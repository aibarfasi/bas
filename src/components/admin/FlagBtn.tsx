export function FlagBtn({
  on,
  label,
  onLabel,
  offLabel,
  busy,
  onClick,
}: {
  on: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`bas-mac-chip border disabled:cursor-not-allowed disabled:opacity-50 ${
        on
          ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
          : "border-bas-hairline bg-bas-card text-bas-muted hover:text-bas-heading"
      }`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}
