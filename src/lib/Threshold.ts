import type { AlertPriority } from '../types/metrics';
import { Alert } from './Alert';

export type ThresholdState =
  | 'healthy'
  | 'firing'
  | 'pending_resolve'
  | 'resolving';

export class Threshold {
  public readonly id: string;
  public readonly metricName: string;
  public readonly priority: AlertPriority;
  public readonly value: number;
  public readonly operator: 'greater_than' | 'less_than';
  public readonly description: string;
  public readonly resolveDelaySeconds: number;

  private _state: ThresholdState = 'healthy';
  private _activeAlert?: Alert;
  private _pendingResolveAt?: Date;

  constructor(
    metricName: string,
    priority: AlertPriority,
    value: number,
    operator: 'greater_than' | 'less_than',
    description: string,
    resolveDelaySeconds: number = 0,
  ) {
    this.id = `${metricName}-${priority}-${value}`;
    this.metricName = metricName;
    this.priority = priority;
    this.value = value;
    this.operator = operator;
    this.description = description;
    this.resolveDelaySeconds = resolveDelaySeconds;
  }

  get state(): ThresholdState {
    return this._state;
  }

  get activeAlert(): Alert | undefined {
    return this._activeAlert;
  }

  get pendingResolveAt(): Date | undefined {
    return this._pendingResolveAt;
  }

  get isHealthy(): boolean {
    return this._state === 'healthy';
  }

  get isFiring(): boolean {
    return this._state === 'firing';
  }

  get isPendingResolve(): boolean {
    return this._state === 'pending_resolve';
  }

  get isResolving(): boolean {
    return this._state === 'resolving';
  }

  evaluate(currentValue: number): boolean {
    return this.operator === 'greater_than'
      ? currentValue > this.value
      : currentValue < this.value;
  }

  transitionToFiring(currentValue: number): Alert {
    if (
      this._state !== 'healthy' &&
      this._state !== 'pending_resolve' &&
      this._state !== 'resolving'
    ) {
      throw new Error(`Cannot transition to firing from state: ${this._state}`);
    }

    this._state = 'firing';
    this._pendingResolveAt = undefined;
    this._activeAlert = new Alert(
      this.id,
      this.metricName,
      this.priority,
      currentValue,
    );

    return this._activeAlert;
  }

  transitionToPendingResolve(): void {
    if (this._state !== 'firing') {
      throw new Error(
        `Cannot transition to pending_resolve from state: ${this._state}`,
      );
    }

    if (this.resolveDelaySeconds > 0) {
      this._state = 'pending_resolve';
      this._pendingResolveAt = new Date();
    } else {
      // No delay - resolve immediately
      this.transitionToHealthy();
    }
  }

  transitionToResolving(): void {
    if (this._state !== 'pending_resolve') {
      throw new Error(
        `Cannot transition to resolving from state: ${this._state}`,
      );
    }

    this._state = 'resolving';
  }

  transitionToHealthy(): void {
    if (!['firing', 'pending_resolve', 'resolving'].includes(this._state)) {
      throw new Error(
        `Cannot transition to healthy from state: ${this._state}`,
      );
    }

    if (this._activeAlert && !this._activeAlert.isResolved) {
      this._activeAlert.resolve();
    }

    this._state = 'healthy';
    this._activeAlert = undefined;
    this._pendingResolveAt = undefined;
  }

  shouldResolve(): boolean {
    if (this._state !== 'pending_resolve' || !this._pendingResolveAt) {
      return false;
    }

    const elapsedSeconds =
      (Date.now() - this._pendingResolveAt.getTime()) / 1000;
    return elapsedSeconds >= this.resolveDelaySeconds;
  }

  getRemainingResolveTime(): number {
    if (this._state !== 'pending_resolve' || !this._pendingResolveAt) {
      return 0;
    }

    const elapsedSeconds =
      (Date.now() - this._pendingResolveAt.getTime()) / 1000;
    return Math.max(0, this.resolveDelaySeconds - elapsedSeconds);
  }
}
