import type { FunctionComponent, ReactNode } from 'react'

import { assertType, describe, expectTypeOf, test } from 'vitest'

import { compose, providers, when } from '../src'
import type { ProviderComponent } from '../src'
import {
  ConfigProvider,
  CountProvider,
  ThemeProvider,
  UserProvider,
} from './helpers'

describe('providers type inference', () => {
  test('returns ProviderComponent', () => {
    const result = providers()
    expectTypeOf(result).toExtend<ProviderComponent>()
  })

  test('add returns ProviderComponent for chaining', () => {
    const result = providers().add(ConfigProvider)
    expectTypeOf(result).toExtend<ProviderComponent>()
  })

  test('add is callable as a function component', () => {
    const Providers = providers().add(ConfigProvider)
    expectTypeOf(Providers).toBeCallableWith({ children: null as ReactNode })
  })

  describe('required props', () => {
    test('requires props argument for components with required props', () => {
      providers().add(ThemeProvider, { theme: 'dark' })
      providers().add(UserProvider, { user: { name: 'Alice' } })

      // @ts-expect-error missing required props argument
      providers().add(ThemeProvider)

      // @ts-expect-error missing required props argument
      providers().add(UserProvider)
    })

    test('rejects incorrect prop types', () => {
      // @ts-expect-error theme must be string
      providers().add(ThemeProvider, { theme: 123 })

      // @ts-expect-error user must have name property
      providers().add(UserProvider, { user: {} })

      // @ts-expect-error user.name must be string
      providers().add(UserProvider, { user: { name: 42 } })
    })

    test('rejects extra props', () => {
      // @ts-expect-error unknown property
      providers().add(ThemeProvider, { theme: 'dark', extra: true })
    })
  })

  describe('optional props', () => {
    test('allows omitting props for components with all optional props', () => {
      providers().add(ConfigProvider)
      providers().add(CountProvider)
    })

    test('allows providing optional props', () => {
      providers().add(CountProvider, { initial: 10 })
    })

    test('rejects incorrect optional prop types', () => {
      // @ts-expect-error initial must be number
      providers().add(CountProvider, { initial: 'ten' })
    })
  })

  describe('tuple entries', () => {
    test('accepts tuple with component and props', () => {
      providers().add([ThemeProvider, { theme: 'dark' }])
      providers().add([UserProvider, { user: { name: 'Bob' } }])
    })

    test('rejects tuple with incorrect props', () => {
      // @ts-expect-error theme must be string
      providers().add([ThemeProvider, { theme: 123 }])
    })

    test('accepts null tuple entry', () => {
      providers().add(null)
    })
  })

  describe('chaining', () => {
    test('allows chaining multiple adds', () => {
      const result = providers()
        .add(ThemeProvider, { theme: 'dark' })
        .add(ConfigProvider)
        .add(UserProvider, { user: { name: 'Alice' } })
        .add(CountProvider, { initial: 5 })

      expectTypeOf(result).toExtend<ProviderComponent>()
    })
  })
})

describe('when type inference', () => {
  test('returns tuple or null', () => {
    const result = when(true, ThemeProvider, { theme: 'dark' })
    expectTypeOf(result).toEqualTypeOf<[typeof ThemeProvider, { theme: string }] | null>()
  })

  test('requires props for components with required props', () => {
    when(true, ThemeProvider, { theme: 'dark' })

    // @ts-expect-error missing required props
    when(true, ThemeProvider)

    // @ts-expect-error missing required props
    when(true, UserProvider)
  })

  test('allows omitting props for components with optional props', () => {
    when(true, ConfigProvider)
    when(false, CountProvider)
  })

  test('rejects incorrect prop types', () => {
    // @ts-expect-error theme must be string
    when(true, ThemeProvider, { theme: 42 })

    // @ts-expect-error initial must be number
    when(true, CountProvider, { initial: 'wrong' })
  })

  test('condition must be boolean', () => {
    when(true, ConfigProvider)
    when(false, ConfigProvider)

    // @ts-expect-error condition must be boolean
    when('true', ConfigProvider)

    // @ts-expect-error condition must be boolean
    when(1, ConfigProvider)

    // @ts-expect-error condition must be boolean
    when(null, ConfigProvider)
  })
})

describe('compose type inference', () => {
  test('returns ProviderComponent', () => {
    const result = compose(ConfigProvider)
    expectTypeOf(result).toExtend<ProviderComponent>()
  })

  test('accepts components without required props', () => {
    compose(ConfigProvider)
    compose(ConfigProvider, CountProvider)
  })

  test('requires tuple for components with required props', () => {
    compose([ThemeProvider, { theme: 'dark' }])
    compose([UserProvider, { user: { name: 'Alice' } }])

    // @ts-expect-error ThemeProvider requires props, must be tuple
    compose(ThemeProvider)

    // @ts-expect-error UserProvider requires props, must be tuple
    compose(UserProvider)
  })

  test('accepts mixed entries', () => {
    compose(
      [ThemeProvider, { theme: 'dark' }],
      ConfigProvider,
      [UserProvider, { user: { name: 'Bob' } }],
      CountProvider,
    )
  })

  test('accepts null entries from when()', () => {
    compose(
      ConfigProvider,
      when(true, ThemeProvider, { theme: 'dark' }),
      when(false, UserProvider, { user: { name: 'Alice' } }),
      null,
    )
  })

  test('rejects incorrect tuple props', () => {
    // @ts-expect-error theme must be string
    compose([ThemeProvider, { theme: 123 }])

    // @ts-expect-error missing required user prop
    compose([UserProvider, {}])
  })
})

describe('clone type inference', () => {
  test('returns ProviderComponent', () => {
    const original = providers().add(ConfigProvider)
    const cloned = original.clone()
    expectTypeOf(cloned).toExtend<ProviderComponent>()
  })

  test('cloned provider supports add', () => {
    const cloned = providers().add(ConfigProvider).clone()
    const result = cloned.add(ThemeProvider, { theme: 'dark' })
    expectTypeOf(result).toExtend<ProviderComponent>()
  })
})

describe('wrap type inference', () => {
  test('returns FunctionComponent with same props', () => {
    function MyComponent({ name, count }: { name: string; count: number }) {
      return <span>{name}: {count}</span>
    }

    const Providers = providers().add(ConfigProvider)
    const Wrapped = Providers.wrap(MyComponent)

    expectTypeOf(Wrapped).toExtend<FunctionComponent<{ name: string; count: number }>>()
  })

  test('wrapped component requires original props', () => {
    function Greeting({ message }: { message: string }) {
      return <span>{message}</span>
    }

    const Wrapped = providers().wrap(Greeting)

    // @ts-expect-error missing message prop
    assertType(<Wrapped />)
  })

  test('wrapped component accepts correct props', () => {
    function Greeting({ message }: { message: string }) {
      return <span>{message}</span>
    }

    const Wrapped = providers().wrap(Greeting)
    assertType(<Wrapped message="hello" />)
  })

  test('preserves optional props', () => {
    function OptionalProps({ label, count = 0 }: { label?: string; count?: number }) {
      return <span>{label}: {count}</span>
    }

    const Wrapped = providers().wrap(OptionalProps)
    
    assertType(<Wrapped />)
    assertType(<Wrapped label="test" />)
    assertType(<Wrapped count={5} />)
    assertType(<Wrapped label="test" count={5} />)
  })
})

describe('ProviderComponent interface', () => {
  test('has add method', () => {
    const p = providers()
    expectTypeOf(p.add).toBeFunction()
  })

  test('has clone method', () => {
    const p = providers()
    expectTypeOf(p.clone).toBeFunction()
    expectTypeOf(p.clone()).toExtend<ProviderComponent>()
  })

  test('has wrap method', () => {
    const p = providers()
    expectTypeOf(p.wrap).toBeFunction()
  })

  test('is callable as component', () => {
    const p = providers()
    expectTypeOf(p).toBeCallableWith({ children: null as ReactNode })
  })
})

