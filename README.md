# Alert Playground

A real-time metrics monitoring and alerting simulation platform with state machine-based alerting and Incident.io integration. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Real-time metrics simulation** - Error Rate, P95 Response Time, CPU Usage, Memory Usage
- **State machine alerting** - Advanced threshold management with resolve delays
- **Incident.io integration** - Automatic alert creation and resolution
- **Interactive controls** - Manual adjustments to trigger different scenarios
- **Live charts** - Real-time visualization with threshold overlays

## Quick Start

```bash
# Clone and install
git clone https://github.com/vmorsell/alert-playground.git
cd alert-playground
npm install

# Start development server
npm run dev
```

Open http://localhost:5173

## Incident.io Setup

1. Get API token from Incident.io Settings → API Keys
2. Create HTTP alert source and copy the Config ID
3. Click "Configure Incident.io" in the app and enter your credentials
4. Click "Save & Enable"

## Usage

- **Monitor**: Watch real-time metrics on the dashboard
- **Test**: Use +/- buttons to trigger alerts by crossing thresholds
- **Observe**: Watch alerts fire and resolve automatically with proper delays

### Example Scenarios

**High Error Rate**: Increase Error Rate → P2 fires at 5% → P1 fires at 15% → P0 fires at 30% → Reset to see resolution delays

**Memory Pressure**: Increase Memory → P2 at 85% → P1 at 95% → Reset to baseline

## Metrics & Thresholds

| Metric            | Thresholds              | Resolve Delay | Description                    |
| ----------------- | ----------------------- | ------------- | ------------------------------ |
| Error Rate        | P0: >15%, P2: >5%       | 30s, 15s      | Request error percentage       |
| P95 Response Time | P1: >1000ms, P3: >400ms | 45s, 20s      | 95th percentile response times |
| CPU Usage         | P1: >90%, P3: >75%      | 60s, 30s      | CPU utilization                |
| Memory Usage      | P1: >95%, P2: >85%      | 45s, 30s      | Memory utilization             |

## Tech Stack

React 19 • TypeScript • Tailwind CSS v4 • Chart.js • Vite • Incident.io API

## Development

```bash
npm run build    # Production build
npm run lint     # Code linting
npm run preview  # Preview build
```

## Deployment

The web app is dependent on the CORS proxy in `/api/incident-io.js` in order to bypass CORS restrictions in Incide.io's API. Works out of the box with Vercel. Will need some config to be deployed to other platforms.

---

**Built for testing. Don't use prod credentials**
