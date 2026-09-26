import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet, View, ActivityIndicator, ScrollView, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import api, { getErrorMessage } from '@/services/api';
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";
import { getNotificationListenerStatus, openNotificationListenerSettings, requestLocalNotificationPermissions } from "@/services/notificationPermission";

export default function HomePage() {
  const { logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('authorized');

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const status = await getNotificationListenerStatus();
      setNotificationPermission(status);
      await requestLocalNotificationPermissions();
    }
  };

  const loadTransactions = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);
      const res = await api.get('/transactions');
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      checkPermissions();
    }, [])
  );

  const { totalMonth, monthName } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let sum = 0;
    transactions.forEach(t => {
      if (t.date) {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          sum += parseFloat(t.amount || 0);
        }
      }
    });

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return {
      totalMonth: sum.toFixed(2),
      monthName: monthNames[currentMonth]
    };
  }, [transactions]);

  const showPermissionWarning = Platform.OS === 'android' && notificationPermission !== 'authorized';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} colors={['#10B981']} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Bienvenido</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>Aquí podrás ver que no se roban tu dinero, ¡lo gastaste tú!</ThemedText>
          </View>

          {/* Banner de Permiso de Notificaciones si está desactivado */}
          {showPermissionWarning && (
            <View style={styles.permissionWarningCard}>
              <View style={styles.permissionWarningHeader}>
                <SymbolView name={{ ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications' }} size={24} tintColor="#B45309" />
                <ThemedText style={styles.permissionWarningTitle}>Pagos Automáticos Desactivados</ThemedText>
              </View>
              <ThemedText style={styles.permissionWarningText}>
                Para registrar tus compras por NFC (Google Wallet y bancos), la aplicación necesita permiso para escuchar las notificaciones.
              </ThemedText>
              <Pressable
                style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.85 }]}
                onPress={openNotificationListenerSettings}
              >
                <SymbolView name={{ ios: 'gear', android: 'settings', web: 'settings' }} size={18} tintColor="#fff" />
                <ThemedText style={styles.settingsButtonText}>Activar en Ajustes</ThemedText>
              </Pressable>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBanner}>
              <ThemedText style={styles.errorText}>⚠️ {errorMessage}</ThemedText>
              <Pressable onPress={() => loadTransactions()} style={styles.retryButton}>
                <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.contentContainer}>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement || '#f8f9fa' }]}>
              <ThemedText style={styles.summaryTitle}>Gastos de {monthName}</ThemedText>
              {loading && !refreshing ? (
                <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 10 }} />
              ) : (
                <ThemedText style={styles.summaryAmount}>${totalMonth}</ThemedText>
              )}
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]} 
            onPress={logout}
          >
            <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  permissionWarningCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  permissionWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  permissionWarningText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 14,
  },
  settingsButton: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
  retryButton: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  retryButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  contentContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#10B981',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});