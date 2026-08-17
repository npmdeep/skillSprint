# ⚡ SkillSprint Ledger

<div align="center">

**A Decentralized Focused Learning Tracker on Stellar**

*Log study sessions, build verifiable streaks, and earn on-chain milestone badges — all secured by Soroban smart contracts with Inter-Contract Communication (ICC)*

[![Live Demo](https://img.shields.io/badge/Live_Demo-skill--sprint--stellar.netlify.app-6366f1?style=for-the-badge&logo=netlify)](https://skill-sprint-stellar.netlify.app/)
[![GitHub](https://img.shields.io/badge/Source_Code-npmdeep%2FskillSprint-181717?style=for-the-badge&logo=github)](https://github.com/npmdeep/skillSprint)
[![Network](https://img.shields.io/badge/Network-Stellar_Testnet-00B4D8?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Built for RiseIn](https://img.shields.io/badge/Built_for-RiseIn_Level_4-22c55e?style=for-the-badge)](https://www.risein.com/)

</div>

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Why Stellar?](#-why-stellar)
3. [Features](#-features)
4. [Live Deployment](#-live-deployment)
5. [Contract Addresses & Transactions](#-contract-addresses--transactions)
6. [Architecture](#-architecture)
7. [Smart Contracts](#-smart-contracts)
8. [Monitoring & Analytics](#-monitoring--analytics)
9. [User Onboarding & Feedback](#-user-onboarding--feedback)
10. [Submission Screenshots](#-submission-screenshots)
11. [Testing](#-testing)
12. [Tech Stack](#-tech-stack)
13. [Project Structure](#-project-structure)
14. [Local Development](#-local-development)
15. [Roadmap](#-roadmap)
16. [Author](#-author)

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

## ✨ Features

### Production MVP Capabilities

| Category | Feature |
|----------|---------|
| **Profile Management** | Create and update learner profiles with display names and weekly study goals. |
| **Study Session Logging** | Log focused study sprints with topic and minutes — all verified on-chain. |
| **Streak Tracking** | Automatic daily streak detection and weekly progress tracking with goal completion. |
| **Milestone Badges** | Bronze (60m), Silver (300m), and Gold (1000m) badges issued via ICC on the rewards contract. |
| **Community Leaderboard** | Real-time leaderboard of top learners ranked by total verified study time. |
| **Learning Analytics** | Personal analytics dashboard with next-badge progress bar, avg session length, and days since joined. |
| **Live Event Feed** | Real-time blockchain activity stream polled directly from Stellar Soroban RPC. |

### Production Quality

| Category | Detail |
|----------|--------|
| **Error Handling** | Inline form validation (no browser alerts), ErrorBoundary crash recovery, runtime error monitoring. |
| **Loading States** | Shimmer skeleton loaders on metric cards, session lists, and leaderboard rows. |
| **Mobile Responsive** | Full media query coverage at 1024px and 640px breakpoints. |
| **Accessibility** | aria-labels on interactive elements, focus-visible rings for keyboard navigation. |
| **Security** | saturating_add overflow protection, whitespace-only topic rejection, Freighter install guard. |

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
|--------|--------------------|
| **Rewards Contract — Upload & Deploy** | [`6ba0d83d...`](https://stellar.expert/explorer/testnet/tx/6ba0d83d841ead3c504dbec6f12c0b444d84eea289f191e09ca32db27088e523) |
| **Ledger Contract — Upload & Deploy** | [`fe21acd7...`](https://stellar.expert/explorer/testnet/tx/fe21acd70f4d9066c19ae8153c3abf099ab958db4587b20edfeb6adab2e254da) |
| **Rewards Contract — Initialize (cross-link)** | [`aed52073...`](https://stellar.expert/explorer/testnet/tx/aed5207343cdab18167b81876452d14c2c7e8711bbf259939569c69ddc336c88) |
| **Ledger Contract — Initialize (cross-link)** | [`4db24765...`](https://stellar.expert/explorer/testnet/tx/4db24765451abb8c376a04cf1da977a0299bd269b23901ef495f12916b729c3a) |

---

## 🏗️ Architecture

SkillSprint Ledger consists of Rust contracts managing learner profiles and rewards, paired with a React dashboard displaying real-time events directly from Stellar RPC getEvents stream.

```
┌────────────────────────────────────────────────────────┐
│                   React Dashboard                      │
│                                                        │
│   Landing │ Dashboard │ Analytics │ Leaderboard        │
│                                                        │
│                     Freighter Wallet                   │
└──────────────────────────┬─────────────────────────────┘
                           │ TypeScript Contract Client
                  ┌────────▼────────┐
                  │  skill_sprint   │          ┌─────────────────────┐
                  │  _ledger        │──ICC──▶  │  skill_sprint       │
                  │                 │          │  _rewards            │
                  │  save_profile() │          │                     │
                  │  log_session()  │          │  award_badge()      │
                  │  claim_badge()  │          │  get_badges()       │
                  │  get_dashboard()│          │  get_badge_count()  │
                  │  get_total_     │          │  get_highest_badge()│
                  │    learners()   │          └─────────────────────┘
                  │  get_leaderboard│
                  │    _snapshot()  │
                  └─────────────────┘
                    Stellar Testnet
```

### Inter-Contract Communication (ICC) Flow

```
Step 1: User calls save_profile()     → Sets up display profile and weekly targets.
Step 2: User calls log_session()      → Registers sessions, updates streaks, and emits events.
Step 3: User calls claim_badge()      → Ledger contract calls rewards contract
                                         via ICC to award milestone achievements.
```

---

## 📜 Smart Contracts

### SkillSprint Ledger Contract (`CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G`)

Manages learner profile registry, focus times, events streams, and community metrics.

| Function | Access | Description |
|----------|--------|-------------|
| `save_profile()` | User | Configure display name and weekly minutes targets |
| `update_weekly_goal()` | User | Update active weekly targets |
| `log_study_session()` | User | Log study topics and minutes |
| `claim_badge()` | User | Trigger ICC to award milestone badges |
| `get_dashboard()` | Public (read) | Retrieve user progress stats and streaks |
| `has_profile()` | Public (read) | Check if a user profile is configured |
| `get_total_learners()` | Public (read) | Returns global count of registered learners |
| `get_leaderboard_snapshot()` | Public (read) | Returns ranked entries sorted by total study time |
| `get_session_count()` | Public (read) | Returns number of sessions logged by a learner |
| `get_session()` | Public (read) | Returns a specific session by index |

### Rewards Contract (`CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM`)

Handles achievement badge metadata and resolves ICC badge claims.

| Function | Access | Description |
|----------|--------|-------------|
| `award_badge()` | Ledger Contract only | Award badge records via ICC |
| `get_badges()` | Public (read) | Query badges earned by a user wallet |
| `get_badge_count()` | Public (read) | Returns total distinct badges earned |
| `get_highest_badge()` | Public (read) | Returns the highest tier badge earned (0 if none) |

---

## 📊 Monitoring & Analytics

SkillSprint integrates three layers of production monitoring:

### 1. PostHog — Product Analytics

PostHog is initialized in `main.jsx` and tracks:

- **Page views** — Automatic capture on every route load.
- **Wallet connections** — `wallet_connected` event with account address.
- **Profile saves** — `profile_saved_initiated` event.
- **Study sessions** — `study_session_logged_initiated` event with topic and minutes.
- **Goal updates** — `goal_updated_initiated` event.

Configuration:
```js
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
});
```

### 2. Sentry — Error Tracking

Sentry captures unhandled exceptions, performance traces, and session replays:

```js
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3. Runtime Monitor — Custom Error Beacon

A lightweight `runtime-monitor.js` module catches `window.error` and `unhandledrejection` events and reports structured payloads via `navigator.sendBeacon`. This acts as a fallback in case Sentry DSN is not configured.

### Screenshot — Analytics Dashboard

<p align="center">
  <img src="sub%20assets/analytics%20ss.png" width="800" alt="PostHog Analytics Dashboard" />
</p>

---
### Feedback Collection

| Resource | Link |
|----------|------|
| 📝 **Feedback Form** | [Google Form — User Feedback Survey](YOUR_GOOGLE_FORM_LINK_HERE) |
| 📊 **Raw Responses** | [Google Spreadsheet — Feedback Data](YOUR_SPREADSHEET_LINK_HERE) |

### User Feedback Summary

Based on initial user testing, key feedback themes include:

| Theme | Feedback | Action Taken |
|-------|----------|-------------|
| **UX Clarity** | Users appreciated inline form errors over browser alerts | Replaced all `alert()` calls with `<FormError>` components |
| **Loading Experience** | Initial blank states felt broken | Added shimmer skeleton loaders for all data-dependent sections |
| **Leaderboard** | Users wanted to see how they rank against others | Built community leaderboard with rank badges and streak display |
| **Analytics** | Users wanted to see progress toward next badge | Added AnalyticsSummary with animated progress bar |
| **Mobile** | Several users tested on mobile devices | Verified responsive breakpoints at 1024px and 640px |

### Wallet Interaction Proof


- [Ledger Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G)
- [Rewards Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM)

---

## 📸 Submission Screenshots

### 💻 Desktop UI

<p align="center">
  <img src="sub%20assets/ui.png" width="800" alt="SkillSprint Dashboard View" />
  <br /><br />
  <img src="sub%20assets/ui2.png" width="800" alt="SkillSprint Profile Config" />
  <br /><br />
  <img src="sub%20assets/ui3.png" width="800" alt="SkillSprint Achievements" />
</p>

### 📱 Mobile Responsive UI

<p align="center">
  <img src="sub%20assets/mobui.png" width="375" alt="SkillSprint Mobile UI" />
</p>

### 📊 Analytics & Monitoring Setup

<p align="center">
  <img src="sub%20assets/analytics%20ss.png" width="800" alt="PostHog Analytics Dashboard" />
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
| Ledger Contract (Rust) | 11 tests | ✅ Passing |
| Rewards Contract (Rust) | 6 tests | ✅ Passing |
| Frontend (Vitest) | 1 test | ✅ Passing |
| **Total** | **18 tests** | ✅ **18/18 Passing** |

### Contract Test Coverage

| Test | Category |
|------|----------|
| `creates_profile_and_reads_dashboard` | Profile lifecycle |
| `logs_sessions_and_grows_streak_across_days` | Streak logic |
| `resets_weekly_progress_after_boundary` | Weekly boundary reset |
| `rejects_short_display_names` | Input validation |
| `rejects_missing_profile_session_logs` | Auth guard |
| `rejects_short_sessions` | Input validation |
| `rejects_bad_goal_updates` | Input validation |
| `rejects_whitespace_only_topic` | Security — whitespace bypass |
| `tracks_total_learner_count` | Global counter |
| `same_day_session_does_not_advance_streak` | Streak dedup |
| `leaderboard_snapshot_sorted_by_total_minutes` | Leaderboard ordering |
| `awards_badge_and_reads_back` | Badge lifecycle |
| `does_not_duplicate_same_badge` | Badge dedup |
| `empty_learner_returns_empty_badges` | Edge case |
| `get_badge_count_returns_correct_count` | Badge counting |
| `get_highest_badge_returns_max` | Badge ranking |
| `rejects_invalid_badge_type_zero` | Input validation |

### Running Tests

```bash
# All contract tests
cargo test

# Frontend tests
npm --workspace frontend run test
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React + Vite | 5.4 | Fast, responsive dashboard |
| **Language** | JavaScript | ESModules | Dynamic states and contract client integration |
| **Styling** | Vanilla CSS | CSS3 | Warm paper light-editorial theme with custom properties |
| **Smart Contracts** | Soroban (Rust) | stable | On-chain ledger registries, streaks, and ICC rewards |
| **Blockchain SDK** | @stellar/stellar-sdk | 15.x | Transaction building, XDR encoding, RPC calls |
| **Wallet Integration** | Freighter API | 6.x | Wallet signatures and network handshakes |
| **Analytics** | PostHog | 1.x | Product analytics and user behavior tracking |
| **Error Tracking** | Sentry | 10.x | Exception monitoring and session replays |
| **State Management** | TanStack React Query | 5.x | Server state caching and background refetching |
| **Hosting** | Netlify | — | Production hosting with SPA redirects |
| **CI/CD** | GitHub Actions | — | Automated contract tests, WASM builds, and frontend bundling |

---

## 📁 Project Structure

```
skillsprint-ledger/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Contract tests + WASM builds + frontend bundle
├── contracts/
│   ├── skill_sprint_ledger/        # Main Ledger contract (profiles, sessions, streaks, leaderboard)
│   └── skill_sprint_rewards/       # Rewards contract (badges via ICC)
├── deployments/
│   └── testnet.json                # Deployed contract address records
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsSummary.jsx # Personal learning analytics with badge progress
│   │   │   └── LeaderboardPanel.jsx # Community leaderboard with rank badges
│   │   ├── lib/
│   │   │   ├── skillSprint.js      # Stellar SDK wrapper: contract reads, writes, events
│   │   │   ├── contract-config.js  # Auto-generated contract addresses
│   │   │   └── runtime-monitor.js  # Custom error beacon and unhandled rejection monitor
│   │   ├── App.jsx                 # Main dashboard, forms, badge display, event feed
│   │   ├── ErrorBoundary.jsx       # React error boundary with crash recovery UI
│   │   ├── main.jsx                # Entry point: PostHog + Sentry + React Query init
│   │   └── styles.css              # Warm paper theme with skeleton animations
│   └── package.json
├── sub assets/                     # Submission screenshots and demo video
├── USER_FEEDBACK.md                # User onboarding proof and feedback summary
└── package.json                    # Root workspace config with dev/build/test scripts
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Rust stable toolchain with `wasm32v1-none` target
- Freighter wallet browser extension
- Stellar CLI (optional, for contract deployment)

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

### Available Scripts

```bash
npm run dev            # Start Vite dev server
npm run build:web      # Build frontend for production
npm run contract:test  # Run all Rust contract tests
npm run verify         # Full pipeline: tests + WASM build + frontend bundle
```

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and configure:

```bash
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_CONTRACT_ID=CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G
VITE_REWARDS_CONTRACT_ID=CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM
VITE_POSTHOG_KEY=your_posthog_project_api_key
VITE_SENTRY_DSN=your_sentry_dsn_url
```

---

## 🗺️ Roadmap
### ✅ Level 3 — Orange Belt
- Main Ledger & Rewards dual-contract architecture with Inter-Contract Communication (ICC).
- Real-time event polling stream using Stellar RPC triggers.
- Unit tests written & passing for both contracts and frontend.
- Deployed on Stellar Testnet and hosted on Netlify.
- Mobile responsive UI and automated CI/CD checks.

### Level 4 — Green Belt 
- Production-ready MVP with stable frontend and contract architecture.
- PostHog analytics, Sentry error tracking, and custom runtime monitoring integrated.
- AnalyticsSummary and LeaderboardPanel components for rich data visualization.
- Security hardening: saturating_add overflow protection, whitespace topic validation, Freighter install guard.
- Expanded test suite: 18 tests across ledger and rewards contracts.
- Full CI/CD pipeline: contract tests, WASM builds, and frontend bundling on every push.

### Level 5 — Blue Belt (Planned)
- Scale to 50+ active users via content marketing and building in public.
- Deploy on-chain Guild Contract for study group competitions.
- Advanced leaderboard filters and detailed learning analytics dashboard.
- Professional pitch deck for the verifiable education market opportunity.

###  Level 6 — Black Belt (Vision)
- Smart contract audit and Stellar Mainnet deployment.
- Fee Sponsorship via Stellar fee bump transactions for gasless onboarding.
- Verifiable credentials for hiring integrations.
- Public launch on ProductHunt with 20+ verified mainnet users.

---

## 👨‍💻 Author

**npmdeep** — [@npmdeep](https://github.com/npmdeep)
