import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';
import { Slot, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === 'login';
    const inAdmin = segments[0] === '(admin)';
    const inProdutor = segments[0] === '(produtor)';

    if (!session) {
      if (!inAuth) router.replace('/login');
    } else if (profile) {
      if (profile.role === 'admin' && !inAdmin) {
        router.replace('/(admin)/(tabs)/' as any);
      } else if (profile.role === 'produtor' && !inProdutor) {
        router.replace('/(produtor)/(tabs)/' as any);
      }
    }
  }, [session, profile, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <RootRedirect />
      </PaperProvider>
    </AuthProvider>
  );
}
