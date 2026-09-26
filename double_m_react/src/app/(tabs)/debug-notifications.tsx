import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import {
  getNotificationListenerStatus,
  openNotificationListenerSettings,
} from '@/services/notificationPermission';
import {
  processIncomingNotification,
  ALLOWED_PACKAGES,
  DebugNotificationLog,
} from '@/services/notificationPipeline';
import { KNOWN_PACKAGES } from '@/services/notiProcesor';

export default function DebugNotificationsScreen() {
  const theme = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [capturedNotifications, setCapturedNotifications] = useState<DebugNotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACCEPTED' | 'WALLET' | 'ERROR'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Estado del modal de simulación
  const [simModalVisible, setSimModalVisible] = useState(false);
  const [simTitle, setSimTitle] = useState('Google Wallet');
  const [simText, setSimText] = useState('Pagaste $145.50 en Starbucks con Visa •••• 4321');
  const [simApp, setSimApp] = useState('com.google.android.apps.walletnfcrel');
  const [isSimulating, setIsSimulating] = useState(false);

  const checkPermission = async () => {
    if (Platform.OS !== 'android') {
      setPermissionStatus('not_supported');
      return;
    }
    const status = await getNotificationListenerStatus();
    setPermissionStatus(status);
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
    Alert.alert('Limpiar Historial', '¿Deseas vaciar todos los registros de notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('@debug_notifications');
          setCapturedNotifications([]);
        },
      },
    ]);
  };

  useEffect(() => {
    checkPermission();
    loadCapturedNotifications();
  }, []);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await processIncomingNotification(
        {
          title: simTitle,
          text: simText,
          app: simApp,
        },
        true
      );
      setSimModalVisible(false);
      await loadCapturedNotifications();
      Alert.alert(
        'Simulación Exitosa',
        'La notificación fue procesada por el pipeline, enviada a la base de datos y se disparó la notificación de confirmación.'
      );
    } catch (err: any) {
      Alert.alert('Error en simulación', err.message || 'Ocurrió un error.');
    } finally {
      setIsSimulating(false);
    }
  };

  const isAuthorized = permissionStatus === 'authorized';

  const filteredLogs = capturedNotifications.filter((log) => {
    if (activeFilter === 'ACCEPTED') return log.filterStatus === 'ACCEPTED';
    if (activeFilter === 'WALLET') return log.app === 'com.google.android.apps.walletnfcrel';
    if (activeFilter === 'ERROR') return log.processingStatus === 'BACKEND_ERROR' || log.processingStatus === 'NO_AMOUNT';
    return true;
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Cabecera */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Debug de Notificaciones
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Monitorea cómo llegan y se procesan los pagos NFC de Google Wallet y bancos.
          </ThemedText>
        </View>

        {/* Tarjeta de Estado del Permiso */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isAuthorized ? '#ECFDF5' : '#FEF2F2',
              borderColor: isAuthorized ? '#10B981' : '#EF4444',
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <ThemedText style={styles.statusLabel}>Acceso a Notificaciones (Android):</ThemedText>
              <ThemedText
                style={[
                  styles.statusValue,
                  { color: isAuthorized ? '#047857' : '#B91C1C' },
                ]}
              >
                {isAuthorized ? '✓ Autorizado' : '✕ Desactivado'}
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.permissionSettingsButton,
                { backgroundColor: isAuthorized ? '#059669' : '#DC2626' },
                pressed && { opacity: 0.8 },
              ]}
              onPress={openNotificationListenerSettings}
            >
              <SymbolView
                name={{ ios: 'gear', android: 'settings', web: 'settings' }}
                size={16}
                tintColor="#fff"
              />
              <ThemedText style={styles.permissionSettingsButtonText}>
                {isAuthorized ? 'Ajustes' : 'Activar Ahora'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Nota informativa de Google Wallet */}
        <View style={[styles.packageNotice, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.packageNoticeTitle}>
            ℹ️ Paquete de Google Wallet en Android:
          </ThemedText>
          <ThemedText style={styles.packageNoticeCode}>
            com.google.android.apps.walletnfcrel
          </ThemedText>
          <ThemedText style={styles.packageNoticeDesc}>
            (Nota: El paquete oficial NO es google.wallet.com, sino walletnfcrel)
          </ThemedText>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: '#3B82F6' },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setSimModalVisible(true)}
          >
            <SymbolView
              name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
              size={18}
              tintColor="#fff"
            />
            <ThemedText style={styles.actionBtnText}>Simular Wallet</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: '#10B981' },
              pressed && { opacity: 0.8 },
            ]}
            onPress={loadCapturedNotifications}
          >
            <SymbolView
              name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              size={18}
              tintColor="#fff"
            />
            <ThemedText style={styles.actionBtnText}>Recargar</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: '#6B7280' },
              pressed && { opacity: 0.8 },
            ]}
            onPress={clearNotifications}
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor="#fff"
            />
            <ThemedText style={styles.actionBtnText}>Limpiar</ThemedText>
          </Pressable>
        </View>

        {/* Filtros */}
        <View style={styles.filtersContainer}>
          <Pressable
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <ThemedText
              style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}
            >
              Todas ({capturedNotifications.length})
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.filterChip, activeFilter === 'ACCEPTED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ACCEPTED')}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                activeFilter === 'ACCEPTED' && styles.filterChipTextActive,
              ]}
            >
              Aceptadas
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.filterChip, activeFilter === 'WALLET' && styles.filterChipActive]}
            onPress={() => setActiveFilter('WALLET')}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                activeFilter === 'WALLET' && styles.filterChipTextActive,
              ]}
            >
              Google Wallet
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.filterChip, activeFilter === 'ERROR' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ERROR')}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                activeFilter === 'ERROR' && styles.filterChipTextActive,
              ]}
            >
              Errores
            </ThemedText>
          </Pressable>
        </View>

        {/* Lista de Registros */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
        ) : filteredLogs.length === 0 ? (
          <ScrollView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>No hay notificaciones registradas</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              1. Toca en "Activar Ahora" para darle permiso a la app en Ajustes de Android.{"\n"}
              2. Haz una compra NFC con Google Wallet o tu banco.{"\n"}
              3. O toca en "Simular Wallet" para probar el procesamiento inmediatamente.
            </ThemedText>
          </ScrollView>
        ) : (
          <ScrollView style={styles.logsList} showsVerticalScrollIndicator={false}>
            {filteredLogs.map((log) => {
              const isWallet = log.app === 'com.google.android.apps.walletnfcrel';
              const isSuccess = log.processingStatus === 'SUCCESS';
              const isIgnored = log.filterStatus === 'IGNORED_PACKAGE';
              const isExpanded = expandedLogId === log.id;

              let badgeColor = '#EF4444';
              let badgeLabel = 'Error';
              if (isSuccess) {
                badgeColor = '#10B981';
                badgeLabel = '✓ Procesada y Guardada';
              } else if (isIgnored) {
                badgeColor = '#F59E0B';
                badgeLabel = 'Ignorado (Paquete no permitido)';
              } else if (log.processingStatus === 'NO_AMOUNT') {
                badgeColor = '#F97316';
                badgeLabel = 'Sin Monto';
              }

              const timeStr = log.timestamp
                ? new Date(log.timestamp).toLocaleTimeString()
                : '';

              return (
                <View
                  key={log.id}
                  style={[
                    styles.logCard,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  {/* Encabezado de la tarjeta */}
                  <View style={styles.logCardHeader}>
                    <View style={styles.appTitleContainer}>
                      <ThemedText style={styles.appFriendlyName}>
                        {isWallet ? '🔵 Google Wallet' : log.appFriendlyName || log.app}
                      </ThemedText>
                      <ThemedText style={styles.logTimestamp}>{timeStr}</ThemedText>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badgeColor + '20' }]}>
                      <ThemedText style={[styles.statusBadgeText, { color: badgeColor }]}>
                        {badgeLabel}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Paquete */}
                  <ThemedText style={styles.logPackageText}>Paquete: {log.app}</ThemedText>

                  {/* Contenido Crudo de Notificación */}
                  <View style={styles.notificationPreview}>
                    {log.title ? (
                      <ThemedText style={styles.previewTitle}>
                        Título: <ThemedText style={styles.bold}>{log.title}</ThemedText>
                      </ThemedText>
                    ) : null}
                    <ThemedText style={styles.previewText}>
                      Texto: <ThemedText style={styles.bold}>{log.text || 'Sin texto'}</ThemedText>
                    </ThemedText>
                  </View>

                  {/* Datos Extraídos */}
                  {isSuccess && (
                    <View style={styles.extractedBox}>
                      <ThemedText style={styles.extractedTitle}>Datos Extraídos:</ThemedText>
                      <View style={styles.extractedGrid}>
                        <ThemedText style={styles.extractedItem}>
                          💰 Monto:{' '}
                          <ThemedText style={styles.extractedAmount}>
                            ${log.extractedAmount?.toFixed(2)}
                          </ThemedText>
                        </ThemedText>
                        <ThemedText style={styles.extractedItem}>
                          💳 Tarjeta: •••• {log.extractedCardLast4 || 'N/A'}
                        </ThemedText>
                        <ThemedText style={styles.extractedItem}>
                          📝 Comercio: {log.transactionTitle || 'Gasto NFC'}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Error si hubo */}
                  {log.errorMessage ? (
                    <View style={styles.errorBox}>
                      <ThemedText style={styles.errorBoxText}>
                        ⚠️ {log.errorMessage}
                      </ThemedText>
                    </View>
                  ) : null}

                  {/* Botón para expandir pasos y JSON */}
                  <Pressable
                    style={styles.expandButton}
                    onPress={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <ThemedText style={styles.expandButtonText}>
                      {isExpanded ? 'Ocultar Diagnóstico ▲' : 'Ver Diagnóstico y Pasos ▼'}
                    </ThemedText>
                  </Pressable>

                  {/* Sección expandible */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      <ThemedText style={styles.stepsTitle}>Pasos de Procesamiento:</ThemedText>
                      {log.steps?.map((step, idx) => (
                        <ThemedText key={idx} style={styles.stepItem}>
                          • {step}
                        </ThemedText>
                      ))}

                      <ThemedText style={[styles.stepsTitle, { marginTop: 12 }]}>
                        JSON Crudo:
                      </ThemedText>
                      <View style={styles.rawJsonBox}>
                        <ThemedText style={styles.rawJsonText}>
                          {JSON.stringify(log.raw, null, 2)}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Modal de Simulación de Google Wallet */}
        <Modal
          visible={simModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSimModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Simular Notificación de Google Wallet
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Prueba cómo el sistema procesa el pago, crea la transacción y muestra la notificación local.
              </ThemedText>

              {/* Botones de Ejemplo Rápido */}
              <ThemedText style={styles.modalLabel}>Plantillas Rápidas:</ThemedText>
              <View style={styles.templatesRow}>
                <Pressable
                  style={styles.templateBtn}
                  onPress={() => {
                    setSimTitle('Google Wallet');
                    setSimText('Pagaste $150.00 en Starbucks con Visa •••• 1234');
                    setSimApp('com.google.android.apps.walletnfcrel');
                  }}
                >
                  <ThemedText style={styles.templateBtnText}>Starbucks $150</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.templateBtn}
                  onPress={() => {
                    setSimTitle('Google Wallet');
                    setSimText('Compra de $340.50 en OXXO con Tarjeta •••• 8899');
                    setSimApp('com.google.android.apps.walletnfcrel');
                  }}
                >
                  <ThemedText style={styles.templateBtnText}>OXXO $340.50</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.templateBtn}
                  onPress={() => {
                    setSimTitle('BBVA');
                    setSimText('Retiro/Compra por $500.00 con tarjeta terminación 5544');
                    setSimApp('com.bancomer.mbanking');
                  }}
                >
                  <ThemedText style={styles.templateBtnText}>BBVA $500</ThemedText>
                </Pressable>
              </View>

              <ThemedText style={styles.modalLabel}>Paquete (App):</ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                value={simApp}
                onChangeText={setSimApp}
              />

              <ThemedText style={styles.modalLabel}>Título:</ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                value={simTitle}
                onChangeText={setSimTitle}
              />

              <ThemedText style={styles.modalLabel}>Texto de Notificación:</ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement, minHeight: 60 },
                ]}
                value={simText}
                multiline
                onChangeText={setSimText}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: '#6B7280' }]}
                  onPress={() => setSimModalVisible(false)}
                >
                  <ThemedText style={styles.modalActionBtnText}>Cancelar</ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleSimulate}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.modalActionBtnText}>Ejecutar Pipeline</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSubtitle: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  statusCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 13, opacity: 0.8 },
  statusValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  permissionSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  permissionSettingsButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  packageNotice: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  packageNoticeTitle: { fontSize: 12, fontWeight: 'bold' },
  packageNoticeCode: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#3B82F6',
    fontWeight: 'bold',
    marginTop: 2,
  },
  packageNoticeDesc: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#3B82F6' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterChipTextActive: { color: '#ffffff' },
  emptyContainer: {
    flex: 1,
    padding: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 22,
    textAlign: 'center',
  },
  logsList: { flex: 1 },
  logCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appTitleContainer: { flex: 1 },
  appFriendlyName: { fontSize: 16, fontWeight: 'bold' },
  logTimestamp: { fontSize: 12, opacity: 0.5 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  logPackageText: { fontSize: 12, opacity: 0.5, marginBottom: 8 },
  notificationPreview: {
    backgroundColor: '#00000008',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  previewTitle: { fontSize: 13, marginBottom: 4 },
  previewText: { fontSize: 13 },
  bold: { fontWeight: 'bold' },
  extractedBox: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98140',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  extractedTitle: { fontSize: 12, fontWeight: 'bold', color: '#047857', marginBottom: 4 },
  extractedGrid: { gap: 2 },
  extractedItem: { fontSize: 13 },
  extractedAmount: { color: '#059669', fontWeight: 'bold' },
  errorBox: {
    backgroundColor: '#EF444415',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorBoxText: { color: '#DC2626', fontSize: 12 },
  expandButton: {
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#00000010',
    marginTop: 4,
  },
  expandButtonText: { fontSize: 12, color: '#3B82F6', fontWeight: 'bold' },
  expandedSection: { marginTop: 10 },
  stepsTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  stepItem: { fontSize: 12, opacity: 0.8, lineHeight: 18 },
  rawJsonBox: {
    backgroundColor: '#1F2937',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  rawJsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000077',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, opacity: 0.7, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', marginBottom: 4, marginTop: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#00000020',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  templatesRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  templateBtn: {
    backgroundColor: '#3B82F620',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  templateBtnText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalActionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
