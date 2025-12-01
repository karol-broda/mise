import type { ReactNode } from 'react'

import { Component, createContext, useContext } from 'react'

export const ThemeContext = createContext<string | null>(null)
export const UserContext = createContext<{ name: string } | null>(null)
export const ConfigContext = createContext<{ debug: boolean } | null>(null)
export const CountContext = createContext<number>(0)

export function ThemeProvider({ theme, children }: { theme: string; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function UserProvider({ user, children }: { user: { name: string }; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  return <ConfigContext.Provider value={{ debug: false }}>{children}</ConfigContext.Provider>
}

export function CountProvider({
  initial = 0,
  children,
}: {
  initial?: number
  children: ReactNode
}) {
  return <CountContext.Provider value={initial}>{children}</CountContext.Provider>
}

export function TestConsumer() {
  const theme = useContext(ThemeContext)
  const user = useContext(UserContext)
  const config = useContext(ConfigContext)
  const count = useContext(CountContext)
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="user">{user !== null ? user.name : 'none'}</span>
      <span data-testid="config">{config !== null ? String(config.debug) : 'none'}</span>
      <span data-testid="count">{count}</span>
    </div>
  )
}

export function ThrowingProvider({ children: _ }: { children: ReactNode }): ReactNode {
  throw new Error('ThrowingProvider error')
}

export function ConditionalThrowingProvider({
  shouldThrow,
  children,
}: {
  shouldThrow: boolean
  children: ReactNode
}) {
  if (shouldThrow) {
    throw new Error('ConditionalThrowingProvider error')
  }
  return <>{children}</>
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error): void {
    if (this.props.onError !== undefined && this.props.onError !== null) {
      this.props.onError(error)
    }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
