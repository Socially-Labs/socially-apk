# Interactive backend guide

Open `backend-guide.html` in a browser, or serve this directory with `python3 -m http.server 8098`.

Snapshot: backend `e98ce0667545d8374855395df0d4c894bc5cd105`.

Includes 35 live-migration-derived table layouts, 68 registered API contracts, 53 response examples captured with synthetic fixtures, 22 Anchor public instructions, and 9 on-chain account structures plus 2 nested types. `guide-data.json` contains the extracted source evidence.

This guide does not connect to an API or modify accounts. Request validation is a simplified local teaching tool. Response examples have synthetic IDs, balances, times, and mocked market prices. Token-funding examples use a synthetic chain adapter and demonstrate response shapes, not proof of an external transfer. Google Fonts are optional; offline fallback fonts work.

The current API implements paper trading. Devnet funding reconciles test-token transfers. The separate Anchor fund program is not called by the current API; deployment was not verified.
