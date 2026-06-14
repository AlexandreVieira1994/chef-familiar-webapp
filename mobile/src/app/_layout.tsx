import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        headerShadowVisible: false,
        headerBackTitle: '',
        headerTitle: '',
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#F2F2F7',
        },
      }}>
      <Stack.Screen name="index" options={{ title: 'Chef Familiar' }} />
      <Stack.Screen name="inventory" options={{ title: 'Inventário' }} />
      <Stack.Screen name="recipes" options={{ title: 'Receitas' }} />
      <Stack.Screen name="recipes/[id]" options={{ title: 'Detalhe da receita' }} />
      <Stack.Screen name="planner" options={{ title: 'Plano' }} />
      <Stack.Screen name="shopping" options={{ title: 'Compras' }} />
      <Stack.Screen name="rules" options={{ title: 'Regras' }} />
    </Stack>
    </GestureHandlerRootView>
  );
}
