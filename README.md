[![CI](https://github.com/balluPiku/skillsprint-ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/balluPiku/skillsprint-ledger/actions/workflows/ci.yml)

# SkillSprint Ledger

SkillSprint Ledger is a production-ready Stellar Soroban mini-dApp for tracking focused study time on-chain. Learners connect a Freighter wallet, create a profile, set a weekly target, log study sessions, and monitor live contract events from Soroban RPC in near real time.

## Submission Links

- Live demo: [skillsprint-ledger.vercel.app](https://skillsprint-ledger.vercel.app)
- CI workflow: [GitHub Actions Workflow](https://github.com/balluPiku/skillsprint-ledger/actions/workflows/ci.yml)
- Stellar Lab Ledger contract page: [CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G](https://lab.stellar.org/r/testnet/contract/CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G)
- Stellar Lab Rewards contract page: [CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM](https://lab.stellar.org/r/testnet/contract/CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM)
- Soroban Rewards Deploy TX: [6ba0d83d841ead3c504dbec6f12c0b444d84eea289f191e09ca32db27088e523](https://stellar.expert/explorer/testnet/tx/6ba0d83d841ead3c504dbec6f12c0b444d84eea289f191e09ca32db27088e523)
- Soroban Ledger Deploy TX: [fe21acd70f4d9066c19ae8153c3abf099ab958db4587b20edfeb6adab2e254da](https://stellar.expert/explorer/testnet/tx/fe21acd70f4d9066c19ae8153c3abf099ab958db4587b20edfeb6adab2e254da)
- Rewards Initialize TX: [aed5207343cdab18167b81876452d14c2c7e8711bbf259939569c69ddc336c88](https://stellar.expert/explorer/testnet/tx/aed5207343cdab18167b81876452d14c2c7e8711bbf259939569c69ddc336c88)
- Ledger Initialize TX: [4db24765451abb8c376a04cf1da977a0299bd269b23901ef495f12916b729c3a](https://stellar.expert/explorer/testnet/tx/4db24765451abb8c376a04cf1da977a0299bd269b23901ef495f12916b729c3a)
- Demo video: [Google Drive Link](https://drive.google.com/file/d/1JCLe6s5ADPzqODZ_hu4ph-flDoEEcOaI/view?usp=sharing)


## Screenshots

Desktop preview:

![SkillSprint Ledger desktop UI](./ui.png)

Mobile responsive view:

![SkillSprint Ledger mobile UI](./Mobile%20responsive.png)

CI/CD pipeline proof:

![SkillSprint Ledger CI/CD](./CI_CD.png)

## Product Features

Users can:

- Connect a Freighter wallet on Stellar Testnet
- Create or update a public learner profile
- Set a weekly study target
- Log study sessions on-chain
- Earn on-chain achievement badges via automated inter-contract communication (ICC)
- Track total minutes, weekly progress, and streaks
- Read the latest five sessions from the deployed contract
- Watch recent contract events arrive through Soroban RPC polling

## Stack

- Smart contract: Rust + Soroban SDK
- Contract tooling: Stellar CLI
- Frontend: React + Vite
- Wallet: Freighter
- RPC and contract client: `@stellar/stellar-sdk`
- Query layer: TanStack Query
- CI/CD: GitHub Actions + Vercel

## Deployment Details

- Network: `Stellar Testnet`
- Ledger Contract ID: `CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G`
- Rewards Contract ID: `CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM`
- Ledger Explorer: `https://lab.stellar.org/r/testnet/contract/CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G`
- Rewards Explorer: `https://lab.stellar.org/r/testnet/contract/CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM`
- Vercel production URL: `https://skillsprint-ledger.vercel.app`

Notes:

- Inter-contract calls: Fully implemented. Logging study sessions triggers automated badge awards based on total minutes.
- Custom token or liquidity pool: not used in this build
- Token or pool address: not applicable

## Local Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`:

```env
STELLAR_ACCOUNT=alice
STELLAR_NETWORK=testnet
STELLAR_CONTRACT_ALIAS=skill_sprint_ledger
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_CONTRACT_ID=CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2
```

For frontend-only configuration, copy `frontend/.env.example` to `frontend/.env`.

Optional runtime error reporting:

```env
VITE_ERROR_TRACKING_URL=https://your-webhook-endpoint.example.com
```

### 3. Run contract tests

```powershell
npm run contract:test
```

### 4. Build the contract

```powershell
npm run contract:build
```

### 5. Export frontend config

```powershell
npm run export:frontend
```

### 6. Start the frontend

```powershell
npm run dev
```

## Build Commands

Local full build:

```powershell
npm run build
```

Frontend deploy build:

```powershell
npm run build:web
```

Full local verification:

```powershell
npm run verify
```

## CI/CD

GitHub Actions runs two jobs on pushes and pull requests:

- `Contract Checks`: `cargo test --locked` and release WASM build for `wasm32v1-none`
- `Frontend Build`: `npm ci`, frontend config generation, and Vite production build

The Vercel deployment uses `vercel.json` and `.vercelignore` so only frontend-required files are uploaded. The production build command is:

```powershell
npm run build:web
```

## Deploy To Stellar Testnet

### 1. Create and fund a testnet identity

```powershell
stellar keys generate alice --network testnet --fund
```

### 2. Build the contract

```powershell
npm run contract:build
```

### 3. Deploy the contract

```powershell
npm run contract:deploy
```

### 4. Refresh frontend contract config

```powershell
npm run export:frontend
```

## Production Readiness Notes

- The UI now includes a live contract activity feed powered by Soroban RPC `getEvents`
- The frontend is protected by an error boundary and optional webhook-based runtime reporting
- Mobile layouts stack cleanly for narrower screens and keep action buttons readable
- Source maps are enabled for the Vite build to make production debugging easier

## Verification

Completed locally:

- `cargo test`
- `cargo build --locked --target wasm32v1-none --release -p skill_sprint_ledger`
- `npm run build:web`
- `vercel deploy --prod`

## Repository Checklist

- Public GitHub repository: yes
- README with complete documentation: yes
- Live demo link: yes
- Mobile responsive screenshot: yes
- CI/CD workflow configured: yes
- Contract address documented: yes
- Minimum 8 meaningful commits: yes
