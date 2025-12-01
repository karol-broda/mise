import type { ComponentProps, ComponentType, FunctionComponent, ReactNode } from 'react'

type PropsOf<C extends ComponentType<any>> = Omit<ComponentProps<C>, 'children'>

type ProviderEntry<C extends ComponentType<any> = ComponentType<any>> = C | [C, PropsOf<C>]

type ProviderTuple = [ComponentType<any>, Record<string, any>]

type AsProviderEntry<T> = T extends null
  ? null
  : T extends ComponentType<any>
    ? {} extends PropsOf<T>
      ? T
      : [T, PropsOf<T>]
    : T extends [infer C extends ComponentType<any>, infer _P]
      ? [C, PropsOf<C>]
      : never

type AsProviderEntries<T extends any[]> = { [K in keyof T]: AsProviderEntry<T[K]> }

export interface ProviderComponent extends FunctionComponent<{ children: ReactNode }> {
  add<C extends ComponentType<any>>(
    Component: C,
    ...args: {} extends PropsOf<C> ? [PropsOf<C>?] : [PropsOf<C>]
  ): ProviderComponent

  add<C extends ComponentType<any>>(entry: [C, PropsOf<C>] | null): ProviderComponent

  clone(): ProviderComponent

  wrap<P extends object>(Component: ComponentType<P>): FunctionComponent<P>
}

export function providers(): ProviderComponent {
  const entries: ProviderTuple[] = []

  const Provider = ({ children }: { children: ReactNode }): ReactNode => {
    return entries.reduceRight<ReactNode>((acc, [Component, props]) => {
      return <Component {...props}>{acc}</Component>
    }, children)
  }

  Provider.add = function <C extends ComponentType<any>>(
    componentOrEntry: C | [C, PropsOf<C>] | null,
    ...args: {} extends PropsOf<C> ? [PropsOf<C>?] : [PropsOf<C>]
  ): ProviderComponent {
    if (componentOrEntry === null) {
      return Provider as ProviderComponent
    }

    if (Array.isArray(componentOrEntry)) {
      const [Component, props] = componentOrEntry
      entries.push([Component, props])
    } else {
      entries.push([componentOrEntry, args[0] || {}])
    }

    return Provider as ProviderComponent
  }

  Provider.clone = function (): ProviderComponent {
    const cloned = providers()
    for (const [Component, props] of entries) {
      cloned.add(Component, props)
    }
    return cloned
  }

  Provider.wrap = function <P extends object>(
    Component: ComponentType<P>
  ): FunctionComponent<P> {
    return function WrappedComponent(props: P): ReactNode {
      return (
        <Provider>
          <Component {...props} />
        </Provider>
      )
    }
  }

  return Provider as ProviderComponent
}

export function when<C extends ComponentType<any>>(
  condition: boolean,
  Component: C,
  ...args: {} extends PropsOf<C> ? [PropsOf<C>?] : [PropsOf<C>]
): [C, PropsOf<C>] | null {
  if (!condition) {
    return null
  }
  return [Component, (args[0] || {}) as PropsOf<C>]
}

type ComposeEntry<C extends ComponentType<any> = ComponentType<any>> =
  | ProviderEntry<C>
  | null

export function compose<T extends ComposeEntry[]>(
  ...entries: T & AsProviderEntries<T>
): ProviderComponent {
  const builder = providers()

  for (const entry of entries) {
    if (entry === null) {
      continue
    }

    if (Array.isArray(entry)) {
      const [Component, props] = entry
      builder.add(Component, props as any)
    } else {
      builder.add(entry as ComponentType<any>)
    }
  }

  return builder
}
