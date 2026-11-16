// Small labelled number for stats grids. value null shows as an em dash.
export function StatTile({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface p-3 ring-1 ring-line">
      <p className="text-xs text-muted">{label}</p>
      <p className="num text-2xl font-semibold">{value ?? '—'}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}
