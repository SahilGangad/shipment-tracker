# Nagarkot Forwarders — Shipment Tracker

A full-stack shipment tracking application with an append-only audit trail and status history log.

---

## 🚀 Live Demo & Links

- **Frontend:** [https://shipment-tracker-by-sahil.vercel.app/](https://shipment-tracker-by-sahil.vercel.app/)
- **Backend API:** [https://shipment-tracker-at6z.onrender.com](https://shipment-tracker-at6z.onrender.com)

## 1. Tech Choices & Why

- **React 19 + Vite + TypeScript (Frontend):** Instant dev startup, high-speed builds, and end-to-end type safety matching our backend models.
- **Vanilla CSS (Warm Editorial Light Theme):** Custom aesthetic inspired by Sahil's portfolio palette (warm oat `#f2eee3` canvas, soft ivory `#fbf9f3` elevated cards, `#181510` ink typography, and signature `#ff3b1f` vermilion accents) with clean, standard typography and zero framework overhead.
- **Node.js + Express 5 + TypeScript (Backend):** Minimal, fast, and familiar REST API setup with native async error handling.
- **Prisma ORM:** Strict type safety, clean migrations, and `prisma.$transaction` for atomic status updates.
- **PostgreSQL (Docker / Hosted):** Reliable relational database with ACID guarantees, foreign keys, and indexes on frequently queried fields (`reference_number`, `current_status`).

---

## 2. Steps to Run Locally

### Prerequisites
- **Node.js** (v18+)
- **Docker** (for local PostgreSQL)

### Quick Start

```bash
# 1. Start Database
docker compose up -d

# 2. Start Backend (http://localhost:5000)
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev

# 3. Start Frontend (http://localhost:5173) in a new terminal
cd ../frontend
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 3. Assumptions About Data Model & Status Flow

- **Two-Table Append-Only Pattern:** 
  - `shipments` stores current consignment info.
  - `status_history` stores an immutable, append-only log of every status change with timestamps, locations, and notes.
- **Denormalized Current Status:** `current_status` is stored directly on `shipments` and updated atomically within a `$transaction` whenever a new history entry is appended. This keeps list/filter queries fast without complex subqueries.
- **Strict 6-Digit Reference Numbers:** Reference numbers are assumed to be strictly 6 digits (e.g. `104926`), validated by regex `^\d{6}$` on both frontend and backend, and unique in the database.
- **Flexible Real-World Transitions:** Shipments usually follow `BOOKED` ➔ `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`, but real-world exceptions are allowed (e.g. `CUSTOMS_HOLD` or `CANCELLED` at any stage).
- **Scope:** Authentication and user roles were omitted per requirements to focus on data integrity, audit history, and responsive UI.

---

## 4. If this needed to support 10,000 shipments and multiple concurrent users, what would you change?

To scale this system to 10,000+ shipments with multiple concurrent users, I would implement **optimistic concurrency control** via a `version` or `updated_at` column on the `shipments` table to prevent race conditions during simultaneous status updates. At the database layer, I would add composite indexes on `(current_status, updated_at DESC)` and switch from offset-based pagination to **cursor-based keyset pagination** to keep query latency low regardless of dataset size. I would introduce **Redis** to cache frequently accessed active shipments, place **PgBouncer** in front of PostgreSQL for connection pooling with read replicas for search queries, and route high-volume incoming status updates (e.g., automated carrier webhooks or IoT scans) through a message queue like **BullMQ/RabbitMQ** for buffered, asynchronous batch processing.
