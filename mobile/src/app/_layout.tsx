import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerBackTitle: 'Voltar',
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000000' : '#F2F2F7',
          },
        }}>
        <Stack.Screen name="index" options={{ title: 'Chef Familiar' }} />
        <Stack.Screen name="inventory" options={{ title: 'Inventário' }} />
        <Stack.Screen name="recipes" options={{ title: 'Receitas' }} />
        <Stack.Screen name="planner" options={{ title: 'Plano' }} />
        <Stack.Screen name="shopping" options={{ title: 'Compras' }} />
        <Stack.Screen name="rules" options={{ title: 'Regras' }} />
      </Stack>
    </ThemeProvider>
  );
}
