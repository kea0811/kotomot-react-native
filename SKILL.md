---
name: kotomot-react-native
description: Use when the user wants i18n in a React Native app backed by the Kotomot translation platform. Provides `<KotoProvider>` + `useTranslation()` with AsyncStorage caching, version-based revalidation, offline support, and runtime locale switching. Sibling SDKs exist for Node (`kotomot-node-sdk`), browser React (`kotomot-react`), and Flutter (`kotomot_flutter`).
---

# kotomot-react-native

React Native SDK for [Kotomot](https://kotomot.app). Provider + `useTranslation()` hook that loads translations at runtime, caches them in AsyncStorage (with version-based revalidation), and switches locale live.

## When to reach for this

User says:
- "add i18n to my React Native / Expo app"
- "translation management with offline support on mobile"
- "runtime locale switching without app restart"

For a different host environment, point them at the matching SDK:
- Server-side Node → `kotomot-node-sdk`
- Browser React → `kotomot-react`
- Flutter → `kotomot_flutter`

## Install

```bash
npm install kotomot-react-native @react-native-async-storage/async-storage
# iOS:
cd ios && pod install
```

For Expo: `npx expo install @react-native-async-storage/async-storage`.

## Quick start

```tsx
import { KotoProvider, useTranslation } from 'kotomot-react-native';
import { ActivityIndicator, Button, Text, View } from 'react-native';

export default function App() {
  return (
    <KotoProvider
      apiKey={process.env.KOTOMOT_API_KEY!}   // generate in the dashboard
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

| Prop | Required | Notes |
|---|---|---|
| `apiKey` | ✓ | Generate in the dashboard. Read-scoped. |
| `projectId` | ✓ | Project slug or ID. |
| `defaultLocale` | ✓ | Locale to use on first launch. |
| `apiUrl` | — | Defaults to `https://api.kotomot.app`. |
| `namespace` | — | Limit to one namespace. |
| `environment` | — | Pin to a published environment. |

## `useTranslation()` returns

| Field | Notes |
|---|---|
| `t(key, fallback?)` | Resolve a flat key path. |
| `ti(key, vars)` | Interpolate `{name}` placeholders. |
| `locale` | Current active locale. |
| `setLocale(code)` | Activate a new locale; persists to AsyncStorage. |
| `loading` | True during initial fetch + locale switches. |
| `availableLocales` | List of supported locale codes. |

## Gotchas worth knowing

1. **AsyncStorage is required.** Install `@react-native-async-storage/async-storage` AND link/pod-install for iOS. Without it the SDK can't cache — it'll still work online but every launch re-fetches.
2. **Cache-first.** On launch, the SDK reads the last-good locale from AsyncStorage and renders instantly, then revalidates in the background. So first paint is offline-safe.
3. **Reads come from the PUBLISHED set.** Use `environment: 'production'` to pin if you want predictability across versions.
4. **`apiKey` is bundled into the app.** Use a read-scoped key. Rotate from the dashboard if leaked.
5. **`setLocale` returns a Promise** — await it if you need to chain a screen transition, but most UI flows just await the next render.
6. **Expo Go vs bare RN**: works in both. With Expo, use `npx expo install` so the native module matches the runtime SDK.

## Links

- npm: https://www.npmjs.com/package/kotomot-react-native
- platform: https://kotomot.app
- repo: https://github.com/kea0811/kotomot-react-native
- sibling SDKs:
  - `kotomot-node-sdk` (server-side Node)
  - `kotomot-react` (browser React)
  - `kotomot_flutter`
