import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeTokens, Radii } from '@/constants/theme';
import { transactionsApi, categoriesApi, cardsApi, getApiErrorMessage } from '@/services/api';
import { Transaction, Category, Card } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

export default function EditTransaccionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [itemData, setItemData] = useState<Partial<Transaction>>({
    id: '',
    note: '',
    amount: 0,
    origin: 'manual',
    categoryId: null,
    cardId: null,
  });

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amountStr, setAmountStr] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll().catch(() => []),
      cardsApi.getAll().catch(() => []),
    ]).then(([catList, cardList]) => {
      setCategories(catList);
      setCards(cardList);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchItem = async () => {
        if (!id) return;
        try {
          setIsLoading(true);
          const item = await transactionsApi.getById(id);
          if (item) {
            setItemData(item);
            setAmountStr(String(item.amount));
            if (item.date) setDate(new Date(item.date));
          }
        } catch (error) {
          console.error('Error obteniendo movimiento:', error);
          Alert.alert('Error', getApiErrorMessage(error));
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }, [id])
  );

  const isAuto = itemData.origin === 'automático_google_pay';

  const handleSave = async () => {
    if (!id) return;
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
      return;
    }

    try {
      setIsSaving(true);
      await transactionsApi.update(id, {
        amount: parsedAmount,
        note: itemData.note || null,
        categoryId: itemData.categoryId ?? null,
        cardId: itemData.cardId ?? null,
        origin: isAuto ? 'automático_google_pay' : 'manual',
        date: date.toISOString(),
      });
      router.back();
    } catch (error) {
      console.error('Error editando movimiento:', error);
      Alert.alert('Error', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Movimiento',
      '¿Estás seguro de que deseas eliminar este movimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              setIsDeleting(true);
              await transactionsApi.delete(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

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
        <Text style={styles.headerTitle}>Editar Movimiento</Text>
        <Pressable onPress={handleDelete} style={styles.deleteIconButton} disabled={isDeleting}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={20}
            tintColor={ThemeTokens.expenseText}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Monto */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Monto ($)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              placeholderTextColor={ThemeTokens.placeholder}
            />
          </View>

          {/* Concepto / Nota */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Concepto o nota</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Despensa, Gasolina, Cena..."
              placeholderTextColor={ThemeTokens.placeholder}
              value={itemData.note || ''}
              onChangeText={(text) => setItemData({ ...itemData, note: text })}
            />
          </View>

          {/* Categoría */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              <Pressable
                style={[
                  styles.chip,
                  itemData.categoryId === null && styles.chipActive,
                ]}
                onPress={() => setItemData({ ...itemData, categoryId: null })}
              >
                <Text style={[styles.chipText, itemData.categoryId === null && styles.chipTextActive]}>
                  Sin categoría
                </Text>
              </Pressable>
              {categories.map((cat) => {
                const isSelected = itemData.categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: cat.color || ThemeTokens.brandFill, borderColor: cat.color || ThemeTokens.brandFill },
                    ]}
                    onPress={() => setItemData({ ...itemData, categoryId: cat.id })}
                  >
                    <CategoryIcon
                      name={cat.name}
                      color={isSelected ? '#0D0B1A' : cat.color}
                      size={20}
                      iconSize={12}
                      borderRadius={5}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, isSelected && { color: '#0D0B1A', fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tarjeta */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Tarjeta asociada</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
              <Pressable
                style={[
                  styles.chip,
                  itemData.cardId === null && styles.chipActive,
                ]}
                onPress={() => setItemData({ ...itemData, cardId: null })}
              >
                <Text style={[styles.chipText, itemData.cardId === null && styles.chipTextActive]}>
                  Efectivo / Ninguna
                </Text>
              </Pressable>
              {cards.map((card) => {
                const isSelected = itemData.cardId === card.id;
                return (
                  <Pressable
                    key={card.id}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: card.color || ThemeTokens.brandFill, borderColor: card.color || ThemeTokens.brandFill },
                    ]}
                    onPress={() => setItemData({ ...itemData, cardId: card.id })}
                  >
                    <Text style={[styles.chipText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                      {card.banco} (•••• {card.last4})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Fecha */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Fecha</Text>
            <Pressable style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <SymbolView
                name={{ ios: 'calendar', android: 'event', web: 'event' }}
                size={18}
                tintColor={ThemeTokens.textSecondary}
              />
              <Text style={styles.datePickerText}>{date.toLocaleDateString('es-MX')}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
          </View>

          {/* Switch Google Pay */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <SymbolView
                name={{ ios: 'wave.3.forward', android: 'contactless', web: 'contactless' }}
                size={20}
                tintColor={ThemeTokens.brandSoftText}
              />
              <Text style={styles.switchLabel}>Pago con Google Pay</Text>
            </View>
            <Switch
              value={isAuto}
              onValueChange={(val) =>
                setItemData({ ...itemData, origin: val ? 'automático_google_pay' : 'manual' })
              }
              trackColor={{ false: ThemeTokens.surfaceTrack, true: ThemeTokens.brandFill }}
              thumbColor={isAuto ? ThemeTokens.incomeText : ThemeTokens.placeholder}
            />
          </View>

          {/* Botón Guardar */}
          <Pressable
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#F2EEFC" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
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
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fieldSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeTokens.textSecondary,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    borderRadius: Radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: ThemeTokens.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textInput: {
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    borderRadius: Radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: ThemeTokens.textPrimary,
    fontSize: 15,
  },
  horizontalChips: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: ThemeTokens.brandFill,
    borderColor: ThemeTokens.brandFill,
  },
  chipText: {
    fontSize: 13,
    color: ThemeTokens.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#F2EEFC',
    fontWeight: '700',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    borderRadius: Radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  datePickerText: {
    fontSize: 15,
    color: ThemeTokens.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginBottom: 28,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ThemeTokens.textPrimary,
  },
  saveButton: {
    backgroundColor: ThemeTokens.brandFill,
    paddingVertical: 16,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#F2EEFC',
    fontSize: 16,
    fontWeight: '700',
  },
});
