import { Link } from 'react-router'
import { useGameStore } from '../store/gameStore'
import { formatLayout } from '../arsenal/formatLayout'
import { Page, Card } from '../components/ui'
import { primaryButton } from '../components/styles'

export function ArsenalScreen() {
  const balls = useGameStore((s) => s.balls)
  const ballSpecs = useGameStore((s) => s.ballSpecs)

  return (
    <Page
      title="Arsenal"
      wide
      action={<Link to="/arsenal/new" className={primaryButton}>Add ball</Link>}
    >
      {balls.length === 0 ? (
        <Card className="p-6 text-muted">No balls yet. Add the first one to keep its layout and surface on file.</Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {balls.map((ball) => {
            const spec = ballSpecs.find((s) => s.id === ball.specId)
            return (
              <li key={ball.id}>
                <Card className="h-full p-4">
                  <p className="font-semibold">
                    {ball.nickname ?? spec?.name ?? 'Unknown ball'}
                    <span className="ml-2 text-sm font-normal text-muted">{spec?.brand}</span>
                  </p>
                  <p className="num mt-1 text-lg">
                    {ball.layout.system === '2ls' ? '2LS' : 'Dual angle'} {formatLayout(ball.layout)}
                  </p>
                  <p className="text-sm text-muted">
                    {ball.surface}
                    {ball.weight ? ` · ${ball.weight} lb` : ''}
                  </p>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
