<div align="center">

<h1>Aether Ecosystem</h1>

<img src="https://img.shields.io/badge/AETHER-ECOSYSTEM-7c3aed?style=for-the-badge&labelColor=0a0a0c&logoColor=white" height="40" />
<br>
<samp>One Platform. Two Powerhouses. Zero Compromise.</samp>
<br><br>

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0f172a?style=flat-square&logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-886FBF?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License](https://img.shields.io/badge/License-Proprietary-333?style=flat-square)](#)

<br>

---

</div>

## About

**Aether Ecosystem** is an enterprise-grade, unified business intelligence platform that merges **Supply Chain Management** and **Customer Relationship Management** into a single, cohesive experience. It is designed from the ground up with a pitch-black UI foundation accented by lavender and violet tones, delivering a premium, distraction-free workspace for data-driven teams.

The platform is not two products duct-taped together — it is a single codebase, a single deployment, and a single source of truth for your entire business pipeline: from raw materials entering your warehouse to a closed deal landing in your CRM.

---

## Why Aether

<table>
<tr>
<td width="50%">

### The Problem

Most businesses run their supply chain and sales operations on completely disconnected tools. Inventory managers don't see sales velocity. Sales reps don't know what's in stock. Forecasting is done in spreadsheets. Data lives in silos.

</td>
<td width="50%">

### The Solution

Aether unifies these critical functions under one roof. When a deal closes in the CRM, the supply chain module already knows. When stock runs low, the AI engine adjusts demand forecasts automatically. Every decision is informed by the full picture.

</td>
</tr>
</table>

**Key Benefits:**

| Benefit | Description |
|:---|:---|
| **Unified Data Layer** | Supply chain metrics and CRM data share the same database infrastructure, eliminating data silos. |
| **AI-First Intelligence** | Google Gemini Pro powers demand forecasting, anomaly detection, and an always-available chatbot assistant. |
| **Zero Context Switching** | Navigate from warehouse inventory to a sales pipeline without ever leaving the platform. |
| **Real-Time Visibility** | Dashboards update live — no manual refreshes, no stale data, no guesswork. |
| **Operational Efficiency** | Automated reorder calculations, stockout predictions, and purchase order generation reduce manual overhead. |
| **Premium Developer Experience** | Built with Next.js App Router, full TypeScript coverage, and Prisma ORM for a modern, maintainable codebase. |

---

## Architecture

```
                              +---------------------+
                              |    Landing Page      |
                              |  (Route: /)          |
                              +----------+----------+
                                         |
                          +--------------+--------------+
                          |                             |
                +---------v---------+        +----------v----------+
                |   Aether Supply   |        |     AetherCRM       |
                |  (Route: /supply) |        |   (Route: /crm)     |
                +---------+---------+        +----------+----------+
                          |                             |
              +-----------+-----------+       +---------+---------+
              |           |           |       |         |         |
          Services    Components   Types    Views    Store    DataService
              |           |                   |
    +---------+---------+ |          +--------+--------+
    |  dataService      | |          | Dashboard       |
    |  inventoryService | |          | Clients         |
    |  forecastService  | |          | Pipeline        |
    |  anomalyService   | |          | Tasks           |
    |  pricingService   | |          | Settings        |
    |  chatService      | |          +-----------------+
    |  geminiService    | |
    |  exportService    | |
    +-------------------+ |
                          |
     +--------------------+--------------------+
     | Dashboard      | ProductList            |
     | SmartReorder   | PurchaseOrders         |
     | SalesLog       | Suppliers              |
     | Intelligence   | AIChatbot              |
     | AnomalyDetect  | StockoutPrediction     |
     | PriceOptimizer | CategoryAnalytics      |
     | ProfitMargins  | TrendComparison        |
     | StockAlerts    | WarehouseView          |
     | StockTransfer  | DemandForecast         |
     | ActivityLog    | BulkImport             |
     +--------------------+--------------------+
```

### Database Schema

The platform uses **dual Prisma schemas** with SQLite for local development and easy portability, with support for PostgreSQL (Supabase / Neon) in production.

<details>
<summary><b>Supply Chain Schema</b> — <code>prisma/supply.prisma</code></summary>
<br>

| Model | Key Fields | Purpose |
|:---|:---|:---|
| `Product` | name, sku, barcode, category, price, cost, stock, reorderLevel, supplierId, warehouseId | Core inventory item |
| `Supplier` | name, leadTimeDays, contactEmail, rating, onTimePercent, fulfillmentRate, location | Vendor management with scorecard |
| `Warehouse` | name, location, capacity | Multi-location storage tracking |
| `Sale` | productId, quantity, date | Sales transaction log |
| `StockTransfer` | productId, fromWarehouseId, toWarehouseId, quantity, notes | Inter-warehouse movements |
| `ActivityLog` | userId, action, entityType, entityName, details | Full audit trail |
| `Category` | name, userId | Product categorization |

</details>

<details>
<summary><b>CRM Schema</b> — <code>prisma/crm.prisma</code></summary>
<br>

| Model | Key Fields | Purpose |
|:---|:---|:---|
| `Client` | name, company, email, status | Customer records (Active / Pending / Inactive) |
| `Deal` | client, value, days, stageId | Pipeline deals (Lead / Contacted / Proposal / Won) |
| `Task` | title, time, type, completed | Scheduled actions (call / email / meeting) |

</details>

---

## Modules

### Aether Supply — Supply Chain Intelligence

A full-featured, 38-component supply chain management system covering every aspect of inventory operations.

<details>
<summary><b>View All Supply Chain Features</b></summary>
<br>

| Feature | Component | Description |
|:---|:---|:---|
| **Dashboard** | `Dashboard.tsx` | At-a-glance KPIs: total inventory value, stock health, anomaly alerts. |
| **Product Catalog** | `ProductList.tsx` | Full CRUD with advanced filtering, SKU/barcode tracking, and multi-supplier assignment. |
| **Smart Reordering** | `SmartReorder.tsx` | Algorithm-based reorder point calculations using safety stock and lead time data. |
| **Sales Log** | `SalesLog.tsx` | Transaction history with product linkage and sales velocity tracking. |
| **Supplier Hub** | `Suppliers.tsx` | Supplier directory with delivery performance metrics. |
| **Supplier Scorecard** | `SupplierScorecard.tsx` | Star ratings, on-time %, fulfillment rates, and total order counts per vendor. |
| **AI Intelligence** | `Intelligence.tsx` | Gemini-powered analytics engine for actionable insights. |
| **AI Chatbot** | `AIChatbot.tsx` | Floating conversational assistant with full context of inventory, sales, and supplier data. |
| **Anomaly Detection** | `AnomalyDetection.tsx` | Automated identification of unusual patterns in stock levels and sales data. |
| **Stockout Prediction** | `StockoutPrediction.tsx` | Predictive engine estimating days until stockout for each product. |
| **Demand Forecast** | `DemandForecast.tsx` | AI-generated demand curves based on historical sales trends. |
| **Purchase Orders** | `PurchaseOrders.tsx` | Automated PO generation based on reorder suggestions. |
| **Price Optimizer** | `PriceOptimizer.tsx` | Cost-based pricing analysis with margin optimization recommendations. |
| **Category Analytics** | `CategoryAnalytics.tsx` | Performance breakdown by product category with visual comparisons. |
| **Profit Margins** | `ProfitMargins.tsx` | Item-level and category-level margin analysis with cost tracking. |
| **Trend Comparison** | `TrendComparison.tsx` | Side-by-side trend analysis across products and time periods. |
| **Stock Alerts** | `StockAlerts.tsx` | Real-time notification system for low, critical, and overstocked items. |
| **Warehouse View** | `WarehouseView.tsx` | Multi-location inventory visualization with capacity tracking. |
| **Stock Transfer** | `StockTransfer.tsx` | Inter-warehouse movement management with full audit trail. |
| **Bulk Import** | `BulkImport.tsx` | Mass data import for products, suppliers, and inventory records. |
| **Activity Log** | `ActivityLog.tsx` | Comprehensive audit trail of all CRUD operations. |
| **Data Export** | `ExportButton.tsx` | One-click export functionality for reports and data extracts. |
| **Advanced Filters** | `AdvancedFilter.tsx` | Multi-criteria filtering with date range support. |
| **Settings** | `SupplierManager`, `WarehouseManager`, `CategoryManager` | Full CRUD management panels for reference data. |

</details>

### AetherCRM — Customer Relationship Management

A streamlined, high-velocity CRM built for teams that value clarity over clutter.

<details>
<summary><b>View All CRM Features</b></summary>
<br>

| Feature | Component | Description |
|:---|:---|:---|
| **Dashboard** | `Dashboard.tsx` | Revenue metrics, active client count, win rate, and average deal size at a glance. |
| **Client Directory** | `Clients.tsx` | Searchable client list with status indicators (Active / Pending / Inactive). |
| **Sales Pipeline** | `Pipeline.tsx` | Kanban-style deal tracking across four stages: Lead, Contacted, Proposal, Won. |
| **Task Manager** | `Tasks.tsx` | Integrated task scheduling for calls, emails, and meetings. |
| **Settings** | `Settings.tsx` | CRM configuration and preferences panel. |

</details>

---

## Service Layer

The business logic is decoupled into a dedicated service layer for testability and reuse.

| Service | Responsibility |
|:---|:---|
| `dataService.ts` | Core CRUD operations against the database with API fallback to mock data. |
| `inventoryService.ts` | Stock analytics: status classification, demand trends, movement analysis, safety stock. |
| `forecastService.ts` | Time-series demand forecasting using historical sales data. |
| `anomalyService.ts` | Statistical anomaly detection across inventory and sales patterns. |
| `predictionService.ts` | Stockout prediction engine with days-remaining calculations. |
| `pricingService.ts` | Cost-based pricing analysis and margin optimization logic. |
| `purchaseOrderService.ts` | Automated purchase order generation from reorder suggestions. |
| `chatService.ts` | Context-aware conversation engine for the AI chatbot. |
| `geminiService.ts` | Google Gemini Pro API integration layer. |
| `genkitService.ts` | Google GenKit service adapter for AI workflows. |
| `exportService.ts` | Data serialization and export (CSV/JSON) functionality. |
| `neonClient.ts` | Neon PostgreSQL serverless client driver. |
| `supabaseClient.ts` | Supabase client initialization and configuration. |
| `mockData.ts` | Rich fallback dataset for offline/demo operation. |

---

## Tech Stack

<table>
<tr>
<td><b>Category</b></td>
<td><b>Technology</b></td>
<td><b>Purpose</b></td>
</tr>
<tr><td>Framework</td><td>Next.js 16 (App Router)</td><td>Server-side rendering, routing, API layer</td></tr>
<tr><td>UI Library</td><td>React 19</td><td>Component-based frontend architecture</td></tr>
<tr><td>Language</td><td>TypeScript 5.8</td><td>Type safety across the entire codebase</td></tr>
<tr><td>Styling</td><td>Tailwind CSS 4</td><td>Utility-first CSS with custom design tokens</td></tr>
<tr><td>Animation</td><td>Framer Motion 12</td><td>Page transitions, micro-interactions, scroll reveals</td></tr>
<tr><td>Icons</td><td>Lucide React</td><td>Consistent, lightweight icon system</td></tr>
<tr><td>Charts</td><td>Recharts 3</td><td>Data visualization for dashboards and analytics</td></tr>
<tr><td>ORM</td><td>Prisma 5</td><td>Type-safe database access with migrations</td></tr>
<tr><td>Database</td><td>SQLite (local) / PostgreSQL (prod)</td><td>Dual-mode: SQLite for dev, Supabase/Neon for production</td></tr>
<tr><td>AI Engine</td><td>Google Gemini Pro</td><td>Demand forecasting, anomaly detection, chatbot intelligence</td></tr>
<tr><td>Typography</td><td>Inter (Google Fonts)</td><td>Clean, modern sans-serif for all UI text</td></tr>
<tr><td>Routing</td><td>React Router DOM 7</td><td>Client-side navigation within modules</td></tr>
</table>

---

## Project Structure

```
aether-ecosystem/
|
+-- prisma/                     # Database layer
|   +-- supply.prisma           # Supply chain schema (7 models)
|   +-- crm.prisma              # CRM schema (3 models)
|   +-- supply.db               # Local SQLite database (supply)
|   +-- crm.db                  # Local SQLite database (CRM)
|   +-- seed-supply.ts          # Supply chain seed data
|   +-- seed-crm.ts             # CRM seed data
|   +-- generated/              # Prisma-generated clients
|
+-- src/
|   +-- app/                    # Next.js App Router
|   |   +-- page.tsx            # Landing page (module selector)
|   |   +-- layout.tsx          # Root layout with Inter font
|   |   +-- globals.css         # Design system & Tailwind config
|   |   +-- supply/             # Aether Supply route
|   |   +-- crm/                # AetherCRM route
|   |       +-- page.tsx        # CRM dashboard
|   |       +-- dataService.ts  # CRM data access layer
|   |
|   +-- supply/                 # Supply chain module
|   |   +-- SupplyApp.tsx       # Root orchestrator (state, handlers)
|   |   +-- types.ts            # TypeScript interfaces & enums
|   |   +-- constants.ts        # Static configuration data
|   |   +-- components/         # 38 UI components
|   |   +-- services/           # 14 business logic services
|   |   +-- contexts/           # React context providers
|   |
|   +-- views/                  # CRM view components
|   |   +-- Dashboard.tsx       # Revenue stats & KPIs
|   |   +-- Clients.tsx         # Client directory
|   |   +-- Pipeline.tsx        # Kanban deal pipeline
|   |   +-- Tasks.tsx           # Task scheduler
|   |   +-- Settings.tsx        # CRM preferences
|   |
|   +-- components/             # Shared components
|   |   +-- Modal.tsx           # Reusable modal dialog
|   |
|   +-- store.ts                # CRM state & initial data
|
+-- package.json
+-- tsconfig.json
+-- docker-compose.yml          # Optional Docker setup
+-- .env.example                # Environment variable template
+-- .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **npm** (bundled with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/yuno7777/aether-ecosystem.git
cd aether-ecosystem

# Install dependencies
npm install
```

### Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

```env
# AI - Required for intelligence features
GEMINI_API_KEY=your-gemini-api-key

# Database - Optional, falls back to local SQLite
DATABASE_URL=your-postgres-connection-string
DIRECT_URL=your-direct-connection-string
```

> **Note:** The application works fully offline using SQLite databases and rich mock data. External database and AI keys are optional enhancements.

### Database Setup

```bash
# Generate Prisma clients
npx prisma generate --schema=prisma/supply.prisma
npx prisma generate --schema=prisma/crm.prisma

# Seed databases with demo data (optional)
npx tsx prisma/seed-supply.ts
npx tsx prisma/seed-crm.ts
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

| Route | Module |
|:---|:---|
| `/` | Landing page with module selector |
| `/supply` | Aether Supply dashboard |
| `/crm` | AetherCRM dashboard |

---

## Design Philosophy

Aether follows a strict set of design principles:

- **Pitch Black Foundation** — Background `#0a0a0c` to eliminate visual noise and maximize focus.
- **Lavender Accent System** — Primary accent `#a78bfa` (violet-400) for interactive elements and highlights.
- **Minimal Chrome** — No unnecessary borders, shadows, or decorations. Every pixel earns its place.
- **Motion with Purpose** — Framer Motion animations are used for orientation, not decoration.
- **Information Density** — Dashboards pack maximum insight into minimum space without feeling cluttered.
- **Graceful Fallbacks** — If the database is unreachable, the app seamlessly falls back to rich demo data.

---

<div align="center">

<br>

<samp>Built with precision in Mumbai, India</samp>

<br>

<sub>Supply Chain Intelligence &middot; Customer Relationship Management &middot; AI-Powered Analytics</sub>

<br><br>

<img src="https://img.shields.io/badge/%C2%A9_2026-Aether_Ecosystem-7c3aed?style=flat-square&labelColor=0a0a0c" />

</div>
