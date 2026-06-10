# SkillSprint Ledger

SkillSprint Ledger is a Stellar Soroban mini-dApp for tracking focused study time on-chain. Learners connect a Freighter wallet, create a public profile, set a weekly study target, and log individual study sessions that update weekly progress and streak data.

## Submission Links

- MVP demo video: [mvp.mp4](./mvp.mp4)
- Stellar Lab contract page: `https://lab.stellar.org/r/testnet/contract/CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2`
- Testnet transaction 1: `https://stellar.expert/explorer/testnet/tx/27739ea83c74e3b25086c9c2dd53ff9f4d39ad9834d5dbb9461d63ed910e9ec4`
- Testnet transaction 2: `https://stellar.expert/explorer/testnet/tx/8f47a8eb7b284a7bc562f8785eb2c2cf50e428954d709574840e6224d07a9e6a`

## UI Preview

![SkillSprint Ledger UI](./ui.png)

## Deployment Details

- Network: `Stellar Testnet`
- Contract alias: `skill_sprint_ledger`
- Contract ID: `CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2`
- Contract explorer: `https://lab.stellar.org/r/testnet/contract/CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2`
- Testnet transaction 1: `https://stellar.expert/explorer/testnet/tx/27739ea83c74e3b25086c9c2dd53ff9f4d39ad9834d5dbb9461d63ed910e9ec4`
- Testnet transaction 2: `https://stellar.expert/explorer/testnet/tx/8f47a8eb7b284a7bc562f8785eb2c2cf50e428954d709574840e6224d07a9e6a`

## What The App Does

Users can:

- Connect a Freighter wallet on Stellar Testnet
- Create or update a public learner profile
- Set a weekly study target
- Log study sessions on-chain
- Track total minutes, weekly progress, and streaks
- Review recent sessions pulled from the deployed contract

## Stack

- Smart contract: Rust + Soroban SDK
- Contract tooling: Stellar CLI
- Frontend: React + Vite
- Wallet: Freighter
- Network access: Soroban RPC via `@stellar/stellar-sdk`
- Data fetching: TanStack Query

## Project Structure

```text
contracts/skill_sprint_ledger/
frontend/
scripts/
assets/
Cargo.toml
package.json
README.md
```

## Contract Features

The Soroban contract stores:

- A learner profile per Stellar address
- Individual study sessions by index
- Weekly progress totals
- Consecutive-day streaks

Contract methods:

- `save_profile(learner, display_name, weekly_goal_minutes)`
- `update_weekly_goal(learner, new_goal_minutes)`
- `log_session(learner, topic, minutes_spent)`
- `get_dashboard(learner)`
- `get_session_count(learner)`
- `get_session(learner, index)`
- `has_profile(learner)`

Validation rules:

- Display name: 3 to 32 chars
- Topic: 3 to 48 chars
- Session length: 5 to 480 minutes
- Weekly goal: 30 to 5000 minutes

## Local Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Run contract tests

```powershell
npm run contract:test
```

### 3. Build the Soroban contract

```powershell
npm run contract:build
```

This uses `stellar contract build` and outputs:

```text
target/wasm32v1-none/release/skill_sprint_ledger.wasm
```

### 4. Configure environment

Copy `.env.example` to `.env` and set a Stellar CLI identity:

```env
STELLAR_ACCOUNT=alice
STELLAR_NETWORK=testnet
STELLAR_CONTRACT_ALIAS=skill_sprint_ledger
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_CONTRACT_ID=
```

If you also want a frontend-only env file, copy `frontend/.env.example` to `frontend/.env`.

For this deployed testnet instance, you can set:

```env
VITE_CONTRACT_ID=CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2
```

## Deploy To Stellar Testnet

### 1. Create and fund a testnet identity

Using Stellar CLI:

```powershell
stellar keys generate alice --network testnet --fund
```

This follows the current Stellar docs flow for testnet deployment with `stellar` CLI.

### 2. Build the contract

```powershell
npm run contract:build
```

### 3. Deploy the contract

```powershell
npm run contract:deploy
```

The deploy script wraps:

```powershell
stellar contract deploy `
  --wasm target/wasm32v1-none/release/skill_sprint_ledger.wasm `
  --source-account alice `
  --network testnet `
  --alias skill_sprint_ledger
```

After deployment it writes:

```text
deployments/testnet.json
```

Current deployed record:

- Source account alias: `alice`
- Contract ID: `CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2`
- Deployment timestamp: `2026-04-19T15:26:28.340Z`

### 4. Export frontend config

```powershell
npm run export:frontend
```

That updates:

[`frontend/src/lib/contract-config.js`](C:/Users/Deep%20Saha/Desktop/SkillSprint%20Ledger%20level3/frontend/src/lib/contract-config.js:1)

### 5. Start the frontend

```powershell
npm run dev
```

Then open the Vite URL and connect Freighter on `Stellar Testnet`.

Example local dev URL from the latest run:

```text
http://localhost:5174/
```

## Production Build

```powershell
npm run build
```

This will:

1. Build the Soroban contract
2. Export the frontend config
3. Build the React app into `frontend/dist`

## Vercel Deployment

The repo is still Vercel-ready for the frontend.

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `frontend/dist`

Set these Vercel environment variables:

- `VITE_STELLAR_RPC_URL`
- `VITE_STELLAR_NETWORK_PASSPHRASE`
- `VITE_CONTRACT_ID`

Recommended testnet values:

```env
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_CONTRACT_ID=CACOOTSVOLSTXCEIG7YJZAI7KYCWUQRVUPN5YE7OY33RP2F6OL5ZMJW2
```

## Notes

- This repo is now a real Stellar Soroban project, not a Hardhat/EVM app.
- The previous Solidity/Hardhat contract flow has been removed.
- Freighter must be installed in the browser to submit transactions from the frontend.
- If Brave blocks Freighter injection on localhost, Chrome or Edge may be more reliable for the demo flow.

## Verification

Current local checks completed:

- `cargo test`
- `stellar contract build`
- `npm --workspace frontend run build`
- `npm run contract:deploy`
