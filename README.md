# kotomot-react-native

React Native SDK for [Kotomot](https://kotomot.app). A provider + `useTranslation()` hook that loads translations at runtime, caches them in AsyncStorage (with version-based revalidation), and switches locale live.

## Install

```bash
npm install kotomot-react-native @react-native-async-storage/async-storage
# iOS:
cd ios && pod install
```

## Quick start

```tsx
import { KotoProvider, useTranslation } from 'kotomot-react-native';

export default function App() {
  return (
    <KotoProvider
      apiKey={process.env.KOTOMOT_API_KEY!} // generated in the dashboard
      projectId="your-project"
      defaultLocale="en"
    >
      <Home />
    </KotoProvider>
  );
}

function Home() {
  const { t, ti, locale, setLocale, loading } = useTranslation();
  if (loading) return <ActivityIndicator />;
  return (
    <View>
      <Text>{t('home.hero.title')}</Text>
      <Text>{ti('home.greeting', { name: 'Jane' })}</Text>
      <Button title="日本語" onPress={() => setLocale('ja')} />
    </View>
  );
}
```

## `<KotoProvider>` props

| Prop | Type | | |
|---|---|---|---|
| `apiKey` | `string` | **required** | dashboard key |
| `projectId` | `string` | **required** | slug or ID |
| `defaultLocale` | `string` | **required** | a persisted choice overrides it |
| `apiUrl` | `string` | default `https://api.kotomot.app` | host or full endpoint |
| `namespace` | `string` | optional | filter to one namespace |

## API

`useTranslation()` → `{ t, ti, tp, locale, setLocale, loading, availableLocales, refresh }`

```ts
t(key, fallback?)                  // look up a key
ti(key, params, fallback?)         // interpolate — supports {var} and {{var}}
tp(key, count, params?)            // pluralize — key.zero / .one / .other
setLocale(code)                    // switch language (persisted)
availableLocales                   // LocaleInfo[] from /v1/locales (for a picker)
refresh()                          // re-check the published version
```

`useKoto()` returns the full context (adds `translations`, `error`, `version`).

## Caching

Translations are cached in **AsyncStorage** (one entry per locale). On load the cached bundle renders immediately, then the published version is checked and the bundle refetched only if it changed. The selected locale is persisted across launches.

MIT
