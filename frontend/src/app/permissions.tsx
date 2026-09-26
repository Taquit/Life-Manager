import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  AppState,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Notifications from 'expo-notifications';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { ThemeTokens, Radii } from '@/constants/theme';

export default function PermissionsScreen() {
  const router = useRouter();
  const [listenerStatus, setListenerStatus] = useState<string>('checking');
  const [pushStatus, setPushStatus] = useState<string>('checking');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const checkPermissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Verificar estado de escucha de notificaciones en Android
      if (Platform.OS === 'android') {
        const lStatus = await RNAndroidNotificationListener.getPermissionStatus();
        setListenerStatus(lStatus);
      } else {
        setListenerStatus('not_supported');
      }

      // 2. Verificar estado de permisos de notificaciones locales / push
      const pStatus = await Notifications.getPermissionsAsync();
      setPushStatus(pStatus.granted ? 'authorized' : 'denied');
    } catch (err) {
      console.error('Error comprobando permisos:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    // Escuchar cambios de estado de la app para actualizar permisos al regresar de Ajustes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  const requestListenerPermission = () => {
    if (Platform.OS === 'android') {
      RNAndroidNotificationListener.requestPermission();
    }
  };

  const requestPushPermission = async () => {
    try {
      const res = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      setPushStatus(res.granted ? 'authorized' : 'denied');
    } catch (err) {
      console.error('Error solicitando permisos de notificaciones:', err);
    }
  };

  const isListenerGranted = listenerStatus === 'authorized';
  const isPushGranted = pushStatus === 'authorized';
  const allGranted = isListenerGranted && isPushGranted;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={ThemeTokens.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Permisos de Escucha</Text>
        <Pressable onPress={checkPermissions} style={styles.refreshButton}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color={ThemeTokens.brandFill} />
          ) : (
            <SymbolView
              name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              size={20}
              tintColor={ThemeTokens.textSecondary}
            />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de Estado Global */}
        <View
          style={[
            styles.summaryCard,
            allGranted ? styles.summaryCardSuccess : styles.summaryCardPending,
          ]}
        >
          <View style={styles.summaryIconContainer}>
            <SymbolView
              name={
                allGranted
                  ? { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified' }
                  : { ios: 'exclamationmark.shield.fill', android: 'security_update_warning', web: 'warning' }
              }
              size={28}
              tintColor={allGranted ? ThemeTokens.incomeText : ThemeTokens.pendingText}
            />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>
              {allGranted ? 'Captura automatica activa' : 'Configuracion requerida'}
            </Text>
            <Text style={styles.summarySubtitle}>
              {allGranted
                ? 'El sistema esta listo para detectar pagos con Google Wallet y avisarte.'
                : 'Concede los permisos para que tus compras se anadan solas a Money_app.'}
            </Text>
          </View>
        </View>

        {/* Permiso 1: Acceso a Notificaciones */}
        <View style={styles.permissionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.cardTitle}>Acceso a Notificaciones (Android)</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isListenerGranted ? styles.statusPillActive : styles.statusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isListenerGranted ? styles.statusPillTextActive : styles.statusPillTextInactive,
                ]}
              >
                {isListenerGranted ? 'Activo' : 'Requerido'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Permite a Money_app escuchar en segundo plano los mensajes generados por Google Wallet
            y pagos NFC. Con esto, cada compra se detecta inmediatamente sin necesidad de escribirla
            a mano.
          </Text>

          <Pressable
            style={[
              styles.actionButton,
              isListenerGranted ? styles.actionButtonGranted : styles.actionButtonPrimary,
            ]}
            onPress={requestListenerPermission}
          >
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              size={18}
              tintColor={isListenerGranted ? ThemeTokens.textSecondary : '#FFFFFF'}
            />
            <Text
              style={[
                styles.actionButtonText,
                isListenerGranted ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
              ]}
            >
              {isListenerGranted ? 'Ajustes de acceso activos' : 'Abrir Ajustes de Android'}
            </Text>
          </Pressable>
        </View>

        {/* Permiso 2: Notificaciones Push / Locales */}
        <View style={styles.permissionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.cardTitle}>Notificaciones del Sistema</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                isPushGranted ? styles.statusPillActive : styles.statusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isPushGranted ? styles.statusPillTextActive : styles.statusPillTextInactive,
                ]}
              >
                {isPushGranted ? 'Activo' : 'Requerido'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Permite mostrarte una alerta en la barra superior de tu dispositivo cada vez que se
            registre un gasto automaticamente, indicando el monto y la tarjeta utilizada.
          </Text>

          <Pressable
            style={[
              styles.actionButton,
              isPushGranted ? styles.actionButtonGranted : styles.actionButtonPrimary,
            ]}
            onPress={requestPushPermission}
          >
            <SymbolView
              name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              size={18}
              tintColor={isPushGranted ? ThemeTokens.textSecondary : '#FFFFFF'}
            />
            <Text
              style={[
                styles.actionButtonText,
                isPushGranted ? styles.actionButtonTextSecondary : styles.actionButtonTextPrimary,
              ]}
            >
              {isPushGranted ? 'Notificaciones activas' : 'Solicitar Permiso de Notificaciones'}
            </Text>
          </Pressable>
        </View>

        {/* Garantia de Privacidad */}
        <View style={styles.privacyNote}>
          <SymbolView
            name={{ ios: 'lock.shield', android: 'privacy_tip', web: 'lock' }}
            size={18}
            tintColor={ThemeTokens.textTertiary}
            style={{ marginRight: 10, marginTop: 2 }}
          />
          <Text style={styles.privacyText}>
            Garantia de privacidad: Money_app solo procesa las notificaciones provenientes de Google
            Wallet y aplicaciones bancarias asociadas. Ningun mensaje personal ni otra notificacion
            es leida ni almacenada.
          </Text>
        </View>

        {/* Acceso a Pantalla de Depuracion */}
        <Pressable
          style={styles.debugLinkRow}
          onPress={() => router.push('/(tabs)/debug-notifications' as any)}
        >
          <View style={styles.debugLinkContent}>
            <SymbolView
              name={{ ios: 'hammer.fill', android: 'build', web: 'build' }}
              size={18}
              tintColor={ThemeTokens.brandText}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.debugLinkText}>Ir a Depurador de Notificaciones y Simulador</Text>
          </View>
          <SymbolView
            name={{ ios: 'chevron.forward', android: 'arrow_forward', web: 'arrow_forward' }}
            size={16}
            tintColor={ThemeTokens.brandText}
          />
        </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: ThemeTokens.borderSubtle,
  },
  headerTitle: {
    fontSize: 18,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryCardSuccess: {
    backgroundColor: 'rgba(15, 174, 124, 0.12)',
    borderColor: ThemeTokens.incomeFill,
  },
  summaryCardPending: {
    backgroundColor: 'rgba(255, 201, 77, 0.12)',
    borderColor: ThemeTokens.pendingText,
  },
  summaryIconContainer: {
    marginRight: 14,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: ThemeTokens.textSecondary,
  },
  permissionCard: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ThemeTokens.brandFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  statusPillActive: {
    backgroundColor: 'rgba(15, 174, 124, 0.2)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(255, 92, 122, 0.2)',
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: ThemeTokens.incomeText,
  },
  statusPillTextInactive: {
    color: ThemeTokens.expenseText,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: ThemeTokens.textSecondary,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: ThemeTokens.brandFill,
  },
  actionButtonGranted: {
    backgroundColor: ThemeTokens.surfaceTrack,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    color: ThemeTokens.textSecondary,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.surfaceTrack,
    borderRadius: Radii.card,
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: ThemeTokens.textTertiary,
  },
  debugLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeTokens.surface,
    padding: 16,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: ThemeTokens.brandFill,
  },
  debugLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debugLinkText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: ThemeTokens.brandText,
  },
});
