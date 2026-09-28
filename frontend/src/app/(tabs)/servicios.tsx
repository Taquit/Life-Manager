// frontend/src/app/(tabs)/servicios.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';
import { servicesApi, categoriesApi, getApiErrorMessage } from '@/services/api';
import { Service, Category } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

export default function ServiciosScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterState, setFilterState] = useState<'todos' | 'pendiente' | 'pagado'>('pendiente');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPayDay, setFormPayDay] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string | null>(null);
  const [formState, setFormState] = useState<'pendiente' | 'pagado'>('pendiente');
  const [savingForm, setSavingForm] = useState(false);

  const loadServices = async () => {
    try {
      const stateParam = filterState === 'todos' ? undefined : filterState;
      const [servicesData, categoriesData] = await Promise.all([
        servicesApi.getAll(stateParam),
        categoriesApi.getAll('gasto').catch(() => []),
      ]);
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error cargando servicios:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [filterState])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleTogglePaid = async (srv: Service) => {
    const isNowPaid = srv.state === 'pagado';
    const newState = isNowPaid ? 'pendiente' : 'pagado';

    setServices((prev) =>
      prev.map((s) => (s.id === srv.id ? { ...s, state: newState } : s))
    );

    try {
      if (!isNowPaid) {
        await servicesApi.markAsPaid(srv.id);
      } else {
        await servicesApi.update(srv.id, { state: 'pendiente' });
      }
    } catch (err) {
      console.error('Error actualizando servicio:', err);
      setServices((prev) =>
        prev.map((s) => (s.id === srv.id ? { ...s, state: srv.state } : s))
      );
      Alert.alert('Error', getApiErrorMessage(err));
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormName('');
    setFormAmount('');
    setFormPayDay('');
    setFormDueDate('');
    setFormCategoryId(null);
    setFormState('pendiente');
    setModalVisible(true);
  };

  const openEditModal = (srv: Service) => {
    setEditingService(srv);
    setFormName(srv.name);
    setFormAmount(srv.amount ? String(srv.amount) : '');
    setFormPayDay(srv.payDay !== null && srv.payDay !== undefined ? String(srv.payDay) : '');
    setFormDueDate(srv.dueDate || '');
    setFormCategoryId(srv.categoryId || null);
    setFormState(srv.state === 'pagado' ? 'pagado' : 'pendiente');
    setModalVisible(true);
  };

  const handleSaveModal = async () => {
    const nameTrimmed = formName.trim();
    if (!nameTrimmed) {
      Alert.alert('Dato requerido', 'Por favor ingresa el nombre del servicio.');
      return;
    }

    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Dato requerido', 'Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    let parsedPayDay: number | null = null;
    if (formPayDay.trim()) {
      const p = parseInt(formPayDay, 10);
      if (isNaN(p) || p < 1 || p > 31) {
        Alert.alert('Día inválido', 'El día de pago debe ser un número entre 1 y 31.');
        return;
      }
      parsedPayDay = p;
    }

    setSavingForm(true);
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, {
          name: nameTrimmed,
          amount: numAmount,
          payDay: parsedPayDay,
          dueDate: formDueDate.trim() || null,
          categoryId: formCategoryId,
          state: formState,
        });
      } else {
        await servicesApi.create({
          name: nameTrimmed,
          amount: numAmount,
          payDay: parsedPayDay,
          dueDate: formDueDate.trim() || null,
          categoryId: formCategoryId,
          state: formState,
        });
      }
      setModalVisible(false);
      loadServices();
    } catch (err: any) {
      console.error('Error guardando servicio:', err);
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeleteService = (srv: Service) => {
    Alert.alert(
      'Eliminar servicio',
      `¿Deseas eliminar el servicio "${srv.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await servicesApi.delete(srv.id);
              setModalVisible(false);
              loadServices();
            } catch (err: any) {
              console.error('Error eliminando servicio:', err);
              Alert.alert('Error', getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const totalPending = useMemo(() => {
    const pendings = services.filter((s) => s.state === 'pendiente');
    return pendings.reduce((acc, s) => acc + s.amount, 0);
  }, [services]);

  const pendingCount = useMemo(() => {
    return services.filter((s) => s.state === 'pendiente').length;
  }, [services]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servicios</Text>
        <Pressable style={styles.addButton} onPress={openCreateModal}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={20}
            tintColor="#F2EEFC"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ThemeTokens.brandFill}
          />
        }
      >
        {/* Hero Card: Este Mes */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>ESTE MES</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroAmount}>
              ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.pendingBadgeText}>
              {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
            </Text>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          {(['todos', 'pendiente', 'pagado'] as const).map((tab) => {
            const isSelected = filterState === tab;
            const label = tab === 'todos' ? 'Todos' : tab === 'pendiente' ? 'Pendientes' : 'Pagados';
            return (
              <Pressable
                key={tab}
                style={[styles.segmentItem, isSelected && styles.segmentItemActive]}
                onPress={() => setFilterState(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected ? styles.segmentTextActive : styles.segmentTextInactive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Eyebrow label */}
        <Text style={styles.sectionEyebrow}>
          {filterState === 'todos' ? 'TODOS LOS SERVICIOS' : filterState === 'pendiente' ? 'PENDIENTES' : 'PAGADOS'}
        </Text>

        {/* List Card Container */}
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay servicios en esta sección</Text>
            <Text style={styles.emptySubtitle}>
              Toca el botón + para registrar tus recibos de luz, agua, suscripciones o renta.
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {services.map((srv, index) => {
              const isPaid = srv.state === 'pagado';
              const dueDateText = srv.payDay
                ? `Día ${srv.payDay} de cada mes`
                : srv.dueDate
                ? (srv.dueDate.toLowerCase().startsWith('vence') ? srv.dueDate : `Vence ${srv.dueDate}`)
                : 'Sin fecha límite';

              return (
                <Pressable
                  key={srv.id}
                  style={[
                    styles.serviceRow,
                    index < services.length - 1 && styles.serviceDivider,
                  ]}
                  onPress={() => openEditModal(srv)}
                >
                  <CategoryIcon
                    name={srv.name}
                    size={42}
                    iconSize={22}
                    borderRadius={12}
                    style={{ marginRight: 14 }}
                  />
                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    <Text style={[styles.serviceDueDate, isPaid && { color: '#0FAE7C' }]}>
                      {isPaid ? 'Pagado este mes' : dueDateText}
                    </Text>
                  </View>
                  <View style={styles.rightActions}>
                    <Text style={styles.serviceAmount}>
                      ${srv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                    <Pressable
                      style={[
                        styles.checkboxCircle,
                        isPaid && styles.checkboxCirclePaid,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTogglePaid(srv);
                      }}
                    >
                      {isPaid && (
                        <SymbolView
                          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                          size={14}
                          tintColor="#0D0B1A"
                        />
                      )}
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal: Crear / Editar Servicio */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar servicio' : 'Nuevo servicio'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={20}
                  tintColor="#8A7FBD"
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* Nombre */}
              <Text style={styles.inputLabel}>Nombre del servicio</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. CFE, Netflix, Renta"
                placeholderTextColor="#6E6494"
                value={formName}
                onChangeText={setFormName}
              />

              {/* Monto */}
              <Text style={styles.inputLabel}>Monto ($)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor="#6E6494"
                keyboardType="decimal-pad"
                value={formAmount}
                onChangeText={setFormAmount}
              />

              {/* Día de pago mensual */}
              <Text style={styles.inputLabel}>Día de pago recurrente (1 - 31)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. 15 (opcional)"
                placeholderTextColor="#6E6494"
                keyboardType="number-pad"
                value={formPayDay}
                onChangeText={setFormPayDay}
              />

              {/* Fecha de vencimiento específica */}
              <Text style={styles.inputLabel}>Fecha de vencimiento (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6E6494"
                value={formDueDate}
                onChangeText={setFormDueDate}
              />

              {/* Estado (solo en edición o creación) */}
              <Text style={styles.inputLabel}>Estado inicial</Text>
              <View style={styles.stateSelector}>
                <Pressable
                  style={[styles.stateOption, formState === 'pendiente' && styles.stateOptionActivePending]}
                  onPress={() => setFormState('pendiente')}
                >
                  <Text style={[styles.stateOptionText, formState === 'pendiente' && styles.stateOptionTextActive]}>
                    Pendiente
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.stateOption, formState === 'pagado' && styles.stateOptionActivePaid]}
                  onPress={() => setFormState('pagado')}
                >
                  <Text style={[styles.stateOptionText, formState === 'pagado' && styles.stateOptionTextActive]}>
                    Pagado
                  </Text>
                </Pressable>
              </View>

              {/* Selector de Categoría */}
              {categories.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Categoría</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
                    <Pressable
                      style={[
                        styles.categoryChip,
                        formCategoryId === null && styles.categoryChipActive,
                      ]}
                      onPress={() => setFormCategoryId(null)}
                    >
                      <Text style={[styles.categoryChipText, formCategoryId === null && styles.categoryChipTextActive]}>
                        General
                      </Text>
                    </Pressable>
                    {categories.map((cat) => {
                      const isSelected = formCategoryId === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          style={[
                            styles.categoryChip,
                            isSelected && { backgroundColor: cat.color || ThemeTokens.brandFill, borderColor: cat.color || ThemeTokens.brandFill },
                          ]}
                          onPress={() => setFormCategoryId(cat.id)}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              isSelected && { color: '#0D0B1A', fontWeight: '700' },
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Botón Guardar */}
              <Pressable
                style={[styles.primaryModalButton, savingForm && { opacity: 0.7 }]}
                onPress={handleSaveModal}
                disabled={savingForm}
              >
                {savingForm ? (
                  <ActivityIndicator color="#F2EEFC" />
                ) : (
                  <Text style={styles.primaryModalButtonText}>
                    {editingService ? 'Guardar cambios' : 'Crear servicio'}
                  </Text>
                )}
              </Pressable>

              {/* Botón Eliminar (solo en modo edición) */}
              {editingService && (
                <Pressable
                  style={styles.deleteModalButton}
                  onPress={() => handleDeleteService(editingService)}
                >
                  <Text style={styles.deleteModalButtonText}>Eliminar servicio</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0B1A',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#17142B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: '#1D1711',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4A3515',
    marginBottom: 20,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFC94D',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
  },
  pendingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFC94D',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#17142B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2757',
    padding: 4,
    height: 48,
    marginBottom: 24,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#9B6BFF',
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#0D0B1A',
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: '#B4A9E0',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7FBD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: '#17142B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2757',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#241F42',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F2EEFC',
    marginBottom: 3,
  },
  serviceDueDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFC94D',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
    marginRight: 14,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A4178',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCirclePaid: {
    backgroundColor: '#0FAE7C',
    borderColor: '#0FAE7C',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F2EEFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A7FBD',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 4, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#17142B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#2E2757',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  modalCloseButton: {
    padding: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#B4A9E0',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#0D0B1A',
    borderWidth: 1,
    borderColor: '#2E2757',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F2EEFC',
    fontSize: 15,
  },
  stateSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  stateOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0D0B1A',
    borderWidth: 1,
    borderColor: '#2E2757',
    alignItems: 'center',
  },
  stateOptionActivePending: {
    backgroundColor: '#3A2B12',
    borderColor: '#FFC94D',
  },
  stateOptionActivePaid: {
    backgroundColor: '#0F3324',
    borderColor: '#0FAE7C',
  },
  stateOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7FBD',
  },
  stateOptionTextActive: {
    color: '#F2EEFC',
    fontWeight: '700',
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0D0B1A',
    borderWidth: 1,
    borderColor: '#2E2757',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#B4A9E0',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#F2EEFC',
    fontWeight: '700',
  },
  primaryModalButton: {
    backgroundColor: '#7C3AED',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryModalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  deleteModalButton: {
    backgroundColor: 'rgba(255, 92, 122, 0.1)',
    borderWidth: 1,
    borderColor: '#FF5C7A',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  deleteModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5C7A',
  },
});