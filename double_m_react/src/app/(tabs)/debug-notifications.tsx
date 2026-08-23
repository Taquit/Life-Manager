import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";

export default function DebugNotificationsScreen() {
  const theme = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [capturedNotifications, setCapturedNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = async () => {
    if (Platform.OS !== 'android') {
      setPermissionStatus('not_supported');
      return;
    }
    try {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error al verificar permisos:', error);
    }
  };

  const requestPermission = () => {
    if (Platform.OS === 'android') {
      RNAndroidNotificationListener.requestPermission();
    }
  };

  const loadCapturedNotifications = async () => {
    setIsLoading(true);
    try {
      const dataStr = await AsyncStorage.getItem('@debug_notifications');
      if (dataStr) {
        setCapturedNotifications(JSON.parse(dataStr));
      } else {
        setCapturedNotifications([]);
      }
    } catch (e) {
      console.error('Error cargando notificaciones de AsyncStorage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearNotifications = async () => {
    await AsyncStorage.removeItem('@debug_notifications');
    setCapturedNotifications([]);
  };

  useEffect(() => {
    checkPermission();
    loadCapturedNotifications();
  }, []);

  const isAuthorized = permissionStatus === 'authorized';

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.headerTitle}>Debug de Notificaciones</ThemedText>

        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusText}>
            Estado del Permiso: 
            <ThemedText style={[styles.bold, { color: isAuthorized ? '#10B981' : '#EF4444' }]}>
              {` ${permissionStatus}`}
            </ThemedText>
          </ThemedText>
        </View>

        <View style={styles.actionsContainer}>
          <Pressable 
            style={({ pressed }) => [styles.actionButton, { backgroundColor: '#3B82F6' }, pressed && { opacity: 0.8 }]}
            onPress={requestPermission}
          >
            <SymbolView name={{ ios: 'lock.shield', android: 'security', web: 'security' }} size={20} tintColor="#fff" />
            <ThemedText style={styles.actionButtonText}>Permisos Nativos</ThemedText>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.actionButton, { backgroundColor: '#10B981' }, pressed && { opacity: 0.8 }]}
            onPress={loadCapturedNotifications}
          >
            <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={20} tintColor="#fff" />
            <ThemedText style={styles.actionButtonText}>Recargar JSON</ThemedText>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.actionButton, { backgroundColor: '#EF4444' }, pressed && { opacity: 0.8 }]}
            onPress={clearNotifications}
          >
            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={20} tintColor="#fff" />
            <ThemedText style={styles.actionButtonText}>Limpiar Historial</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.jsonContainer, { backgroundColor: theme.backgroundElement }]}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
          ) : capturedNotifications.length === 0 ? (
            <ScrollView style={{ padding: 20 }}>
              <ThemedText style={styles.instructionsTitle}>Pasos para probar:</ThemedText>
              <ThemedText style={styles.instructionsText}>
                1. Toca en "Permisos Nativos". Esto abrirá los ajustes del sistema Android.
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                2. Busca esta aplicación y actívale el acceso a las notificaciones.
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                3. Espera a recibir notificaciones de otras apps (bancos, mensajes).
              </ThemedText>
              <ThemedText style={styles.instructionsText}>
                4. Toca en "Recargar JSON" para ver la información cruda en esta pantalla.
              </ThemedText>
            </ScrollView>
          ) : (
            <ScrollView style={{ padding: 20 }}>
              <ThemedText style={styles.jsonText}>
                {JSON.stringify(capturedNotifications, null, 2)}
              </ThemedText>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  headerTitle: { fontSize: 32, fontWeight: '800', marginBottom: 16 },
  statusContainer: {
    marginBottom: 24,
    opacity: 0.8
  },
  statusText: { fontSize: 16 },
  bold: { fontWeight: '800' },
  actionsContainer: {
    gap: 12,
    marginBottom: 24
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  jsonContainer: {
    flex: 1,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden'
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3B82F6'
  },
  instructionsText: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
    opacity: 0.8
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    opacity: 0.7
  }
});
