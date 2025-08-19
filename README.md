# Smart Waste Collection – IoT + Route Optimization

An end-to-end system to monitor public waste bin fill levels with IoT sensors, schedule pickups, and generate optimized truck routes.
Tech: **Node/Express + MongoDB + JWT** (backend) and **React + Tailwind** (frontend).

---

## Public URLs (Production)
 http://https://3.107.185.222

**Project demo account (for graders):**

* **Email:** `stealth959@hotmail.co`
* **Password:** `1234`

> If the demo account doesn’t exist in your DB yet, you can create it via the app’s **Register** page or the API (see “Quick Start → Create a user”).

---

## Features

* **Auth**: Register/Login with JWT (protected APIs)
* **Bins**: CRUD bins; filter by type/status; latest fill snapshot
* **Sensor Readings**: Post readings to update bin snapshot & status
* **Routes**: Generate optimized pickup routes (nearest-neighbor + 2-opt), view details, complete stops, auto-reset bins, auto-complete route
* **Trucks**: CRUD trucks; assign/unassign trucks to routes; auto free truck when route completes

---

## Project Structure

```
root/
├─ backend/
│  ├─ server.js
│  ├─ config/db.js
│  ├─ models/ (User, Bin, SensorReading, RoutePlan, Truck)
│  ├─ controllers/ (auth, bins, sensor, routePlan, truck)
│  ├─ routes/ (authRoutes, bins, sensorRoutes, routePlanRoutes, truckRoutes)
│  └─ test/ (Mocha/Chai/Sinon unit tests)
└─ frontend/
   ├─ src/
   │  ├─ pages/ (Login, Tasks, Bins, BinHistory, Routes, RoutePlanDetail, Trucks)
   │  ├─ components/ (forms & lists)
   │  ├─ context/AuthContext.jsx
   │  └─ axiosConfig.js
   └─ public/
```

---

## Requirements

* **Node.js** ≥ 18 (tested with **v22.x**)
* **MongoDB** (Atlas or local)
* **npm** or **yarn**

---

## Setup: Backend

```bash
cd backend
npm install
# or: yarn
```

Create **.env** in `backend/`:

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=supersecret
PORT=5001
```

Start the API:

```bash
npm start         # node server.js
# or if you have nodemon:
npm run dev
```

Run tests:

```bash
npm test
```

---

## Setup: Frontend

```bash
cd frontend
npm install
# or: yarn
```

Confirm **API base URL** in `frontend/src/axiosConfig.js` (example):

```js
import axios from 'axios';

// In dev, CRA proxy may be used; otherwise set baseURL:
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5001',
});
export default axiosInstance;
```

(Optional) create `.env` in `frontend/`:

```
REACT_APP_API_BASE=http://localhost:5001
```

Start the UI:

```bash
npm start
# visit http://localhost:3000
```

Build:

```bash
npm run build
```

---

## Quick Start (local)

### 1) Create a user (or use demo credentials)

**Via UI:** go to **/register** and sign up
**Via API:**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@smartwaste.app","password":"Password123!"}'
```

Login to get a JWT:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartwaste.app","password":"Password123!"}'
```

### 2) Create a bin

```bash
curl -X POST http://localhost:5001/api/bins \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{
    "name":"King & Ann",
    "type":"general",
    "capacityLitres":240,
    "location":{"lat":-27.4699,"lng":153.0251},
    "installedAt":"2024-01-15"
  }'
```

### 3) Post a sensor reading (mark as “needs\_pickup” if ≥80)

```bash
curl -X POST http://localhost:5001/api/sensor-readings \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"binId":"<BIN_ID>","fillPct":85,"batteryPct":60}'
```

### 4) (Optional) Create a truck

```bash
curl -X POST http://localhost:5001/api/trucks \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"name":"Truck 12","plateNumber":"ABC-123","capacityLitres":5000,"fuelType":"diesel"}'
```

### 5) Generate a route

```bash
curl -X POST http://localhost:5001/api/routes \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{
    "depot":{"lat":-27.4699,"lng":153.0251},
    "threshold":80,
    "maxStops":10,
    "truckId":"<TRUCK_ID or omit>"
  }'
```

### 6) Complete a stop (auto-resets bin to 0%)

```bash
curl -X PATCH http://localhost:5001/api/routes/<ROUTE_ID>/stops/<BIN_ID>/complete \
  -H "Authorization: Bearer <JWT>"
```

---

## Core Endpoints (summary)

* **Auth**

  * `POST /api/auth/register` — create user
  * `POST /api/auth/login` — login, returns JWT
* **Bins**

  * `GET /api/bins` — list (filters: `type`, `status`)
  * `POST /api/bins` — create
  * `GET /api/bins/:id` — get one
  * `PUT /api/bins/:id` — update
  * `DELETE /api/bins/:id` — delete
  * `GET /api/bins/latest` — latest snapshots
* **Sensor Readings**

  * `POST /api/sensor-readings` — add reading `{ binId, fillPct, batteryPct? }`
  * `GET /api/sensor-readings/bin/:id` — history for one bin
* **Routes**

  * `POST /api/routes` — generate optimized route `{ depot, threshold?, maxStops?, truckId? }`
  * `GET /api/routes` — list
  * `GET /api/routes/:id` — detail
  * `DELETE /api/routes/:id` — delete
  * `PATCH /api/routes/:id/stops/:binId/complete` — mark stop serviced (auto-reset bin; complete route if all done)
  * `PATCH /api/routes/:id/assign-truck` — `{ truckId }` or `{ truckId:null }`
* **Trucks**

  * `GET /api/trucks` — list (filters: `status`, `minCapacity`, `q`)
  * `POST /api/trucks` — create
  * `GET /api/trucks/:id` — get one
  * `PUT /api/trucks/:id` — update
  * `DELETE /api/trucks/:id` — delete

> All non-auth endpoints require `Authorization: Bearer <JWT>`.

---

## Frontend Navigation

* **/login** — authenticate
* **/tasks** — (template CRUD page from starter)
* **/bins** — manage bins; simulate fill; view latest snapshot
* **/bins/\:id/history** — line chart + table of readings
* **/routes** — create & list routes
* **/routes/\:id** — route detail; complete stops; assign/unassign truck
* **/trucks** — manage trucks

---

## CI

A GitHub Actions workflow (`Backend CI`) installs deps, runs backend tests (Mocha), and builds the frontend. It expects `MONGO_URI`, `JWT_SECRET`, `PORT` in repository secrets.

---

## Notes / Troubleshooting

* **401 Unauthorized** → ensure JWT header is set.
* **404** on routes/sensor endpoints → confirm routes are mounted in `server.js`.
* **React/Recharts hook error** → ensure only one `react`/`react-dom` version (run `npm ls react react-dom` in `frontend`).
* For production, set `REACT_APP_API_BASE` to your deployed API base.

