export function AddressAvatar({
  address,
  size = 32,
}: {
  address: string;
  size?: number;
}) {
  const seed = address.toLowerCase().replace(/^0x/, "").padEnd(40, "0");
  const hue = parseInt(seed.slice(0, 6), 16) % 360;
  const color = `hsl(${hue} 72% 54%)`;
  const bg = `hsl(${(hue + 40) % 360} 28% 16%)`;
  const cells: boolean[] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 3; x++) {
      const bit = parseInt(seed[y * 3 + x + 6] ?? "0", 16) % 2 === 0;
      row.push(bit);
    }
    cells.push(row[0], row[1], row[2], row[1], row[0]);
  }
  const cell = size / 5;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 rounded-full"
      aria-hidden
    >
      <rect width={size} height={size} rx={size / 2} fill={bg} />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % 5) * cell + cell * 0.15}
            y={Math.floor(i / 5) * cell + cell * 0.15}
            width={cell * 0.7}
            height={cell * 0.7}
            rx={1}
            fill={color}
          />
        ) : null,
      )}
    </svg>
  );
}
