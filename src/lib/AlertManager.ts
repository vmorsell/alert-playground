import type { IncidentManagementProvider } from '../providers/IncidentManagementProvider';
import type { AlertThreshold } from '../types/metrics';
import { Alert } from './Alert';
import { Threshold } from './Threshold';

export interface AlertManagerEvents {
  onThresholdStateChange: (threshold: Threshold) => void;
  onAlertCreated: (alert: Alert) => void;
  onAlertResolved: (alert: Alert) => void;
}

export class AlertManager {
  private thresholds = new Map<string, Threshold>();
  private activeAlerts = new Map<string, Alert>();
  private incidentProvider: IncidentManagementProvider;
  private eventHandlers: Partial<AlertManagerEvents> = {};

  constructor(incidentProvider: IncidentManagementProvider) {
    this.incidentProvider = incidentProvider;
  }

  addThreshold(
    metricName: string,
    priority: AlertThreshold['priority'],
    value: number,
    operator: AlertThreshold['operator'],
    description: string,
    resolveDelaySeconds: number = 0,
  ): Threshold {
    const threshold = new Threshold(
      metricName,
      priority,
      value,
      operator,
      description,
      resolveDelaySeconds,
    );

    this.thresholds.set(threshold.id, threshold);
    return threshold;
  }

  addThresholds(metricName: string, alertThresholds: AlertThreshold[]): void {
    alertThresholds.forEach((threshold) => {
      this.addThreshold(
        metricName,
        threshold.priority,
        threshold.threshold,
        threshold.operator,
        threshold.description,
        threshold.resolveDelaySeconds || 0,
      );
    });
  }

  removeThreshold(thresholdId: string): void {
    const threshold = this.thresholds.get(thresholdId);
    if (threshold && !threshold.isHealthy) {
      threshold.transitionToHealthy();
    }
    this.thresholds.delete(thresholdId);
  }

  on<K extends keyof AlertManagerEvents>(
    event: K,
    handler: AlertManagerEvents[K],
  ): void {
    this.eventHandlers[event] = handler;
  }

  off<K extends keyof AlertManagerEvents>(event: K): void {
    delete this.eventHandlers[event];
  }

  async evaluateMetric(
    metricName: string,
    currentValue: number,
  ): Promise<void> {
    const metricThresholds = Array.from(this.thresholds.values()).filter(
      (t) => t.metricName === metricName,
    );

    for (const threshold of metricThresholds) {
      await this.evaluateThreshold(threshold, currentValue);
    }

    await this.processPendingResolves();

    // Clean up any inconsistent state
    this.cleanupInconsistentState();
  }

  private async evaluateThreshold(
    threshold: Threshold,
    currentValue: number,
  ): Promise<void> {
    const shouldFire = threshold.evaluate(currentValue);
    const currentState = threshold.state;

    try {
      if (
        shouldFire &&
        (currentState === 'healthy' ||
          currentState === 'pending_resolve' ||
          currentState === 'resolving')
      ) {
        console.log(`Firing alert for threshold ${threshold.id}`);
        const alert = threshold.transitionToFiring(currentValue);
        this.activeAlerts.set(alert.id, alert);

        await this.incidentProvider.sendAlert(alert, threshold, 'firing');

        this.eventHandlers.onThresholdStateChange?.(threshold);
        this.eventHandlers.onAlertCreated?.(alert);
      } else if (!shouldFire && currentState === 'firing') {
        console.log(`Pending resolve for threshold ${threshold.id}`);
        threshold.transitionToPendingResolve();
        this.eventHandlers.onThresholdStateChange?.(threshold);
      }
    } catch (error) {
      console.error(`Failed to evaluate threshold ${threshold.id}:`, {
        threshold: threshold.id,
        metricName: threshold.metricName,
        currentValue,
        currentState,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async processPendingResolves(): Promise<void> {
    const pendingThresholds = Array.from(this.thresholds.values()).filter(
      (t) => t.isPendingResolve && t.shouldResolve(),
    );

    for (const threshold of pendingThresholds) {
      try {
        const alert = threshold.activeAlert;
        if (alert) {
          threshold.transitionToResolving();

          await this.incidentProvider.sendAlert(alert, threshold, 'resolved');

          threshold.transitionToHealthy();
          this.activeAlerts.delete(alert.id);

          this.eventHandlers.onThresholdStateChange?.(threshold);
          this.eventHandlers.onAlertResolved?.(alert);
        }
      } catch (error) {
        console.error(`Failed to resolve threshold ${threshold.id}:`, {
          threshold: threshold.id,
          metricName: threshold.metricName,
          alertId: threshold.activeAlert?.id,
          error: error instanceof Error ? error.message : String(error),
        });

        // force the threshold back to healthy to prevent stuck state
        try {
          threshold.transitionToHealthy();
          if (threshold.activeAlert) {
            this.activeAlerts.delete(threshold.activeAlert.id);
          }
          this.eventHandlers.onThresholdStateChange?.(threshold);
        } catch (cleanupError) {
          console.error(`Failed to cleanup threshold ${threshold.id}:`, {
            threshold: threshold.id,
            error:
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError),
          });
        }
      }
    }
  }

  private cleanupInconsistentState(): void {
    // Remove alerts from activeAlerts if their threshold is healthy
    const alertsToRemove: string[] = [];

    for (const [alertId, alert] of this.activeAlerts.entries()) {
      const threshold = this.thresholds.get(alert.thresholdId);
      if (
        !threshold ||
        threshold.isHealthy ||
        threshold.activeAlert?.id !== alertId
      ) {
        alertsToRemove.push(alertId);
      }
    }

    for (const alertId of alertsToRemove) {
      this.activeAlerts.delete(alertId);
    }
  }

  getThreshold(thresholdId: string): Threshold | undefined {
    return this.thresholds.get(thresholdId);
  }

  getThresholdsForMetric(metricName: string): Threshold[] {
    return Array.from(this.thresholds.values()).filter(
      (t) => t.metricName === metricName,
    );
  }

  getActiveAlertsForMetric(metricName: string): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (a) => a.metricName === metricName && !a.isResolved,
    );
  }

  getAllThresholds(): Threshold[] {
    return Array.from(this.thresholds.values());
  }

  getAllActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter((a) => !a.isResolved);
  }

  getAlert(alertId: string): Alert | undefined {
    return this.activeAlerts.get(alertId);
  }

  isMetricAlerting(metricName: string): boolean {
    return this.getActiveAlertsForMetric(metricName).length > 0;
  }

  getHighestPriorityAlertForMetric(metricName: string): Alert | undefined {
    const alerts = this.getActiveAlertsForMetric(metricName);
    if (alerts.length === 0) return undefined;

    const priorities = { P1: 1, P2: 2, P3: 3, P4: 4 };
    return alerts.sort(
      (a, b) => priorities[a.priority] - priorities[b.priority],
    )[0];
  }

  getStats() {
    const thresholdsByState = {
      healthy: 0,
      firing: 0,
      pending_resolve: 0,
      resolving: 0,
    };

    Array.from(this.thresholds.values()).forEach((t) => {
      thresholdsByState[t.state]++;
    });

    return {
      totalThresholds: this.thresholds.size,
      activeAlerts: this.activeAlerts.size,
      thresholdsByState,
    };
  }
}
