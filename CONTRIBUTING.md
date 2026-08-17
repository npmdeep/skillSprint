# Contributing to SkillSprint Ledger

Thank you for your interest in contributing to SkillSprint Ledger!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/skillSprint.git`
3. Install dependencies: `npm install`
4. Run the dev server: `npm run dev`

## Development Workflow

- Run contract tests: `cargo test`
- Build for production: `npm run build:web`
- Full verification: `npm run verify`

## Code Style

- Frontend: JavaScript with React (functional components, hooks)
- Contracts: Rust with soroban-sdk idioms
- CSS: Vanilla CSS with custom properties (no frameworks)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with descriptive commits
3. Ensure all tests pass (`cargo test` and `npm run build:web`)
4. Submit a pull request with a clear description

## Reporting Issues

Use GitHub Issues to report bugs or request features. Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser and wallet version