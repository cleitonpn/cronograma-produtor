import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="evento/novo" options={{ headerShown: true, title: 'Novo Evento', headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="evento/[id]" options={{ headerShown: true, headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="projeto/novo" options={{ headerShown: true, title: 'Novo Projeto', headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="projeto/[id]" options={{ headerShown: true, headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="template/novo" options={{ headerShown: true, title: 'Novo Template', headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="template/[id]" options={{ headerShown: true, headerBackTitle: 'Voltar' }} />
      <Stack.Screen name="usuario/novo" options={{ headerShown: true, title: 'Novo Usuário', headerBackTitle: 'Voltar' }} />
    </Stack>
  );
}
