type MiniChartProps = {
  values: number[];
  positive?: boolean;
  height?: number;
};

export function MiniChart({ values, positive = true, height = 88 }: MiniChartProps) {
  const width = 420;
  const padding = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y = padding + ((max - value) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const color = positive ? "var(--mint)" : "var(--coral)";

  return (
    <svg
      aria-label={positive ? "Rising market price chart" : "Falling market price chart"}
      className="mini-chart"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={`chart-${positive ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.24" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#chart-${positive ? "up" : "down"})`} points={area} />
      <polyline fill="none" points={points} stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
