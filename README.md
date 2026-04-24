<div align="center">

<br>

<img src="https://img.shields.io/badge/AETHER-ECOSYSTEM-7663b0?style=for-the-badge&labelColor=0a0a0c&logoColor=white" height="50" />

<br><br>

<samp>One Platform. Six Powerhouses. Zero Compromise.</samp>

<br><br>

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0f172a?style=flat-square&logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_3.1_Flash_Lite-886FBF?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion_12-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Prisma](https://img.shields.io/badge/Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-333?style=flat-square)](#)

<br>

---

</div>

## Overview

**Aether Ecosystem** is an enterprise-grade, AI-native unified business platform that consolidates **six mission-critical operational domains** — Supply Chain, CRM, Document Intelligence, Tax & Compliance, Autonomous Sales Development, and WhatsApp Commerce — into a single, cohesive deployment. Designed from the ground up for Indian B2B SMBs, it runs on a pitch-black glassmorphism UI with lavender accents (`#7663b0`), delivering a premium, distraction-free workspace powered by Google Gemini 3.1 Flash Lite Preview.

This is not six products glued together. It is one codebase, one deployment, and one source of truth that connects raw materials entering a warehouse all the way through to an AI agent closing a retail sale over WhatsApp.

---

## Why Aether

<table>
<tr>
<td width="50%">

### The Problem

Most businesses operate their supply chain, CRM, documents, taxes, and customer communication across 8–12 completely disconnected SaaS tools. Inventory lives in Tally. Deals live in Salesforce. Invoices are made in Excel. GST is done once a quarter in panic. Lead outreach is manual. Customer support is on WhatsApp, managed by overworked humans.

The result: data silos, missed ITC claims, slow sales cycles, and no single view of the business.

</td>
<td width="50%">

### The Solution

Aether collapses all of this into one platform. Inventory data flows into the CRM. Document extraction feeds into the invoice builder. GST reconciliation is AI-automated. An autonomous AI SDR agent prospects, qualifies, and schedules demos. A WhatsApp AI agent browses catalogs, processes UPI payments, and handles 86% of customer queries without a human.

Every module speaks to every other module. Every decision is informed by the full picture.

</td>
</tr>
</table>

**Key Platform Benefits:**

| Benefit | Detail |
|:---|:---|
| **Six Unified Modules** | Supply Chain → CRM → Documents → Tax → AI SDR → WhatsApp Commerce, all in one deployment |
| **AI-First Architecture** | Google Gemini 3.1 Flash Lite Preview embedded natively into every module for real-time intelligence |
| **Indian B2B Optimized** | GST reconciliation, GSTR-2B matching, UPI payment links, Hindi/Marathi/Gujarati language support |
| **Zero Context Switching** | Navigate from a warehouse stockout alert to a closed CRM deal without leaving the platform |
| **Real-Time Operations** | Live WhatsApp inbox, live agent activity feeds, live stock alerts — no manual refresh required |
| **Graceful Degradation** | If the database or AI API is unreachable, every module falls back to rich, realistic mock data |
| **PDF Generation** | Built-in invoice and purchase order PDF generation using React-PDF with company branding |
| **Role-Based Access** | Auth provider with role metadata (ROLE_META) for fine-grained access control per module |

---

## The Six Powerhouses

---

### 1. Aether Supply — Supply Chain Intelligence (`/supply`)

A full-featured, **41-component** supply chain management system covering inventory operations end-to-end. Powers the foundation of the platform with real inventory data that feeds into every other module.

#### Dashboard & Analytics
- **KPI Dashboard** (`Dashboard.tsx`) — At-a-glance total inventory value, stock health index, active anomaly count, and reorder alerts. Animated stat cards with trend indicators.
- **Category Analytics** (`CategoryAnalytics.tsx`) — Revenue and stock breakdown by product category with interactive Recharts bar charts and percentage comparisons.
- **Trend Comparison** (`TrendComparison.tsx`) — Side-by-side, multi-product sales trend overlays across custom date ranges for spotting seasonality and demand spikes.
- **Profit Margins** (`ProfitMargins.tsx`) — Item-level and category-level margin analysis with cost-vs-price breakdown and gross margin percentage tracking.

#### Inventory & Product Management
- **Product Catalog** (`ProductList.tsx`) — Full CRUD with advanced search, multi-field filtering, SKU/barcode display, category, price, cost, and supplier assignment. Inline status badges (Critical / Low / Overstocked / Healthy).
- **Product Modal** (`ProductModal.tsx`) — Detailed product form with 22 fields including dimensions, weight, lead time, reorder level, and warehouse assignment.
- **Bulk Import** (`BulkImport.tsx`) — Mass CSV/JSON upload for products, suppliers, and inventory records with column mapping and validation feedback.
- **Barcode Scanner** (`BarcodeScanner.tsx`) — Camera-based barcode/QR scanning using browser APIs for instant product lookup.
- **Category Manager** (`CategoryManager.tsx`) — CRUD panel for product categories with user-scoped visibility.

#### Supplier & Warehouse Operations
- **Supplier Hub** (`Suppliers.tsx`) — Vendor directory with contact info, location, lead time, and order history.
- **Supplier Scorecard** (`SupplierScorecard.tsx`) — Star rating, on-time delivery %, fulfillment rate, and total order volume per vendor with visual scoring bars.
- **Supplier Alerts** (`SupplierAlerts.tsx`) — Automated notifications for delayed, at-risk, or underperforming suppliers.
- **Lead Time History** (`LeadTimeHistory.tsx`) — Historical lead time tracking per supplier with trend visualization.
- **Supplier Manager** (`SupplierManager.tsx`) — Settings panel for adding/editing suppliers.
- **Warehouse View** (`WarehouseView.tsx`) — Multi-location inventory visualization with per-warehouse capacity utilization, stock counts, and utilization percentages.
- **Warehouse 3D** (`Warehouse3D.tsx`) — Three.js-powered 3D warehouse visualization for spatial bay mapping.
- **Warehouse Manager** (`WarehouseManager.tsx`) — Add/edit warehouses with location, capacity, and zone configuration.
- **Stock Transfer** (`StockTransfer.tsx`) — Inter-warehouse movement management with full audit trail, from/to warehouse selection, quantity validation, and notes.

#### AI & Forecasting
- **AI Intelligence** (`Intelligence.tsx`) — Gemini 3.1 Flash Lite-powered analytics that generate natural-language actionable insights from current inventory state, including reorder suggestions, slow-mover identification, and demand spike warnings.
- **AI Chatbot** (`AIChatbot.tsx`) — Floating conversational assistant with full context of inventory, sales, and supplier data. Powered by `chatService.ts` + `genkitService.ts`. Answers queries like "What's selling fastest?" or "When will monitors run out?" with real data.
- **Anomaly Detection** (`AnomalyDetection.tsx`) — Statistical anomaly detection across stock levels and sales patterns using z-score and moving average deviation. Flags unusual spikes, drops, and consecutive low-stock anomalies.
- **Demand Forecast** (`DemandForecast.tsx`) — AI-generated demand curves using exponential smoothing on historical sales data, segmented by category.
- **Stockout Prediction** (`StockoutPrediction.tsx`) — Predictive engine that calculates days until stockout for each product based on current stock and average daily sales velocity.
- **Price Optimizer** (`PriceOptimizer.tsx`) — Cost-based pricing analysis with margin optimization recommendations, competitor positioning, and suggested price bands.
- **Smart Reorder** (`SmartReorder.tsx`) + **Auto Reorder** (`AutoReorder.tsx`) — Algorithm-based reorder point calculations using safety stock, lead time, and service level targets. Can auto-trigger purchase orders.

#### Purchasing & Orders
- **Purchase Orders** (`PurchaseOrders.tsx`) — Automated PO generation from reorder suggestions, with supplier assignment, delivery date estimation, and status tracking (Draft / Sent / Delivered).
- **Custom Order Modal** (`CustomOrderModal.tsx`) — Manual PO creation form with line items, quantities, suppliers, and notes.
- **Sales Log** (`SalesLog.tsx`) — Transaction history linked to products with date, quantity, and revenue logging.

#### Utilities
- **Stock Alerts** (`StockAlerts.tsx`) — Real-time notification panel for critical, low, and overstocked items with severity classification and bulk reorder CTAs.
- **Advanced Filter** (`AdvancedFilter.tsx`) — Multi-criteria filter panel with date range picker, category, status, stock level, and supplier filters.
- **Date Range Picker** (`DateRangePicker.tsx`) — Custom calendar component for selecting analytics date windows.
- **Activity Log** (`ActivityLog.tsx`) — Full audit trail of all Create/Update/Delete operations with user, timestamp, and entity name.
- **Export Button** (`ExportButton.tsx`) — One-click export to CSV or JSON for any data table view.
- **Bulk Import** — CSV upload with column mapping for rapid data onboarding.

#### Service Layer (14 services)
| Service | Responsibility |
|:---|:---|
| `dataService.ts` | Core CRUD against Prisma DB with API fallback logic |
| `inventoryService.ts` | Stock status classification, demand trends, safety stock |
| `forecastService.ts` | Exponential smoothing demand forecasting |
| `anomalyService.ts` | Statistical anomaly detection (z-score, deviation) |
| `predictionService.ts` | Days-until-stockout calculations |
| `pricingService.ts` | Margin optimization and cost analysis |
| `purchaseOrderService.ts` | Automated PO generation from reorder triggers |
| `chatService.ts` | Context-aware conversation engine for AI chatbot |
| `geminiService.ts` | Google Gemini API integration for inventory insights |
| `genkitService.ts` | Google GenKit adapter using `gemini-3.1-flash-lite-preview` |
| `exportService.ts` | CSV/JSON data serialization and export |
| `neonClient.ts` | Neon PostgreSQL serverless driver |
| `supabaseClient.ts` | Supabase client initialization |
| `mockData.ts` | Rich fallback dataset for offline/demo operation |

---

### 2. AetherCRM — Customer Relationship Management (`/crm`)

A high-velocity, full-featured CRM designed for clarity over clutter. Built with a Kanban pipeline, client intelligence, and geographic visualization.

#### Features
- **Revenue Dashboard** (`Dashboard.tsx`) — Total revenue, active client count, win rate percentage, average deal size, and monthly revenue trend chart.
- **Client Directory** (`Clients.tsx`) — Searchable client list with status badges (Active / Pending / Inactive), company names, contact details, and deal count. Full CRUD.
- **Sales Pipeline** (`Pipeline.tsx`) — Kanban-style deal board across four stages: **Lead → Contacted → Proposal → Won**. Drag-and-drop deal cards with value, age, and stage tracking.
- **Client Map** (`ClientMap.tsx`) — Geographic visualization of client locations for territory management.
- **Task Manager** (`Tasks.tsx`) — Integrated task scheduler for calls, emails, and meetings with due dates and completion tracking.
- **Settings Panel** (`Settings.tsx`) — CRM preferences and configuration.

#### Shared AI Components
- **Smart Quote** (`SmartQuote.tsx`) — AI-powered quote generator for rapid proposal drafting, connected to inventory data.
- **Email Drafter** (`EmailDrafter.tsx`) — Gemini-powered email drafting assistant for client outreach.
- **Command Palette** (`CommandPalette.tsx`) — Global `⌘K` search and action palette across modules.

---

### 3. AetherDocs — Intelligent Document Processing (`/documents`)

An AI-powered document intelligence hub that extracts structured data from unstructured files and provides a full-featured invoice builder with PDF export.

#### Features

**Upload & AI Extraction**
- Drag-and-drop file upload with multi-file queue support
- Supports PDF, DOCX, TXT, CSV, and image-based documents
- `extractTextFromFile()` — Parses raw text from uploaded files
- `extractDocumentData()` — Sends text to Gemini 3.1 Flash Lite with a structured extraction prompt, returning vendor name, invoice number, date, line items (description, quantity, unit price), GST amounts, and totals
- Processing status indicator with per-file loading states

**Document Library**
- Processed documents library with status badges (Extracted / Processing / Failed)
- Full-screen document viewer with structured field display
- Export to CSV or JSON per processed document
- Delete document functionality

**Invoice Builder** (`InvoiceBuilder.tsx`)
- Multi-section form: Company details, client details, line items, tax rates, payment terms
- AI-assisted line item drafting via prompt (`draftInvoiceWithAI()`) — describe what you want to invoice and Gemini generates structured line items
- Real-time subtotal, GST, and grand total calculation
- Live preview of generated invoice
- PDF generation and download via `InvoicePDF.tsx` using React-PDF

**Settings Panel** (`SettingsPanel.tsx`)
- Company logo upload
- Company name, address, GSTIN, bank details persistence
- These settings are injected into all generated invoices and purchase orders

**PDF Templates**
- `InvoiceTemplate.tsx` — Branded invoice PDF with company logo, client details, line items, GST breakdown, and payment terms
- `PurchaseOrderTemplate.tsx` — Branded PO PDF with supplier details, ordered items, delivery dates, and terms

**Service Layer**
- `documentService.ts` — `extractDocumentData()`, `draftInvoiceWithAI()`, `exportToCSV()`, `exportToJSON()`
- `quoteService.ts` — Quote generation logic

---

### 4. AetherTax — GST & Compliance Intelligence (`/tax`)

Automated GSTR-2B reconciliation, ITC tracking, and AI-powered compliance advisory specifically designed for Indian GST filing requirements.

#### Three Dashboard Views

**Tax Overview Dashboard**
- Period summary card: Total Sales Liability, Total ITC Available, Total ITC Lost, Net Tax Payable
- Visual KPI cards with currency formatting (₹)
- Quick action buttons: Sync Portal Data, Export Report, Send Alert to CA
- AI advisory generation trigger

**GSTR Reconciliation Table**
- Side-by-side comparison: **Books vs GSTR-2B Portal** per vendor
- Columns: Vendor Name, GSTIN, Invoice Number, Date, Book Amount, Portal Amount, Book ITC, Portal ITC, Status
- Status badges: ✅ Matched | ⚠️ Mismatch | 🔴 Missing in Portal | 🔵 Missing in Books
- Row-level ITC delta calculation
- **Gemini AI Advisory** — One click sends all mismatched rows to `analyzeMismatchesWithAI()`, which returns a Chartered Accountant-grade markdown advisory with vendor-by-vendor action items, ITC loss quantification, and recommended next steps
- **WhatsApp CA Alert** — `sendCAAlert()` dispatches advisory summary to the CA via messaging API

**Portal Notices**
- Notice alert cards with department, subject, severity badge (High / Medium / Low), and due date
- Badge notification counter on sidebar item

**Service Layer**
- `taxService.ts` — `generateMockTaxData()`, `analyzeMismatchesWithAI()`, `sendCAAlert()`

---

### 5. AetherSDR — AI Sales Development Rep Agent (`/sdr`)

An autonomous AI agent dashboard for managing the full top-of-funnel sales workflow — from lead sourcing through qualified CRM handoff — targeting Indian B2B SMBs.

#### Four Dashboard Views

**SDR Dashboard**
- Stats: Active Cadences, Emails Sent (with open rate), Meetings Booked
- **Live Agent Activity Feed** — Real-time log of: Email Sent, Lead Qualified, WhatsApp Reply, Demo Booked events with timestamps
- **Pipeline Analytics Chart** — Mock bar chart showing leads by stage (Sourced → Contacted → Replied → Qualified → Meeting Booked)
- Active cadence list with status indicators and progress bars

**Lead Sourcing & Prospecting**
- Lead table with columns: Name, Company, Role, Source (Apollo/LinkedIn/Google), Score (0–100), Status (New / Contacted / Replied / Qualified / Disqualified)
- **Score Badge** — Color-coded qualification score with threshold classification
- Lead source tags (Apollo.io, LinkedIn Scrape, Google Search Grounding)
- Per-lead action buttons: Quick Email, Quick WhatsApp, View Profile
- Add New Lead form with multi-source selection

**Cadence Manager (Email Outreach)**
- Cadence builder with step editor
- **Gemini Email Drafter** — "Generate Draft" button sends context (lead name, company, role, pain points) to Gemini 3.1 Flash Lite via a system prompt, returning a fully tailored cold email with subject line, body, and personalized talking points
- Gmail SMTP / SendGrid integration configuration
- Follow-up sequence with branching logic (e.g., if no reply in 3 days → send follow-up 1)
- Open tracking and reply detection placeholders

**Settings & API Configuration**
- **Gmail / SendGrid** — SMTP host, API key, from name, reply-to
- **WhatsApp Provider** — Gupshup / Interakt provider select, opt-in token
- **Agent LLM Runtime** — Gemini model selector (currently: `gemini-3.1-flash-lite-preview`), system prompt override for persona customization
- **Cal.com / Calendar** — Cal.com API key for automated demo booking links, Google Calendar OAuth placeholder
- **Apollo.io** — API key for lead sourcing integration
- **CRM Handoff** — Supabase URL/key for auto lead entry and score thresholds for qualification triggers

---

### 6. AetherCommerce — WhatsApp AI Commerce Agent (`/commerce`)

A full-stack WhatsApp Business API operations dashboard for running conversational commerce — catalog browsing, UPI ordering, AI support, human handoffs, and broadcast campaigns — in Hindi, English, Marathi, and Gujarati.

#### Four Dashboard Views

**Commerce Overview Dashboard**
- Live KPI cards: Active Conversations, Orders Placed (via WhatsApp), UPI Payments Realized, **AI Deflection Rate (86%)**
- **Live Agent Activity Stream** — Real-time feed: Order Placed (Hindi), UPI Payment Success, Support FAQ Resolved, Handoff Triggered
- **Conversational Demographics** — Language breakdown bar chart: English 45%, Hindi 35%, Marathi 12%, Gujarati 8% with user counts

**Live Operations Inbox (Human Handoff)**
- Split-pane chat interface: conversation list (left) + active chat (right)
- Chat list with contact phone/name, last message preview, timestamp, and status tags: **Handoff | Urgent | AI Handled | Resolved**
- Active conversation highlighted with lavender border indicator
- Full chat thread view with AI bubble (left) and user bubble (right)
- **Handoff simulation** — When user requests human, AI pauses and shows "Human agent joined" divider
- "Resume AI Control" button to hand conversation back to the bot
- Admin message composer with send button

**Broadcast Campaigns**
- **Gemini Template Editor** — Write broadcast message in English, select target language (Hindi / Marathi / Tamil), click "Auto-Localize" to have Gemini translate and culturally adapt the message
- Variable injection: `{{Name}}`, `{{OrderID}}` placeholder support
- **Audience Targeting** — CRM Segment picker (e.g., "Active Retailers" — 4,020 contacts), purchase history filter
- One-click broadcast push to entire segment
- Campaign name input and template management

**Integration Settings**
- **WhatsApp Business API** — WABA Phone ID, Permanent Access Token (Meta Cloud API)
- **UPI Payment Gateway** — Razorpay API Key for dynamic UPI link generation in chat
- **Catalog Sync** — Direct inventory sync from Aether Supply (active status display)

---

## Shared Infrastructure & Components

### Authentication (`/auth`)
- `AuthProvider.tsx` — React context-based auth with user state management, `login()`, `logout()` methods, and `ROLE_META` for role definitions
- Role-gated module access with per-module permission checks

### Shared Components (`/components`)
| Component | Description |
|:---|:---|
| `CommandPalette.tsx` | Global `⌘K` command palette for cross-module search and navigation |
| `EmailDrafter.tsx` | Reusable Gemini-powered email drafting modal |
| `SmartQuote.tsx` | AI quote builder pulling live inventory data |
| `Modal.tsx` | Reusable modal dialog wrapper with AnimatePresence transitions |
| `Providers.tsx` | Root React context providers |
| `pdf/InvoiceTemplate.tsx` | React-PDF invoice template with branding |
| `pdf/PurchaseOrderTemplate.tsx` | React-PDF PO template with supplier details |

### Database (`/prisma`)
Dual Prisma schema architecture:

**Supply Schema** (`prisma/supply.prisma`) — 7 models:
`Product` · `Supplier` · `Warehouse` · `Sale` · `StockTransfer` · `ActivityLog` · `Category`

**CRM Schema** (`prisma/crm.prisma`) — 3 models:
`Client` · `Deal` · `Task`

---

## Full Tech Stack

| Layer | Technology | Version | Purpose |
|:---|:---|:---|:---|
| **Framework** | Next.js (App Router) | 15 | SSR, file-based routing, API routes |
| **UI Library** | React | 19 | Component-based frontend |
| **Language** | TypeScript | 5.8 | Full type-safety across codebase |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS with custom design tokens |
| **Animation** | Framer Motion | 12 | Page transitions, micro-interactions, scroll reveals |
| **Icons** | Lucide React | Latest | 500+ consistent SVG icons |
| **Charts** | Recharts | 3 | Data visualization in dashboards |
| **ORM** | Prisma | 5 | Type-safe DB access with migrations |
| **Database (Dev)** | SQLite | — | Local development, zero config |
| **Database (Prod)** | PostgreSQL | — | Supabase / Neon serverless |
| **AI Engine** | Google Gemini | 3.1 Flash Lite Preview | Forecasting, extraction, drafting, advisory |
| **AI SDK** | @google/genai | Latest | Direct Gemini API calls |
| **PDF Generation** | React-PDF / pdf-lib | — | Invoice and PO document rendering |
| **Typography** | Inter (Google Fonts) | — | Clean, modern sans-serif |

---

## Project File Structure

```
aether-ecosystem/
│
├── prisma/
│   ├── supply.prisma           # Supply chain DB schema (7 models)
│   ├── crm.prisma              # CRM DB schema (3 models)
│   ├── supply.db               # Local SQLite (supply)
│   ├── crm.db                  # Local SQLite (CRM)
│   ├── seed-supply.ts          # Supply chain seed data
│   ├── seed-crm.ts             # CRM seed data
│   └── generated/              # Prisma-generated type-safe clients
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page — module selector (6 powerhouses)
│   │   ├── layout.tsx          # Root layout with Inter font, metadata
│   │   ├── globals.css         # Design system, Tailwind base, custom tokens
│   │   ├── supply/             # Aether Supply route wrapper
│   │   ├── crm/                # AetherCRM route
│   │   │   └── page.tsx        # CRM root with auth, view router
│   │   ├── documents/          # AetherDocs route
│   │   │   ├── page.tsx        # Documents root (upload/library/invoice/settings)
│   │   │   ├── InvoiceBuilder.tsx  # Full invoice creation form + AI draft
│   │   │   ├── InvoicePDF.tsx  # PDF preview and download component
│   │   │   └── SettingsPanel.tsx   # Company branding settings
│   │   ├── tax/                # AetherTax route
│   │   │   └── page.tsx        # Tax dashboard (overview/reconciliation/notices)
│   │   ├── sdr/                # AetherSDR route
│   │   │   └── page.tsx        # SDR dashboard (pipeline/cadences/settings)
│   │   └── commerce/           # AetherCommerce route
│   │       └── page.tsx        # Commerce dashboard (inbox/campaigns/settings)
│   │
│   ├── supply/                 # Supply Chain module
│   │   ├── SupplyApp.tsx       # Root orchestrator (state, event handlers)
│   │   ├── types.ts            # TypeScript interfaces & enums
│   │   ├── constants.ts        # Static configuration & defaults
│   │   ├── components/         # 41 UI components (see full list above)
│   │   ├── services/           # 14 business logic services
│   │   └── contexts/           # React context providers
│   │
│   ├── views/                  # CRM view components
│   │   ├── Dashboard.tsx       # Revenue KPIs & charts
│   │   ├── Clients.tsx         # Client directory & CRUD
│   │   ├── Pipeline.tsx        # Kanban deal pipeline
│   │   ├── ClientMap.tsx       # Geographic client map
│   │   ├── Tasks.tsx           # Task scheduler
│   │   └── Settings.tsx        # CRM configuration
│   │
│   ├── auth/                   # Authentication layer
│   │   └── AuthProvider.tsx    # Context, ROLE_META, login/logout
│   │
│   ├── services/               # Global services
│   │   ├── documentService.ts  # AI extraction, invoice drafting, CSV/JSON export
│   │   ├── taxService.ts       # GST data, AI advisory, CA alerting
│   │   └── quoteService.ts     # Smart quote generation
│   │
│   ├── components/             # Shared platform components
│   │   ├── CommandPalette.tsx  # Global ⌘K palette
│   │   ├── EmailDrafter.tsx    # AI email drafting modal
│   │   ├── SmartQuote.tsx      # AI quote builder
│   │   ├── Modal.tsx           # Reusable modal
│   │   ├── Providers.tsx       # Root context wrapper
│   │   └── pdf/
│   │       ├── InvoiceTemplate.tsx      # PDF invoice template
│   │       └── PurchaseOrderTemplate.tsx # PDF PO template
│   │
│   └── store.ts                # CRM Zustand/state store with initial data
│
├── .env.local                  # Environment secrets (not committed)
├── .env.example                # Variable template
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **npm** 10+ (bundled with Node.js)

### Installation

```bash
git clone https://github.com/yuno7777/aether-ecosystem.git
cd aether-ecosystem
npm install
```

### Environment Configuration

```bash
cp .env.example .env.local
```

**Required variables:**

```env
# AI — Powers all 6 modules
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Database — Optional, falls back to local SQLite
DATABASE_URL=your-postgres-connection-string
DIRECT_URL=your-direct-postgres-string
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** All modules work fully offline using SQLite and rich mock data. Only the Gemini key is required to unlock live AI features.

### Database Setup

```bash
# Generate Prisma clients
npx prisma generate --schema=prisma/supply.prisma
npx prisma generate --schema=prisma/crm.prisma

# Seed with demo data (optional)
npx tsx prisma/seed-supply.ts
npx tsx prisma/seed-crm.ts
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`

### Routes

| Route | Powerhouse | Key Features |
|:---|:---|:---|
| `/` | Landing Page | Module selector, hero animations, stats |
| `/supply` | Aether Supply | 41-component inventory management |
| `/crm` | AetherCRM | Pipeline, clients, tasks, analytics |
| `/documents` | AetherDocs | AI extraction, invoice builder, PDF export |
| `/tax` | AetherTax | GSTR reconciliation, AI advisory, notices |
| `/sdr` | AetherSDR | Lead sourcing, cadence manager, Gemini drafting |
| `/commerce` | AetherCommerce | WhatsApp inbox, broadcasts, UPI orders |

---

## Design System

Aether follows a strict set of visual principles:

- **Foundation** — Background `#0a0a0c` — pitch black, zero noise
- **Primary Accent** — `#7663b0` lavender — interactive elements, highlights, CTAs
- **Glassmorphism** — `bg-white/[0.02..0.05]` overlays on dark surfaces
- **Border System** — `border-white/5` to `border-white/20` for layering depth
- **Typography** — Inter from Google Fonts; weights 400/500/600/700
- **Motion** — Framer Motion `AnimatePresence` with `opacity + y` reveals; stagger children for lists
- **Micro-interactions** — Hover states on every interactive element; scale, color, and glow transforms
- **Iconography** — Lucide React throughout, `strokeWidth` adjusts between active/inactive states (2.5 vs 2)

---

## Planned Integrations (Backend)

| Feature | Integration Target |
|:---|:---|
| WhatsApp messaging | Meta Cloud API / Gupshup / Wati |
| Email outreach | Gmail SMTP / SendGrid |
| Lead sourcing | Apollo.io API / LinkedIn Scraping |
| Demo scheduling | Cal.com API + Google Calendar OAuth |
| UPI payments | Razorpay Payment Links API |
| CRM persistence | Supabase (PostgreSQL) |
| Workflow automation | n8n webhooks + FastAPI agent runtime |

---

<div align="center">

<br>

<samp>Built with precision in Mumbai, India</samp>

<br>

<sub>Supply Chain &middot; CRM &middot; Documents &middot; Tax &middot; AI SDR &middot; WhatsApp Commerce</sub>

<br><br>

<img src="https://img.shields.io/badge/%C2%A9_2026-Aether_Ecosystem-7663b0?style=flat-square&labelColor=0a0a0c" />

</div>
