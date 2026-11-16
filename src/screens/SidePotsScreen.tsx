import { Page, Card } from '../components/ui'

// Placeholder so the destination exists in the navigation.
// The boards are driven by bingoBoard() and threeSixNine() in src/sidepots/.
export function SidePotsScreen() {
  return (
    <Page title="Side pots" wide>
      <Card className="p-6 text-muted">Bingo and 3-6-9 will show here.</Card>
    </Page>
  )
}
