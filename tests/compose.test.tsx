import type { ReactNode } from 'react'

import { describe, expect, test, vi } from 'vitest'

/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react'

import { compose, when } from '../src'
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

describe('compose', () => {
  test('composes a single provider with props', () => {
    const Providers = compose([ThemeProvider, { theme: 'dark' }])

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  test('composes multiple providers', () => {
    const Providers = compose(
      [ThemeProvider, { theme: 'light' }],
      [UserProvider, { user: { name: 'Alice' } }],
    )

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('user')).toHaveTextContent('Alice')
  })

  test('accepts component without props', () => {
    const Providers = compose(ConfigProvider)

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('config')).toHaveTextContent('false')
  })

  test('mixes tuples and bare components', () => {
    const Providers = compose([ThemeProvider, { theme: 'dark' }], ConfigProvider, [
      UserProvider,
      { user: { name: 'Bob' } },
    ])

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('user')).toHaveTextContent('Bob')
    expect(screen.getByTestId('config')).toHaveTextContent('false')
  })

  test('first provider wraps outermost', () => {
    const order: string[] = []

    function OuterProvider({ children }: { children: ReactNode }) {
      order.push('outer')
      return <>{children}</>
    }

    function InnerProvider({ children }: { children: ReactNode }) {
      order.push('inner')
      return <>{children}</>
    }

    const Providers = compose(OuterProvider, InnerProvider)

    render(
      <Providers>
        <div>content</div>
      </Providers>,
    )

    expect(order).toEqual(['outer', 'inner'])
  })

  test('handles provider with optional props using tuple', () => {
    const Providers = compose([CountProvider, { initial: 42 }])

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('count')).toHaveTextContent('42')
  })

  test('handles provider with optional props using bare component', () => {
    const Providers = compose(CountProvider)

    render(
      <Providers>
        <TestConsumer />
      </Providers>,
    )

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  test('renders children directly when no providers given', () => {
    const Providers = compose()

    render(
      <Providers>
        <span data-testid="child">hello</span>
      </Providers>,
    )

    expect(screen.getByTestId('child')).toHaveTextContent('hello')
  })

  test('composes many providers', () => {
    const values: number[] = []

    function createNumberProvider(n: number) {
      return function NumberProvider({ children }: { children: ReactNode }) {
        values.push(n)
        return <>{children}</>
      }
    }

    const Providers = compose(
      createNumberProvider(1),
      createNumberProvider(2),
      createNumberProvider(3),
      createNumberProvider(4),
      createNumberProvider(5),
    )

    render(
      <Providers>
        <div>content</div>
      </Providers>,
    )

    expect(values).toEqual([1, 2, 3, 4, 5])
  })

  describe('when', () => {
    test('includes provider when condition is true', () => {
      const Providers = compose(
        [ThemeProvider, { theme: 'dark' }],
        when(true, ConfigProvider),
      )

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('config')).toHaveTextContent('false')
    })

    test('skips provider when condition is false', () => {
      const Providers = compose(
        [ThemeProvider, { theme: 'dark' }],
        when(false, ConfigProvider),
      )

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('config')).toHaveTextContent('none')
    })

    test('works with provider that has required props', () => {
      const Providers = compose(
        when(true, ThemeProvider, { theme: 'conditional' }),
      )

      render(
        <Providers>
          <TestConsumer />
        </Providers>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('conditional')
    })
  })

  describe('clone', () => {
    test('creates independent copy from compose result', () => {
      const Base = compose([ThemeProvider, { theme: 'dark' }])
      const Extended = Base.clone().add(ConfigProvider)

      render(
        <Extended>
          <TestConsumer />
        </Extended>,
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('config')).toHaveTextContent('false')
    })
  })

  describe('wrap', () => {
    test('wraps component with compose result', () => {
      const Providers = compose([ThemeProvider, { theme: 'dark' }])
      const WrappedConsumer = Providers.wrap(TestConsumer)

      render(<WrappedConsumer />)

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })
  })

  describe('error handling', () => {
    test('throws when a provider throws', () => {
      const Providers = compose(ThrowingProvider)

      expect(() => {
        render(
          <Providers>
            <div>content</div>
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')
    })

    test('throws when a provider in the middle throws', () => {
      const Providers = compose(
        [ThemeProvider, { theme: 'dark' }],
        ThrowingProvider,
        ConfigProvider,
      )

      expect(() => {
        render(
          <Providers>
            <TestConsumer />
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')
    })

    test('throws when the first provider throws', () => {
      const Providers = compose(ThrowingProvider, ConfigProvider)

      expect(() => {
        render(
          <Providers>
            <TestConsumer />
          </Providers>,
        )
      }).toThrow('ThrowingProvider error')
    })

    test('throws when the last provider throws', () => {
      const Providers = compose(ConfigProvider, ThrowingProvider)

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
      const Providers = compose(ThrowingProvider)

      render(
        <ErrorBoundary fallback={<span data-testid="error">caught</span>} onError={onError}>
          <Providers>
            <TestConsumer />
          </Providers>
        </ErrorBoundary>,
      )

      expect(screen.getByTestId('error')).toHaveTextContent('caught')
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    test('conditional throwing provider works when not throwing', () => {
      const Providers = compose([ConditionalThrowingProvider, { shouldThrow: false }])

      render(
        <Providers>
          <span data-testid="child">success</span>
        </Providers>,
      )

      expect(screen.getByTestId('child')).toHaveTextContent('success')
    })

    test('conditional throwing provider throws when configured', () => {
      const Providers = compose([ConditionalThrowingProvider, { shouldThrow: true }])

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

      const Providers = compose(TrackingProvider, ThrowingProvider)

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

      const Providers = compose(ThrowingProvider, TrackingProvider)

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
