import type { AlertPriority } from '../types/metrics';

export class Alert {
  public readonly id: string;
  public readonly thresholdId: string;
  public readonly metricName: string;
  public readonly priority: AlertPriority;
  public readonly triggeredAt: Date;
  public readonly triggerValue: number;
  public resolvedAt?: Date;
  public externalIncidentId?: string;

  constructor(
    thresholdId: string,
    metricName: string,
    priority: AlertPriority,
    triggerValue: number,
  ) {
    this.id = `${thresholdId}-${Date.now()}`;
    this.thresholdId = thresholdId;
    this.metricName = metricName;
    this.priority = priority;
    this.triggeredAt = new Date();
    this.triggerValue = triggerValue;
  }

  resolve(): void {
    this.resolvedAt = new Date();
  }

  setExternalIncidentId(id: string): void {
    this.externalIncidentId = id;
  }

  get isResolved(): boolean {
    return this.resolvedAt !== undefined;
  }

  get duration(): number {
    const endTime = this.resolvedAt || new Date();
    return endTime.getTime() - this.triggeredAt.getTime();
  }
}
