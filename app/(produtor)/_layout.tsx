import { Stack } from 'expo-router';

export default function ProdutorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="projeto/[id]"
        options={{
          headerShown: true,
          headerBackTitle: 'Projetos',
          headerStyle: { backgroundColor: '#1565C0' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack>
  );
}
