import { createBrowserRouter, RouterProvider, Outlet } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { ScoreScreen } from './screens/ScoreScreen'
import { ArsenalScreen } from './screens/ArsenalScreen'
import { AddBallScreen } from './screens/AddBallScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { PatternsScreen } from './screens/PatternsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LeagueScreen } from './screens/LeagueScreen'
import { StatsScreen } from './screens/StatsScreen'
import { NightsScreen } from './screens/NightsScreen'
import { NightDetailScreen } from './screens/NightDetailScreen'

function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)] text-white flex flex-col items-center p-4 pb-24">
      <Outlet />
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomeScreen /> },
      { path: '/score', element: <ScoreScreen /> },
      { path: '/nights', element: <NightsScreen /> },
      { path: '/nights/:sessionId', element: <NightDetailScreen /> },
      { path: '/leagues/:leagueKey', element: <LeagueScreen /> },
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
