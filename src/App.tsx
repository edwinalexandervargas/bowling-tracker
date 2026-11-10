import { useState } from 'react'
import { PinDeck } from './components/PinDeck'
import { pinsStanding, pinsKnockedDown } from './pins/pins'

function App() {
  const [lastShot, setLastShot] = useState<number | null>(null)

  const handleConfirm = (pinsAfter: number) => {
    setLastShot(pinsAfter)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Pin Deck</h1>

      <PinDeck onConfirm={handleConfirm} />

      {lastShot !== null && (
        <div className="mt-6 text-center space-y-1">
          <p className="text-lg">
            Knocked down: <span className="font-bold">{pinsKnockedDown(1023, lastShot)}</span>
          </p>
          <p className="text-sm text-gray-400">
            Left standing: {pinsStanding(lastShot).join(', ') || 'none (strike!)'}
          </p>
          <p className="text-xs text-gray-500">
            Mask: {lastShot}
          </p>
        </div>
      )}
    </div>
  )
}

export default App