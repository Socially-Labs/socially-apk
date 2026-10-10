# Captain Discover UI TODO

Proposed UI changes for the paper trading application. Check off items after implementation and verification.

## Main Discover page

- [ ] **Vault selector:** Show the selected vault name and available buying power.
- [ ] **Paper badge:** Place a subtle “Paper trading” label near the heading.
- [ ] **Tabs:** Provide Markets, Saved and Positions tabs.
- [ ] **Empty state:** Offer create/select vault actions, or explain when the selected vault’s trading starts.

## Token list rows

- [ ] **Market data:** Show the token icon, name, symbol, price and 24h percentage change.
- [ ] **Graphs:** Remove small charts from list rows.
- [ ] **Held indicator:** Mark tokens owned by the selected vault.

## Selected vault card

- [ ] **Balance:** Show vault value, available buying power and unrealized P&L.
- [ ] **Status:** Show Fundraising, Active, Frozen or Completed, with trading availability.
- [ ] **Navigation:** Open the vault’s details and activity when tapped.

## Trade sheet — after tapping a token

- [ ] **Chart:** Show real 24h history; display “Chart unavailable” if history cannot load and keep the rest of the sheet usable. Do not fabricate historical prices.
- [ ] **Buy/Sell:** Keep both controls visible and show current holdings and average entry price.
- [ ] **Amount entry:** Add 25%, 50%, 75% and Max shortcuts based on the selected vault’s buying power for buys and available holdings for sells.
- [ ] **Estimate:** Show estimated tokens, simulated fees and remaining buying power before confirmation.
- [ ] **Freshness:** Show “Price updating” when stale and wait for a usable price before allowing submission.
- [ ] **Order feedback:** Show clear pending, filled or rejected status, including a rejection reason when available.

## Positions tab

- [ ] **Position rows:** Show quantity, average entry price, current value and unrealized P&L for the selected vault.
- [ ] **Recent trades:** Show the selected vault’s latest orders with status and execution price when filled.
