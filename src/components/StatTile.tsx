// Small labelled number for stats grids. value null shows as an em dash.
export function StatTile({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
  return (
    <div className="rounded bg-gray-800 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

