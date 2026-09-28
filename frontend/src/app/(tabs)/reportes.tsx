import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { transactionsApi } from '@/services/api';
import { MonthlySummary } from '@/types';

export default function ReportesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7)
  );

  const loadSummary = async () => {
    try {
      const data = await transactionsApi.getSummary(selectedMonth);
      setSummary(data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [selectedMonth])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  const changeMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    const newMonthStr = date.toISOString().substring(0, 7);
    setSelectedMonth(newMonthStr);
  };

  const netBalance = summary?.netBalance ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const breakdown = summary?.categoryBreakdown || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes Financieros</Text>
      </View>

      {/* Month Navigator */}
      <View style={styles.monthSelector}>
        <Pressable style={styles.monthNavButton} onPress={() => changeMonth(-1)}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={18}
            tintColor={ThemeTokens.textPrimary}
          />
        </Pressable>
        <Text style={styles.monthText}>{selectedMonth}</Text>
        <Pressable style={styles.monthNavButton} onPress={() => changeMonth(1)}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={18}
            tintColor={ThemeTokens.textPrimary}
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
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Net Balance Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>BALANCE NETO</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  {
                    color:
                      netBalance >= 0 ? ThemeTokens.incomeText : ThemeTokens.expenseText,
                  },
                ]}
              >
                ${netBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Income vs Expenses Comparison */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>INGRESOS VS GASTOS</Text>

              <View style={styles.comparisonRow}>
                <View style={styles.comparisonCol}>
                  <Text style={styles.comparisonLabel}>Ingresos</Text>
                  <Text style={[styles.comparisonAmount, { color: ThemeTokens.incomeText }]}>
                    ${totalIncome.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.comparisonCol}>
                  <Text style={styles.comparisonLabel}>Gastos</Text>
                  <Text style={[styles.comparisonAmount, { color: ThemeTokens.expenseText }]}>
                    ${totalExpense.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Visual ratio bar */}
              <View style={styles.ratioBarContainer}>
                {totalIncome + totalExpense > 0 ? (
                  <>
                    <View
                      style={[
                        styles.ratioBarIncome,
                        {
                          flex: Math.max(totalIncome, 0.001),
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.ratioBarExpense,
                        {
                          flex: Math.max(totalExpense, 0.001),
                        },
                      ]}
                    />
                  </>
                ) : (
                  <View style={styles.ratioBarEmpty} />
                )}
              </View>
              {totalExpense > totalIncome && (
                <View style={styles.expenseWarningBanner}>
                  <SymbolView
                    name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
                    size={20}
                    tintColor={ThemeTokens.expenseText}
                  />
                  <Text style={styles.expenseWarningText}>
                    Atención: Tus gastos superan los ingresos este mes.
                  </Text>
                </View>
              )}
            </View>

            {/* Distribucion y Presupuestos por Categoria */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>DISTRIBUCIÓN Y PRESUPUESTOS</Text>

              {breakdown.length === 0 ? (
                <Text style={styles.emptyBreakdownText}>
                  No se registraron gastos en este periodo
                </Text>
              ) : (
                <View style={styles.breakdownList}>
                  {breakdown.map((item) => {
                    const hasBudget = typeof item.budget === 'number' && item.budget > 0;
                    const budgetRatio = hasBudget ? (item.totalAmount / (item.budget as number)) * 100 : item.percentage;
                    const isExceeded = hasBudget && budgetRatio >= 100;
                    const isWarning = hasBudget && budgetRatio >= 80 && budgetRatio < 100;

                    let barColor = item.categoryColor || ThemeTokens.brandFill;
                    if (isExceeded) barColor = ThemeTokens.expenseText;
                    else if (isWarning) barColor = ThemeTokens.pendingText;

                    return (
                      <View key={item.categoryId} style={styles.breakdownItem}>
                        <View style={styles.breakdownHeader}>
                          <View style={styles.breakdownCatInfo}>
                            <View
                              style={[
                                styles.catDot,
                                { backgroundColor: item.categoryColor || ThemeTokens.brandFill },
                              ]}
                            />
                            <Text style={styles.catName}>{item.categoryName}</Text>
                          </View>

                          <View style={styles.amountBadgeRow}>
                            {isExceeded && (
                              <View style={styles.exceededBadge}>
                                <Text style={styles.exceededBadgeText}>100%+ Excedido</Text>
                              </View>
                            )}
                            {isWarning && (
                              <View style={styles.warningBadge}>
                                <Text style={styles.warningBadgeText}>80%+ Alerta</Text>
                              </View>
                            )}
                            <Text style={styles.catAmount}>
                              ${item.totalAmount.toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.budgetSubHeader}>
                          <Text style={styles.budgetDetailText}>
                            {hasBudget
                              ? `Presupuesto: $${(item.budget as number).toFixed(2)} (${budgetRatio.toFixed(0)}%)`
                              : `Porcentaje del gasto: ${item.percentage}%`}
                          </Text>
                        </View>

                        <View style={styles.track}>
                          <View
                            style={[
                              styles.fill,
                              {
                                width: `${Math.min(budgetRatio, 100)}%`,
                                backgroundColor: barColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ThemeTokens.textPrimary,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: ThemeTokens.surface,
    marginHorizontal: 20,
    borderRadius: Radii.button,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radii.full,
    backgroundColor: ThemeTokens.surfaceTrack,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 14,
  },
  card: {
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeTokens.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  comparisonCol: {
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 12,
    color: ThemeTokens.textSecondary,
  },
  comparisonAmount: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: Radii.full,
    overflow: 'hidden',
    backgroundColor: ThemeTokens.surfaceTrack,
  },
  ratioBarIncome: {
    backgroundColor: ThemeTokens.incomeText,
  },
  ratioBarExpense: {
    backgroundColor: ThemeTokens.expenseText,
  },
  ratioBarEmpty: {
    flex: 1,
    backgroundColor: ThemeTokens.surfaceTrack,
  },
  emptyBreakdownText: {
    fontSize: 13,
    color: ThemeTokens.textTertiary,
    marginTop: 6,
  },
  breakdownList: {
    gap: 14,
  },
  breakdownItem: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  catName: {
    fontSize: 13.5,
    color: ThemeTokens.textPrimary,
  },
  catAmount: {
    fontSize: 13,
    color: ThemeTokens.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    backgroundColor: ThemeTokens.surfaceTrack,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  amountBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetailText: {
    fontSize: 11.5,
    color: ThemeTokens.textSecondary,
  },
  exceededBadge: {
    backgroundColor: ThemeTokens.overdueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: ThemeTokens.expenseText,
  },
  exceededBadgeText: {
    color: ThemeTokens.expenseText,
    fontSize: 10,
    fontWeight: '700',
  },
  warningBadge: {
    backgroundColor: ThemeTokens.pendingBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: ThemeTokens.pendingText,
  },
  warningBadgeText: {
    color: ThemeTokens.pendingText,
    fontSize: 10,
    fontWeight: '700',
  },
  expenseWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeTokens.overdueBg,
    borderWidth: 1,
    borderColor: ThemeTokens.expenseFill,
    borderRadius: Radii.card,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  expenseWarningText: {
    flex: 1,
    fontSize: 12.5,
    color: ThemeTokens.expenseText,
    fontWeight: '600',
    lineHeight: 16,
  },
});
