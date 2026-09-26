import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { transactionsApi, getApiErrorMessage } from '@/services/api';
import {
  parseNotification,
  isGooglePayNotification,
  NotificationData,
  ParsedNotification,
} from '@/services/notiProcesor';

export default function DebugNotificationsScreen() {
  const router = useRouter();

  // Estados de lista
  const [capturedNotifications, setCapturedNotifications] = useState<NotificationData[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filterMode, setFilterMode] = useState<'google_pay' | 'all'>('google_pay');
  const [testingItemIndex, setTestingItemIndex] = useState<number | null>(null);
  const [itemTestResults, setItemTestResults] = useState<Record<number, { success: boolean; message: string }>>({});

  // Estados del simulador
  const [simTitle, setSimTitle] = useState('Google Pay');
  const [simText, setSimText] = useState('Compra de $150.00 con tarjeta terminada en 1234');
  const [simApp, setSimApp] = useState('com.google.android.apps.walletnfcrel');
  const [simulatingSend, setSimulatingSend] = useState(false);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadCapturedNotifications = async () => {
    setIsLoadingList(true);
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
      setIsLoadingList(false);
    }
  };

  const clearNotifications = async () => {
    Alert.alert(
      'Limpiar historial',
      '¿Deseas vaciar el registro local de notificaciones capturadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@debug_notifications');
            setCapturedNotifications([]);
            setItemTestResults({});
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadCapturedNotifications();
  }, []);

  // Parseo en tiempo real del simulador
  const simParsed: ParsedNotification = useMemo(() => {
    return parseNotification({
      title: simTitle,
      text: simText,
      app: simApp,
    });
  }, [simTitle, simText, simApp]);

  // Lista filtrada
  const displayedNotifications = useMemo(() => {
    if (filterMode === 'all') return capturedNotifications;
    return capturedNotifications.filter((n) => isGooglePayNotification(n));
  }, [capturedNotifications, filterMode]);

  // Envio de prueba desde el simulador
  const handleSimTestSend = async () => {
    if (simParsed.status !== 'ready' || !simParsed.amount || !simParsed.cardLast4) {
      Alert.alert(
        'Datos incompletos',
        `No se puede procesar: ${simParsed.statusText}. Verifica que el texto incluya monto ($XX) y ultimos 4 digitos de tarjeta.`
      );
      return;
    }

    setSimulatingSend(true);
    setSimResult(null);

    try {
      const createdTx = await transactionsApi.createGooglePay({
        amount: simParsed.amount,
        cardLast4: simParsed.cardLast4,
        merchant: simParsed.merchant,
        note: simParsed.note,
        date: new Date().toISOString(),
      });

      setSimResult({
        success: true,
        message: `Transaccion creada con exito (ID: ${createdTx.id || 'ok'}). Gasto registrado: $${simParsed.amount}.`,
      });
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setSimResult({
        success: false,
        message: `Fallo el registro en backend: ${errMsg}`,
      });
    } finally {
      setSimulatingSend(false);
    }
  };

  // Envio de prueba para un elemento de la lista
  const handleItemTestSend = async (item: NotificationData, index: number) => {
    const parsed = parseNotification(item);
    if (parsed.status !== 'ready' || !parsed.amount || !parsed.cardLast4) {
      Alert.alert(
        'Notificacion no procesable',
        `No se puede enviar: ${parsed.statusText}. Falta el monto o los ultimos 4 digitos de la tarjeta.`
      );
      return;
    }

    setTestingItemIndex(index);
    try {
      const createdTx = await transactionsApi.createGooglePay({
        amount: parsed.amount,
        cardLast4: parsed.cardLast4,
        merchant: parsed.merchant,
        note: parsed.note,
        date: new Date().toISOString(),
      });

      setItemTestResults((prev) => ({
        ...prev,
        [index]: {
          success: true,
          message: `Enviada con exito (ID: ${createdTx.id || 'ok'}). Monto: $${parsed.amount}`,
        },
      }));
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err);
      setItemTestResults((prev) => ({
        ...prev,
        [index]: {
          success: false,
          message: `Error: ${errMsg}`,
        },
      }));
    } finally {
      setTestingItemIndex(null);
    }
  };

  const applyPreset = (title: string, text: string) => {
    setSimTitle(title);
    setSimText(text);
    setSimResult(null);
  };

  const getStatusColor = (status: ParsedNotification['status']) => {
    switch (status) {
      case 'ready':
        return { text: ThemeTokens.incomeText, bg: 'rgba(15, 174, 124, 0.2)' };
      case 'missing_amount':
        return { text: ThemeTokens.expenseText, bg: 'rgba(255, 92, 122, 0.2)' };
      case 'missing_card':
        return { text: ThemeTokens.pendingText, bg: 'rgba(255, 201, 77, 0.2)' };
    }
  };

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
        <Text style={styles.headerTitle}>Depurador de Notificaciones</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={loadCapturedNotifications} style={styles.iconButton}>
            {isLoadingList ? (
              <ActivityIndicator size="small" color={ThemeTokens.brandFill} />
            ) : (
              <SymbolView
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                size={18}
                tintColor={ThemeTokens.textSecondary}
              />
            )}
          </Pressable>
          <Pressable onPress={clearNotifications} style={styles.iconButton}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor={ThemeTokens.expenseText}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Atajo a Permisos */}
        <Pressable
          style={styles.permissionsBanner}
          onPress={() => router.push('/permissions' as any)}
        >
          <View style={styles.permissionsBannerLeft}>
            <SymbolView
              name={{ ios: 'lock.shield', android: 'security', web: 'security' }}
              size={18}
              tintColor={ThemeTokens.brandText}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.permissionsBannerText}>Verificar permisos de escucha del sistema</Text>
          </View>
          <SymbolView
            name={{ ios: 'chevron.forward', android: 'arrow_forward', web: 'arrow_forward' }}
            size={14}
            tintColor={ThemeTokens.brandText}
          />
        </Pressable>

        {/* SECCION 1: Simulador de Notificaciones */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <SymbolView
              name={{ ios: 'play.laptopcomputer', android: 'science', web: 'science' }}
              size={20}
              tintColor={ThemeTokens.brandFill}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>Simulador de Google Wallet</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Prueba como se extraen los datos de una notificacion y enviala al backend sin esperar un cobro real.
          </Text>

          {/* Presets */}
          <Text style={styles.fieldLabel}>Casos de prueba predefinidos:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
            <Pressable
              style={styles.presetChip}
              onPress={() => applyPreset('Google Pay', 'Pago de $150.00 con Santander termina en 1234')}
            >
              <Text style={styles.presetChipText}>Preset: $150 termina 1234</Text>
            </Pressable>
            <Pressable
              style={styles.presetChip}
              onPress={() => applyPreset('OXXO', 'Compra de $45.50 •••• 5678 aprobada')}
            >
              <Text style={styles.presetChipText}>Preset: $45.50 •••• 5678</Text>
            </Pressable>
            <Pressable
              style={styles.presetChip}
              onPress={() => applyPreset('Walmart', 'Cargo por $1,250.00 tarjeta 9012')}
            >
              <Text style={styles.presetChipText}>Preset: $1,250 tarjeta 9012</Text>
            </Pressable>
            <Pressable
              style={styles.presetChip}
              onPress={() => applyPreset('Aviso Banco', 'Transferencia recibida con exito')}
            >
              <Text style={styles.presetChipText}>Preset: Sin monto/tarjeta</Text>
            </Pressable>
          </ScrollView>

          {/* Formulario del simulador */}
          <Text style={styles.fieldLabel}>Titulo / Comercio detectado:</Text>
          <TextInput
            style={styles.input}
            value={simTitle}
            onChangeText={setSimTitle}
            placeholder="Ej. Google Pay o Walmart"
            placeholderTextColor={ThemeTokens.placeholder}
          />

          <Text style={styles.fieldLabel}>Texto de la notificacion:</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={simText}
            onChangeText={setSimText}
            placeholder="Ej. Compra de $150.00 con tarjeta terminada en 1234"
            placeholderTextColor={ThemeTokens.placeholder}
            multiline
          />

          <Text style={styles.fieldLabel}>Paquete emisor de la aplicacion:</Text>
          <TextInput
            style={styles.input}
            value={simApp}
            onChangeText={setSimApp}
            placeholder="com.google.android.apps.walletnfcrel"
            placeholderTextColor={ThemeTokens.placeholder}
            autoCapitalize="none"
          />

          {/* Vista previa de parseo en tiempo real */}
          <View style={styles.parsedPreviewCard}>
            <View style={styles.parsedPreviewHeader}>
              <Text style={styles.parsedPreviewTitle}>Analisis de Parseo en Tiempo Real</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: getStatusColor(simParsed.status).bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: getStatusColor(simParsed.status).text },
                  ]}
                >
                  {simParsed.statusText}
                </Text>
              </View>
            </View>

            <View style={styles.parsedItemRow}>
              <Text style={styles.parsedItemLabel}>Monto detectado:</Text>
              <Text
                style={[
                  styles.parsedItemValue,
                  simParsed.amount
                    ? { color: ThemeTokens.incomeText, fontWeight: '700' }
                    : { color: ThemeTokens.expenseText },
                ]}
              >
                {simParsed.amount ? `$${simParsed.amount.toFixed(2)}` : 'No detectado'}
              </Text>
            </View>

            <View style={styles.parsedItemRow}>
              <Text style={styles.parsedItemLabel}>Ultimos 4 digitos:</Text>
              <Text
                style={[
                  styles.parsedItemValue,
                  simParsed.cardLast4
                    ? { color: ThemeTokens.brandSoftText, fontWeight: '700' }
                    : { color: ThemeTokens.expenseText },
                ]}
              >
                {simParsed.cardLast4 ? `•••• ${simParsed.cardLast4}` : 'No detectado'}
              </Text>
            </View>

            <View style={styles.parsedItemRow}>
              <Text style={styles.parsedItemLabel}>Comercio / Merchant:</Text>
              <Text style={styles.parsedItemValue}>{simParsed.merchant}</Text>
            </View>

            <View style={styles.parsedItemRow}>
              <Text style={styles.parsedItemLabel}>Nota generada:</Text>
              <Text style={styles.parsedItemValue} numberOfLines={2}>
                {simParsed.note}
              </Text>
            </View>

            {/* Boton de envio de prueba */}
            <Pressable
              style={[
                styles.testButton,
                simParsed.status !== 'ready' && styles.testButtonDisabled,
                simulatingSend && { opacity: 0.7 },
              ]}
              onPress={handleSimTestSend}
              disabled={simulatingSend || simParsed.status !== 'ready'}
            >
              {simulatingSend ? (
                <ActivityIndicator color="#0D0B1A" />
              ) : (
                <>
                  <SymbolView
                    name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                    size={16}
                    tintColor="#0D0B1A"
                  />
                  <Text style={styles.testButtonText}>Probar envio al backend</Text>
                </>
              )}
            </Pressable>

            {/* Resultado del simulador */}
            {simResult && (
              <View
                style={[
                  styles.resultBanner,
                  simResult.success ? styles.resultBannerSuccess : styles.resultBannerError,
                ]}
              >
                <Text
                  style={[
                    styles.resultBannerText,
                    simResult.success ? styles.resultBannerTextSuccess : styles.resultBannerTextError,
                  ]}
                >
                  {simResult.message}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SECCION 2: Historial de Notificaciones Capturadas */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionHeaderTitle}>
            Historial de Notificaciones ({displayedNotifications.length})
          </Text>
          <View style={styles.filterToggle}>
            <Pressable
              style={[
                styles.filterToggleBtn,
                filterMode === 'google_pay' && styles.filterToggleBtnActive,
              ]}
              onPress={() => setFilterMode('google_pay')}
            >
              <Text
                style={[
                  styles.filterToggleText,
                  filterMode === 'google_pay' && styles.filterToggleTextActive,
                ]}
              >
                Wallet ({capturedNotifications.filter((n) => isGooglePayNotification(n)).length})
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterToggleBtn,
                filterMode === 'all' && styles.filterToggleBtnActive,
              ]}
              onPress={() => setFilterMode('all')}
            >
              <Text
                style={[
                  styles.filterToggleText,
                  filterMode === 'all' && styles.filterToggleTextActive,
                ]}
              >
                Todas ({capturedNotifications.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {displayedNotifications.length === 0 ? (
          <View style={styles.emptyHistoryCard}>
            <SymbolView
              name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
              size={36}
              tintColor={ThemeTokens.textTertiary}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyHistoryTitle}>Sin notificaciones registradas</Text>
            <Text style={styles.emptyHistorySubtitle}>
              {filterMode === 'google_pay'
                ? 'No se han detectado notificaciones de Google Wallet en segundo plano. Usa el simulador de arriba para probar.'
                : 'El almacenamiento local de notificaciones esta vacio.'}
            </Text>
          </View>
        ) : (
          displayedNotifications.map((notif, index) => {
            const parsed = parseNotification(notif);
            const statusStyle = getStatusColor(parsed.status);
            const isTesting = testingItemIndex === index;
            const testResult = itemTestResults[index];
            const timestampFormatted = notif.time
              ? new Date(Number(notif.time)).toLocaleTimeString()
              : 'Reciente';

            return (
              <View key={index} style={styles.historyCard}>
                {/* Informacion cruda */}
                <View style={styles.rawHeader}>
                  <View style={styles.appBadge}>
                    <Text style={styles.appBadgeText} numberOfLines={1}>
                      {notif.app || 'desconocido'}
                    </Text>
                  </View>
                  <Text style={styles.timestampText}>{timestampFormatted}</Text>
                </View>

                <View style={styles.rawContentBox}>
                  <Text style={styles.rawTitleText}>
                    {notif.title ? `Titulo: ${notif.title}` : 'Sin titulo'}
                  </Text>
                  <Text style={styles.rawBodyText}>{`Texto: ${notif.text}`}</Text>
                </View>

                {/* Informacion parseada */}
                <View style={styles.parsedCardSection}>
                  <View style={styles.parsedHeaderRow}>
                    <Text style={styles.parsedSectionTitle}>Datos Parseados para Backend</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                        {parsed.statusText}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.parsedGrid}>
                    <View style={styles.parsedGridCol}>
                      <Text style={styles.gridLabel}>Monto:</Text>
                      <Text
                        style={[
                          styles.gridValue,
                          parsed.amount
                            ? { color: ThemeTokens.incomeText }
                            : { color: ThemeTokens.expenseText },
                        ]}
                      >
                        {parsed.amount ? `$${parsed.amount.toFixed(2)}` : 'Falta'}
                      </Text>
                    </View>

                    <View style={styles.parsedGridCol}>
                      <Text style={styles.gridLabel}>Tarjeta:</Text>
                      <Text
                        style={[
                          styles.gridValue,
                          parsed.cardLast4
                            ? { color: ThemeTokens.brandSoftText }
                            : { color: ThemeTokens.expenseText },
                        ]}
                      >
                        {parsed.cardLast4 ? `•••• ${parsed.cardLast4}` : 'Falta'}
                      </Text>
                    </View>

                    <View style={styles.parsedGridColFull}>
                      <Text style={styles.gridLabel}>Comercio:</Text>
                      <Text style={styles.gridValue}>{parsed.merchant}</Text>
                    </View>

                    <View style={styles.parsedGridColFull}>
                      <Text style={styles.gridLabel}>Nota generada:</Text>
                      <Text style={styles.gridValueSmall}>{parsed.note}</Text>
                    </View>
                  </View>

                  {/* Accion de prueba para este elemento */}
                  <Pressable
                    style={[
                      styles.testItemButton,
                      parsed.status !== 'ready' && styles.testButtonDisabled,
                      isTesting && { opacity: 0.7 },
                    ]}
                    onPress={() => handleItemTestSend(notif, index)}
                    disabled={isTesting || parsed.status !== 'ready'}
                  >
                    {isTesting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <SymbolView
                          name={{ ios: 'paperplane', android: 'send', web: 'send' }}
                          size={14}
                          tintColor="#FFFFFF"
                        />
                        <Text style={styles.testItemButtonText}>Probar envio al backend</Text>
                      </>
                    )}
                  </Pressable>

                  {testResult && (
                    <View
                      style={[
                        styles.resultBanner,
                        testResult.success ? styles.resultBannerSuccess : styles.resultBannerError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultBannerText,
                          testResult.success
                            ? styles.resultBannerTextSuccess
                            : styles.resultBannerTextError,
                        ]}
                      >
                        {testResult.message}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
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
    borderBottomWidth: 1,
    borderBottomColor: ThemeTokens.borderSubtle,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  permissionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeTokens.brandFill,
    marginBottom: 20,
  },
  permissionsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionsBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeTokens.brandText,
  },
  sectionCard: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: ThemeTokens.textSecondary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeTokens.textTertiary,
    marginBottom: 6,
    marginTop: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: ThemeTokens.surfaceTrack,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  presetChipText: {
    fontSize: 12,
    color: ThemeTokens.brandSoftText,
    fontWeight: '600',
  },
  input: {
    backgroundColor: ThemeTokens.background,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: ThemeTokens.textPrimary,
    fontSize: 13.5,
    marginBottom: 6,
  },
  parsedPreviewCard: {
    backgroundColor: ThemeTokens.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginTop: 14,
  },
  parsedPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parsedPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  parsedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  parsedItemLabel: {
    fontSize: 12.5,
    color: ThemeTokens.textTertiary,
  },
  parsedItemValue: {
    fontSize: 12.5,
    color: ThemeTokens.textPrimary,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.incomeText,
    height: 44,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  testButtonDisabled: {
    opacity: 0.4,
  },
  testButtonText: {
    color: '#0D0B1A',
    fontSize: 14,
    fontWeight: '700',
  },
  resultBanner: {
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  resultBannerSuccess: {
    backgroundColor: 'rgba(15, 174, 124, 0.15)',
    borderColor: ThemeTokens.incomeFill,
  },
  resultBannerError: {
    backgroundColor: 'rgba(255, 92, 122, 0.15)',
    borderColor: ThemeTokens.expenseFill,
  },
  resultBannerText: {
    fontSize: 12,
    lineHeight: 16,
  },
  resultBannerTextSuccess: {
    color: ThemeTokens.incomeText,
    fontWeight: '600',
  },
  resultBannerTextError: {
    color: ThemeTokens.expenseText,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.full,
    padding: 2,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  filterToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  filterToggleBtnActive: {
    backgroundColor: ThemeTokens.brandFill,
  },
  filterToggleText: {
    fontSize: 11,
    color: ThemeTokens.textTertiary,
    fontWeight: '600',
  },
  filterToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyHistoryCard: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    marginBottom: 6,
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: ThemeTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 16,
  },
  rawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appBadge: {
    backgroundColor: ThemeTokens.surfaceTrack,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '70%',
  },
  appBadgeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: ThemeTokens.brandSoftText,
  },
  timestampText: {
    fontSize: 11,
    color: ThemeTokens.textTertiary,
  },
  rawContentBox: {
    backgroundColor: ThemeTokens.background,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 12,
  },
  rawTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    marginBottom: 4,
  },
  rawBodyText: {
    fontSize: 12,
    color: ThemeTokens.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  parsedCardSection: {
    borderTopWidth: 1,
    borderTopColor: ThemeTokens.borderSubtle,
    paddingTop: 10,
  },
  parsedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parsedSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeTokens.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  parsedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  parsedGridCol: {
    width: '48%',
  },
  parsedGridColFull: {
    width: '100%',
  },
  gridLabel: {
    fontSize: 11,
    color: ThemeTokens.textTertiary,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
  },
  gridValueSmall: {
    fontSize: 12,
    color: ThemeTokens.textSecondary,
  },
  testItemButton: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.brandFill,
    height: 38,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  testItemButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
