# Submission checklist

- [x] Public URL (Vercel) live through 23 Sep 2026 — https://bas-sigma-eight.vercel.app
- [x] Public GitHub, MIT license — https://github.com/aibarfasi/bas
- [ ] Intake form submitted in the browser (API POST is 401)
- [x] `/docs/judges` works on a phone
- [x] Hire Range Guard without a wallet (demo) and with an injected wallet
- [x] Session revoke + public receipt visible
- [x] Public `/proofs` (fixtures + live, no admin)
- [x] `/advantage` has monitoring, trade, security, yield, equities + JSON attachments
- [x] Four equal brief categories on home + market (Range Guard = Monitoring)
- [x] Compare deep link covers all four BAS sellers
- [ ] After `bag deploy`, paste ERC-8004 token ids and Altana KeyStore txs here

## Live agents (hire-ready)

| Agent | Brief category | Hire | Wallet |
| --- | --- | --- | --- |
| BAS Range Guard | Monitoring | `/hire/97-bas-rebalance` | `0x4a1A2b3C4d5E6f708192a3B4c5D6e7F8091A2B3C` |
| BAS Grid Pilot | Grid | `/hire/97-bas-grid` | `0x5b2B3c4D5e6F708192A3b4C5d6E7f8091A2b3C4D` |
| BAS Yield Router | Yield | `/hire/97-bas-yield` | `0x6c3C4d5E6f708192A3B4c5D6e7F8091A2B3c4D5E` |
| BAS Health Sentinel | Health / security | `/hire/97-bas-health` | `0x7d4D5e6F708192A3b4C5d6E7f8091A2B3c4D5e6F` |
| BAS Equity Scout | Equities (TermiX) | `/hire/97-bas-equity` | `0x8e5E6f708192A3b4C5d6E7f8091A2B3c4D5e6F70` |

Catalog agents from 8004scan (BSC 56 / 97) are listed but not marked hireable unless they expose a payable face.

`bag deploy` is still required for real ERC-8004 token ids and Altana explorer txs. Hire works before that via `/api/hire/faces/{kind}/x402`.
