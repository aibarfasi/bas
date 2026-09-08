export function WalletGlyph({
  kind,
  className = "h-6 w-6",
}: {
  kind: "metamask" | "binance" | "rabby" | "okx" | "browser" | "wallet";
  className?: string;
}) {
  if (kind === "metamask") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <path fill="#E2761B" d="M27.4 4.6 18.2 11.4l1.7-4.1z" />
        <path fill="#E4761B" d="m4.6 4.6 9.1 6.9-1.6-4.2z" />
        <path fill="#E4761B" d="m23.4 22.8-2.5 3.8 5.3 1.5 1.5-5.2z" />
        <path fill="#E4761B" d="m4.3 22.9 1.5 5.2 5.3-1.5-2.5-3.8z" />
        <path fill="#E4761B" d="m10.8 14.3-1.5 2.2 5.3.2-.2-5.7z" />
        <path fill="#E4761B" d="m21.2 14.3-.2-3.4-.1 5.8 5.3-.2z" />
        <path fill="#F6851B" d="m11.1 26.6 3.2-1.5-2.7-2.1z" />
        <path fill="#F6851B" d="m17.7 25.1 3.2 1.5-.4-3.6z" />
      </svg>
    );
  }
  if (kind === "binance") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <path
          fill="#FCD535"
          d="M16 4.5 19.4 8 16 11.4 12.6 8 16 4.5Zm-8 8L11.4 16 8 19.5 4.5 16 8 12.5Zm16 0L27.5 16 24 19.5 20.6 16 24 12.5ZM16 20.6 19.4 24 16 27.5 12.6 24 16 20.6Zm0-8.1 3.4 3.5L16 19.5 12.6 16 16 12.5Z"
        />
      </svg>
    );
  }
  if (kind === "rabby") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <circle cx="16" cy="16" r="12" fill="#8697FF" />
        <circle cx="12" cy="14" r="2" fill="#fff" />
        <circle cx="20" cy="14" r="2" fill="#fff" />
      </svg>
    );
  }
  if (kind === "okx") {
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden>
        <rect x="6" y="6" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="18" y="6" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="6" y="18" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="18" y="18" width="8" height="8" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="5" y="10" width="22" height="14" rx="3" fill="#FCD535" />
      <rect x="19" y="14" width="6" height="4" rx="1" fill="#181A20" />
    </svg>
  );
}

export function walletKind(name: string): "metamask" | "binance" | "rabby" | "okx" | "browser" {
  const n = name.toLowerCase();
  if (n.includes("meta")) return "metamask";
  if (n.includes("binance") || n.includes("bnb")) return "binance";
  if (n.includes("rabby")) return "rabby";
  if (n.includes("okx") || n.includes("okex")) return "okx";
  return "browser";
}
