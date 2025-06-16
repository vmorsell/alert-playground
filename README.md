# Alert Playground

A real-time metrics monitoring and alerting simulation platform with Incident.io integration. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Real-time metrics simulation** - Error Rate, P95 Response Time, CPU Usage, Memory Usage
- **Independent threshold alerts** - Each threshold operates as a separate alert (P0-P4 priorities)
- **Incident.io integration** - Automatic alert posting and resolution
- **Interactive controls** - Manual adjustment to simulate different scenarios
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
3. Click "Configure" in the app and enter your credentials
4. Click "Save & Enable"

## Usage

- **Monitor**: Watch real-time metrics on the dashboard
- **Test**: Use +/- buttons to trigger alerts by crossing thresholds
- **Observe**: Watch alerts fire and resolve automatically in Incident.io

### Example Scenarios

**High Error Rate**: Increase Error Rate → P2 fires at 5% → P0 fires at 15% → Reset to see resolution

**Memory Pressure**: Increase Memory → P2 at 85% → P1 at 95% → Reset to baseline

## Metrics & Thresholds

| Metric | Thresholds | Description |
|--------|------------|-------------|
| Error Rate | P0: >15%, P2: >5% | Request error percentage |
| P95 Response Time | P1: >1000ms, P3: >400ms | 95th percentile response times |
| CPU Usage | P1: >90%, P3: >75% | CPU utilization |
| Memory Usage | P1: >95%, P2: >85% | Memory utilization |

## Tech Stack

React 19 • TypeScript • Tailwind CSS v4 • Chart.js • Vite • Incident.io API

## Development

```bash
npm run build    # Production build
npm run lint     # Code linting
npm run preview  # Preview build
```

## Deployment

Works on any static hosting platform (Vercel, Netlify, etc.). No server required.

---

**Built for testing and learning alert management systems**
