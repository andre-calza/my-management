type Props = {
  label: string;
  value: number | string;
};

export function StatCard({ label, value }: Props) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
