/**
 * BAS Yield Router — rank CAKE + fee APR, then optional move after user signs.
 */
export const meta = {
  name: "BAS Yield Router",
  category: "yield",
  allowlist: [
    "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
    "0x556B9306565093C855AEA9AE92A594704c2Cd59e",
  ],
};

export async function runWork() {
  return {
    action: "rank-farms",
    leader: "WBNB / USDT 0.25%",
    custody: "hirer",
    executesOnlyAfterUserSign: true,
  };
}
