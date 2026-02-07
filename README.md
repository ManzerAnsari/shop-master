# Shop Master

A full-stack **shop analytics and point-of-sale** application with dashboard, inventory, sales, reports, and a Smart Calendar with holiday-based insights. Built with React (Vite) and Node.js (Express) with MongoDB.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Libraries & Purpose](#libraries--purpose)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [Database Seeding](#database-seeding)
- [API Overview](#api-overview)

---

## Features

### Authentication & Users
- **Login / Register** – JWT-based auth with access + refresh tokens (stored in Redux; refresh token in sessionStorage).
- **Protected routes** – Unauthenticated users are redirected to login.
- **Token refresh** – Automatic refresh on 401; logout on refresh failure.
- **User management** – Admin can manage users (server-side user routes).

### Dashboard
- **Stats cards** – Revenue, profit, transactions, low-stock count for the selected period.
- **Date filter** – Today, Week, Month, Custom range.
- **Sales trend line chart** – Daily revenue over the selected period (Recharts).
- **Category pie chart** – Sales by category.
- **Low-stock alerts** – List of products below threshold with quick link to inventory.
- **AI insights** – Automated insights based on sales/inventory (AI insights API).

### Inventory
- **Product list** – Table with search, filters, pagination.
- **Add / Edit product** – Form with name, category, purchase/selling price, stock, barcode, expiry (optional).
- **Barcode support** – UPC, EAN, Code 128, Code 39, QR (stored per product).
- **Inventory scanner** – Barcode/QR scanning (html5-qrcode) for quick lookup and stock updates.

### Sales
- **Sales list** – Table of sales with date, total, profit; filters and date range.
- **New sale** – Multi-item sale with date picker (default today), product lookup, quantity, unit price; totals and profit calculated.
- **View sale details** – Modal with items and totals.
- **Download invoice** – Plain-text invoice download for a sale.

### Reports
- **Date range** – Today, Week, Month, 1 Year, Custom range.
- **Charts** – Sales trend (line), profit trend, top products (bar), category breakdown (pie) via Recharts.
- **Key metrics** – Total revenue, profit, average order value, transaction count.
- **Insights** – Text insights derived from report data.

### Smart Calendar
- **Historical sales calendar** – Month view with daily badges; hover shows same date across 3 years (revenue, orders).
- **Year-over-year panel** – Revenue and order count for current month in current year, last year, 2 years ago.
- **Product sales trend chart** – Bar chart (Chart.js) for a selected product: daily or monthly comparison across 3 years.
- **Upcoming festivals** – Public holidays from API (country selector: IN, US, GB, AU, CA, DE, FR); cached in DB.
- **Predictions** – Avg monthly revenue, growth rate, predicted revenue, confidence (from historical same-month data).
- **Smart suggestions** – Top products for the selected month across years (stock-up suggestions).
- **Festival cache** – API responses stored in MongoDB by country + year; old cache (year &lt; current − 1) cleaned up automatically.

### Settings
- **Shop & user settings** – Update shop name, profile, preferences (wired to users API).

### Real-time (WebSocket)
- **Socket.IO** – Server pushes real-time events; client can show live updates (e.g. new sales, stock changes) when implemented in UI.

### Other
- **Showcase** – Public landing/showcase page.
- **Theme** – Theme context and Tailwind for light/dark and styling.
- **Responsive layout** – Main layout with sidebar/nav for authenticated app.

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React 18, Vite |
| UI        | Ant Design, Tailwind CSS, Recharts, Chart.js |
| State     | Redux (RTK), React Router |
| HTTP      | Axios (interceptors for auth + refresh) |
| Backend   | Node.js, Express |
| Database  | MongoDB (Mongoose) |
| Auth      | JWT (access + refresh), bcrypt |
| Real-time | Socket.IO (server + client) |

---

## Libraries & Purpose

### Frontend (`clientSide`)

| Library | Purpose |
|--------|---------|
| **react** / **react-dom** | UI components and rendering |
| **react-router-dom** | Client-side routing (login, dashboard, inventory, sales, reports, settings, calendar) |
| **@reduxjs/toolkit** | Global state (auth: user, access/refresh tokens) |
| **react-redux** | Connecting components to Redux |
| **axios** | HTTP client; auth header and 401 refresh logic |
| **antd** | Buttons, tables, forms, modals, date pickers, layout, message, etc. |
| **@ant-design/icons** | Ant Design icon set |
| **@iconify/react** | Additional icons (Icon component) |
| **tailwindcss** / **@tailwindcss/vite** | Utility-first CSS and Vite integration |
| **recharts** | Line, bar, pie charts (Dashboard, Reports) |
| **chart.js** / **react-chartjs-2** | Bar chart (Smart Calendar product sales trend) |
| **dayjs** | Date formatting and manipulation |
| **framer-motion** | Animations (where used) |
| **html5-qrcode** | Barcode/QR scanning in browser |
| **qrcode** | QR code generation |
| **socket.io-client** | WebSocket client for real-time updates |
| **@tanstack/react-query** | Server state caching (where used) |
| **vite** | Build tool and dev server |
| **vitest** / **@testing-library/react** | Unit and component tests |

### Backend (`serverSide`)

| Library | Purpose |
|--------|---------|
| **express** | HTTP server and API routes |
| **mongoose** | MongoDB ODM (User, Product, Sale, FestivalCache) |
| **jsonwebtoken** | Issue and verify JWT access tokens |
| **bcryptjs** | Hash and verify passwords |
| **dotenv** | Load `.env` (PORT, MONGODB_URI, JWT_SECRET, etc.) |
| **cors** | Allow frontend origin |
| **helmet** | Security headers |
| **express-rate-limit** | Rate limiting in production |
| **morgan** | HTTP request logging |
| **cookie-parser** | Parse cookies (if any cookie-based logic remains) |
| **multer** | File uploads (if used) |
| **zod** | Request validation (validators) |
| **socket.io** | WebSocket server |
| **nodemon** | Restart server on file change (dev) |

### External APIs (backend)
- **Nager.Date** – Public holidays for US, GB, AU, CA, DE, FR, etc. (no key).
- **Calendarific** – Public holidays for India (optional; set `CALENDARIFIC_API_KEY`). Results cached in DB by country + year.

---

## Project Structure

```
shop-master/
├── clientSide/                 # React (Vite) frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (Badge, Button, Card, Scanner, etc.)
│   │   ├── config/             # Scanner, theme config
│   │   ├── contexts/           # ThemeContext
│   │   ├── hooks/              # useLogin, useLogout, useWebSocket, useDebounce, etc.
│   │   ├── layouts/            # AuthLayout, MainLayout
│   │   ├── lib/                # Axios instance (auth + refresh)
│   │   ├── pages/               # Dashboard, Inventory, Sales, Reports, Settings, SmartCalendar, Login, Register, Showcase
│   │   ├── routes/              # Router config, ProtectedRoute, AuthRoute
│   │   ├── services/            # API services (auth, dashboard, sales, reports, festivals, etc.)
│   │   ├── store/               # Redux store, authSlice
│   │   ├── utils/               # currency, festivals helpers, offlineQueue, etc.
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── serverSide/
│   ├── src/
│   │   ├── controller/         # auth, dashboard, sales, reports, products, users, aiInsights
│   │   ├── middleware/         # auth (JWT), validate
│   │   ├── models/             # User, Product, Sale, FestivalCache
│   │   ├── routes/              # auth, products, sales, dashboard, reports, users, ai-insights, festivals
│   │   ├── seeders/             # seed.js (demo user, products, sales)
│   │   ├── services/           # websocketService
│   │   ├── validators/         # auth, product, sales, user (Zod)
│   │   └── index.js            # Express app, MongoDB connect, Socket.IO
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** (v18 or later recommended)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

---

## Environment Setup

### Backend (`serverSide`)

Copy `.env.example` to `.env` and set:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/shop_analytics
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
# Optional: for India holidays in Smart Calendar (free key at https://calendarific.com/)
CALENDARIFIC_API_KEY=your-key
```

### Frontend (`clientSide`)

- Optional: create `.env` and set `VITE_API_BASE=http://localhost:4000/api` if the API is not at `http://localhost:5000/api` (default in code is 5000; adjust to match your `PORT` or proxy).

---

## Running the Project

1. **Install dependencies**

   ```bash
   cd clientSide && npm install
   cd ../serverSide && npm install
   ```

2. **Start MongoDB** (if running locally).

3. **Start backend**

   ```bash
   cd serverSide
   npm run dev
   ```
   Server runs at `http://localhost:4000` (or your `PORT`). API base path: `/api`.

4. **Start frontend**

   ```bash
   cd clientSide
   npm run dev
   ```
   App runs at `http://localhost:3000` (or the port Vite prints). Set `VITE_API_BASE` to match your API URL (e.g. `http://localhost:4000/api`) if needed.

5. **Seed database (optional)**

   ```bash
   cd serverSide
   npm run seed
   ```
   Creates a demo user, sample products, and sales. Use the seeded credentials to log in.

---

## Database Seeding

Running `npm run seed` in `serverSide`:

- **Demo user** – e.g. `demo@shopmaster.com` / `demo123` (see seed output or `serverSide/src/seeders/README.md`).
- **Products** – Multiple categories (Electronics, Clothing, Food, Books, etc.) with prices, stock, barcodes.
- **Sales** – Historical sales over a recent period.

Details: `serverSide/src/seeders/README.md`.

---

## API Overview

| Base path       | Purpose |
|----------------|--------|
| `/api/auth`    | Login, register, refresh token, logout, /me |
| `/api/products`| CRUD products (and inventory-related) |
| `/api/sales`   | CRUD sales, trends, top products, summary |
| `/api/dashboard` | Stats, sales trend, low stock, category breakdown for date range |
| `/api/reports` | Aggregated report data for date range |
| `/api/users`   | User management (admin) |
| `/api/ai-insights` | AI-generated insights |
| `/api/festivals`   | Public holidays by country/year (cache in DB; Nager.Date / Calendarific) |

Auth: use `Authorization: Bearer <accessToken>` for protected routes. Client handles refresh via Axios interceptors.

---

## License

Private / internal use unless stated otherwise.
