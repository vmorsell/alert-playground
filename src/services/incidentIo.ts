import type { IncidentIoConfig, AlertThreshold } from '../types/metrics';

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

  private generateDeduplicationKey(metricName: string, priority: string): string {
    return `alert-playground-${SESSION_ID}-${metricName}-${priority}`;
  }

  private generateGroupKey(metricName: string): string {
    return `alert-playground-${SESSION_ID}-${metricName}`;
  }

  async postThresholdAlert(
    metricName: string,
    threshold: AlertThreshold,
    currentValue: number,
    serviceName: string = 'demo-service'
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const deduplicationKey = this.generateDeduplicationKey(metricName, threshold.priority);
      const groupKey = this.generateGroupKey(metricName);

      const alertData = {
        deduplication_key: deduplicationKey,
        group_key: groupKey,
        source_url: window.location.href,
        title: `${serviceName}: ${threshold.description}`,
        description: `${threshold.description} / Current value is ${currentValue.toFixed(1)}% on ${serviceName} - exceeds ${threshold.priority} threshold of ${threshold.threshold}%`,
        status: 'firing',
        metadata: {
          ...this.config.metadata,
          priority: threshold.priority.toLowerCase(),
          group_key: groupKey,
          metric_name: metricName,
          current_value: currentValue,
          threshold_value: threshold.threshold,
          service: serviceName,
        },
      };

      const response = await fetch(
        `/api/incident-io/v2/alert_events/http/${this.config.alertSourceConfigId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AlertEventResponse = await response.json();
      console.log('Threshold alert posted to Incident.io:', result);
    } catch (error) {
      console.error('Failed to post threshold alert to Incident.io:', error);
      throw error;
    }
  }

  async resolveThresholdAlert(
    metricName: string,
    threshold: AlertThreshold,
    currentValue: number,
    serviceName: string = 'demo-service'
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const deduplicationKey = this.generateDeduplicationKey(metricName, threshold.priority);
      const groupKey = this.generateGroupKey(metricName);

      const alertData = {
        deduplication_key: deduplicationKey,
        group_key: groupKey,
        source_url: window.location.href,
        title: `${serviceName}: ${threshold.description} - Resolved`,
        description: `${threshold.description} resolved / Current value is ${currentValue.toFixed(1)}% on ${serviceName} - below ${threshold.priority} threshold of ${threshold.threshold}%`,
        status: 'resolved',
        metadata: {
          ...this.config.metadata,
          priority: threshold.priority.toLowerCase(),
          group_key: groupKey,
          metric_name: metricName,
          current_value: currentValue,
          threshold_value: threshold.threshold,
          service: serviceName,
        },
      };

      const response = await fetch(
        `/api/incident-io/v2/alert_events/http/${this.config.alertSourceConfigId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alertData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: AlertEventResponse = await response.json();
      console.log('Threshold alert resolved in Incident.io:', result);
    } catch (error) {
      console.error('Failed to resolve threshold alert in Incident.io:', error);
      throw error;
    }
  }
} 