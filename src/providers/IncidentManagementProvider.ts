import { Alert } from '../lib/Alert';
import { Threshold } from '../lib/Threshold';

export interface IncidentManagementProvider {
  sendAlert(
    alert: Alert,
    threshold: Threshold,
    status: 'firing' | 'resolved',
  ): Promise<void>;
}

export interface IncidentManagementConfig {
  enabled: boolean;
  [key: string]: any;
}
