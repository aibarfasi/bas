/**
 * BAS Grid Pilot — Smart Router fills, recipient = client.
 */
export const meta = {
  name: "BAS Grid Pilot",
  category: "grid",
  allowlist: ["0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"],
};

export async function runWork(input: {
  amountIn: string;
  recipient: string;
  minOut: string;
}) {
  if (!input.minOut || input.minOut === "0") {
    throw new Error("minOut must be > 0");
  }
  return {
    action: "grid-fill",
    router: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
    recipient: input.recipient,
    amountIn: input.amountIn,
    minOut: input.minOut,
    custody: "hirer",
  };
}
