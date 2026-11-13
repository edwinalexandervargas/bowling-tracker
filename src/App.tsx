import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { ScoreScreen } from './screens/ScoreScreen'
import { ArsenalScreen } from './screens/ArsenalScreen'
import { AddBallScreen } from './screens/AddBallScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { PatternsScreen } from './screens/PatternsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { NightsScreen } from './screens/NightsScreen'

function Layout() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 pb-20">
      <Outlet />
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <ScoreScreen /> },
      { path: '/nights', element: <NightsScreen /> },
      { path: '/stats', element: <StatsScreen /> },
      { path: '/arsenal', element: <ArsenalScreen /> },
      { path: '/arsenal/new', element: <AddBallScreen /> },
      { path: '/patterns', element: <PatternsScreen /> },
      { path: '/profile', element: <ProfileScreen /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
