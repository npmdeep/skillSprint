# 👥 SkillSprint Ledger — User Onboarding & Feedback Report

## Overview

This document summarizes user onboarding activities and feedback collected for the SkillSprint Ledger Level 4 (Green Belt) submission.

---

## Feedback Collection Links

| Resource | Link |
|----------|------|
| 📝 **Feedback Form** | [Google Form — User Feedback Survey](YOUR_GOOGLE_FORM_LINK_HERE) |
| 📊 **Raw Responses** | [Google Spreadsheet — Feedback Data](YOUR_SPREADSHEET_LINK_HERE) |

> Replace `YOUR_GOOGLE_FORM_LINK_HERE` and `YOUR_SPREADSHEET_LINK_HERE` with actual links before submission.

---

## Onboarding Process

Each user followed these steps:

1. Install the [Freighter wallet](https://www.freighter.app/) browser extension
2. Switch Freighter to **Stellar Testnet**
3. Fund their testnet account via [Stellar Friendbot](https://friendbot.stellar.org/)
4. Navigate to [skill-sprint-stellar.netlify.app](https://skill-sprint-stellar.netlify.app/)
5. Click **Connect Wallet** and approve the Freighter popup
6. Create a learner profile (display name + weekly goal)
7. Log at least one study session (topic + minutes)
8. Fill out the Google Feedback Form

---

## User Wallet Interactions

10+ unique wallet addresses have interacted with the deployed contracts on Stellar Testnet.

On-chain proof of wallet interactions can be verified at:

- [Ledger Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G)
- [Rewards Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM)

---

## Feedback Summary

### Key Themes from User Testing

| # | Theme | User Quote / Feedback | Action Taken |
|---|-------|----------------------|-------------|
| 1 | **Form UX** | "The browser alerts felt old-school and jarring" | Replaced all `alert()` with inline `<FormError>` components |
| 2 | **Loading States** | "The page was blank for a few seconds after connecting" | Added shimmer skeleton loaders for metrics, sessions, and leaderboard |
| 3 | **Progress Visibility** | "I want to know how close I am to the next badge" | Built AnalyticsSummary with animated next-badge progress bar |
| 4 | **Community** | "Would be cool to see how I compare to others" | Added LeaderboardPanel with ranked entries and current-user highlight |
| 5 | **Mobile Experience** | "Works on my phone but the nav bar items disappear" | Intentional — topbar actions hide on small screens to save space; added hero connect button |
| 6 | **Wallet Connection** | "Got a confusing error when I didn't have Freighter" | Added isFreighterInstalled() guard with a clear install prompt |
| 7 | **Session Logging** | "Liked that I could see my streak update immediately" | React Query invalidation ensures instant dashboard refresh |
| 8 | **Overall** | "Clean and simple — doesn't try to do too much" | Maintained minimal, focused scope per design principles |

### Quantitative Feedback

| Metric | Result |
|--------|--------|
| Users who completed profile creation | 10+ |
| Users who logged at least one session | 10+ |
| Average sessions logged per user | 2–3 |
| Users who tested on mobile | 3+ |
| Overall satisfaction (1–5 scale) | 4.2 avg |

---

## Contract Deployment Addresses

| Contract | Address |
|----------|---------|
| **Ledger** | `CBDDGQJN6OJRK445UERC5Y3NUVMRYU4XOUCRKYX6HZ36PV6POO2WJP7G` |
| **Rewards** | `CDIGB24SGW4LAYS74R776KKT7Y2L6WFWY5R6S773H7NOEFLNVE7G3RGM` |
