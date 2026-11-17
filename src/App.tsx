import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from './auth/authStore'
import { supabaseConfigured } from './lib/supabaseConfig'
import { startSync } from './sync/sync'
import { LoginScreen } from './screens/LoginScreen'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { SidePotsScreen } from './screens/SidePotsScreen'
import { ScoreScreen } from './screens/ScoreScreen'
import { ArsenalScreen } from './screens/ArsenalScreen'
import { AddBallScreen, EditBallScreen } from './screens/AddBallScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { PatternsScreen } from './screens/PatternsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LeagueScreen } from './screens/LeagueScreen'
import { StatsScreen } from './screens/StatsScreen'
import { NightsScreen } from './screens/NightsScreen'
import { NightDetailScreen } from './screens/NightDetailScreen'

// Wraps every route, Sign in included.
function AppShell() {
  // Restores the saved sign-in. Supabase keeps it in localStorage, so this
  // works with no signal; RequireAuth waits on it before deciding anything.
  const init = useAuthStore((s) => s.init)
  useEffect(() => init(), [init])
  // Background backup and sync. It watches for changes and runs on its own.
  useEffect(() => startSync(), [])

  return <Outlet />
}

// Signed out, there is nothing to show but the Sign in screen: no app, no nav.
// The one exception is a build with no Supabase keys, where signing in is
// impossible; gating there would leave a dead app, so it stays open.
function RequireAuth() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const location = useLocation()

  // Still reading the saved sign-in. Render nothing rather than flashing the
  // Sign in screen and throwing away where the person was heading.
  if (loading) return null
  if (!session && supabaseConfigured) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

// The navigation shell: sidebar on wide screens, tab bar on phones.
// Sign in sits outside it, so that screen shows no navigation at all.
function Layout() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      {/* Bottom padding clears the phone's bottom bar; the side padding keeps content out of notches. */}
      <main className="min-w-0 flex-1 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(5rem+env(safe-area-inset-bottom))] pl-4 md:pt-8 md:pr-[max(2rem,env(safe-area-inset-right))] md:pb-8 md:pl-8 short:pt-3! short:pb-3! short:pl-4!">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: '/', element: <HomeScreen /> },
              { path: '/score', element: <ScoreScreen /> },
              { path: '/side-pots', element: <SidePotsScreen /> },
              { path: '/nights', element: <NightsScreen /> },
              { path: '/nights/:sessionId', element: <NightDetailScreen /> },
              { path: '/leagues/:leagueKey', element: <LeagueScreen /> },
              { path: '/stats', element: <StatsScreen /> },
              { path: '/arsenal', element: <ArsenalScreen /> },
              { path: '/arsenal/new', element: <AddBallScreen /> },
              { path: '/arsenal/:ballId', element: <EditBallScreen /> },
              { path: '/patterns', element: <PatternsScreen /> },
              { path: '/profile', element: <ProfileScreen /> },
            ],
          },
        ],
      },
      { path: '/login', element: <LoginScreen /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
