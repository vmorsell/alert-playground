import { Alert } from '../lib/Alert';
import { Threshold } from '../lib/Threshold';
import type { IncidentManagementProvider } from './IncidentManagementProvider';

export class MultiProviderManager implements IncidentManagementProvider {
  private providers: IncidentManagementProvider[] = [];

  addProvider(provider: IncidentManagementProvider): void {
    this.providers.push(provider);
  }

  removeProvider(provider: IncidentManagementProvider): void {
    const index = this.providers.indexOf(provider);
    if (index > -1) {
      this.providers.splice(index, 1);
    }
  }

  clearProviders(): void {
    this.providers = [];
  }

  getProviders(): IncidentManagementProvider[] {
    return [...this.providers];
  }

  async sendAlert(
    alert: Alert,
    threshold: Threshold,
    status: 'firing' | 'resolved',
  ): Promise<void> {
    const promises = this.providers.map(async (provider) => {
      try {
        await provider.sendAlert(alert, threshold, status);
      } catch (error) {
        console.error('Provider failed to send alert:', {
          provider: provider.constructor.name,
          alertId: alert.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(promises);
  }
}
