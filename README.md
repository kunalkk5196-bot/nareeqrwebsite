# NAREE VendTrack — Sanitary Napkin Vending Machine IoT Management Platform

[![Status](https://img.shields.io/badge/Status-Production--Ready-emerald.svg)](https://github.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![Framework](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)

**Naree VendTrack** is an enterprise-grade IoT Vending Machine Management System engineered to monitor and manage large fleets of cellular 4G-connected sanitary napkin vending machines. It integrates with physical static QR codes (**PhonePe** and **Razorpay**), validates webhooks server-side with strict idempotency, triggers physical mechanical dispenses, reconciles inventory variances, and generates compliance-grade financial reports.

---

## 1. Key Business Rules & Architectural Highlights

1. **Pre-Existing Static QR Association (No Synthetic QR Generation)**:
   - Physical vending machines already have static PhonePe and Razorpay QR codes affixed.
   - The application binds each machine to its unique pre-printed identifiers (e.g. `PH-VM-PUN-0001` and `RP-VM-PUN-0001`).
2. **Zero-Fabrication QR Scan Telemetry Rule**:
   - Static QR scan metrics are only recorded if PhonePe or Razorpay merchant telemetry APIs expose raw scan events.
   - If unavailable, the system strictly reports `Unavailable` rather than fabricating synthetic scan numbers.
   - The system **never** equates *number of payments* with *number of QR scans*.
3. **Decoupled Financial vs Physical Execution (`PAYMENT SUCCESS ≠ DISPENSE SUCCESS`)**:
   - Payments and dispensing transactions are tracked as distinct database records.
   - If a verified payment succeeds but the machine motor jams or optical drop sensor times out, the anomaly is quarantined in `/reconciliation` for automated customer refunds or manual dispatch.
4. **Stock Variance & Drift Reconciliation**:
   - Expected Book Stock (`Opening + Refills - Dispensed`) is continuously compared against reported physical stock. Variances trigger an immediate `STOCK_MISMATCH` audit alert.

---

## 2. System Architecture

```
                    [ Physical Vending Machine ]
                         /                  \
   [ Affixed PhonePe / Razorpay QR ]     [ 4G IoT Controller (SIM) ]
               |                                     |
         Customer Scans & Pays              MQTT / HTTPS Telemetry
               |                         + Device Authentication Credentials
               v                                     |
    [ Payment Provider API ]                         |
     (PhonePe / Razorpay)                            |
               |                                     |
    Webhook (SHA256 / HMAC-SHA256)                   |
               v                                     v
    +-------------------------------------------------------+
    |               NAREE VendTrack Backend API             |
    |  - Webhook Ingestion with Idempotency Guard           |
    |  - QR Identifier Machine Resolver                     |
    |  - IoT Heartbeat & Offline Monitor (300s timeout)     |
    |  - Dispense Trigger & Stock Variance Engine           |
    |  - Audit Logging & Financial Ledger                   |
    +-------------------------------------------------------+
                               |
               +---------------+---------------+
               |                               |
               v                               v
      [ PostgreSQL 16 DB ]            [ Next.js Admin Dashboard ]
      - 17 Normalized Relational      - Fleet Management & Telemetry
        Tables with Indexes           - Revenue & Dispense Charts
      - Strict Foreign Keys & Audit   - Reconciliation Center
      - ACID Transactions             - Multi-format Reports (CSV/Excel)
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js 20, Express, TypeScript, Prisma ORM, Pino Structured Logging, Zod Validation |
| **Database** | PostgreSQL 16 (Normalized Relational Schema), In-memory Relational DataStore Fallback |
| **Frontend Dashboard** | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Lucide Icons, Outfit Typography |
| **IoT Layer** | Eclipse Mosquitto MQTT Broker (1883), Secure HTTPS REST Fallback (`/api/v1/iot/...`) |
| **Payment Integrations** | Official PhonePe Merchant Checksum (`X-VERIFY`), Razorpay Webhooks (`HMAC-SHA256`) |
| **DevOps & Containers** | Docker, Docker Compose, Multi-stage Dockerfiles |

---

## 4. Pre-Seeded Demonstration Accounts

For immediate testing, 4 role-based demo accounts with password `Password@123` are pre-seeded:

| Role | Email | Description / Permissions |
|---|---|---|
| **SUPER_ADMIN** | `superadmin@naree.com` | Full administrative control, user creation, settings, audit logs |
| **ADMIN** | `admin@naree.com` | Machine management, transaction investigation, reports, stock refills |
| **OPERATOR** | `operator@naree.com` | Machine monitoring, stock adjustments, field refills |
| **VIEWER** | `viewer@naree.com` | Read-only analytics, charts, telemetry monitoring |

---

## 5. Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 10+

### Option A: Running Backend & Frontend Directly

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start Backend API Server**:
   ```bash
   npm run dev
   ```
   *The backend will boot on `http://localhost:5000` with Swagger documentation available at `http://localhost:5000/api/v1/docs`.*

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Frontend Next.js Dashboard**:
   ```bash
   npm run dev
   ```
   *The admin dashboard will be live at `http://localhost:3000`.*

---

## 6. Option B: Docker Compose Deployment

To launch the complete production stack (PostgreSQL, Mosquitto MQTT, Backend, and Frontend):

```bash
cd docker
docker compose up -d
```

Service mapping:
- **Admin Dashboard**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000`
- **Swagger Documentation**: `http://localhost:5000/api/v1/docs`
- **MQTT Broker**: `mqtt://localhost:1883`
- **PostgreSQL**: `localhost:5432` (`user: postgres`, `db: naree_vending`)

---

## 7. Running the IoT Vending Machine Simulator

To simulate live 4G SIM machines posting sensor telemetry (battery voltage, motor driver status, drop sensor verification, and stock levels):

```bash
# From workspace root
npx tsx iot/simulator.ts
```

---

## 8. Payment Webhook Endpoints & Verification

### PhonePe Webhook
- **URL**: `POST /api/v1/webhooks/phonepe`
- **Header**: `X-VERIFY: <SHA256_CHECKSUM>###<SALT_INDEX>`
- **Payload**: Standard PhonePe Base64 encoded payload.

### Razorpay Webhook
- **URL**: `POST /api/v1/webhooks/razorpay`
- **Header**: `X-Razorpay-Signature: <HMAC_SHA256_HEX>`
- **Payload**: Standard Razorpay event JSON (`payment.captured`, `order.paid`).

### Idempotency Protection
All webhooks enforce strict deduplication:
```
Header: X-Idempotency-Key: <unique_key>
```
If a duplicate webhook is received, the server returns the cached response without creating duplicate payment entries or duplicate dispense commands.

---

## 9. Automated Testing Suite

The repository contains test suites for Authentication, Webhooks, Idempotency, and Reconciliation:

```bash
cd backend
npm test
```

Test Suites:
- `backend/tests/auth.test.ts`: JWT authentication, bcrypt hash validation, RBAC checks.
- `backend/tests/payment-webhook.test.ts`: Signature checks, machine resolution, idempotency deduplication, dispense dispatch.
- `backend/tests/reconciliation.test.ts`: Detection of Payment Success with Dispense Failure; Stock mismatch detection.

---

## 10. Summary of Dashboard Pages

- `/login`: Sleek dark-mode sign-in with 1-click demo role switcher.
- `/dashboard`: 12 KPI metric cards, timeseries charts, gateway distribution, and performance tables.
- `/machines`: Full machine table, filters (Online, Offline, Low Stock, Out of Stock), and "Register Machine" modal.
- `/machines/[id]`: Tabbed detail view (Overview, Payments, Dispenses, Stock Ledger, IoT Hardware Diagnostics).
- `/payments`: Payment transaction ledger with search, filters, and manual live gateway inquiry.
- `/qr-activity`: Static QR mapping and provider telemetry tracking.
- `/dispensing`: Physical dispense records separating payment success from physical motor completion.
- `/stock`: Machine capacity levels, low-stock alerts, and manual correction dialogs.
- `/reconciliation`: Anomaly remediation center (quarantined payments without dispenses, stock mismatches).
- `/reports`: Customizable reports with instant CSV and Excel (.xlsx) export.
- `/notifications`: Severity-filtered alert center.
- `/users`: RBAC administrator and operator management.
- `/audit-logs`: Immutable system activity trail.
- `/settings`: Configuration of offline heartbeat timeouts, thresholds, and operational mode toggles.

---

## 11. MOCK_MODE vs. Production PostgreSQL

### Local Development / Demo Mode (`MOCK_MODE=true`)
When `MOCK_MODE=true` (or when running without a running PostgreSQL container):
- The platform boots an in-memory relational DataStore initialized with **10 seed machines** (spread across Pune & Mumbai), 2 sanitary napkin products, and historical baseline transactions.
- A prominent amber **`DEMO / MOCK MODE`** banner is displayed in the frontend header.
- All CRUD actions, QR transactions, and telemetry simulations operate immediately without external service dependencies.

### Production PostgreSQL Mode (`MOCK_MODE=false`)
For production deployment with a real PostgreSQL database:
1. Set `MOCK_MODE=false` in your environment.
2. Provide a PostgreSQL connection string:
   ```bash
   DATABASE_URL="postgresql://user:password@hostname:5432/naree_vending?schema=public"
   ```
3. Run Prisma database migrations to apply all 17 normalized tables:
   ```bash
   cd backend
   npx prisma migrate deploy
   # or
   npm run prisma:push
   ```
4. Seed the database with initial users, products, machines, and QR mappings:
   ```bash
   npm run seed
   ```

---

## 12. Deployment Guide

### Vercel Deployment
The repository is pre-configured with `vercel.json` for multi-service or serverless deployment:
1. Connect your repository to Vercel.
2. Configure Environment Variables:
   - `NEXT_PUBLIC_MOCK_MODE` (`true` for demo, `false` for live)
   - `NEXT_PUBLIC_API_URL` (URL of your backend API)
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (A strong, random 256-bit key)
3. Deploy directly via the Vercel Dashboard or `vercel deploy`.

### Docker Deployment
```bash
docker compose up -d
```
Starts PostgreSQL, Mosquitto MQTT broker, backend API container on port 5000, and Next.js frontend on port 3000.

