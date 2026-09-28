// frontend/src/app/(tabs)/transaccion/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';
import { transactionsApi, categoriesApi } from '@/services/api';
import { Transaction, Category } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

export type Transaccion = Transaction;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MovimientosScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const monthLabel = useMemo(() => {
    return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  const loadTransactions = async () => {
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

      let typeParam: string | undefined = undefined;
      let categoryIdParam: string | undefined = undefined;

      if (activeFilter === 'ingresos') typeParam = 'ingreso';
      else if (activeFilter === 'gastos') typeParam = 'gasto';
      else if (activeFilter !== 'todas') {
        categoryIdParam = activeFilter;
      }

      const [data, cats] = await Promise.all([
        transactionsApi.getAll({
          type: typeParam,
          categoryId: categoryIdParam,
          startDate,
          endDate,
          limit: 100,
        }),
        categoriesApi.getAll().catch(() => []),
      ]);

      setTransactions(data);
      setCategories(cats);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [activeFilter, selectedDate])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const filterChips = useMemo(() => {
    const base = [
      { key: 'todas', label: 'Todas' },
      { key: 'ingresos', label: 'Ingresos' },
      { key: 'gastos', label: 'Gastos' },
    ];
    const catChips = categories.map((c) => ({
      key: c.id,
      label: c.name,
    }));
    return [...base, ...catChips];
  }, [categories]);

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (tx) =>
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.categoryName && tx.categoryName.toLowerCase().includes(q)) ||
        (tx.cardBanco && tx.cardBanco.toLowerCase().includes(q))
    );
  }, [transactions, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    const groups: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((tx) => {
      const txDateStr = tx.date ? tx.date.substring(0, 10) : todayStr;
      let label = txDateStr;

      if (txDateStr === todayStr) {
        label = 'HOY';
      } else if (txDateStr === yesterdayStr) {
        label = 'AYER';
      } else {
        const parts = txDateStr.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2], 10);
          const mIdx = parseInt(parts[1], 10) - 1;
          label = `${day} DE ${MONTH_NAMES[mIdx]?.toUpperCase() || parts[1]}`;
        }
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Movimientos</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/categoria' as any)}
          >
            <SymbolView
              name={{ ios: 'tag.fill', android: 'label', web: 'label' }}
              size={18}
              tintColor="#8A7FBD"
            />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={18}
          tintColor="#8A7FBD"
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchTextInput}
          placeholder="Buscar por concepto o categoría..."
          placeholderTextColor="#8A7FBD"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              size={18}
              tintColor="#8A7FBD"
            />
          </Pressable>
        )}
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <Pressable style={styles.chevronButton} onPress={handlePrevMonth}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={16}
            tintColor="#8A7FBD"
          />
        </Pressable>
        <Text style={styles.monthText}>{monthLabel}</Text>
        <Pressable style={styles.chevronButton} onPress={handleNextMonth}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor="#8A7FBD"
          />
        </Pressable>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.key;
          return (
            <Pressable
              key={chip.key}
              style={[
                styles.chip,
                isSelected ? styles.chipActive : styles.chipInactive,
              ]}
              onPress={() => setActiveFilter(chip.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Transactions List */}
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
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Sin movimientos</Text>
            <Text style={styles.emptySubtitle}>
              Tus transacciones manuales y de Google Pay para este período aparecerán aquí.
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([dateLabel, items]) => (
            <View key={dateLabel} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{dateLabel}</Text>
              <View style={styles.dateCardContainer}>
                {items.map((tx, idx) => {
                  const isIncome = tx.type === 'ingreso';
                  const isAuto = tx.origin === 'automático_google_pay';
                  return (
                    <Pressable
                      key={tx.id}
                      style={[
                        styles.txItemRow,
                        idx < items.length - 1 && styles.txItemDivider,
                      ]}
                      onPress={() => router.push(`/(tabs)/transaccion/${tx.id}` as any)}
                    >
                      <CategoryIcon
                        name={tx.categoryName || tx.note}
                        color={tx.categoryColor}
                        size={40}
                        iconSize={20}
                        borderRadius={12}
                        style={{ marginRight: 12 }}
                      />
                      <View style={styles.txDetails}>
                        <Text style={styles.txTitle}>{tx.note || tx.categoryName || 'Movimiento'}</Text>
                        <Text style={styles.txSubtitle}>
                          {tx.categoryName || 'General'}
                          {tx.cardBanco ? ` · ${tx.cardBanco}` : ''}
                        </Text>
                      </View>
                      <View style={styles.txAmountContainer}>
                        {isAuto && (
                          <SymbolView
                            name={{ ios: 'wave.3.forward', android: 'contactless', web: 'contactless' }}
                            size={14}
                            tintColor={ThemeTokens.textTertiary}
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isIncome ? ThemeTokens.incomeText : ThemeTokens.expenseText },
                          ]}
                        >
                          {isIncome ? '+' : '-'}${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB: Nueva Transacción */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/transaccion/new' as any)}
      >
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={28}
          tintColor="#FFFFFF"
        />
      </Pressable>
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#17142B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17142B',
    borderWidth: 1,
    borderColor: '#2E2757',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
  },
  searchTextInput: {
    flex: 1,
    color: '#F2EEFC',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  chevronButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F2EEFC',
    marginHorizontal: 16,
  },
  filterChipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
  },
  chipInactive: {
    backgroundColor: '#17142B',
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0D0B1A',
  },
  chipTextInactive: {
    color: '#B4A9E0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7FBD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  dateCardContainer: {
    backgroundColor: '#17142B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2757',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  txItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#241F42',
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F2EEFC',
  },
  txSubtitle: {
    fontSize: 12,
    color: '#8A7FBD',
    marginTop: 2,
  },
  txAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAmount: {
    fontSize: 15.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
});