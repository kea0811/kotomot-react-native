# Koto React Native SDK

A React Native SDK for integrating with the Koto Translation API, providing persistent API key storage using AsyncStorage and seamless translation management for mobile applications.

## Installation

```bash
npm install @koto-react-native/core @react-native-async-storage/async-storage
# or
yarn add @koto-react-native/core @react-native-async-storage/async-storage
```

### iOS Setup
```bash
cd ios && pod install
```

### Android Setup
For React Native 0.60+, autolinking handles the setup automatically.

## Basic Setup

### 1. Provider Configuration

Wrap your app with the `KotoProvider`:

```tsx
import React from 'react';
import { KotoProvider } from '@koto-react-native/core';
import { MainApp } from './MainApp';

export default function App() {
  return (
    <KotoProvider
      config={{
        baseUrl: 'https://api.your-koto-instance.com'
      }}
    >
      <MainApp />
    </KotoProvider>
  );
}
```

### 2. Authentication Setup

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert
} from 'react-native';
import { useKoto } from '@koto-react-native/core';

export function AuthScreen() {
  const { apiKey, setApiKey, removeApiKey, isAuthenticated } = useKoto();
  const [inputKey, setInputKey] = useState('');

  const handleSetKey = async () => {
    try {
      await setApiKey(inputKey);
      Alert.alert('Success', 'API key saved');
      setInputKey('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  return (
    <View style={styles.container}>
      {!isAuthenticated ? (
        <>
          <Text style={styles.label}>Enter API Key:</Text>
          <TextInput
            style={styles.input}
            value={inputKey}
            onChangeText={setInputKey}
            placeholder="hms_xxxxx"
            secureTextEntry
            autoCapitalize="none"
          />
          <Button title="Authenticate" onPress={handleSetKey} />
        </>
      ) : (
        <>
          <Text style={styles.successText}>Authenticated ✓</Text>
          <Button
            title="Logout"
            onPress={removeApiKey}
            color="red"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  successText: {
    fontSize: 18,
    color: 'green',
    marginBottom: 16,
  },
});
```

## Working with Translations

### Fetching Translations

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useKoto } from '@koto-react-native/core';

export function TranslationsList() {
  const { makeRequest, isAuthenticated } = useKoto();
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTranslations();
    }
  }, [isAuthenticated]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        '/api/v1/translations?projectId=YOUR_PROJECT_ID&locale=en'
      );
      setTranslations(response.translations);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView>
      {translations && Object.entries(translations).map(([key, value]) => (
        <View key={key} style={{ padding: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>{key}</Text>
          <Text>{JSON.stringify(value)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

### Updating Translations

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert
} from 'react-native';
import { useKoto } from '@koto-react-native/core';

export function TranslationEditor({ keyPath, currentValue, locale }) {
  const { makeRequest } = useKoto();
  const [translation, setTranslation] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await makeRequest('/api/v1/translations/update', {
        method: 'PUT',
        body: JSON.stringify({
          projectId: 'YOUR_PROJECT_ID',
          keyPath,
          locale,
          translation
        })
      });
      Alert.alert('Success', 'Translation updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update translation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 8 }}>Key: {keyPath}</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 16,
          minHeight: 80
        }}
        value={translation}
        onChangeText={setTranslation}
        multiline
      />
      <Button
        title={saving ? 'Saving...' : 'Save'}
        onPress={handleSave}
        disabled={saving}
      />
    </View>
  );
}
```

### Batch Updates

```tsx
const batchUpdate = async () => {
  const { makeRequest } = useKoto();

  try {
    await makeRequest('/api/v1/translations', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'YOUR_PROJECT_ID',
        locale: 'fr',
        translations: {
          common: {
            welcome: 'Bienvenue',
            goodbye: 'Au revoir'
          },
          auth: {
            login: 'Connexion',
            logout: 'Déconnexion'
          }
        }
      })
    });
    Alert.alert('Success', 'Translations updated');
  } catch (error) {
    Alert.alert('Error', 'Failed to update translations');
  }
};
```

## API Reference

### KotoProvider

The main provider component that wraps your application.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Your app components |
| `config` | `KotoConfig` | No | Configuration options |

#### KotoConfig

```typescript
interface KotoConfig {
  baseUrl?: string;      // API base URL (default: 'https://api.koto.dev')
  headers?: Record<string, string>;  // Additional headers
  timeout?: number;      // Request timeout in ms
}
```

### useKoto Hook

Returns the Koto context with methods and state.

```typescript
const {
  // State
  apiKey,           // string | null - Current API key
  baseUrl,          // string - Current base URL
  isLoading,        // boolean - Loading state
  error,            // string | null - Error message
  isAuthenticated,  // boolean - Auth status

  // Methods
  setApiKey,        // (key: string) => Promise<void>
  removeApiKey,     // () => Promise<void>
  setBaseUrl,       // (url: string) => void
  makeRequest,      // <T>(endpoint: string, options?: RequestInit) => Promise<T>
} = useKoto();
```

## Features

- **Persistent Storage**: API keys are stored securely in AsyncStorage
- **React Native Optimized**: Built specifically for iOS and Android
- **Automatic Persistence**: Settings persist across app sessions
- **TypeScript Support**: Full type definitions included
- **Simple API**: Easy-to-use hooks and context pattern
- **Lightweight**: Minimal dependencies

## Advanced Usage

### Custom Headers

```tsx
<KotoProvider
  config={{
    baseUrl: 'https://api.koto.dev',
    headers: {
      'X-Custom-Header': 'value',
      'X-App-Version': '1.0.0'
    }
  }}
>
  <App />
</KotoProvider>
```

### Error Handling

```tsx
function TranslationComponent() {
  const { makeRequest, error } = useKoto();

  const fetchData = async () => {
    try {
      const data = await makeRequest('/api/v1/translations');
      // Handle success
    } catch (err) {
      if (err.message.includes('401')) {
        // Handle authentication error
      } else if (err.message.includes('network')) {
        // Handle network error
      } else {
        // Handle other errors
      }
    }
  };

  // Display context-level errors
  if (error) {
    return <Text>Error: {error}</Text>;
  }
}
```

### Loading States

```tsx
function AppContent() {
  const { isLoading, isAuthenticated } = useKoto();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading saved credentials...</Text>
      </View>
    );
  }

  return isAuthenticated ? <MainApp /> : <AuthScreen />;
}
```

## Platform Differences from React Web SDK

| Feature | React Web | React Native |
|---------|-----------|--------------|
| Storage | IndexedDB | AsyncStorage |
| UI | DOM elements | Native components |
| Package | `@koto-react/` | `@koto-react-native/core` |
| Platform | Web browsers | iOS & Android |
| Setup | None | Pod install for iOS |

## Best Practices

1. **API Key Security**
   - Never hardcode API keys in your source code
   - Use environment variables for default configurations
   - Store keys securely using AsyncStorage

2. **Error Handling**
   - Always wrap API calls in try-catch blocks
   - Provide user-friendly error messages
   - Implement retry logic for network failures

3. **Performance**
   - Cache frequently used translations locally
   - Batch translation updates when possible
   - Use loading states for better UX

4. **Testing**
   ```typescript
   // Mock AsyncStorage in tests
   jest.mock('@react-native-async-storage/async-storage', () => ({
     getItem: jest.fn(),
     setItem: jest.fn(),
     removeItem: jest.fn(),
   }));
   ```

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0 (Hooks support)
- @react-native-async-storage/async-storage >= 1.0.0

## Troubleshooting

### AsyncStorage not working
- Ensure `@react-native-async-storage/async-storage` is properly installed
- Run `pod install` in the iOS directory
- Rebuild the app after installation

### API key not persisting
- Check that AsyncStorage has proper permissions
- Verify the storage key format is correct
- Ensure the app isn't clearing storage on launch

### Network requests failing
- Verify the base URL is correct and accessible
- Check that the device has network connectivity
- Ensure proper network permissions in app config

## License

MIT