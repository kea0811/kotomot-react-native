# Koto React Native

> **Koto** (言) — Japanese for "word." Every translation starts with a single word. Koto bridges languages one word at a time.

A React Native implementation of the Koto SDK using AsyncStorage for persistent API key storage.

## Installation

```bash
npm install koto-react-native @react-native-async-storage/async-storage
```

For iOS, you'll also need to run:
```bash
cd ios && pod install
```

## Usage

### 1. Wrap your app with KotoProvider

```tsx
import React from 'react';
import { KotoProvider } from 'koto-react-native';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <KotoProvider config={{ baseUrl: 'https://api.your-service.com' }}>
      <AppContent />
    </KotoProvider>
  );
}
```

### 2. Use the useKoto hook in your components

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { useKoto } from 'koto-react-native';

export function AppContent() {
  const { 
    apiKey, 
    setApiKey, 
    removeApiKey, 
    makeRequest, 
    isLoading, 
    isAuthenticated 
  } = useKoto();
  
  const [inputKey, setInputKey] = useState('');
  const [data, setData] = useState(null);

  const handleSetKey = async () => {
    try {
      await setApiKey(inputKey);
      setInputKey('');
    } catch (error) {
      console.error('Failed to set API key:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await removeApiKey();
      setData(null);
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await makeRequest('/api/data');
      setData(response);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!isAuthenticated ? (
        <View>
          <Text>Enter your API Key:</Text>
          <TextInput
            value={inputKey}
            onChangeText={setInputKey}
            placeholder="Your API key"
            secureTextEntry
            style={{ 
              borderWidth: 1, 
              borderColor: '#ccc', 
              padding: 10, 
              marginVertical: 10 
            }}
          />
          <Button title="Set API Key" onPress={handleSetKey} />
        </View>
      ) : (
        <View>
          <Text>You are authenticated!</Text>
          <Button title="Fetch Data" onPress={fetchData} />
          <Button title="Logout" onPress={handleLogout} color="red" />
          
          {data && (
            <View style={{ marginTop: 20 }}>
              <Text>Data:</Text>
              <Text>{JSON.stringify(data, null, 2)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
```

## API Reference

### KotoProvider

The main provider component that manages the Koto context.

**Props:**
- `config` (optional): Configuration object
  - `baseUrl`: Base URL for API requests (default: 'https://api.koto.dev')
  - `headers`: Additional headers to include in requests
  - `timeout`: Request timeout in milliseconds

### useKoto Hook

Returns the Koto context with the following properties:

- `apiKey`: Current API key (string | null)
- `setApiKey(key: string)`: Set the API key (saves to AsyncStorage)
- `removeApiKey()`: Remove the API key (clears from AsyncStorage)
- `baseUrl`: Current base URL
- `setBaseUrl(url: string)`: Update the base URL
- `makeRequest<T>(endpoint: string, options?: RequestInit)`: Make authenticated API requests
- `isLoading`: Loading state for initial API key retrieval
- `error`: Error message if any
- `isAuthenticated`: Boolean indicating if user has an API key

## Features

- **Persistent Storage**: API keys are automatically saved to AsyncStorage and persist across app sessions
- **Type Safety**: Full TypeScript support with type definitions
- **React Native Optimized**: Built specifically for React Native with AsyncStorage integration
- **Simple API**: Easy to use hooks and context API
- **Secure**: API keys are stored securely in AsyncStorage

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0
- @react-native-async-storage/async-storage >= 1.0.0

## License

MIT