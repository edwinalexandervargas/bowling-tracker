import { ScoreEntry } from './components/ScoreEntry'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Score Entry</h1>
      <ScoreEntry />
    </div>
  )
}

export default App
