import type { ReactNode } from 'react'

import { describe, expect, test, vi } from 'vitest'

/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react'

import { providers, when } from '../src'
import {
  ConditionalThrowingProvider,
  ConfigProvider,
  CountProvider,
  ErrorBoundary,
  TestConsumer,
  ThemeProvider,
  ThrowingProvider,
  UserProvider,
} from './helpers'

describe('providers', () => {
  test('composes a single provider', () => {
    const Providers = providers().add(ThemeProvider, { theme: 'dark' })

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  test('composes multiple providers', () => {
    const Providers = providers()
      .add(ThemeProvider, { theme: 'light' })
      .add(UserProvider, { user: { name: 'Alice' } })

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('user')).toHaveTextContent('Alice')
  })

  test('handles provider with optional props', () => {
    const Providers = providers().add(ConfigProvider)

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('config')).toHaveTextContent('false')
  })

  test('combines required and optional prop providers', () => {
    const Providers = providers()
      .add(ThemeProvider, { theme: 'dark' })
      .add(ConfigProvider)
      .add(UserProvider, { user: { name: 'Bob' } })

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('user')).toHaveTextContent('Bob')
    expect(screen.getByTestId('config')).toHaveTextContent('false')
  })

  test('first added provider wraps outermost', () => {
    const order: string[] = []

    function OuterProvider({ children }: { children: ReactNode }) {
      order.push('outer')
      return <>{children}</>
    }

    function InnerProvider({ children }: { children: ReactNode }) {
      order.push('inner')
      return <>{children}</>
    }

    const Providers = providers().add(OuterProvider).add(InnerProvider)

    render(
      <Providers>
        <div>content</div>
      </Providers>,
    )

    expect(order).toEqual(['outer', 'inner'])
  })

  test('handles optional props with explicit value', () => {
    const Providers = providers().add(CountProvider, { initial: 99 })

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('count')).toHaveTextContent('99')
  })

  test('handles optional props with no value', () => {
    const Providers = providers().add(CountProvider)

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  test('returns chainable builder', () => {
    const builder = providers()
    const result = builder.add(ConfigProvider)

    expect(result).toBe(builder)
  })

  test('renders children when no providers added', () => {
    const Providers = providers()

    render(
      <Providers>
        <span data-testid="child">hello</span>
      </Providers>,
    )

    expect(screen.getByTestId('child')).toHaveTextContent('hello')
  })

  describe('when', () => {
    test('adds provider when condition is true', () => {
      const Providers = providers()
        .add(when(true, ThemeProvider, { theme: 'dark' }))

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    test('skips provider when condition is false', () => {
      const Providers = providers()
        .add(when(false, ThemeProvider, { theme: 'dark' }))

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('')
    })

    test('works with providers without props', () => {
      const Providers = providers()
        .add(when(true, ConfigProvider))

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('config')).toHaveTextContent('false')
    })

    test('can mix conditional and unconditional providers', () => {
      const isDev = true
      const hasUser = false

      const Providers = providers()
        .add(ThemeProvider, { theme: 'dark' })
        .add(when(isDev, ConfigProvider))
        .add(when(hasUser, UserProvider, { user: { name: 'Test' } }))

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('config')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('none')
    })
  })

  describe('clone', () => {
    test('creates independent copy', () => {
      const Base = providers().add(ThemeProvider, { theme: 'dark' })
      const Cloned = Base.clone().add(ConfigProvider)

      render(
        <Cloned>
          <TestConsumer />
        </Cloned>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('config')).toHaveTextContent('false')
    })

    test('original is not affected by clone modifications', () => {
      const Base = providers().add(ThemeProvider, { theme: 'dark' })
      Base.clone().add(UserProvider, { user: { name: 'Clone' } })

      render(
        <Base>
          <TestConsumer />
        </Base>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('user')).toHaveTextContent('none')
    })
  })

  describe('wrap', () => {
    test('wraps component with providers', () => {
      const Providers = providers().add(ThemeProvider, { theme: 'dark' })
      const WrappedConsumer = Providers.wrap(TestConsumer)

      render(<WrappedConsumer />)

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    test('passes props through to wrapped component', () => {
      function Greeting({ name }: { name: string }) {
        return <span data-testid="greeting">Hello, {name}</span>
      }

      const Providers = providers().add(ThemeProvider, { theme: 'dark' })
      const WrappedGreeting = Providers.wrap(Greeting)

      render(<WrappedGreeting name="World" />)

      expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, World')
    })
  })

  describe('error handling', () => {
    test('throws when a provider throws', () => {
      const Providers = providers().add(ThrowingProvider)

      expect(() => {
        render(
          <Providers>
            <div>content</div>
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')
    })

    test('throws when a provider in the chain throws', () => {
      const Providers = providers()
        .add(ThemeProvider, { theme: 'dark' })
        .add(ThrowingProvider)
        .add(ConfigProvider)

      expect(() => {
        render(
          <Providers>
            <TestConsumer />
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')
    })

    test('error can be caught by error boundary', () => {
      const onError = vi.fn()
      const Providers = providers().add(ThrowingProvider)

      render(
        <ErrorBoundary fallback={<span data-testid="error">caught</span>} onError={onError}>
          <Providers>
            <TestConsumer />
          </Providers>
        </ErrorBoundary>,
      )

      expect(screen.getByTestId('error')).toHaveTextContent('caught')
      expect(onError).toHaveBeenCalledTimes(1)
    })

    test('conditional throwing provider works when not throwing', () => {
      const Providers = providers()
        .add(ConditionalThrowingProvider, { shouldThrow: false })

      render(
        <Providers>
          <span data-testid="child">success</span>
        </Providers>,
      )

      expect(screen.getByTestId('child')).toHaveTextContent('success')
    })

    test('conditional throwing provider throws when configured', () => {
      const Providers = providers()
        .add(ConditionalThrowingProvider, { shouldThrow: true })

      expect(() => {
        render(
          <Providers>
            <span>content</span>
          </Providers>,
        )
      }).toThrow('ConditionalThrowingProvider error')
    })

    test('providers before throwing provider still execute', () => {
      const executed: string[] = []

      function TrackingProvider({ children }: { children: ReactNode }) {
        executed.push('tracking')
        return <>{children}</>
      }

      const Providers = providers().add(TrackingProvider).add(ThrowingProvider)

      expect(() => {
        render(
          <Providers>
            <div>content</div>
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')

      expect(executed).toContain('tracking')
    })

    test('providers after throwing provider do not execute', () => {
      const executed: string[] = []

      function TrackingProvider({ children }: { children: ReactNode }) {
        executed.push('tracking')
        return <>{children}</>
      }

      const Providers = providers().add(ThrowingProvider).add(TrackingProvider)

      expect(() => {
        render(
          <Providers>
            <div>content</div>
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')

      expect(executed).not.toContain('tracking')
    })
  })
})
