# VYRA Intelligence OS

> Multi-Chain Liquidity Intelligence OS — AI-Powered Crypto Analytics Platform

[![Vercel](https://img.shields.io/badge/vercel-deployed-black?logo=vercel)](https://vyra-intelligence-os.vercel.app)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-3178C6?logo=typescript)](https://typescriptlang.org)

---

## 🚀 Live Demo

**[vyra-intelligence-os.vercel.app](https://vyra-intelligence-os.vercel.app)**

---

## ✨ Features

### 🧠 Intelligence Dashboard
- **Real-time Chain Overview** — Live prices, 24h change, volume for SOL, ETH, BASE, BNB
- **Live Signal Feed** — Whale movements, smart money accumulation, liquidity spikes
- **AI Agent Society** — 4 autonomous agents (Whale Scout, Risk Sentinel, Flow Oracle, Alpha Hunter)
- **Liquidity Flow Predictions** — Gravity model forecasts cross-chain capital rotation
- **Personalized Experience** — Connect wallet to see your chain highlighted + balance

### ⚡ Signal Stream
- Real-time whale event tracking across 4 chains
- Chain-specific filtering (SOL / ETH / BASE / BNB)
- Event types: buy, sell, transfer, swap
- USD value + protocol detection

### 🤖 Agent Society
- **Whale Scout** — Tracks high-volume wallet movements
- **Risk Sentinel** — Monitors market risk + liquidity depth
- **Flow Oracle** — Predicts cross-chain capital rotation
- **Alpha Hunter** — Discovers asymmetric opportunities
- Consensus system with confidence scoring

### 🗺️ Liquidity Heatmap
- Cross-chain liquidity flow visualization
- Top DEX pairs by liquidity per chain
- Whale flow tracking (top buys / sells)
- Chain-specific stats (price, volume, market cap, DEX pairs)

### 💬 AI Copilot
- Natural language queries about on-chain data
- Live price lookups (CoinGecko API)
- Whale activity reports (DexScreener API)
- Trending token discovery
- Risk assessment with score breakdown
- Opportunity scanning with confidence levels

### 🦊 Wallet Connect
- **Phantom** — Solana wallet (real `window.solana.connect()`)
- **MetaMask** — EVM chains (real `eth_requestAccounts`)
- **Trust Wallet** — EVM chains (real `eth_requestAccounts`)
- Auto-connect on page load from localStorage
- Balance display (SOL / ETH / BNB)
- Chain-aware UI highlighting

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite 6 + React 19 + TypeScript 5.7 |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 |
| Animation | Framer Motion v12 |
| Icons | Lucide React |
| Crypto Data | DexScreener API + CoinGecko API |
| Wallet | Solana Wallet Adapter + EVM providers |
| Deployment | Vercel |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  VYRA Intelligence OS            │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────────────────────────┐ │
│  │ Sidebar   │  │         Main Content          │ │
│  │          │  │                              │ │
│  │ ◉ INTEL  │  │  ┌────────────────────────┐  │ │
│  │ • Dash   │  │  │ Hero + Wallet Status   │  │ │
│  │ • Signals│  │  └────────────────────────┘  │ │
│  │          │  │  ┌────────────────────────┐  │ │
│  │ ◎ WORK   │  │  │ Chain Cards (1/2/4)   │  │ │
│  │ • Heatmap│  │  └────────────────────────┘  │ │
│  │ • Agents │  │  ┌────────────────────────┐  │ │
│  │          │  │  │ Signals + Agents       │  │ │
│  │ ◇ AI     │  │  └────────────────────────┘  │ │
│  │ • Copilot│  │  ┌────────────────────────┐  │ │
│  │          │  │  │ Predictions + Copilot  │  │ │
│  │ [Wallet] │  │  └────────────────────────┘  │ │
│  └──────────┘  └──────────────────────────────┘ │
│                                                  │
├─────────────────────────────────────────────────┤
│  Data Layer: DexScreener + CoinGecko APIs       │
│  Wallet: Phantom + MetaMask + Trust Wallet      │
│  State: Zustand (wallet, signals, agents)       │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── main.tsx                 # App entry + SPA router + sidebar
├── components/
│   ├── WalletConnect.tsx    # Wallet modal (Phantom/MetaMask/Trust)
│   └── NewsFeed.tsx         # Real-time crypto news
├── lib/
│   ├── real-data.ts         # DexScreener + CoinGecko fetchers
│   ├── signal-engine.ts     # Whale/smart money/liquidity detection
│   ├── agent-society/       # AI agent system
│   │   ├── index.ts         # Agent orchestration + consensus
│   │   ├── scout.ts         # Whale Scout agent
│   │   ├── whale.ts         # Whale tracking agent
│   │   ├── risk.ts          # Risk assessment agent
│   │   ├── narrative.ts     # Narrative analysis agent
│   │   ├── consensus.ts     # Multi-agent consensus
│   │   └── types.ts         # Agent type definitions
│   ├── prediction-brain.ts  # Liquidity flow prediction (Gravity Model)
│   ├── feature-engine.ts    # Feature extraction from signals
│   ├── signal-store.ts      # Reactive signal state management
│   ├── wallet-store.ts      # Zustand wallet store
│   ├── dexscreener.ts       # DexScreener API service
│   ├── coingecko.ts         # CoinGecko API service
│   └── chain-adapters/      # Chain-specific adapters
│       ├── simulator.ts     # On-chain event simulator
│       └── types.ts         # Chain type definitions
├── pages/
│   ├── Dashboard.tsx        # Intelligence dashboard (main page)
│   ├── Signals.tsx          # Signal stream
│   ├── Agents.tsx           # Agent society
│   ├── Heatmap.tsx          # Liquidity heatmap
│   ├── Copilot.tsx          # AI assistant
│   └── TokenDetail.tsx      # Token deep dive
└── styles/
    └── app.css              # Global styles + Tailwind v4 theme
```

---

## 🔌 API Integration

### DexScreener API
| Endpoint | Description |
|---|---|
| `/latest/dex/search` | Search tokens by name/symbol |
| `/latest/dex/tokens/{address}` | Token info + pairs |
| `/latest/dex/pairs/{chain}/{pair}` | Pair details (price, liq, vol) |
| `/tokens/v1/{chain}` | Top tokens by chain |
| `/token-boosts/latest/v1` | Boosted/promoted tokens |

### CoinGecko API
| Endpoint | Description |
|---|---|
| `/coins/markets` | Market data (price, volume, mcap) |
| `/search/trending` | Trending coins |
| `/news` | Crypto news |
| `/global` | Global market stats |

---

## 🚦 Getting Started

```bash
# Clone the repo
git clone https://github.com/allinoneacount1-dot/vyra-intelligence-os.git
cd vyra-intelligence-os

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--color-vyra-bg` | `#08080c` | Background |
| `--color-vyra-accent` | `#6364f1` | Primary accent |
| `--color-vyra-cyan` | `#22d3ee` | Secondary accent |
| `--color-vyra-green` | `#10b981` | Positive/success |
| `--color-vyra-red` | `#ef4444` | Negative/danger |
| `--font-sans` | Inter, SF Pro | Body text |
| `--font-mono` | JetBrains Mono | Numbers, labels |

**Glassmorphism:** `backdrop-blur(20px)` + `rgba(255,255,255,0.04)` + `border rgba(255,255,255,0.06)`

---

## 🖥️ WSL Autostart Guide

> **Goal:** Pas WSL dinyalakan, semua langsung auto-activate tanpa crash. Tinggal buka Telegram, langsung bisa ngobrol sama Rachel. 💎

### Architecture

```
Windows Login
    │
    ▼
WSL boots (systemd=true in wsl.conf)
    │
    ├── linger enabled → user services survive WSL shutdown
    │
    ├── vyra-autostart.service (systemd user service)
    │    ├─ [1/3] Check Qdrant → start if needed (with retry)
    │    ├─ [2/3] Check Hermes Gateway → start if needed (systemd or direct)
    │    ├─ [3/3] Verify linger is enabled
    │    └─ Final health report (logged to ~/.hermes/autostart.log)
    │
    └── hermes-gateway.service (systemd, enabled)
         └─ Telegram + WhatsApp bridges active

Optional: Windows Task Scheduler → direct wsl.exe call (belt + suspenders)
```

### Prerequisites (Already Configured)

| Component | Status | Notes |
|---|---|---|
| `wsl.conf` systemd | ✅ | `[boot] systemd=true` |
| systemd linger | ✅ | `loginctl show-user marco` → Linger=yes |
| vyra-autostart.service | ✅ | `systemctl --user enable vyra-autostart.service` |
| hermes-gateway.service | ✅ | `systemctl --user enable hermes-gateway.service` |

### How It Works (Crash-Proof)

1. **No `set -e`** — each step handles its own errors, one failure doesn't kill the whole script
2. **Retry logic** — up to 3 retries with 3s delay for each service
3. **Health checks first** — checks if service is already running before trying to start
4. **Dual start for Hermes** — tries systemd first, falls back to direct process launch
5. **Comprehensive logging** — everything logged to `~/.hermes/autostart.log`
6. **Idempotent** — safe to run multiple times, won't double-start services

### Optional: Windows Task Scheduler (Belt + Suspenders)

For extra reliability, add a Windows-level trigger:

```powershell
# Run as Administrator (one time only)
schtasks /create /tn "VYRA-Autostart" /tr "wsl.exe -d Ubuntu-24.04 -e bash /home/marco/.hermes/auto-start.sh" /sc onlogon /rl highest /f
```

Or double-click `vyra-setup-task.bat` on Desktop (Run as Administrator).

### Verify Everything

```bash
# Check systemd is healthy (should show "running", not "degraded")
systemctl --user is-system-running

# Check all services
systemctl --user status vyra-autostart.service --no-pager
systemctl --user status hermes-gateway.service --no-pager

# Run autostart manually
bash ~/.hermes/auto-start.sh

# Check logs
cat ~/.hermes/autostart.log
```

### What Auto-Starts

| Service | Port | Purpose | Check |
|---|---|---|---|
| **Qdrant** | 6333 | RAG Vector DB (2,417 knowledge points, 23 collections) | `curl localhost:6333/readyz` |
| **Hermes Gateway** | internal | AI Agent Gateway (Telegram, WhatsApp) | `systemctl --user is-active hermes-gateway` |
| **Cron Jobs** | — | Daily crypto price update (21:00 WIB) | `hermes cron list` |

### Troubleshooting

| Problem | Solution |
|---|---|
| systemd shows "degraded" | Remove failed units + `systemctl --user reset-failed` |
| Qdrant won't start | `pkill qdrant && cd ~/qdrant && ./qdrant` |
| Hermes won't start | `systemctl --user start hermes-gateway.service` |
| Task Scheduler not running | `schtasks /run /tn "VYRA-Autostart"` |
| Port 6333 in use | `lsof -i :6333` then `kill <PID>` |
| WSL not starting | `wsl --shutdown` then reopen |

---

## 📋 Roadmap

- [x] Real-time signal engine
- [x] AI agent society with consensus
- [x] Liquidity flow prediction (Gravity Model)
- [x] Multi-chain heatmap
- [x] AI Copilot with live data
- [x] Wallet connect (Phantom, MetaMask, Trust Wallet)
- [x] Personalized dashboard with wallet context
- [x] WSL autostart — crash-proof (no set -e, retry logic, systemd + fallback)
- [ ] On-chain wallet tracking (follow specific wallets)
- [ ] Portfolio tracker with P&L
- [ ] Alert system (push notifications)
- [ ] Mobile app (React Native)
- [ ] Telegram bot integration

---

## 📄 License

MIT
