# VYRA Intelligence OS

> Multi-Chain Liquidity Intelligence OS — AI-Powered Crypto Analytics Platform

[![Vercel](https://img.shields.io/badge/vercel-deployed-black?logo=vercel)](https://vyra-intelligence-os.vercel.app)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)](https://react.dev)
[![TanStack](https://img.shields.io/badge/tanstack-start-FF4154)](https://tanstack.com/start)

## Features

- **Real-time Crypto Signals** — Powered by DexScreener API
- **AI Agent Society** — Autonomous agents that analyze, predict, and execute
- **Multi-Chain Heatmap** — Liquidity visualization across SOL, ETH, BASE, BNB
- **Wallet Connect** — Phantom, MetaMask, Trust Wallet, WalletConnect
- **News Feed** — Real-time crypto news from CoinGecko
- **Token Deep Dive** — Detailed token analysis with on-chain data
- **Boosted Tokens** — Discover trending and promoted tokens

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start + React 19 |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 + TanStack React Query |
| Charts | Recharts |
| Animation | Framer Motion v12 |
| Crypto Data | DexScreener API + CoinGecko API |
| Wallet | Solana Wallet Adapter + EVM providers |
| Deployment | Vercel |

## Getting Started

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
```

## Project Structure

```
src/
├── main.tsx              # App entry + SPA router
├── components/
│   ├── WalletConnect.tsx # Wallet connection modal
│   └── NewsFeed.tsx      # Real-time crypto news
├── lib/
│   ├── dexscreener.ts    # DexScreener API service
│   ├── coingecko.ts      # CoinGecko API service
│   └── wallet-store.ts   # Zustand wallet store
├── pages/
│   ├── Landing.tsx       # Landing page
│   ├── Dashboard.tsx     # Intelligence dashboard
│   ├── Signals.tsx       # Signal stream
│   ├── Agents.tsx        # Agent society
│   ├── Heatmap.tsx       # Liquidity heatmap
│   ├── Copilot.tsx       # AI assistant
│   └── TokenDetail.tsx   # Token deep dive
├── routes/               # TanStack Router routes
└── styles/               # Global CSS
```

## API Integration

### DexScreener
- `/latest/dex/search` — Search tokens
- `/latest/dex/tokens/{address}` — Token info
- `/latest/dex/pairs/{chain}/{address}` — Pair details
- `/token-boosts/latest/v1` — Boosted tokens
- `/tokens/v1/{chain}/{address}` — Token profiles

### CoinGecko
- `/search/trending` — Trending coins
- `/news` — Crypto news
- `/coins/markets` — Market data
- `/global` — Global market stats

## License

MIT
