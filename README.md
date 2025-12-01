# mise

compose react context providers with ease. _mise en place_ for your react app.

## install

```bash
npm install @karol-broda/mise
```

## usage

```tsx
import { compose } from "@karol-broda/mise";

const Providers = compose(
  [ThemeProvider, { theme: "dark" }],
  [AuthProvider, { user }],
  [QueryClientProvider, { client: queryClient }],
  ToastProvider, // no props? just pass the component
);

function App() {
  return (
    <Providers>
      <MyApp />
    </Providers>
  );
}
```

instead of:

```tsx
function App() {
  return (
    <ThemeProvider theme="dark">
      <AuthProvider user={user}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <MyApp />
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

## builder api

for a fluent builder pattern:

```tsx
import { providers } from "@karol-broda/mise";

const Providers = providers()
  .add(ThemeProvider, { theme: "dark" })
  .add(AuthProvider, { user })
  .add(ToastProvider);

// use directly - no .build() needed
<Providers>
  <App />
</Providers>
```

## conditional providers

use `when` to conditionally include providers:

```tsx
import { providers, when } from "@karol-broda/mise";

const Providers = providers()
  .add(ThemeProvider, { theme: "dark" })
  .add(when(isDev, DevToolsProvider))
  .add(when(user !== null, AuthProvider, { user }));
```

or with `compose`:

```tsx
import { compose, when } from "@karol-broda/mise";

const Providers = compose(
  [ThemeProvider, { theme: "dark" }],
  when(isDev, DevToolsProvider),
  when(user !== null, AuthProvider, { user }),
);
```

## clone & extend

create variations of provider trees:

```tsx
const base = providers()
  .add(ThemeProvider, { theme: "dark" })
  .add(I18nProvider, { locale: "en" });

const AdminProviders = base.clone().add(AdminToolsProvider);
const UserProviders = base.clone().add(UserProvider, { user });
```

## wrap

wrap any component with providers:

```tsx
const Providers = providers()
  .add(ThemeProvider, { theme: "dark" })
  .add(QueryClientProvider, { client });

const WrappedApp = Providers.wrap(App);

// equivalent to:
// <Providers><App /></Providers>
```

## type safety

props are fully typed. required props must be provided, optional props can be omitted:

```tsx
// required props - must provide second argument
compose([ThemeProvider, { theme: "dark" }]);

// optional props - just pass the component
compose(ToastProvider);
```

## development

```bash
# install dependencies
bun install

# run tests
bun run test

# check formatting
bun run format

# format files
bun run format:write

# build
bun run build

# typecheck
bun run typecheck
```

## license

MIT
