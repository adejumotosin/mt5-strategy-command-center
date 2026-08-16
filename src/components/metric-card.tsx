import { Icon, type IconName } from "@/components/icons";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: IconName;
  tone?: "mint" | "amber" | "blue" | "neutral";
};

export function MetricCard({ label, value, detail, icon, tone = "neutral" }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        <span className="metric-card__icon"><Icon name={icon} /></span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
