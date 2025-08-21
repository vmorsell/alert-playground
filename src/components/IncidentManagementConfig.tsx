import React, { useState } from 'react';
import type { IncidentManagementConfigs } from '../types/metrics';

interface IncidentManagementConfigProps {
  configs: IncidentManagementConfigs;
  onConfigChange: (configs: IncidentManagementConfigs) => void;
}

export const IncidentManagementConfig: React.FC<
  IncidentManagementConfigProps
> = ({ configs, onConfigChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [hasStoredConfig] = useState(() => {
    try {
      return (
        localStorage.getItem('alert-playground-incident-management-configs') !==
        null
      );
    } catch {
      return false;
    }
  });

  const handleSaveAndEnable = () => {
    onConfigChange(localConfigs);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setLocalConfigs(configs);
    setIsExpanded(false);
  };

  const updateIncidentIoConfig = (
    updates: Partial<typeof configs.incidentIo>,
  ) => {
    setLocalConfigs((prev) => ({
      ...prev,
      incidentIo: { ...prev.incidentIo, ...updates },
    }));
  };

  const updateFireHydrantConfig = (
    updates: Partial<typeof configs.fireHydrant>,
  ) => {
    setLocalConfigs((prev) => ({
      ...prev,
      fireHydrant: { ...prev.fireHydrant, ...updates },
    }));
  };

  const updateIncidentIoMetadata = (key: string, value: string) => {
    setLocalConfigs((prev) => ({
      ...prev,
      incidentIo: {
        ...prev.incidentIo,
        metadata: {
          ...prev.incidentIo.metadata,
          [key]: value || undefined,
        },
      },
    }));
  };

  const updateFireHydrantMetadata = (key: string, value: string) => {
    setLocalConfigs((prev) => ({
      ...prev,
      fireHydrant: {
        ...prev.fireHydrant,
        metadata: {
          ...prev.fireHydrant.metadata,
          [key]: value || undefined,
        },
      },
    }));
  };

  const enabledProviders = [
    localConfigs.incidentIo.enabled && 'Incident.io',
    localConfigs.fireHydrant.enabled && 'FireHydrant',
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Incident Management Providers
            </h3>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                enabledProviders.length > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {enabledProviders.length > 0
                ? `${enabledProviders.length} Active`
                : 'Disabled'}
            </div>

            {hasStoredConfig && (
              <div
                className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600"
                title="Configuration loaded from browser storage"
              >
                💾 Saved
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
        >
          {isExpanded ? 'Close' : 'Configure'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-6 border-t border-gray-100 pt-4">
          {/* Security Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-sm">⚠️</span>
              <div className="text-sm text-amber-800">
                <strong>Security Warning:</strong> Do not use production API
                tokens or connect to production alert sources. Use a test
                environment or dedicated demo workspace.
              </div>
            </div>
          </div>

          {/* Incident.io Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">
                Incident.io
              </h4>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfigs.incidentIo.enabled}
                  onChange={(e) =>
                    updateIncidentIoConfig({ enabled: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfigs.incidentIo.enabled
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfigs.incidentIo.enabled
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div
              className={`space-y-4 ${!localConfigs.incidentIo.enabled ? 'opacity-50' : ''}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Token
                  </label>
                  <input
                    type="password"
                    value={localConfigs.incidentIo.token}
                    onChange={(e) =>
                      updateIncidentIoConfig({ token: e.target.value })
                    }
                    placeholder="Bearer token"
                    disabled={!localConfigs.incidentIo.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Source Config ID
                  </label>
                  <input
                    type="text"
                    value={localConfigs.incidentIo.alertSourceConfigId}
                    onChange={(e) =>
                      updateIncidentIoConfig({
                        alertSourceConfigId: e.target.value,
                      })
                    }
                    placeholder="01GW2G3V0S59R238FAHPDS1R66"
                    disabled={!localConfigs.incidentIo.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <input
                    type="text"
                    value={localConfigs.incidentIo.metadata.team || ''}
                    onChange={(e) =>
                      updateIncidentIoMetadata('team', e.target.value)
                    }
                    placeholder="platform-team"
                    disabled={!localConfigs.incidentIo.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <input
                    type="text"
                    value={localConfigs.incidentIo.metadata.service || ''}
                    onChange={(e) =>
                      updateIncidentIoMetadata('service', e.target.value)
                    }
                    placeholder="api-gateway"
                    disabled={!localConfigs.incidentIo.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FireHydrant Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">
                FireHydrant
              </h4>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfigs.fireHydrant.enabled}
                  onChange={(e) =>
                    updateFireHydrantConfig({ enabled: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localConfigs.fireHydrant.enabled
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localConfigs.fireHydrant.enabled
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div
              className={`space-y-4 ${!localConfigs.fireHydrant.enabled ? 'opacity-50' : ''}`}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={localConfigs.fireHydrant.webhookUrl}
                  onChange={(e) =>
                    updateFireHydrantConfig({ webhookUrl: e.target.value })
                  }
                  placeholder="https://signals.firehydrant.io/v1/process/..."
                  disabled={!localConfigs.fireHydrant.enabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <input
                    type="text"
                    value={localConfigs.fireHydrant.metadata.team || ''}
                    onChange={(e) =>
                      updateFireHydrantMetadata('team', e.target.value)
                    }
                    placeholder="platform-team"
                    disabled={!localConfigs.fireHydrant.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <input
                    type="text"
                    value={localConfigs.fireHydrant.metadata.service || ''}
                    onChange={(e) =>
                      updateFireHydrantMetadata('service', e.target.value)
                    }
                    placeholder="api-gateway"
                    disabled={!localConfigs.fireHydrant.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment
                  </label>
                  <input
                    type="text"
                    value={localConfigs.fireHydrant.metadata.environment || ''}
                    onChange={(e) =>
                      updateFireHydrantMetadata('environment', e.target.value)
                    }
                    placeholder="production"
                    disabled={!localConfigs.fireHydrant.enabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleSaveAndEnable}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              title="Save configuration and enable selected providers"
            >
              Save & Enable
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              title="Discard changes and close"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
