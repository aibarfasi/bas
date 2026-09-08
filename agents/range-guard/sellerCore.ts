/**
 * BAS Range Guard — PancakeSwap V3 LP recenter.
 * NFT stays in the hirer's wallet. Agent never custodies.
 */
export const meta = {
  name: "BAS Range Guard",
  category: "rebalance",
  allowlist: ["0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"],
};

export async function runWork(input: {
  tokenId: string;
  widthBps?: number;
}) {
  const width = input.widthBps ?? 800;
  return {
    action: "recenter",
    nft: input.tokenId,
    newWidthBps: width,
    custody: "hirer",
    minOut: "never-zero",
  };
}
