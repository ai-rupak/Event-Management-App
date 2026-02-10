# 🎫 AI Rupak Event Management App – Technical Documentation

## 📌 Project Overview

**AI Rupak Event Management App** is a **full-stack, scalable concert/event booking platform** with:

* High-traffic handling using **queueing**
* Secure **Stripe payments**
* Time-bound ticket reservation
* Real-time booking state
* Mobile-first frontend (Expo + React Native)
* Backend designed for **production-scale concurrency**

The system is designed to later support:

* Admin analytics
* QR-based attendance scanning
* Fraud prevention
* Event demand surge handling

---

## 🏗️ High-Level Architecture

```
Mobile App (Expo / React Native)
        |
        | REST APIs (JWT Auth)
        ↓
Node.js Backend (Express)
        |
        | Prisma ORM
        ↓
MongoDB Atlas
        |
        | Redis
        ↓
Queue + Locks + Expiry
        |
        | Stripe Webhooks
        ↓
Payment Confirmation
```

---

## 🧠 Core Design Principles

* **Separation of Concerns** (Controller / Service / Data)
* **Idempotency-first design** (Payments, Booking, Webhooks)
* **Optimistic UI with backend truth**
* **Fail-safe concurrency**
* **Stateless APIs + Redis for state**

---

## 🧰 Tech Stack

### 🔹 Frontend (Mobile App)

| Category     | Technology                    |
| ------------ | ----------------------------- |
| Framework    | Expo (React Native)           |
| Language     | TypeScript                    |
| Routing      | Expo Router                   |
| State        | Zustand                       |
| Server State | TanStack React Query          |
| Styling      | Tailwind (NativeWind)         |
| Payments     | `@stripe/stripe-react-native` |

---

### 🔹 Backend

| Category      | Technology             |
| ------------- | ---------------------- |
| Runtime       | Node.js                |
| Framework     | Express.js             |
| ORM           | Prisma                 |
| Database      | MongoDB Atlas          |
| Cache         | Redis                  |
| Auth          | JWT (Access + Refresh) |
| Payments      | Stripe API + Webhooks  |
| Logging       | Winston                |
| Validation    | Custom Middleware      |
| Rate Limiting | Express Middleware     |

---

## 📂 Directory Structure (Explained)

### Backend (`/backend`)

```
backend/
├── controllers/     # HTTP layer (req/res)
├── services/        # Business logic
├── routes/          # API versioning
├── middlewares/     # Auth, validation, rate limit
├── prisma/          # DB schema + seed
├── config/          # Redis, Stripe, Logger
├── utils/           # JWT, helpers
├── webhooks/        # Stripe webhook handler
└── index.js         # App bootstrap
```

✔ Controllers are thin
✔ Services are reusable
✔ No DB logic inside controllers

---

### Frontend (`/concertapp`)

```
concertapp/
├── app/             # Expo Router pages
├── api/             # Backend API wrappers
├── components/      # Reusable UI
├── providers/       # QueryClient, Stripe
├── stores/          # Zustand global stores
└── constants/       # Theme & configs
```

✔ API logic isolated
✔ No direct axios in screens
✔ Clean separation of UI & logic

---

## 🔐 Authentication Flow

1. User logs in / signs up
2. Backend issues:

   * Access Token (short-lived)
   * Refresh Token (stored)
3. Access token attached to every API request
4. Middleware validates token
5. Role-based access possible (future admin)

---

## 🎟️ Booking Flow (Critical)

### 1️⃣ Ticket Selection

* User selects tickets
* Stored in Zustand (`bookingStore`)

---

### 2️⃣ Queue System (High Demand Handling)

**Why Queue?**
To prevent overselling and DB race conditions.

**Flow:**

```
User → joinQueue
Redis assigns position
Polling queue status
Only ACTIVE users can book
```

**Redis keys used:**

* `queue:concert:{id}`
* `active:concert:{id}`

---

### 3️⃣ Booking Creation

* Only allowed if:

  * Queue status = `active`
  * Seats available
* Booking created with:

  * `status = pending`
  * `expiresAt = now + 5 min`

✔ Seats temporarily locked
✔ Booking auto-expires

---

### 4️⃣ Payment Flow (Stripe)

#### Step-by-step

```
Frontend → createPaymentIntent
Backend → Stripe PaymentIntent
Backend → Save payment record
Frontend → Stripe Payment Sheet
User pays
Stripe → Webhook
Backend → Confirm booking
```

---

### Stripe Design Decisions

* **Booking is NOT confirmed on frontend**
* Only **webhook confirms booking**
* Prevents fraud & replay attacks

---

## 🔁 Stripe Webhook Flow

```
Stripe → payment_intent.succeeded
        ↓
Verify signature
        ↓
Find payment + booking
        ↓
Mark payment = succeeded
        ↓
Confirm booking
        ↓
Reduce available seats
```

✔ Idempotent
✔ Safe retries
✔ Production-grade

---

## ⏱️ Expiry Handling

* Booking has `expiresAt`
* Frontend countdown timer
* Backend validates expiry before payment
* Expired bookings:

  * Release seats
  * Removed from Redis
  * Marked `EXPIRED`

---

## 📊 State Management Strategy

### Frontend

| State Type  | Tool                   |
| ----------- | ---------------------- |
| UI State    | React state            |
| Cart        | Zustand                |
| Server Data | React Query            |
| Auth        | Zustand + Secure Store |

---

### Backend

| State    | Storage   |
| -------- | --------- |
| Queue    | Redis     |
| Bookings | MongoDB   |
| Payments | MongoDB   |
| Locks    | Redis TTL |

---

## 🧪 Error Handling Strategy

* Backend:

  * Central error middleware
  * Typed error messages
* Frontend:

  * Graceful alerts
  * Retry logic
  * Optimistic rollback

---

## 🧠 Methodologies Used

### ✅ MVC + Service Layer

* Controllers = transport
* Services = logic
* Prisma = persistence

---

### ✅ Event-Driven Design

* Stripe webhooks
* Queue activation
* Booking expiration

---

### ✅ Defensive Programming

* DB constraints
* Redis locks
* Unique indexes
* Webhook idempotency

---

## 🔒 Security Considerations

* JWT-based auth
* Rate limiting
* Stripe signature verification
* No trust on frontend confirmation
* Redis-based concurrency control

---

## 🚀 Scalability Readiness

* Stateless backend
* Redis for hot paths
* Queue-based booking
* Payment webhook isolation

Can scale to:

* 100K+ concurrent users
* Flash-sale events
* Multi-admin scanning

---

## 🛠️ Future Extensions (Planned)

* Admin dashboard
* QR attendance scanning
* Event analytics
* Revenue reports
* Fraud detection
* Offline scan sync


