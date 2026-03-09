# TON-Eats 🚀

The world's first **0% commission** decentralized food delivery network powered by the **TON Blockchain**. 🍔🍣🍕

## 🌟 Key Features
- **0% Commission**: Restaurants keep 100% of their earnings.
- **TON Payouts**: Secure, instant payments via on-chain escrow smart contracts.
- **Real-time Tracking**: Live GPS updates for deliveries via Socket.io.
- **Dynamic Pricing**: USDT-based pricing with live TON oracle conversion.
- **Web3 Native**: Seamless integration with Telegram Mini Apps and TonConnect.

---

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TypeScript, Styled Components, TonConnect.
- **Backend**: Node.js (Express), Socket.io, Prisma ORM.
- **Database**: PostgreSQL (Dockerized).
- **Proxy**: Nginx (handling SPA routing and API proxying).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/) (for local development)

### 2. Launch with Docker Compose
You can bring up the entire stack (Database, Backend, Frontend) with a single command:

```bash
docker compose up -d --build
```

The stack includes:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:3001](http://localhost:3001)
- **Database**: Port `5433`

### 3. Automatic Seeding
The backend is configured to **automatically seed** the database on startup if it detects the merchant table is empty. It will create 3 premium restaurants:
- **Burger Palace** (American)
- **Sushi Zen** (Japanese)
- **Pizza Paradiso** (Italian)

To manually re-seed or clear the database, run:
```bash
docker exec -it twa-ton-backend-1 node seed.js
```

### 4. Development & Live Testing (Cloudflare Tunnel)
To test the Telegram Mini App on a real mobile device, you can launch the **Cloudflare Tunnel** profile:

```bash
docker compose --profile dev up -d
```
Check the logs of the `tunnel` container to find your temporary public URL:
```bash
docker compose logs tunnel
```

---

## 📂 Project Structure

```text
├── backend/            # Express, Prisma, Socket.io
│   ├── prisma/        # Database schema
│   ├── routes/        # API endpoints
│   ├── store/         # Order state & DB singleton
│   └── seed.js        # Initial data entry
├── public/assets/     # Static assets & Premium food photos
├── src/               # React (Vite) Frontend
│   ├── components/    # Styled components & UI
│   ├── hooks/         # Custom TON / Socket hooks
│   └── pages/         # Shop, Discovery, Onboarding
└── docker-compose.yml # Full stack orchestration
```

---

## 🤝 Partner with TON-Eats
Interested in launching your restaurant? Visit the [Merchant Onboarding](/merchant/onboard) page to deploy your store directly on the TON network.

**Built for the TON Hackathon 💎**
