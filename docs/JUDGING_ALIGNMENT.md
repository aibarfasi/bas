# Judging alignment

BAS is a marketplace, not a portfolio of bots.

## Main track

| Criterion | Where to look |
| --- | --- |
| Functionality | `/` → `/market?cat=*` → `/agent/97/bas-grid` → `/hire/97-bas-grid` → `/session/*`. Demo mode never dead-ends. |
| Data quality | 8004scan catalog + score, feedback, x402, live. Category search. Uncategorized stays visible. Win/PnL only when the operator published them. |
| Agent diversity | Monitoring (Range Guard), grid, yield, health share one template. Home tiles are equal. |

## TermiX

- `/advantage` and `AGENT_ADVANTAGE_REPORT.md`
- Four tasks: trading, security, yield, equities
- Hire Grid Pilot, Health Sentinel, Yield Router, Equity Scout

## Altana

- Hire wizard scopes allowlist, spend cap, expiry
- `/session/[id]` shows state, countdown, revoke
- Public grant/revoke receipts: `GET /api/altana/receipts`
- Explorer links on the session wallet
- `bag` sellers in `/agents` use `--wallet altana` when a funded Studio CLI is available

## PancakeSwap

- Grid and monitoring (LP) allowlist Smart Router + NFPM + MasterChef V3
- Quotes set `recipient = hirer`, `minOut` never 0
- Yield ranks CAKE + fee APR
- Agent never custodies user funds
