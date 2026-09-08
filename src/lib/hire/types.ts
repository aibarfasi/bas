export type HireJob = {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  rail: "x402" | "erc-8183";
  paidUsd: number;
  status: "funded" | "running" | "delivered";
  startedAt: number;
  deliveredAt: number | null;
  deliverable: {
    title: string;
    summary: string;
    outputs: { label: string; value: string }[];
    recipient: string;
    custody: string;
  };
};
