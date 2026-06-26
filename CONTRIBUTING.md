# Contributing to Cortex Space

We welcome contributions. This document outlines the development workflow and standards for this project.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri CLI](https://v2.tauri.app/start/cli/) (`cargo install tauri-cli --version "^2"`)

## Setup

```bash
# Clone the repository
git clone https://github.com/icodecedd/cortex-space.git
cd cortex-space

# Install frontend dependencies
npm install

# Run in development mode (desktop app with hot-reload)
npm run tauri dev
```

## Project Structure

```
cortex-space/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities and helpers
│   ├── stores/           # State management
│   └── styles/           # Global styles
├── src-tauri/            # Rust backend
│   ├── src/              # Rust source code
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── public/               # Static assets
└── package.json          # Frontend dependencies and scripts
```

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser-only) |
| `npm run tauri dev` | Start Tauri desktop app with hot-reload |
| `npm run build` | Type-check and build frontend |
| `npm run tauri build` | Build production desktop binary |
| `npm run check-types` | Run TypeScript type checking |

## Code Style

- **TypeScript** -- Use strict typing. Avoid `any` where possible.
- **React** -- Functional components with hooks. Prefer composable patterns.
- **Rust** -- Follow standard Rust conventions (`cargo fmt`, `cargo clippy`).
- **CSS** -- Use Tailwind utility classes. Avoid raw CSS unless necessary.
- **Imports** -- Use path aliases defined in `tsconfig.json` for internal imports.

## Pull Request Process

1. Fork the repository and create a feature branch (`git checkout -b feature-name`)
2. Make your changes following the code style above
3. Run `npm run check-types` to verify TypeScript compiles
4. Ensure the Tauri build succeeds with `npm run tauri build`
5. Commit with a clear, descriptive message
6. Push to your fork and open a Pull Request

## Reporting Issues

When filing a bug report, include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Tauri version, Node version)
- Screenshots or screen recordings if applicable

---

For questions or discussions, open a [GitHub Discussion](https://github.com/icodecedd/cortex-space/discussions).
