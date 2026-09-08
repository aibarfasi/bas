# BAS seller agents

Four BNB Agent Studio sellers — one per judging category. Scaffold with the official CLI, then keep `sellerCore.ts` as the only file you edit.

```bash
npm install --global @bnbagent/studio-cli
bag skills install
```

For each folder:

```bash
cd agents/range-guard
# or: /bnbagent-studio in Cursor
bag init --network bsc-testnet --protocols a2a,x402 --wallet altana
# replace generated sellerCore with this file
bag doctor
bag dev
bag deploy --provider bnb
bag deploy verify --provider bnb
bag erc8004 show
```

## Guardrails (PancakeSwap track)

- Output recipient is always the client / hirer
- `amountOutMin` is never 0
- Call allowlist: Smart Router `0x13f4EA83D0bd40E75C8222255bc855a974568Dd4`, NFPM `0x46A15B0b27311cedF172AB29E4f4766fbE7F4364`
- Health Sentinel allowlist is empty (read-only)
- Altana session: spend cap + expiry registered on KeyStore; revoke is one tx

The marketplace hire path already calls `/api/hire/faces/{kind}/x402` so judges can complete the journey before these runtimes are deployed.
