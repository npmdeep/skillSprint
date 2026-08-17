# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SkillSprint Ledger, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email the maintainer directly or use GitHub's private security advisory feature.

## Scope

This policy covers:
- Soroban smart contracts (skill_sprint_ledger, skill_sprint_rewards)
- Frontend JavaScript SDK (skillSprint.js)
- Build and deployment configurations

## Known Security Measures

- `saturating_add` for all u32 minute accumulations (overflow protection)
- Whitespace-only topic rejection in session logging
- `require_auth()` on all state-modifying contract functions
- ICC authorization: rewards contract verifies calling contract is the registered admin
- Badge type validation: rejects values outside 1-10 range
- Freighter install guard before wallet connection attempts
- Inline form validation replacing browser alert() calls

## Smart Contract Audits

The contracts have not undergone a formal third-party audit. This is planned for Level 6.