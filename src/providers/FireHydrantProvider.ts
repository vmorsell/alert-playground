import { Alert } from '../lib/Alert';
import { Threshold } from '../lib/Threshold';
import type { IncidentManagementProvider } from './IncidentManagementProvider';

interface FireHydrantEventResponse {
  success: boolean;
}

interface FireHydrantEvent {
  summary: string;
  body: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  status: 'OPEN' | 'RESOLVED';
  idempotency_key: string;
  images?: Array<{
    src: string;
    alt: string;
  }>;
  links?: Array<{
    href: string;
    text: string;
  }>;
  annotations?: Record<string, string>;
  tags: string[];
}

export interface FireHydrantConfig {
  enabled: boolean;
  webhookUrl: string;
  metadata: {
    team?: string;
    service?: string;
    environment?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export class FireHydrantProvider implements IncidentManagementProvider {
  private config: FireHydrantConfig;

  constructor(config: FireHydrantConfig) {
    this.config = config;
  }

  updateConfig(config: FireHydrantConfig): void {
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
      const eventData = this.buildEventData(alert, threshold, status);

      // Extract the path from the webhook URL for the proxy
      const webhookUrl = new URL(this.config.webhookUrl);
      const proxyUrl = `/api/firehydrant${webhookUrl.pathname}`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: FireHydrantEventResponse = await response.json();
      console.log(`Alert ${status} sent to FireHydrant:`, result);

      if (result.success && !alert.externalIncidentId) {
        alert.setExternalIncidentId(eventData.idempotency_key);
      }
    } catch (error) {
      console.error(`Failed to send ${status} alert to FireHydrant:`, {
        alertId: alert.id,
        metricName: alert.metricName,
        priority: alert.priority,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private buildEventData(
    alert: Alert,
    threshold: Threshold,
    status: 'firing' | 'resolved',
  ): FireHydrantEvent {
    const serviceName = this.config.metadata.service || 'demo-service';
    const environment = this.config.metadata.environment || 'development';

    const tags = [
      `service:${serviceName}`,
      `environment:${environment}`,
      `metric:${alert.metricName}`,
      `priority:${alert.priority.toLowerCase()}`,
    ];

    // Add team tag if configured
    if (this.config.metadata.team) {
      tags.push(`team:${this.config.metadata.team}`);
    }

    // Add custom metadata as tags
    Object.entries(this.config.metadata).forEach(([key, value]) => {
      if (value && !['service', 'environment', 'team'].includes(key)) {
        tags.push(`${key}:${value}`);
      }
    });

    const eventData: FireHydrantEvent = {
      summary: this.generateSummary(alert, serviceName, status),
      body: this.generateBody(alert, threshold, serviceName, status),
      level: this.mapPriorityToLevel(alert.priority),
      status: status === 'firing' ? 'OPEN' : 'RESOLVED',
      idempotency_key: this.generateIdempotencyKey(alert),
      links: [
        {
          href: window.location.href,
          text: 'Alert Playground Dashboard',
        },
      ],
      annotations: {
        metric_name: alert.metricName,
        threshold_value: threshold.value.toString(),
        threshold_operator: threshold.operator,
        alert_id: alert.id,
        threshold_id: alert.thresholdId,
      },
      tags,
    };

    return eventData;
  }

  private generateSummary(
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

  private generateBody(
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

  private mapPriorityToLevel(
    priority: string,
  ): 'INFO' | 'WARN' | 'ERROR' | 'FATAL' {
    switch (priority) {
      case 'P1':
        return 'FATAL';
      case 'P2':
        return 'ERROR';
      case 'P3':
        return 'WARN';
      case 'P4':
        return 'INFO';
      default:
        return 'WARN';
    }
  }

  private generateIdempotencyKey(alert: Alert): string {
    return `alert-playground-${alert.metricName}`;
  }

  private formatMetricName(metricName: string): string {
    return metricName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/_/g, ' ');
  }

  private formatThresholdText(threshold: Threshold): string {
    const operator = threshold.operator === 'greater_than' ? '>' : '<';
    return `${operator}${this.formatValueText(threshold.metricName, threshold.value)}`;
  }

  private formatValueText(metricName: string, value: number): string {
    switch (metricName) {
      case 'error_rate':
        return `${value.toFixed(1)}%`;
      case 'p95_response_time':
        return `${value.toFixed(0)}ms`;
      case 'cpu_usage':
      case 'memory_usage':
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
