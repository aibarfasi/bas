export type AuditGroup = "settings" | "sellers" | "allowlist" | "snapshot" | "other";

export const AUDIT_GROUP_LABEL: Record<AuditGroup, string> = {
  settings: "Settings",
  sellers: "Sellers",
  allowlist: "Allowlist",
  snapshot: "Snapshot",
  other: "Other",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "settings.update": "Settings saved",
  "agent.patch": "Seller patched",
  "agent.bulk": "Catalog bulk",
  "agent.create": "Seller added",
  "agent.delete": "Seller removed",
  "agent.reset": "Seller reset",
  "allowlist.add": "Contract added",
  "allowlist.remove": "Contract removed",
  "allowlist.replace": "Allowlist replaced",
  "snapshot.import": "Snapshot imported",
};

export function auditAtMs(n: number) {
  return n < 1e12 ? n * 1000 : n;
}

export function auditIso(n: number) {
  return new Date(auditAtMs(n)).toISOString();
}

export function auditGroup(action: string): AuditGroup {
  if (action.startsWith("settings.")) return "settings";
  if (action.startsWith("agent.")) return "sellers";
  if (action.startsWith("allowlist.")) return "allowlist";
  if (action.startsWith("snapshot.")) return "snapshot";
  return "other";
}

export function auditLabel(action: string) {
  return AUDIT_ACTION_LABEL[action] ?? action;
}

export function auditHref(action: string, detail?: string) {
  if (action.startsWith("allowlist.")) return "/admin/allowlist";
  if (action === "settings.update" || action === "snapshot.import") return "/admin/settings";
  if (action === "agent.bulk") return "/admin/catalog";
  if (action.startsWith("agent.") && detail && !/\s/.test(detail)) {
    return `/admin/agents/${encodeURIComponent(detail)}`;
  }
  if (action.startsWith("agent.")) return "/admin/agents";
  return "/admin";
}
