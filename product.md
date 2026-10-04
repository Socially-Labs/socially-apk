socially.trade --- Product & Technical Specification
Version: 1.0
Status: Developer handoff / architecture discussion
Platform: Solana
Primary client: React Native mobile app
Wallet layer: Privy embedded wallets
Trading layer: Jupiter initially, with a controlled allowlist of
execution venues/programs
Protocol: Custom Solana program (Anchor)
1. Product in One Sentence
socially.trade is a social, non-custodial trading protocol on Solana
where people can allocate capital to verified traders ("Captains")
through program-controlled funds, while Captains can trade the fund but
can never withdraw or redirect the Crew's money.
The core promise:
Pick a Captain. Join the Crew. Keep your keys.

The Captain receives trading authority, not custody authority.
2. The Problem
Today, if someone asks a skilled trader:
"Can you trade for me?"

there are several bad options:
1. Give the trader your money.
2. Follow the trader's calls and manually copy trades.
3. Use a centralized exchange's copy-trading product.
These introduce custody risk, poor transparency, bad execution,
unverifiable track records, or dependence on a centralized exchange.
socially.trade should combine:
- simple consumer onboarding,
- pooled trading,
- self-custody / program-controlled custody,
- verifiable performance,
- on-chain risk rules,
- social interaction between traders and investors.
3. Core Participants
3.1 Crew
A Crew member is someone who allocates money to a Captain's fund.
Crew members should be able to:
- sign up with email/phone/Google/Apple,
- receive an embedded wallet,
- on-ramp into USDC,
- discover Captains,
- view Captain performance,
- join a fund,
- view holdings and PnL,
- watch trades in real time,
- chat with the Captain,
- receive trade/risk alerts,
- leave the fund.
The Crew should not need to understand Solana, seed phrases, extensions,
gas, or DEX routing.
3.2 Captain
A Captain is an approved trader who manages a fund.
A Captain can:
- trade the fund,
- create trade instructions,
- use approved trading venues,
- use delegated keys,
- run bots,
- eventually run AI agents,
- communicate with the Crew,
- earn performance fees.
A Captain must not be able to:
- withdraw Crew funds,
- transfer fund assets to an arbitrary wallet,
- change protocol rules,
- add arbitrary delegates,
- bypass fund risk limits.
The Captain controls execution, not custody.
3.3 Fund
Each Captain operates a fund.
A fund is represented by program-controlled Solana accounts, including a
vault PDA.
The fund contains:
- base assets,
- positions,
- share accounting,
- policy/risk rules,
- high-water mark,
- delegate permissions,
- exit requests,
- token/risk configuration.
The fund should have no private key controlled by the Captain.
4. The Most Important Security Principle
Captain ≠ Custodian
The architecture must guarantee:
The Captain can instruct the vault to perform an allowed trade, but
cannot instruct the vault to send money wherever they want.

The protocol, not the backend, must enforce this.
The backend can be compromised.
The Captain's device can be compromised.
A bot key can be compromised.
The protocol must still prevent unauthorized fund movement.
5. High-Level Architecture
                         ┌─────────────────────┐
                         │        CREW         │
                         │ Join / Deposit /    │
                         │ Watch / Chat / Exit │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    SOCIALLY APP     │
                         │ React Native +      │
                         │ Privy Embedded      │
                         │ Wallet              │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      CAPTAIN        │
                         │ Trade / Bot / AI    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API GATEWAY     │
                         │ Auth / permissions  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    TRADE BUILDER    │
                         │ Quotes / routing /  │
                         │ transaction build   │
                         └──────────┬──────────┘
                                    │
                         Jupiter / other approved
                         execution integrations
                                    │
                                    ▼
                ┌────────────────────────────────────┐
                │       SOCIALLY SOLANA PROGRAM      │
                │                                    │
                │ Captain authorization              │
                │ Delegate permissions               │
                │ Venue allowlist                    │
                │ Token tiers                        │
                │ Position limits                    │
                │ Trade size/frequency limits        │
                │ Price protection                   │
                │ Drawdown breaker                   │
                │ Share accounting                   │
                │ Fee accounting                     │
                └──────────────────┬─────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │      FUND PDA       │
                         │ USDC / SOL / tokens │
                         │ Shares / positions  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                              Solana DEXs
Only the on-chain program is trusted with money movement.
6. Three-Layer Architecture
Layer 1 --- App
- React Native
- Privy embedded wallet
- Authentication
- On-ramp
- Captain discovery
- Fund pages
- Trading interface
- Portfolio
- Chat
- Notifications
- Captain tools
- Bot/AI-agent integration
Layer 2 --- Services
Recommended responsibilities:
- API Gateway
- Authentication
- Trade Builder
- Quote / route service
- Transaction simulation
- Fee relayer
- Chat service
- Alert service
- Indexer
- Captain profile service
- Keeper
- Bot/AI API
These services must be treated as untrusted with respect to custody.
Every service should be rebuildable from on-chain data wherever
practical.
Layer 3 --- Solana
The Solana program is the security boundary.
It owns/enforces:
- Fund vaults
- Shares
- Policies
- Positions
- Token registry
- Delegates
- Exit queues
- Protocol configuration
- Trading permissions
- Fee rules
7. Wallet Architecture
Privy is the application wallet/authentication layer.
The user should not need a traditional external wallet for the main UX.
Example:
User
  ↓
Email / Google / Apple
  ↓
Privy
  ↓
Embedded Solana wallet
Important:
The Crew's Privy wallet is not the fund's vault.
The fund is controlled by the socially.trade program.
The Captain's wallet/delegate key is also not the fund's owner.
It only receives constrained execution authority.
8. Fund Vault
The fund vault should be program-controlled.
Conceptually:
Fund PDA
 ├── base asset
 ├── share mint
 ├── NAV
 ├── high-water mark
 ├── policy
 ├── positions
 ├── delegates
 └── exit queue
The Captain must never possess the vault's private key.
The protocol program must be the only authority capable of moving funds
out of the vault, and even the program must only allow movements that
satisfy its rules.
9. Shares
When a Crew member deposits into a fund, they receive fund shares
representing their proportional claim.
Conceptually:
NAV = cash_balance + Σ(position_amount × price)

share_price = NAV / total_shares

shares_out = deposit × total_shares / NAV

value_out = shares × NAV / total_shares
Shares should make proportional ownership and PnL accounting
straightforward.
10. Trading Delegation
A Captain should not use one unrestricted wallet.
Instead, the fund should support multiple delegates.
Example:
Captain
 ├── Phone Delegate
 │    ├── max trade size
 │    ├── daily limit
 │    ├── frequency limit
 │    └── approved venues
 │
 ├── Bot Delegate
 │    ├── max trade size
 │    ├── daily limit
 │    └── approved venues
 │
 └── AI Delegate
      ├── max trade size
      ├── daily limit
      └── approved venues
Each delegate should be independently revocable.
A stolen delegate key must not equal stolen fund custody.
11. Delegate Capability
A delegate should be capable of something like:
swap(
    fund,
    delegate,
    input_token,
    output_token,
    amount,
    venue,
    minimum_output,
    route_data
)
A delegate should NOT have a generic:
transfer(fund, arbitrary_wallet, amount)
capability.
The protocol should intentionally expose a narrow set of operations.
12. DEX / Execution Architecture
Important Design Principle
Do not make Jupiter itself the security boundary.
Jupiter should initially be treated as an execution/route provider.
The architecture should look like:
Captain
   ↓
Socially Trade Builder
   ↓
Jupiter quote / route
   ↓
Transaction construction
   ↓
Socially program
   ↓
Program validation
   ↓
Approved execution programs
   ↓
Fund vault
The backend constructs the transaction.
The on-chain program decides whether the transaction is permitted.
13. Venue Allowlist
The protocol should maintain an on-chain allowlist of approved execution
programs/venues.
Examples from the current product design:
- Jupiter
- Raydium
- Pump.fun
The exact implementation should be program-ID based where appropriate,
not merely based on a string such as "Jupiter".
Why?
A Jupiter route may invoke other Solana programs underneath.
Therefore, the security model must validate the actual
instructions/programs being executed.
The developer must explicitly design how Jupiter-routed transactions are
validated.
This is a critical security requirement.
14. Trade Execution Flow
Example:
Captain wants:
100 USDC → SOL
Flow:
1. Captain selects trade
        ↓
2. Backend requests quote/route
        ↓
3. Jupiter returns route
        ↓
4. Trade Builder constructs transaction
        ↓
5. Transaction is simulated
        ↓
6. Delegate signs
        ↓
7. Socially program receives instruction
        ↓
8. Program checks all policies
        ↓
9. Approved instructions execute
        ↓
10. Output remains inside fund
        ↓
11. Program emits trade event
        ↓
12. Indexer processes event
        ↓
13. Crew receives live alert
15. The Seven Trade Checks
Every trade should be checked on-chain.
Conceptually:
Fund active?
        ↓
Delegate allowed?
        ↓
Venue/program approved?
        ↓
Size and speed within limits?
        ↓
Price fair / protected?
        ↓
Swap output returns to fund?
        ↓
Token tier / position caps still respected?
        ↓
EXECUTE
If any check fails:
REVERT
Nothing should partially execute.
16. Risk Policies
Each fund has a Policy account.
The policy can contain:
- maximum trade size,
- maximum daily volume,
- maximum trade frequency,
- token exposure limits,
- token tiers,
- drawdown threshold,
- slippage limits,
- price deviation limits,
- approved venues,
- delegate permissions,
- fund status.
Policy changes should be controlled.
A Captain can make rules stricter immediately.
Loosening important rules should have a public timelock so Crew members
can react/exit.
17. Token Risk Tiers
The current design uses three tiers.
T1
Major liquid assets such as SOL and other major tokens.
Exposure limit is controlled by fund policy.
T2
Established tokens with deep liquidity.
Example maximum:
25% per token
T3
New or unvetted tokens.
Example:
10% maximum per token
30% combined T3 exposure
The exact values should remain configurable through protocol policy.
18. Token Registry
The protocol should maintain an on-chain token registry.
For each supported token, store relevant risk/valuation information such
as:
- tier,
- price source,
- allowed status,
- relevant authorities/metadata,
- liquidity-related configuration.
The registry should be part of the security boundary.
19. Price Protection
The protocol should not blindly trust a DEX quote.
Potential checks:
- Pyth oracle where appropriate,
- TWAP where appropriate,
- pool-derived price,
- maximum deviation,
- stale-price detection,
- minimum output,
- liquidity-aware valuation.
If the required price source is stale or invalid:
FAIL CLOSED
The transaction should not execute.
20. Drawdown Breaker
Example:
Fund peak NAV: $100,000
Drawdown limit: 30%
Breaker level: $70,000
If the fund crosses the drawdown threshold:
New risk = frozen

Allowed:
✓ Sell positions
✓ Reduce exposure
✓ Return to cash

Not allowed:
✗ Open new risk
✗ Increase risky positions
The Crew should receive an alert.
21. Speed Limits
The protocol should protect against:
- compromised Captain keys,
- compromised bot keys,
- runaway AI agents,
- accidental trading loops,
- excessive churn.
Possible limits:
max_trade_size
max_daily_volume
max_trade_frequency
max_position_size
These should be enforced on-chain.
22. Output Destination
This is one of the most important invariants.
A trade executed by the Captain must result in assets staying inside the
fund.
For example:
Fund USDC
    ↓
DEX
    ↓
Fund SOL
Not:
Fund USDC
    ↓
DEX
    ↓
Captain wallet
The protocol should verify that trade proceeds return to the fund.
23. Captain Must Not Be Able To
The protocol must prevent:
Captain → withdraw fund
Captain → transfer to own wallet
Captain → transfer to arbitrary wallet
Captain → change fund authority
Captain → change protocol rules
Captain → add arbitrary delegate
Captain → bypass risk limits
Captain → use unapproved programs
Captain → bypass price checks
Even if the Captain's delegate key is compromised, the attacker should
remain constrained by the same protocol rules.
24. Joining a Fund
Desired consumer UX:
1. Sign up
2. Add money
3. Pick Captain
4. Join
The user should not need to:
- install a wallet extension,
- manage a seed phrase,
- manually bridge,
- manually select Solana RPCs,
- manually calculate gas.
The app should abstract these details.
25. Leaving a Fund
Crew members should be able to request an exit.
The current design uses:
Cash portion
Instantly redeemable from available USDC/SOL.
Illiquid/token portion
Queued for liquidation.
Safety deadline
If the Captain does not complete a required liquidation within the
defined period, the protocol should have a forced-sale/backstop
mechanism.
Example:
Leave
 ↓
Cash portion → instant
Token portion → queue
 ↓
Captain sells
 ↓
Funds returned
During unresolved queued exits, the fund may pause new deposits to
prevent additional capital entering while previous exits remain
unresolved.
26. Performance Fees
The current product model:
10% of new profit
No:
- joining fee,
- monthly fee,
- exit fee.
The performance fee should use a high-water mark.
Example:
Previous high: $1,180

Fund rises to: $1,300

New profit:
$1,300 - $1,180 = $120

Performance fee:
10% × $120 = $12
The Captain should not receive another fee merely because the fund
recovered from a previous loss.
27. Fee Payment
The current design pays the performance fee in shares rather than
directly removing cash.
Example:
Fund value increases
        ↓
New high-water mark
        ↓
Performance fee calculated
        ↓
New shares minted
        ↓
Captain receives fee shares
Current intended split:
80% → Captain
20% → protocol
Fees are limited in frequency and capped per period.
28. Captain Performance Profile
The Captain profile should be generated from on-chain data rather than
self-reported claims.
Potential metrics:
Performance
- Return since inception
- 30-day return
- 90-day return
- Worst drawdown
- Returns delivered to Crew
Scale
- Current AUM
- Total historical capital
- Current Crew
- Historical Crew
Alignment
- Captain's own stake
- Fees earned
- Average slippage
- Trading history
The profile should also show:
- current holdings,
- fund rules,
- trade history,
- Captain style/risk,
- Crew reviews.
29. Captain Reputation
A Captain should build a verifiable record over time.
Potential ranks:
New Captain
    ↓
Proven Captain
    ↓
Admiral
A Captain should not be able to selectively hide losing trades.
The profile should be reconstructable from public on-chain events.
30. Captain Decision Log
The Captain can post a trade thesis/call in the fund chat.
The system should associate the message with subsequent trades.
Example:
Captain:
"I think SOL will outperform over the next week."

       ↓

Trade

       ↓

Result

       ↓

Public decision history
This makes the social layer more than just chat.
It creates an auditable record of:
- what the Captain said,
- what the Captain did,
- whether the Captain followed their stated strategy.
31. Real-Time Social Layer
Crew should receive:
- trade alerts,
- deposits,
- exits,
- fee events,
- risk events,
- drawdown alerts,
- Captain messages.
Potential architecture:
Solana Program
      ↓
Program Events
      ↓
Indexer
      ↓
Event Bus
      ↓
WebSocket Service
      ↓
Mobile App
32. Bots and AI Agents
The architecture should support:
Human Captain
Bot Captain
AI-assisted Captain
AI Captain
All must use the same protocol-level restrictions.
An AI agent must not receive unrestricted access to the fund.
Instead:
AI Agent
   ↓
AI Delegate Key
   ↓
same policy engine
   ↓
same on-chain checks
   ↓
Fund
The protocol should not care whether the instruction originated from:
- a human,
- a bot,
- an AI agent.
The permissions and risk rules remain the same.
33. Developer Security Requirement
The backend must never be treated as the security layer.
Bad:
Frontend
 ↓
Backend
 ↓
"if venue == Jupiter"
 ↓
sign transaction
Good:
Frontend
 ↓
Backend
 ↓
Transaction builder
 ↓
Delegate signs
 ↓
Solana program
 ↓
ON-CHAIN VALIDATION
 ↓
Execute / Revert
The backend can improve UX.
It must not be able to bypass the protocol.
34. Transaction Construction vs Authorization
These must be separate concepts.
Backend
Responsible for:
- getting quotes,
- finding routes,
- constructing transactions,
- simulation,
- MEV-aware submission,
- transaction relaying,
- API authentication,
- analytics.
Program
Responsible for:
- whether the caller is authorized,
- whether the delegate is authorized,
- whether the venue/program is approved,
- whether the amount is allowed,
- whether the token is allowed,
- whether the position limit is respected,
- whether price/slippage constraints are respected,
- whether output stays in the fund,
- whether the fund is frozen,
- whether the transaction is allowed at all.
35. What Privy Does
Privy should provide the application wallet/authentication experience.
It should NOT be the fund's custody layer.
Conceptually:
Privy Wallet
    ↓
Captain authorization / Crew wallet
    ↓
Socially Program
    ↓
Fund PDA
The protocol remains responsible for fund security.
The application should be designed so that a wallet-provider failure
does not imply permanent loss of the underlying fund.
36. What Jupiter Does
Jupiter is initially an execution/routing dependency.
It can provide:
- quotes,
- routes,
- swap transaction construction,
- access to Solana liquidity.
But Jupiter should not be treated as the authority over the fund.
The protocol decides what the fund is actually allowed to execute.
Potential future execution venues:
- Jupiter
- Raydium
- Orca
- Pump.fun
- other approved Solana protocols
The exact approved list should be governed by protocol configuration.
37. What The API Does
The Socially API is an orchestration layer.
Potential endpoints:
POST /funds
GET  /funds/:id
GET  /captains
GET  /captains/:id
GET  /funds/:id/positions

GET  /trade/quote
POST /trade/build
POST /trade/simulate
POST /trade/submit

POST /funds/:id/join
POST /funds/:id/exit

GET  /funds/:id/trades
GET  /captains/:id/performance
Exact API design is up to implementation.
The critical rule is:
No API endpoint should be capable of bypassing the on-chain
program.

38. Proposed Trade API Flow
Example:
GET /trade/quote
Input:
{
  "fund": "...",
  "inputMint": "USDC",
  "outputMint": "SOL",
  "amount": 100000000,
  "delegate": "..."
}
Backend:
1. Authenticate caller.
2. Check off-chain permissions.
3. Request route.
4. Validate route.
5. Build transaction.
6. Simulate transaction.
7. Return transaction for signing.
Then:
Captain/Delegate signs
        ↓
Solana
        ↓
Socially Program
        ↓
Final authorization
The on-chain program remains authoritative.
39. Required On-Chain Accounts
Initial conceptual accounts:
ProtocolConfig
TokenRegistry
Fund
Policy
Positions
Delegates
ExitRequest
ShareMint
Vault
ProtocolConfig
Contains things such as:
- protocol fee,
- approved venues,
- policy floor,
- emergency pause,
- governance/timelock configuration.
TokenRegistry
Contains:
- token tier,
- valuation source,
- allowed status,
- relevant token risk configuration.
Fund
Contains:
- base asset,
- share mint,
- NAV-related state,
- high-water mark,
- status,
- Captain,
- policy reference.
Policy
Contains:
- trade limits,
- position limits,
- token limits,
- drawdown limits,
- fee configuration,
- pending policy changes.
Positions
Tracks fund holdings and relevant cost basis.
Delegates
Tracks:
- delegate public key,
- permissions,
- limits,
- revocation,
- potentially expiry.
ExitRequest
Tracks:
- owner,
- shares,
- requested amount,
- escrow,
- deadline,
- settlement state.
40. Fund State Machine
A fund should have explicit states.
Example:
ACTIVE
  │
  ├── deposits allowed
  ├── trading allowed
  └── exits allowed

DEPOSITS_PAUSED
  │
  ├── deposits blocked
  ├── trading may continue depending on reason
  └── exits allowed

FROZEN
  │
  ├── new risk blocked
  ├── defensive sells allowed
  └── exits/backstop allowed

CLOSED
  │
  └── final settlement
The exact transitions must be specified and tested.
41. Threat Model
The system should assume:
Threat: Captain attempts to steal funds
Expected result:
Impossible through allowed program instructions.
Threat: Captain's phone key is stolen
Expected result:
Attacker can only perform actions allowed by that delegate's limits.
Threat: Bot key is compromised
Expected result:
Daily limits, size limits, venue restrictions and policy checks remain active.
Threat: Backend is compromised
Expected result:
Backend can create bad transactions, but the program rejects unauthorized transactions.
Threat: Jupiter returns an unexpected route
Expected result:
Program/transaction validation prevents unauthorized execution programs or invalid output.
Threat: Token price is stale
Expected result:
Valuation/trade fails closed.
Threat: Captain attempts to loosen risk rules
Expected result:
Timelocked rule changes give Crew time to react.
Threat: Fund becomes illiquid
Expected result:
Exit queue + deposit pause + forced-sale/backstop mechanism.
42. Non-Goals
The first version should NOT attempt to become:
- a general-purpose Solana wallet,
- a general-purpose DEX,
- a permissionless transaction executor,
- a fully autonomous hedge fund,
- an unrestricted smart-contract wallet,
- a replacement for every Solana trading venue.
The core product is:
Social fund management with constrained trading authority.

43. MVP
The first production-oriented MVP should focus on:
Protocol
- Fund PDA
- Shares
- Captain
- Delegate
- Policy
- Jupiter trading
- Basic token allowlist
- Basic position limits
- Basic trade-size limits
- Output-to-fund enforcement
- Deposit
- Exit
- Basic performance accounting
App
- Authentication
- Privy wallet
- Captain discovery
- Captain profile
- Join fund
- Portfolio
- Captain trade screen
- Trade history
- Exit
- Basic alerts
Backend
- API gateway
- Jupiter integration
- Trade builder
- Transaction simulation
- Indexer
- WebSocket events
- Basic notification service
44. Post-MVP
Add:
- Raydium
- Orca
- Pump.fun
- advanced token tiers
- Pyth/TWAP valuation
- high-water-mark fees
- drawdown breaker
- timelocked policies
- exit queue
- MEV-aware execution
- Captain sea trials
- leaderboards
- Captain ranks
- Telegram bot
- Captain API
- bot trading
- AI trading
- strategy funds
45. The Core Product Loop
Discover Captain
       ↓
Inspect verifiable track record
       ↓
Join Captain's fund
       ↓
USDC enters program-controlled fund
       ↓
Captain trades
       ↓
Every trade passes on-chain rules
       ↓
Crew sees trade in real time
       ↓
Fund profits / loses
       ↓
Captain earns only on new profit
       ↓
Crew can leave
       ↓
Captain builds public track record
       ↓
More Crew joins
       ↓
More capital attracts better Captains
46. Product Differentiation
The product should not be described merely as:
"copy trading"

or:
"a Solana trading app"

The stronger positioning is:
A social trading protocol where you can trust a trader with
execution without trusting them with custody.

Competitive concepts:
Traditional copy trading
The user copies trades.
Problem: - execution lag, - poor pricing, - exchange custody, - limited
transparency.
Informal managed trading
The trader holds the money.
Problem: - custody risk, - manual accounting, - trust dependency.
Hyperliquid-style vaults
Proves the demand for trader-managed pooled capital.
Cesto-style programmable investing
Proves that complex on-chain execution can be abstracted behind consumer
UX.
Socially
Combines:
Trader reputation
+
Pooled capital
+
Program-controlled custody
+
On-chain risk policies
+
Constrained trading delegation
+
Social interaction
+
Verifiable performance
47. The Core Invariant
If a developer remembers only one thing, it should be this:
The Captain should be able to lose the fund through legitimate
trading risk, but should never be able to steal the fund through a
permissioned transaction.

Those are two fundamentally different failure modes.
The protocol must accept:
Trading loss
while preventing:
Unauthorized fund extraction
48. Developer Review Questions
Before implementation, the developer must answer these questions
explicitly:
1. How exactly does the Fund PDA authorize a trade?
2. How is a delegate authenticated on-chain?
3. How are delegate limits stored and enforced?
4. How does the program validate Jupiter-generated transactions?
5. How are downstream DEX program IDs validated?
6. How do we guarantee trade output returns to the fund?
7. Can an instruction invoke an arbitrary CPI?
8. How do we prevent a malicious CPI route?
9. How are token accounts validated?
10. How are token mints validated?
11. How is price protection enforced?
12. How do we handle stale oracle prices?
13. How is NAV calculated atomically?
14. How are share mint/burn operations protected?
15. How is the high-water mark updated?
16. How are performance fees calculated without double charging?
17. How are exits escrowed?
18. What happens when the fund has illiquid positions?
19. What happens if the Captain disappears?
20. What happens if a delegate key is compromised?
21. Can a compromised backend move funds?
22. Can a compromised Privy wallet move fund assets?
23. Can the protocol team move user funds?
24. What exactly can the protocol multisig change?
25. Which changes are timelocked?
26. How does emergency pause work?
27. Can a frozen fund still exit?
28. How are program upgrades governed?
29. What happens if Jupiter is unavailable?
30. Can we replace Jupiter without changing the fund model?
If these questions do not have clear answers, the protocol design is not
finished.
49. Developer Deliverables
A developer implementing the protocol should produce:
Smart contract
- Anchor program
- Account schemas
- Instructions
- PDA derivations
- Authority model
- CPI model
- Error codes
- Events
- Upgrade authority design
- Timelock/governance design
- Tests
- Security tests
Backend
- API specification
- Trade builder
- Jupiter integration
- Transaction simulator
- Relayer
- Indexer
- WebSocket event system
- Notification system
Mobile
- React Native app
- Privy integration
- Captain UI
- Crew UI
- Fund UI
- Trade UI
- Portfolio
- Chat
- Notifications
- Exit flow
Security
- Threat model
- Invariant tests
- Fuzz tests
- CPI abuse tests
- Delegate compromise tests
- Price manipulation tests
- Unauthorized transfer tests
- Emergency pause tests
- External audit before unrestricted public launch
50. Final Architecture
The intended system is:
                         USER
                          │
                          ▼
                 React Native + Privy
                          │
              ┌───────────┴───────────┐
              │                       │
            CREW                   CAPTAIN
              │                       │
       deposit / exit          trade / bot / AI
              │                       │
              └───────────┬───────────┘
                          │
                          ▼
                    SOCIAL API
                          │
                  ┌───────┴────────┐
                  │                │
             Trade Builder     Indexer
                  │                │
                  ▼                ▼
              Jupiter          Events
                  │
                  ▼
           UNSIGNED / BUILT TX
                  │
                  ▼
             DELEGATE SIGN
                  │
                  ▼
        ┌─────────────────────────┐
        │    SOCIALLY PROGRAM     │
        │                         │
        │ Authorization           │
        │ Delegate limits         │
        │ Venue allowlist         │
        │ Token registry          │
        │ Position limits         │
        │ Price checks            │
        │ Slippage                │
        │ Drawdown                │
        │ Output destination      │
        │ Fund state              │
        └────────────┬────────────┘
                     │
                     ▼
                  FUND PDA
                     │
                     ▼
               Approved DEX
                     │
                     ▼
                   SOLANA
51. The Product Thesis
The fundamental thesis is:
People already trust skilled traders enough to ask them to manage
their money. The missing product is a way to give the trader execution
authority without giving them custody.

socially.trade turns that social trust into a programmable relationship.
The Captain provides:
- skill,
- strategy,
- execution,
- communication.
The protocol provides:
- custody isolation,
- enforceable rules,
- accounting,
- transparency,
- permission boundaries.
The Crew provides:
- capital,
- attention,
- feedback,
- social distribution.
The result should feel like a normal mobile finance product while the
underlying system behaves like a constrained, auditable Solana protocol.
52. Important Clarification for Implementation
This document describes the intended product architecture and current
design direction.
It does not mean that every implementation detail has already been
solved.
In particular, the developer must validate:
- exact Jupiter integration model,
- CPI/transaction validation strategy,
- program-ID allowlisting,
- delegate signing model,
- Solana transaction composition,
- oracle/valuation design,
- exit/liquidity mechanics,
- upgrade authority,
- emergency controls,
- legal/regulatory requirements.
Do not weaken the security model simply because a particular integration
is easier.
The fundamental invariant remains:
Captain controls trading. Captain does not control custody.

53. One-Line Pitch
socially.trade --- Pick a Captain. Join the Crew. Keep your keys.
A social trading protocol on Solana where anyone can allocate capital to
skilled traders while smart-contract-enforced rules ensure that traders
can trade the money, but can never take it.