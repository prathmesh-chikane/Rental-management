export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm text-slate-500">{title}</h3>
      <p className="text-2xl font-bold">₹{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
