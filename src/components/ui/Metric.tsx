type Props = {
  label: string;
  value: string;
  tone?: "up" | "down" | "muted" | "default";
};

const tones = {
  up: "text-bas-up",
  down: "text-bas-down",
  muted: "text-bas-muted",
  default: "text-bas-body",
};

export function Metric({ label, value, tone = "default" }: Props) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-bas-muted">{label}</div>
      <div className={`num mt-1 truncate text-sm ${tones[tone]}`}>{value}</div>
    </div>
  );
}
