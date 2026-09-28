import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { userApi, getApiErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile();
        setUser(data);
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={ThemeTokens.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Tarjeta de Usuario */}
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'Sin correo'}</Text>
            </View>

            {/* Seccion de Ajustes y Permisos */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>SISTEMA Y PERMISOS</Text>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/permissions' as any)}
              >
                <View style={styles.menuIconContainer}>
                  <SymbolView
                    name={{ ios: 'lock.shield', android: 'security', web: 'security' }}
                    size={20}
                    tintColor={ThemeTokens.incomeText}
                  />
                </View>
                <View style={styles.menuDetails}>
                  <Text style={styles.menuTitle}>Permisos de Notificaciones</Text>
                  <Text style={styles.menuSubtitle}>Configuración de Google Wallet y NFC</Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.forward', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor={ThemeTokens.textTertiary}
                />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/debug-notifications' as any)}
              >
                <View style={styles.menuIconContainer}>
                  <SymbolView
                    name={{ ios: 'hammer.fill', android: 'build', web: 'build' }}
                    size={20}
                    tintColor={ThemeTokens.brandText}
                  />
                </View>
                <View style={styles.menuDetails}>
                  <Text style={styles.menuTitle}>Depurador de Notificaciones</Text>
                  <Text style={styles.menuSubtitle}>Ver historial de eventos en segundo plano</Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.forward', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor={ThemeTokens.textTertiary}
                />
              </Pressable>
            </View>

            {/* Acciones de Sesion */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>CUENTA</Text>

              <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <SymbolView
                  name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
                  size={20}
                  tintColor={ThemeTokens.expenseText}
                />
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeTokens.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ThemeTokens.brandDeepSurface,
    borderWidth: 2,
    borderColor: ThemeTokens.brandFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: ThemeTokens.brandSoftText,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: ThemeTokens.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeTokens.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 10,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surfaceTrack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuDetails: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ThemeTokens.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: ThemeTokens.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.expenseText,
    borderRadius: Radii.button,
    paddingVertical: 14,
    gap: 10,
  },
  logoutButtonText: {
    color: ThemeTokens.expenseText,
    fontSize: 15,
    fontWeight: '700',
  },
});
