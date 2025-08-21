import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Alert Playground
      </h1>
      <p className="text-sm text-gray-600 mb-3">
        Real-time metrics monitoring and alerting simulation platform
      </p>
    </div>
  );
};
