import { useId, useMemo, useState } from 'react'

const W = 320
const H = 120
const PAD = 8

// Smooth area chart of game scores with an average line. Tap or drag to scrub.
export function TrendChart({ values, average }: { values: number[]; average: number | null }) {
  const id = useId()
  const [active, setActive] = useState<number | null>(null)

  const { points, line, area, avgY } = useMemo(() => {
    const lo = Math.min(...values, average ?? Infinity)
    const hi = Math.max(...values, average ?? -Infinity)
    const range = hi - lo || 1 // all-equal scores would divide by zero
    const x = (i: number) => (values.length === 1 ? W / 2 : (i / (values.length - 1)) * W)
    const y = (v: number) => PAD + (1 - (v - lo) / range) * (H - PAD * 2)
    const pts = values.map((v, i) => ({ x: x(i), y: y(v), v }))
    // Catmull-Rom → cubic Bézier for a smooth curve through every point
    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
      d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`
    }
    return {
      points: pts,
      line: d,
      area: `${d} L${pts.at(-1)!.x},${H} L${pts[0].x},${H} Z`,
      avgY: average === null ? null : y(average),
    }
  }, [values, average])

  if (values.length < 2) return null

  const shown = points[active ?? points.length - 1]
  const scrub = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect()
    const i = Math.round(((clientX - r.left) / r.width) * (values.length - 1))
    setActive(Math.max(0, Math.min(values.length - 1, i)))
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-baseline justify-between text-xs text-white/60">
        <span>{active === null ? 'Latest game' : `Game ${active + 1} of ${values.length}`}</span>
        <span className="text-base font-semibold tabular-nums text-white">{shown.v}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full touch-none overflow-visible"
        role="img"
        aria-label={`Trend of ${values.length} games`}
        onPointerDown={(e) => scrub(e.clientX, e.currentTarget)}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && scrub(e.clientX, e.currentTarget)}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id}-fill)`} />
        {avgY !== null && (
          <line x1="0" x2={W} y1={avgY} y2={avgY} stroke="white" strokeOpacity="0.35" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        )}
        <path d={line} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={shown.x} x2={shown.x} y1="0" y2={H} stroke="white" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" />
        <circle cx={shown.x} cy={shown.y} r="7" fill="white" fillOpacity="0.25" />
        <circle cx={shown.x} cy={shown.y} r="4" fill="white" />
      </svg>
      {average !== null && <p className="mt-1 text-right text-[11px] text-white/50">- - average {average}</p>}
    </div>
  )
}
