# 🦌 WildTrace - Dashboard

**WildTrace - Dashboard** is the frontend interface for the WildTrace project — a visual exploration of environmental, biometric, and emotional data collected throughout a one-year journey across multiple ecosystems.

This dashboard provides a clean, responsive, and read-only view of the enriched and analyzed datasets: predictions, anomaly detection, physiological patterns, and emotional annotations.

## ✨ Features

- 🌿 Display of environmental metrics (temperature, humidity, light, etc.)
- 💓 Visualization of biological signals (heart rate, body temp, HRV...)
- 🎭 Emotional tagging and journaling overlays
- 📈 ML-based insights (clustering, predictions, anomaly detection)
- 🗺️ Interactive journey map and location-based data views
- 📁 Supports both Supabase (live data) and JSON from cloud storage

## 📦 Tech Stack

- **Frontend:** React, TailwindCSS, Recharts, Mapbox
- **Data sources:** Supabase (PostgreSQL API) + Firebase/S3 (JSON archives)
- **Hosting (suggested):** Vercel or Netlify

## 🚫 Out of Scope

This repository **does not include**:
- Data processing or enrichment logic
- Machine learning pipelines
- Backend services or APIs

These are handled in other modules of the WildTrace project.

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/wildtrace-dashboard.git
cd wildtrace-dashboard
npm install
npm run dev
