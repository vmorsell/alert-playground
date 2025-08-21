import { Alert } from '../lib/Alert';
import { Threshold } from '../lib/Threshold';
import type { IncidentIoConfig } from '../types/metrics';
import type { IncidentManagementProvider } from './IncidentManagementProvider';

interface AlertEventResponse {
  deduplication_key: string;
  message: string;
  status: string;
}

export class IncidentIoProvider implements IncidentManagementProvider {
  private config: IncidentIoConfig;

  constructor(config: IncidentIoConfig) {
    this.config = config;
  }

  updateConfig(config: IncidentIoConfig): void {
    this.config = config;
  }

  async sendAlert(
    alert: Alert,
    threshold: Threshold,
    status: 'firing' | 'resolved',
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const deduplicationKey = this.generateDeduplicationKey(alert);
      const groupKey = this.generateGroupKey(alert.metricName);
      const serviceName = this.config.metadata.service || 'demo-service';

      const alertData = {
        deduplication_key: deduplicationKey,
        group_key: groupKey,
        source_url: window.location.href,
        title: this.generateTitle(alert, serviceName, status),
        description: this.generateDescription(
          alert,
          threshold,
          serviceName,
          status,
        ),
        status: status === 'firing' ? 'firing' : 'resolved',
        metadata: {
          ...this.config.metadata,
          priority: alert.priority.toLowerCase(),
          group_key: groupKey,
          metric_name: alert.metricName,
          current_value: alert.triggerValue,
          threshold_value: threshold.value,
          threshold_operator: threshold.operator,
          threshold_id: alert.thresholdId,
          alert_id: alert.id,
          service: serviceName,
        },
      };

      const response = await fetch(
        `/api/incident-io/v2/alert_events/http/${this.config.alertSourceConfigId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AlertEventResponse = await response.json();
      console.log(`Alert ${status} sent to Incident.io:`, result);

      if (result.deduplication_key && !alert.externalIncidentId) {
        alert.setExternalIncidentId(result.deduplication_key);
      }
    } catch (error) {
      console.error(`Failed to send ${status} alert to Incident.io:`, {
        alertId: alert.id,
        metricName: alert.metricName,
        priority: alert.priority,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private generateDeduplicationKey(alert: Alert): string {
    return `${alert.metricName}-${alert.priority}`;
  }

  private generateGroupKey(metricName: string): string {
    return `metric-${metricName}`;
  }

  private generateTitle(
    alert: Alert,
    serviceName: string,
    status: 'firing' | 'resolved',
  ): string {
    const metricDisplayName = this.formatMetricName(alert.metricName);

    if (status === 'resolved') {
      return `[${alert.priority}] ${serviceName}: ${metricDisplayName} resolved`;
    }

    return `[${alert.priority}] ${serviceName}: ${metricDisplayName} critical`;
  }

  private generateDescription(
    alert: Alert,
    threshold: Threshold,
    serviceName: string,
    status: 'firing' | 'resolved',
  ): string {
    const metricDisplayName = this.formatMetricName(alert.metricName);
    const thresholdText = this.formatThresholdText(threshold);
    const valueText = this.formatValueText(
      alert.metricName,
      alert.triggerValue,
    );

    if (status === 'firing') {
      return `${metricDisplayName} critical on ${serviceName}. Current value is ${valueText} - exceeds ${alert.priority} threshold of ${thresholdText}`;
    } else {
      return `${metricDisplayName} resolved on ${serviceName}. Alert duration: ${this.formatDuration(alert.duration)}`;
    }
  }

  private formatMetricName(metricName: string): string {
    // Convert camelCase or snake_case to lowercase with underscores
    return metricName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  private formatThresholdText(threshold: Threshold): string {
    const operator = threshold.operator === 'greater_than' ? '>' : '<';
    return `${operator}${this.formatValueText(threshold.metricName, threshold.value)}`;
  }

  private formatValueText(metricName: string, value: number): string {
    // Format based on metric type
    switch (metricName) {
      case 'errorRate':
        return `${value.toFixed(1)}%`;
      case 'p95ResponseTime':
        return `${value.toFixed(0)}ms`;
      case 'cpuUsage':
      case 'memoryUsage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toFixed(1);
    }
  }

  private formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}
