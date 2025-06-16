import type { IncidentIoConfig, AlertThreshold, MetricType, ThresholdAlertState } from '../types/metrics';

interface AlertEventPayload {
  title: string;
  description: string;
  deduplication_key: string;
  status: 'firing' | 'resolved';
  metadata: {
    priority: string;
    group_key: string;
    [key: string]: string | number | boolean | undefined;
  };
  source_url?: string;
}

interface AlertEventResponse {
  deduplication_key: string;
  message: string;
  status: string;
}

// Generate a unique session ID for this browser session
const SESSION_ID = Math.random().toString(36).substring(2, 15);

export class IncidentIoService {
  private config: IncidentIoConfig;

  constructor(config: IncidentIoConfig) {
    this.config = config;
  }

  updateConfig(config: IncidentIoConfig) {
    this.config = config;
  }

  private generateDeduplicationKey(metricType: MetricType, priority: string): string {
    return `alert-playground-${SESSION_ID}-${metricType}-${priority}`;
  }

  private generateGroupKey(metricType: MetricType): string {
    return `alert-playground-${SESSION_ID}-${metricType}`;
  }

  private mapPriorityToIncidentIo(priority: string): string {
    // Map our P0-P4 to incident.io format (lowercase)
    return priority.toLowerCase();
  }

  async postThresholdAlert(
    metricType: MetricType,
    metricName: string,
    thresholdAlert: ThresholdAlertState,
    currentValue: number,
    unit: string
  ): Promise<AlertEventResponse | null> {
    if (!this.config.enabled || !this.config.token || !this.config.alertSourceConfigId) {
      console.log('Incident.io not configured or disabled');
      return null;
    }

    const threshold = thresholdAlert.threshold;
    const deduplicationKey = this.generateDeduplicationKey(metricType, threshold.priority);
    const groupKey = this.generateGroupKey(metricType);

    const payload: AlertEventPayload = {
      title: `${metricName} Alert - ${threshold.description}`,
      description: `**Metric:** ${metricName}\n**Current Value:** ${currentValue.toFixed(2)} ${unit}\n**Threshold:** ${threshold.threshold} ${unit}\n**Priority:** ${threshold.priority}\n\n${threshold.description}`,
      deduplication_key: deduplicationKey,
      status: 'firing',
      metadata: {
        ...this.config.metadata,
        priority: this.mapPriorityToIncidentIo(threshold.priority),
        group_key: groupKey,
        metric_type: metricType,
        metric_name: metricName,
        current_value: currentValue.toString(),
        threshold_value: threshold.threshold.toString(),
        threshold_priority: threshold.priority,
        unit: unit,
      },
      source_url: window.location.href,
    };

    try {
      const response = await fetch(
        `/api/incident-io/v2/alert_events/http/${this.config.alertSourceConfigId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AlertEventResponse = await response.json();
      console.log('Threshold alert posted to Incident.io:', result);
      return result;
    } catch (error) {
      console.error('Failed to post threshold alert to Incident.io:', error);
      throw error;
    }
  }

  async resolveThresholdAlert(
    metricType: MetricType,
    metricName: string,
    threshold: AlertThreshold
  ): Promise<AlertEventResponse | null> {
    if (!this.config.enabled || !this.config.token || !this.config.alertSourceConfigId) {
      return null;
    }

    const deduplicationKey = this.generateDeduplicationKey(metricType, threshold.priority);
    const groupKey = this.generateGroupKey(metricType);

    const payload: AlertEventPayload = {
      title: `${metricName} Alert Resolved - ${threshold.description}`,
      description: `The ${metricName} alert for ${threshold.description} has been resolved and is now within normal thresholds.`,
      deduplication_key: deduplicationKey,
      status: 'resolved',
      metadata: {
        ...this.config.metadata,
        priority: this.mapPriorityToIncidentIo(threshold.priority),
        group_key: groupKey,
        metric_type: metricType,
        metric_name: metricName,
        threshold_priority: threshold.priority,
      },
      source_url: window.location.href,
    };

    try {
      const response = await fetch(
        `/api/incident-io/v2/alert_events/http/${this.config.alertSourceConfigId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AlertEventResponse = await response.json();
      console.log('Threshold alert resolved in Incident.io:', result);
      return result;
    } catch (error) {
      console.error('Failed to resolve threshold alert in Incident.io:', error);
      throw error;
    }
  }
} 