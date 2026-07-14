# ⚡ SkillSprint Ledger

<div align="center">

**A Decentralized Focused Learning Tracker on Stellar**

*Audit and gamify study time milestones secured by Stellar Soroban smart contracts and ICC badges*

[![Live Demo](https://img.shields.io/badge/Live_Demo-skill--sprint--stellar.netlify.app-6366f1?style=for-the-badge&logo=netlify)](https://skill-sprint-stellar.netlify.app/)
[![GitHub](https://img.shields.io/badge/Source_Code-npmdeep%2FskillSprint-181717?style=for-the-badge&logo=github)](https://github.com/npmdeep/skillSprint)
[![Network](https://img.shields.io/badge/Network-Stellar_Testnet-00B4D8?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Built for RiseIn](https://img.shields.io/badge/Built_for-RiseIn_Level_3-f59e0b?style=for-the-badge)](https://www.risein.com/)

</div>

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Why Stellar?](#-why-stellar)
3. [Live Deployment](#-live-deployment)
4. [Contract Addresses & Transactions](#-contract-addresses--transactions)
5. [Architecture](#-architecture)
6. [Smart Contracts](#-smart-contracts)
7. [Submission Screenshots](#-submission-screenshots)
8. [Testing](#-testing)
9. [Tech Stack](#-tech-stack)
10. [Project Structure](#-project-structure)
11. [Local Development](#-local-development)
12. [Roadmap](#-roadmap)
13. [Author](#-author)

---

## 🔴 Problem Statement

Self-paced study, technical bootcamps, and developer onboarding lack accountable tracking primitives. Learners struggle to prove focus times, verify progress milestones, and share achievements without relying on centralized validation sheets.

| Issue | Impact |
|-------|--------|
| **Unverifiable Progress** | Focus study times and milestones cannot be audited or shared publicly with proof. |
| **Missing Gamification** | Learners lack immediate, on-chain rewards (like badges) for hitting time milestones. |
| **Centralized Control** | Learning achievements are siloed inside specific private learning management platforms. |

**SkillSprint Ledger** removes these constraints. Learners connect a Freighter wallet, configure study milestones, and record focus study sessions directly to the Stellar ledger, earning verified achievement badges.

---

## 🌟 Why Stellar?

SkillSprint Ledger is designed specifically to utilize the native advantages of the Stellar network:

| Stellar Property | SkillSprint Benefit |
|-----------------|-------------------|
| **~5 Second Payouts** | Validates weekly target streaks and issues milestone badges in under 5 seconds. |
| **Micro-fees ($0.00001)** | Makes logging hourly micro-study sessions economically feasible. |
| **Soroban Smart Contracts** | Employs Inter-Contract Communication (ICC) to separate study registries from rewards. |
| **Native Event Stream** | Polls real-time events to power public ledger streams for guest viewers. |

---

## 🌐 Live Deployment

| Resource | Link |
|----------|------|
| 🌍 **Live dApp** | [skill-sprint-stellar.netlify.app](https://skill-sprint-stellar.netlify.app/) |
| 🎬 **Demo Video** | [Google Drive — Walkthrough Recording](https://drive.google.com/file/d/1fyh44vwBPg8KkTM3u7AbpuhR0Jc8XqEj/view?usp=sharing) |
| 💻 **GitHub Repo** | [npmdeep/skillSprint](https://github.com/npmdeep/skillSprint) |

---

## 🔗 Contract Addresses & Transactions

All contracts are deployed and cross-initialized on the **Stellar Testnet** using the `npmdeep` developer credentials.

### Deployed Contract IDs

| Contract | Address |
|----------|---------|
| **Ledger Main Contract** | `CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G` |
| **Rewards Contract** | `CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM` |

### On-Chain Deployment Transactions

| Action | Transaction Hash |
|--------|-----------------|
| **Rewards Contract — Upload & Deploy** | [`6ba0d83d841ead3c504dbec6f12c0b444d84eea289f191e09ca32db27088e523`](https://stellar.expert/explorer/testnet/tx/6ba0d83d841ead3c504dbec6f12c0b444d84eea289f191e09ca32db27088e523) |
| **Ledger Contract — Upload & Deploy** | [`fe21acd70f4d9066c19ae8153c3abf099ab958db4587b20edfeb6adab2e254da`](https://stellar.expert/explorer/testnet/tx/fe21acd70f4d9066c19ae8153c3abf099ab958db4587b20edfeb6adab2e254da) |
| **Rewards Contract — Initialize (cross-link to Ledger)** | [`aed5207343cdab18167b81876452d14c2c7e8711bbf259939569c69ddc336c88`](https://stellar.expert/explorer/testnet/tx/aed5207343cdab18167b81876452d14c2c7e8711bbf259939569c69ddc336c88) |
| **Ledger Contract — Initialize (cross-link to Rewards)** | [`4db24765451abb8c376a04cf1da977a0299bd269b23901ef495f12916b729c3a`](https://stellar.expert/explorer/testnet/tx/4db24765451abb8c376a04cf1da977a0299bd269b23901ef495f12916b729c3a) |

---

## 🏗️ Architecture

SkillSprint Ledger consists of Rust contracts managing learner profiles and rewards, paired with a React dashboard displaying real-time events directly from Stellar RPC getEvents stream.

```
┌────────────────────────────────────────────────────────┐
│                   React Dashboard                      │
│                                                        │
│   Landing │ Dashboard │ Profile Configure │ Ledger     │
│                                                        │
│                     Freighter Wallet                   │
└──────────────────────────┬─────────────────────────────┘
                           │ TypeScript Contract Client
                  ┌────────▼────────┐
                  │  skill_sprint   │
                  │  Contract       │
                  │                 │
                  │  save_profile() │
                  │  log_session()  │
                  │  claim_badge()  │
                  └─────────────────┘
                    Stellar Testnet
```

### Inter-Contract Communication (ICC) Flow

Logging study sessions on the main ledger registry uses ICC to check total study minutes and dynamically issue achievement badges on the rewards contract.

```
Step 1: User calls save_profile()  → Sets up display profile and weekly targets.
Step 2: User calls log_session()  → Registers sessions, updates streaks, and emits events.
Step 3: User calls claim_badge()   → Ledger contract calls rewards contract
                                     via ICC to award milestone achievements.
```

---

## 📜 Smart Contracts

### SkillSprint Ledger Contract (`CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G`)

Manages learner profile registry, focus times, and events streams.

| Function | Access | Description |
|----------|--------|-------------|
| `save_profile()` | User | Configure display name and weekly minutes targets |
| `update_weekly_goal()` | User | Update active weekly targets |
| `log_study_session()` | User | Log study topics and minutes |
| `get_dashboard()` | Public (read) | Retrieve user progress stats and streaks |
| `has_profile()` | Public (read) | Check if a user profile is configured |

### Rewards Contract (`CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM`)

Handles achievement badges metadata and resolves ICC badge claims.

| Function | Access | Description |
|----------|--------|-------------|
| `award_badge()` | Ledger Contract only | Award badge records via ICC |
| `get_badges()` | Public (read) | Query badges earned by a user wallet |

---

## 📸 Submission Screenshots

### 💻 Desktop UI

<p align="center">
  <img src="sub%20assets/ui.png" width="800" alt="SkillSprint Dashboard View 1" />
  <br /><br />
  <img src="sub%20assets/ui2.png" width="800" alt="SkillSprint Profile Config" />
  <br /><br />
  <img src="sub%20assets/ui3.png" width="800" alt="SkillSprint Achievements" />
</p>

### 📱 Mobile Responsive UI

<p align="center">
  <img src="sub%20assets/mobui.png" width="375" alt="SkillSprint Mobile UI" />
</p>

### 🔄 CI/CD Pipeline

<p align="center">
  <img src="sub%20assets/cicd.png" width="800" alt="SkillSprint CI/CD Pipeline" />
</p>

---

## 🧪 Testing

### Test Summary

| Suite | Tests | Status |
|-------|-------|--------|
| Frontend (Vitest) | 1 test | ✅ Passing |
| Escrow Contract (Rust) | 8 tests | ✅ Passing |
| **Total** | **9 tests** | ✅ **9/9 Passing** |

### Running Tests

```bash
# Frontend Tests
npm --workspace frontend run test

# Rust Contracts Tests
cargo test
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React + Vite | 5.4 | Fast, responsive dashboard |
| **Language** | JavaScript | ESModules | Dynamic states and contract client integration |
| **Styling** | Vanilla CSS | CSS3 | Warm paper light-editorial components |
| **Smart Contracts** | Soroban (Rust) | stable | On-chain ledger registries and streaks |
| **Blockchain SDK** | @stellar/stellar-sdk | 12.x | Transaction building, XDR encoding, RPC calls |
| **Wallet Integration** | Freighter API | 1.x | Wallet signatures and network handshakes |
| **Hosting** | Netlify | — | Production hosting |

---

## 📁 Project Structure

```
skillsprint-ledger/
├── .github/
│   └── workflows/
│       └── ci.yml             # Automated contract build and frontend check
├── contracts/
│   ├── focus_forge/           # Main Ledger contract source code
│   └── focus_forge_rewards/   # Rewards Incentive contract source code
├── deployments/
│   └── testnet.json           # Deployed contract address records
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── skillSprint.js # Freighter wrappers and RPC event stream pollers
│   │   │   └── contract-config.js
│   │   ├── App.jsx            # Dashboard and feed stream
│   │   ├── main.jsx           # Application entry point
│   │   └── styles.css         # Warm paper theme style sheets
│   └── package.json
└── package.json
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Rust stable toolchain
- Freighter wallet browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/npmdeep/skillSprint.git
cd skillSprint

# Install dependencies
npm install

# Start local dev server
npm run dev
```

---

## 🗺️ Roadmap

### ✅ Level 3 — Orange Belt (Complete)
- Main Ledger & Rewards dual-contract architecture with Inter-Contract Communication (ICC).
- Real-time event polling stream using Stellar RPC triggers.
- Unit tests written & passing for both contracts and frontend.
- Deployed on Stellar Testnet and hosted on Netlify.
- Mobile responsive UI and automated CI/CD checks.

---

## 👨‍💻 Author

**npmdeep** — [@npmdeep](https://github.com/npmdeep)
