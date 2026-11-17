import { Component, type ErrorInfo, type ReactNode } from 'react'
import { primaryButton } from './styles'

// Last line of defence. Without this, one thrown error unmounts the whole app
// and leaves a blank dark page with nothing to read and nothing to tap.
export class AppError extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.message === null) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display text-xl">Something went wrong</h1>
        <p className="text-sm text-muted">
          Your scores are still saved on this device. Reloading usually clears it.
        </p>
        <button type="button" onClick={() => window.location.reload()} className={primaryButton}>
          Reload
        </button>
        <p className="num max-w-sm text-xs break-words text-muted/70">{this.state.message}</p>
      </div>
    )
  }
}
