// frontend/src/app/(tabs)/transaccion/new.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { transactionsApi, categoriesApi, cardsApi, getApiErrorMessage } from '@/services/api';
import { Category, Card } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function NuevaTransaccionScreen() {
  const router = useRouter();

  const [txType, setTxType] = useState<'gasto' | 'ingreso'>('gasto');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll().catch(() => []),
      cardsApi.getAll().catch(() => []),
    ]).then(([catList, cardList]) => {
      setCategories(catList);
      setCards(cardList);
      if (catList.length > 0) {
        const firstMatching = catList.find((c) => !c.type || c.type.toLowerCase() === txType);
        if (firstMatching) setSelectedCategoryId(firstMatching.id);
      }
      if (cardList.length > 0) {
        setSelectedCardId(cardList[0].id);
      }
      setLoading(false);
    });
  }, [txType]);

  const displayedCategories = useMemo(() => {
    return categories.filter((c) => !c.type || c.type.toLowerCase() === txType);
  }, [categories, txType]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  const dynamicDateText = useMemo(() => {
    const now = new Date();
    return `Hoy, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;
  }, []);

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Monto requerido', 'Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      await transactionsApi.create({
        amount: numAmount,
        type: txType,
        categoryId: selectedCategoryId || null,
        cardId: selectedCardId || null,
        note: note.trim() || null,
        origin: 'manual',
      });
      router.back();
    } catch (err: any) {
      console.error('Error guardando transacción:', err);
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const isGasto = txType === 'gasto';
  const dynamicColor = isGasto ? '#D6294B' : '#0FAE7C';
  const dynamicTextColor = isGasto ? '#FF5C7A' : '#39FFC4';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerActionLeft}>
          <Text style={styles.headerCancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nueva transacción</Text>
        <Pressable onPress={handleSave} style={styles.headerActionRight} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#B84FFF" />
          ) : (
            <Text style={styles.headerSaveText}>Guardar</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Informative text */}
        <Text style={styles.infoText}>
          Las compras con tarjetas vinculadas a Google Pay se agregan solas. Usa este formulario para registrar efectivo, transferencias u otras compras.
        </Text>

        {/* Segmented Control: Gasto / Ingreso */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentItem,
              isGasto && { backgroundColor: '#D6294B' },
            ]}
            onPress={() => setTxType('gasto')}
          >
            <Text
              style={[
                styles.segmentText,
                isGasto ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Gasto
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentItem,
              !isGasto && { backgroundColor: '#0FAE7C' },
            ]}
            onPress={() => setTxType('ingreso')}
          >
            <Text
              style={[
                styles.segmentText,
                !isGasto ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Ingreso
            </Text>
          </Pressable>
        </View>

        {/* Amount Display */}
        <View style={styles.amountDisplayContainer}>
          <Text style={styles.amountEyebrow}>
            {isGasto ? 'MONTO DEL GASTO' : 'MONTO DEL INGRESO'}
          </Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currencySymbol, { color: dynamicTextColor }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: dynamicTextColor }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#6E6494"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Categoría</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategoryId === null && styles.categoryChipSelectedDefault,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === null && styles.categoryChipTextActiveDefault,
                ]}
              >
                Sin categoría
              </Text>
            </Pressable>

            {displayedCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && {
                      backgroundColor: cat.color || '#7C3AED',
                      borderColor: cat.color || '#7C3AED',
                    },
                  ]}
                  onPress={() =>
                    setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)
                  }
                >
                  <CategoryIcon
                    name={cat.name}
                    color={isSelected ? '#0D0B1A' : cat.color}
                    size={20}
                    iconSize={12}
                    borderRadius={5}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* Nueva Category Chip */}
            <Pressable
              style={styles.newCategoryChip}
              onPress={() => router.push('/(tabs)/categoria/new' as any)}
            >
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={14}
                tintColor="#8A7FBD"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.newCategoryChipText}>Nueva</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Tarjeta */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Tarjeta (opcional)</Text>
          <Pressable
            style={styles.dropdownSelector}
            onPress={() => {
              if (cards.length > 0) {
                const nextIdx = (cards.findIndex((c) => c.id === selectedCardId) + 1) % (cards.length + 1);
                if (nextIdx === cards.length) {
                  setSelectedCardId(null);
                } else {
                  setSelectedCardId(cards[nextIdx].id);
                }
              }
            }}
          >
            <View style={styles.dropdownLeft}>
              {selectedCard ? (
                <>
                  <View
                    style={[
                      styles.cardSquircleSmall,
                      { backgroundColor: selectedCard.color || '#7C3AED' },
                    ]}
                  />
                  <Text style={styles.dropdownText}>
                    {selectedCard.banco} • • • • {selectedCard.last4}
                  </Text>
                </>
              ) : (
                <Text style={[styles.dropdownText, { color: '#8A7FBD' }]}>
                  {cards.length === 0 ? 'Sin tarjetas disponibles (Efectivo/Otro)' : 'Efectivo / Ninguna tarjeta seleccionada'}
                </Text>
              )}
            </View>
            <SymbolView
              name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
              size={18}
              tintColor="#8A7FBD"
            />
          </Pressable>
        </View>

        {/* Fecha */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Fecha</Text>
          <View style={styles.dropdownSelector}>
            <View style={styles.dropdownLeft}>
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                size={18}
                tintColor="#8A7FBD"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.dropdownText}>{dynamicDateText}</Text>
            </View>
          </View>
        </View>

        {/* Nota */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Nota</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Agregar nota (opcional)"
            placeholderTextColor="#6E6494"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Bottom Save Button */}
        <Pressable
          style={[styles.saveButton, { backgroundColor: dynamicColor }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#F2EEFC" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isGasto ? 'Guardar gasto' : 'Guardar ingreso'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
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
  headerActionLeft: {
    paddingVertical: 4,
  },
  headerCancelText: {
    fontSize: 15,
    color: '#B84FFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  headerActionRight: {
    paddingVertical: 4,
  },
  headerSaveText: {
    fontSize: 15,
    color: '#B84FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A7FBD',
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#17142B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2757',
    padding: 4,
    height: 48,
    marginBottom: 28,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#F2EEFC',
  },
  segmentTextInactive: {
    color: '#8A7FBD',
  },
  amountDisplayContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  amountEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7FBD',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 140,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F2EEFC',
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17142B',
    borderWidth: 1,
    borderColor: '#2E2757',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  categoryChipSelectedDefault: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7FBD',
  },
  categoryChipTextActive: {
    color: '#0D0B1A',
    fontWeight: '700',
  },
  categoryChipTextActiveDefault: {
    color: '#F2EEFC',
    fontWeight: '700',
  },
  newCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4A4178',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  newCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7FBD',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#17142B',
    borderWidth: 1,
    borderColor: '#2E2757',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSquircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F2EEFC',
  },
  textInput: {
    backgroundColor: '#17142B',
    borderWidth: 1,
    borderColor: '#2E2757',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F2EEFC',
    fontSize: 14.5,
  },
  saveButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#F2EEFC',
    fontSize: 16,
    fontWeight: '700',
  },
});