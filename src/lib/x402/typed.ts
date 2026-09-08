export function paymentTypedData(input: {
  chainId: number;
  amountUsd: string;
  resource: string;
  payTo: string;
  nonce: string;
}) {
  return {
    domain: {
      name: "BAS x402",
      version: "1",
      chainId: input.chainId,
    },
    types: {
      Payment: [
        { name: "scheme", type: "string" },
        { name: "network", type: "string" },
        { name: "asset", type: "string" },
        { name: "amountUsd", type: "string" },
        { name: "resource", type: "string" },
        { name: "payTo", type: "string" },
        { name: "nonce", type: "string" },
      ],
    },
    primaryType: "Payment" as const,
    message: {
      scheme: "exact",
      network: "bsc-testnet",
      asset: "USDT",
      amountUsd: input.amountUsd,
      resource: input.resource,
      payTo: input.payTo,
      nonce: input.nonce,
    },
  };
}

export function isSignedPayment(payment?: string | null) {
  return Boolean(payment && payment !== "demo" && payment.startsWith("0x") && payment.length > 16);
}
