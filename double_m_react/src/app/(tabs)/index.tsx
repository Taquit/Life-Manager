import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import api from '@/services/api';
import { useTheme } from "@/hooks/use-theme";

export default function HomePage() {
  const { logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
      try {
          setLoading(true);
          const res = await api.get('/transactions');
          setTransactions(res.data.data || []);
      } catch (error) {
          console.error("Error cargando transacciones:", error);
      } finally {
          setLoading(false);
      }
  }

  useFocusEffect(
      useCallback(() => {
          loadTransactions();
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Bienvenido</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>Aquí podrás ver que no se roban tu dinero, ¡lo gastaste tú!</ThemedText>
        </View>

        <View style={styles.contentContainer}>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement || '#f8f9fa' }]}>
                <ThemedText style={styles.summaryTitle}>Gastos de {monthName}</ThemedText>
                {loading ? (
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

      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
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
})