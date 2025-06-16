import React, { useState } from 'react';
import type { IncidentIoConfig } from '../types/metrics';

interface IncidentIoConfigProps {
  config: IncidentIoConfig;
  onConfigChange: (config: IncidentIoConfig) => void;
}

export const IncidentIoConfigComponent: React.FC<IncidentIoConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setIsExpanded(false);
  };

  const updateMetadata = (key: string, value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value || undefined,
      },
    }));
  };

  const addMetadataField = () => {
    const key = prompt('Enter metadata field name:');
    if (key && !localConfig.metadata[key]) {
      updateMetadata(key, '');
    }
  };

  const removeMetadataField = (key: string) => {
    if (key !== 'team' && key !== 'service') {
      const { [key]: removed, ...rest } = localConfig.metadata;
      setLocalConfig(prev => ({
        ...prev,
        metadata: rest,
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Incident.io Integration</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            config.enabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {config.enabled ? 'Enabled' : 'Disabled'}
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
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enabled}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localConfig.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Enable Incident.io alerts
              </span>
            </label>
          </div>

          {/* API Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                value={localConfig.token}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Bearer token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Source Config ID
              </label>
              <input
                type="text"
                value={localConfig.alertSourceConfigId}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, alertSourceConfigId: e.target.value }))}
                placeholder="01GW2G3V0S59R238FAHPDS1R66"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Metadata Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Alert Metadata
              </label>
              <button
                onClick={addMetadataField}
                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              >
                Add Field
              </button>
            </div>
            
            <div className="space-y-2">
              {Object.entries(localConfig.metadata).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={key}
                      disabled={key === 'team' || key === 'service'}
                      className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 text-gray-600"
                    />
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => updateMetadata(key, e.target.value)}
                      placeholder="Value"
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {key !== 'team' && key !== 'service' && (
                    <button
                      onClick={() => removeMetadataField(key)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Note: 'priority' and 'group_key' are automatically set based on alert data
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 