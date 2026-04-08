# Museum Exhibit Builder

> Historians + culture orgs build exhibits from audio

## Architecture — Hybrid Path 3
- **WASM** (22KB): bonfyre-brief runs client-side for instant preview
- **Actions**: Full pipeline on push — transcribe, tag, tone, render, emit
- **Pages**: Auto-deploys on every push to `site/`

## Quick Start
1. Go to [the live app](https://nickgonzales76017.github.io/pages-museum-exhibit/)
2. Configure your GitHub token in Settings
3. Drop a file — pipeline runs automatically

Powered by [Bonfyre](https://github.com/Nickgonzales76017/bonfyre) — 48 C11 binaries, ~2.1 MB total.
