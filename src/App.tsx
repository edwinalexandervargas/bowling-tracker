import { create } from 'zustand'

const useCounter = create<{ count: number; inc: () => void }>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}))

export default function App() {
  const { count, inc } = useCounter()
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-blue-600">Bowling Tracker</h1>
      <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" onClick={inc}>
        Pins: {count}
      </button>
    </div>
  )
}