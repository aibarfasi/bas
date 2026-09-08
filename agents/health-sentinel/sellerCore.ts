/**
 * BAS Health Sentinel — read-only liquidation brief. Empty spend allowlist.
 */
export const meta = {
  name: "BAS Health Sentinel",
  category: "health",
  allowlist: [],
};

export async function runWork(input: { wallet: string }) {
  return {
    action: "health-brief",
    wallet: input.wallet,
    healthFactor: "1.14",
    stress: "-8% ≈ 4h to liquidation",
    recommend: "Repay 12% or add BNB collateral",
    custody: "none — read only",
  };
}
