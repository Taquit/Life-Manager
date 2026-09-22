# Money_app — Agent Context & Master Guide

This document serves as the comprehensive context reference for autonomous agents, subagents, and developers working in the **Money_app** (Life-Manager) repository.

---

## 1. Project Overview

**Money_app** is a full-stack personal finance application designed for tracking personal expenses and income, managing debit and credit cards (including billing cycles and payment dates), organizing categories, tracking upcoming recurring bills/services, and generating financial analytics.

### Key Differentiating Feature
* **Automated Transaction Capture via Google Pay**:
  When a user transacts with a card marked as linked to Google Pay (`vinculada_google_pay = true`), the system records transactions automatically with origin `automático_google_pay` (differentiated in the UI by a contactless badge). Manual transactions (`origen = manual`) are recorded via standard forms for cash, bank transfers, and non-automated expenses.

---

## 2. Technology Stack & Infrastructure

### Backend (`/backend`)
* **Framework / Orchestration**: SST v4 (Serverless Stack).
* **Cloud Infrastructure**: AWS Lambda handlers fronted by AWS API Gateway V2.
* **Language & Runtime**: Node.js / TypeScript.
* **Database**: PostgreSQL (hosted on Supabase, connected via native `pg` client).
* **Security & Auth**: JWT (`jsonwebtoken`) for session verification, `bcryptjs` for password hashing, and SST Secrets (`DATABASE_URL`, `JWT_SECRET`).

### Frontend (`/frontend`) & Design System Specs (`extra.md`)
* **Target Platform**: Mobile (Android).
* **Styling & Architecture Guide**: Android Jetpack Compose + Material 3 or React Native / Expo.
* **Theme**: Dark Neon aesthetic with curated HSL-tailored colors.
* **Typography**:
  * Display / Headers / Balances: **Sora** (weights 400, 600, 700). Tabular figures for numbers.
  * Body / Captions / UI: **Manrope** (weights 400, 500, 600, 700).

---

## 3. Directory Layout

```text
Money_app/
├── .agents/                    # Subagent definitions
│   └── agents/
│       ├── backend-dev.md      # Backend specialist subagent
│       ├── contract-reviewer.md# Contract audit subagent
│       └── frontend-dev.md     # Frontend specialist subagent
├── backend/                    # SST v4 Backend project
│   ├── sst.config.ts           # Infrastructure & API Gateway route declarations
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── card/               # Card CRUD and query handlers
│       ├── category/           # Category CRUD and query handlers
│       ├── transactions/       # Transaction CRUD and query handlers
│       ├── user/               # User registration, login, and profile handlers
│       └── utils/              # Shared database connection & response helpers
├── frontend/                   # Frontend workspace
├── AGENTS.MD                   # Multi-agent coordination protocol & boundaries
├── AGENT_CONTEXT.md            # Master context document (this file)
├── MODELS.MD                   # Data models and contract specifications
├── README.md                   # Project intro and execution guide
└── extra.md                    # Detailed UI design and screen specifications
```

---

## 4. Backend Endpoints & Routing

Declared in `backend/sst.config.ts`:

### Authentication & Users (`/user`)
* `POST /user` — Register new user account.
* `POST /user/login` — Authenticate user and return JWT.
* `GET /user` — Retrieve current authenticated user profile.
* `PUT /user` — Update user details.
* `DELETE /user` — Delete user account.

### Transactions (`/transactions`)
* `GET /transactions` — Fetch transactions with support for filters (date range, type, category).
* `POST /transactions` — Create a new transaction (manual or Google Pay).
* `PUT /transactions` — Update an existing transaction.
* `DELETE /transactions` — Remove a transaction.

### Cards (`/card`)
* `GET /card` — Retrieve all cards for authenticated user.
* `GET /card/by_l4` — Retrieve card matching the last 4 digits (used by payment integration).
* `POST /card` — Register a new card.
* `PUT /card` — Update card details (cutoff date, payment date, limit, Google Pay flag).
* `DELETE /card` — Remove card.

### Categories (`/category`)
* `GET /category` — Retrieve categories (expense and income).
* `POST /category` — Create custom category.
* `PUT /category` — Update category name, color, or icon.
* `DELETE /category` — Delete custom category.

---

## 5. Domain Models & Data Structures

### 1. User (`usuario`)
* `id` (UUID / Integer, Primary Key)
* `nombre` (String)
* `email` (String, Unique)
* `metodo_auth` (`email_password` | `google`)
* `hash_password` (String, Nullable for third-party auth)
* `fecha_registro` (Timestamp)

### 2. Card (`tarjeta`)
* `id` (UUID / Integer, Primary Key)
* `usuario_id` (Foreign Key -> User)
* `banco` (String, e.g., BBVA, Santander, Nu)
* `tipo` (`debito` | `credito`)
* `ultimos_4` (String, 4 digits)
* `color_acento` (Hex string)
* `vinculada_google_pay` (Boolean)
* `dia_corte` (Integer, 1-31, applicable to credit)
* `dia_pago` (Integer, 1-31, payment due date)
* `limite` (Decimal / Numeric, credit limit)

### 3. Category (`categoria`)
* `id` (UUID / Integer, Primary Key)
* `usuario_id` (Foreign Key -> User, Nullable for default system categories)
* `nombre` (String, e.g., Alimentación, Transporte, Servicios, Entretenimiento, Salud, Hogar, Compras, Nómina, Freelance, Otros)
* `tipo` (`gasto` | `ingreso`)
* `color` (Hex string)
* `icono` (Identifier / SVG path key)

### 4. Transaction (`transaccion`)
* `id` (UUID / Integer, Primary Key)
* `usuario_id` (Foreign Key -> User)
* `tipo` (`gasto` | `ingreso`)
* `monto` (Decimal / Numeric)
* `categoria_id` (Foreign Key -> Category)
* `tarjeta_id` (Foreign Key -> Card, Nullable)
* `fecha` (Timestamp / Date)
* `nota` (Text, Optional)
* `origen` (`manual` | `automático_google_pay`)

### 5. Bill / Upcoming Service (`servicio_a_pagar`)
* `id` (UUID / Integer, Primary Key)
* `usuario_id` (Foreign Key -> User)
* `nombre` (String, e.g., Internet, Electricidad, Streaming)
* `categoria_id` (Foreign Key -> Category)
* `monto` (Decimal / Numeric)
* `fecha_vencimiento` (Date)
* `estado` (`pendiente` | `pagado` | `vencido`)
* `fecha_pago` (Date, Nullable)

### 6. Monthly Summary (Calculated View)
* `mes` (Year-Month)
* `ingresos_total` (Sum of income)
* `gastos_total` (Sum of expenses)
* `balance_neto` (`ingresos_total - gastos_total`)
* Breakdown by category with percentage distribution

---

## 6. Design System Tokens (from `extra.md`)

* **Base**:
  * Background: `#0D0B1A`
  * Surface: `#17142B`
  * Surface Track: `#241F42`
  * Subtle Border: `#2E2757`
  * Primary Text: `#F2EEFC`
  * Secondary Text: `#B4A9E0`
  * Tertiary Text: `#8A7FBD`
  * Placeholder: `#6E6494`
* **Brand Accent**:
  * Brand Fill: `#7C3AED`
  * Brand Text: `#B84FFF`
  * Deep Hero Surface: `#26134D` / `#20103F`
  * Brand Soft Text: `#C7A9FF`
* **Semantics**:
  * Income Text / Fill: `#39FFC4` / `#0FAE7C`
  * Expense Text / Fill: `#FF5C7A` / `#D6294B`
  * Pending Status: `#FFC94D` (Text), `#3A2B12` (Background)
  * Paid Status: `#0F3324` (Background)
  * Overdue Status: `#3A0F1A` (Background)

---

## 7. Multi-Agent Development Workflow & Rules

All autonomous and subagent operations adhere to the protocol in `AGENTS.MD`:

### Agent Roles and Scopes
1. **`@backend-dev`**:
   * Permitted: `backend/**`, `sst.config.ts`, `migrations/**`.
   * Prohibited: Any frontend files, `extra.md`.
   * Responsible for AWS Lambda handlers, SST configuration, PostgreSQL queries, and API contracts.
2. **`@frontend-dev`**:
   * Permitted: `frontend/**`.
   * Prohibited: Backend source, database migrations, SST configs.
   * Responsible for UI components, state management, and consuming backend endpoints according to `extra.md`.
3. **`@contract-reviewer`**:
   * Read-only across entire repository.
   * Responsible for auditing DTOs, endpoint signatures, casing consistency, and field nullability.

### Development Lifecycle
1. **Step 1 — Backend & Contract**: `@backend-dev` creates/updates endpoints, schemas, and DTOs using `camelCase` keys.
2. **Step 2 — Client Integration**: `@frontend-dev` builds or updates UI components to match API responses and design specs.
3. **Step 3 — Contract Audit**: `@contract-reviewer` validates parity between backend responses and frontend consumption.

### Critical Safety Guardrails
* **No Autonomous Cloud Deployments**: Never execute `sst deploy`, `npx sst deploy`, or `sst remove` without explicit confirmation from the user.
* **No Destructive Database Commands**: Never execute `DROP`, `TRUNCATE`, or destructive data loss scripts without explicit user review and approval.
* **Environment Protection**: Never view, read, or edit `.env` files.
* **Style Guidelines**: Do not use emojis in code, comments, or agent responses.
