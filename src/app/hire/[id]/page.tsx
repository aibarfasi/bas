import { notFound } from "next/navigation";
import { HireWizard } from "@/components/hire/HireWizard";
import { AppShell } from "@/components/shell/AppShell";
import { getScanAgent } from "@/lib/agents/scan";
import { parseHireId } from "@/lib/format";

export default async function HirePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = parseHireId(id);
  if (!parsed) notFound();
  const agent = await getScanAgent(parsed.chainId, parsed.tokenId);
  if (!agent) notFound();

  return (
    <AppShell>
      <HireWizard agent={agent} />
    </AppShell>
  );
}
