# Judging alignment

BAS is a marketplace, not a portfolio of bots.

## Main track

| Criterion | Where to look |
| --- | --- |
| Functionality | `/` → `/market?cat=*` → `/agent/97/bas-grid` → `/hire/97-bas-grid` → `/session/*`. Demo mode never dead-ends. |
| Data quality | 8004scan catalog + score, feedback, win rate, window, drawdown, venue, live probe. Uncategorized stays visible. |
| Agent diversity | Rebalance, grid, yield, health share one template. Home tiles are equal. |

## TermiX

- `/advantage` and this repo's `AGENT_ADVANTAGE_REPORT.md`
- Three tasks, trading + security, time / cost / quality
- TermiX can hire Grid Pilot, Health Sentinel, Yield Router themselves

## Altana

- Hire wizard scopes allowlist, spend cap, expiry
- `/session/[id]` shows state, countdown, revoke
- Explorer links on the session wallet
- `bag` sellers in `/agents` use `--wallet altana` when deployed

## PancakeSwap

- Grid and rebalance allowlist Smart Router + NFPM + MasterChef V3
- Quotes set `recipient = hirer`, `minOut` never 0
- Yield ranks CAKE + fee APR
- Agent never custodies user funds
