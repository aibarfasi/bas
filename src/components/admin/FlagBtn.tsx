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
      className={`inline-flex h-8 items-center rounded-[8px] border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        on
          ? "border-bas-up/40 bg-bas-up/10 text-bas-up"
          : "border-bas-hairline bg-bas-field text-bas-muted hover:border-bas-muted hover:text-bas-heading"
      }`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}
