# Next.js 14 App Router: Base Alchemy RPC & Wallet Signer

A production-ready Next.js App Router application connecting **Alchemy SDK** to **Base Mainnet (Chain ID 8453)**, configured with your signer wallet `0xD6d68800CD199D990C7ACCff409bE60c6508660a` holding your `0.0056 ETH` gas reserve.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd nextjs-app
npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
ALCHEMY_API_KEY="your-alchemy-api-key"
NEXT_PUBLIC_SIGNER_ADDRESS="0xD6d68800CD199D990C7ACCff409bE60c6508660a"
SIGNER_PRIVATE_KEY="your-signer-private-key" # Optional: for live transaction broadcasting
BASE_RPC_URL="https://mainnet.base.org"
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ Step-by-Step Vercel Deployment

### 1. Push to GitHub
```bash
cd nextjs-app
git init
git add .
git commit -m "feat: Next.js 14 Base Alchemy RPC & Signer suite"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 2. Import into Vercel
1. Navigate to **[vercel.com/new](https://vercel.com/new)**.
2. Select your repository.
3. Configure the build parameters:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (or `nextjs-app` if pushed from repository root)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`

### 3. Set Environment Variables in Vercel
Add the following keys in your Vercel Project Settings > Environment Variables:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SIGNER_ADDRESS` | `0xD6d68800CD199D990C7ACCff409bE60c6508660a` | Configured signer wallet holding 0.0056 ETH |
| `ALCHEMY_API_KEY` | `your-alchemy-key` | Key from dashboard.alchemy.com |
| `BASE_RPC_URL` | `https://mainnet.base.org` | High availability Base mainnet RPC fallback |
| `SIGNER_PRIVATE_KEY` | *(Optional)* | Server-only private key for live on-chain broadcast |

### 4. Deploy!
Click **Deploy**. In ~35 seconds, your live production URL (e.g. `https://your-project.vercel.app`) will be active with real-time Base RPC queries and signer telemetry.

---

## 📁 Architecture Overview

```
nextjs-app/
├── app/
│   ├── api/
│   │   ├── base-rpc/
│   │   │   └── route.ts     # Server-side Route Handler querying Alchemy SDK & Base L2 Node
│   │   └── withdraw/
│   │       └── route.ts     # Secure server-side route executing withdrawals via Ethers.js
│   ├── globals.css          # Tailwind CSS styles
│   ├── layout.tsx           # Root metadata & dark-mode layout
│   └── page.tsx             # Interactive dashboard UI with gas meter & withdrawal form
├── .env.local.example       # Environment template
├── package.json             # Next.js 14, Alchemy-SDK & Ethers dependencies
└── README.md
```

## 🔒 Security Best Practices
* **Server-Side Signing**: The private key (`SIGNER_PRIVATE_KEY`) is **only** loaded in `/api/withdraw/route.ts` on the Node.js server. It is **never** sent to or exposed in the browser bundle.
* **Base L2 Gas Savings**: Because Base is an OP Stack Layer 2 rollup, native ETH transfers consume only ~0.0000002 ETH in gas fees (< $0.005), making your 0.0056 ETH reserve cover hundreds of transactions.
