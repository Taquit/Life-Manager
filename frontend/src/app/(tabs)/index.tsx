// frontend/src/app/(tabs)/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';
import { transactionsApi, servicesApi, userApi } from '@/services/api';
import { Transaction, Service, MonthlySummary, User } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function InicioScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const currentDateInfo = useMemo(() => {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];
    const year = now.getFullYear();
    const monthIso = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      monthName,
      year,
      monthIso,
      headerDate: `${monthName} ${year}`,
      heroLabel: `BALANCE DE ${monthName.toUpperCase()} ${year}`,
    };
  }, []);

  const loadData = async () => {
    try {
      const [userRes, sumRes, srvRes, txRes] = await Promise.all([
        userApi.getProfile().catch(() => null),
        transactionsApi.getSummary(currentDateInfo.monthIso).catch(() => null),
        servicesApi.getAll('pendiente').catch(() => []),
        transactionsApi.getAll({ limit: 5 }).catch(() => []),
      ]);
      if (userRes) setUser(userRes);
      if (sumRes) setSummary(sumRes);
      setServices(srvRes);
      setRecentTransactions(txRes);
    } catch (err) {
      console.error('Error cargando datos de inicio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentDateInfo.monthIso])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const netBalance = summary?.netBalance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const topCategories = summary?.categoryBreakdown && summary.categoryBreakdown.length > 0
    ? summary.categoryBreakdown.slice(0, 3)
    : [];

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const greeting = user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Hola';

  return (
    <SafeAreaView style={styles.safeArea}>
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
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{greeting}</Text>
            <Text style={styles.headerDate}>{currentDateInfo.headerDate}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Hero Card: Balance */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>{currentDateInfo.heroLabel}</Text>
              <Text style={styles.heroAmount}>
                ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>

              <View style={styles.balanceDivider} />

              <View style={styles.balanceBreakdown}>
                <View style={styles.breakdownCol}>
                  <View style={styles.breakdownHeaderRow}>
                    <SymbolView
                      name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
                      size={14}
                      tintColor={ThemeTokens.incomeText}
                      style={styles.arrowIcon}
                    />
                    <Text style={styles.breakdownLabel}>Ingresos</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>
                    +${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.breakdownCol}>
                  <View style={styles.breakdownHeaderRow}>
                    <SymbolView
                      name={{ ios: 'arrow.down', android: 'arrow_downward', web: 'arrow_downward' }}
                      size={14}
                      tintColor={ThemeTokens.expenseText}
                      style={styles.arrowIcon}
                    />
                    <Text style={styles.breakdownLabel}>Gastos</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>
                    -${totalExpense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Upcoming Services */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos servicios</Text>
              <Pressable onPress={() => router.push('/(tabs)/servicios' as any)}>
                <Text style={styles.seeAllLink}>Ver todos</Text>
              </Pressable>
            </View>

            {services.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No tienes servicios pendientes para este mes</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              >
                {services.map((srv) => (
                  <View key={srv.id} style={styles.serviceCard}>
                    <CategoryIcon name={srv.name} size={40} iconSize={20} borderRadius={12} />
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {srv.name}
                    </Text>
                    <Text style={styles.serviceDueDate}>
                      {srv.payDay
                        ? `Día ${srv.payDay}`
                        : srv.dueDate
                        ? (srv.dueDate.toLowerCase().startsWith('vence') ? srv.dueDate : `Vence ${srv.dueDate}`)
                        : 'Pronto'}
                    </Text>
                    <Text style={styles.serviceAmount}>
                      ${srv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Categories of the Month */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorías del mes</Text>
              <Pressable onPress={() => router.push('/(tabs)/reportes' as any)}>
                <Text style={styles.seeAllLink}>Ver reporte</Text>
              </Pressable>
            </View>

            {topCategories.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No hay gastos registrados en este período</Text>
              </View>
            ) : (
              <View style={styles.categoriesCard}>
                {topCategories.map((cat, index) => (
                  <View
                    key={cat.categoryId}
                    style={[
                      styles.categoryRow,
                      index < topCategories.length - 1 && { marginBottom: 16 },
                    ]}
                  >
                    <View style={styles.categoryInfo}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: cat.categoryColor || '#FF9142' },
                        ]}
                      />
                      <Text style={styles.categoryName}>{cat.categoryName}</Text>
                      <Text style={styles.categoryAmount}>
                        ${cat.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: cat.categoryColor || '#FF9142',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Transactions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Movimientos recientes</Text>
              <Pressable onPress={() => router.push('/(tabs)/transaccion' as any)}>
                <Text style={styles.seeAllLink}>Ver todos</Text>
              </Pressable>
            </View>

            {recentTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No hay movimientos recientes registrados</Text>
              </View>
            ) : (
              <View style={styles.transactionsCard}>
                {recentTransactions.map((tx, index) => {
                  const isIncome = tx.type === 'ingreso';
                  const isAuto = tx.origin === 'automático_google_pay';
                  return (
                    <Pressable
                      key={tx.id}
                      style={[
                        styles.txItemRow,
                        index < recentTransactions.length - 1 && styles.txItemDivider,
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
            )}
          </>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  headerDate: {
    fontSize: 14,
    color: '#B4A9E0',
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#26134D',
    borderWidth: 1,
    borderColor: '#2E2757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C7A9FF',
  },
  heroCard: {
    backgroundColor: '#26134D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2757',
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B4A9E0',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#2E2757',
    marginBottom: 16,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  arrowIcon: {
    marginRight: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#B4A9E0',
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
  },
  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2E2757',
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#B84FFF',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#17142B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2757',
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    color: '#8A7FBD',
    textAlign: 'center',
  },
  carouselContainer: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 16,
  },
  serviceCard: {
    width: 150,
    backgroundColor: '#17142B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2EEFC',
    marginTop: 10,
    marginBottom: 4,
  },
  serviceDueDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC94D',
    marginBottom: 8,
  },
  serviceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
  },
  categoriesCard: {
    backgroundColor: '#17142B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2E2757',
    marginBottom: 24,
  },
  categoryRow: {
    gap: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#F2EEFC',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F2EEFC',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#241F42',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  transactionsCard: {
    backgroundColor: '#17142B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2E2757',
    marginBottom: 20,
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