// frontend/src/app/(tabs)/cards/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';
import { cardsApi } from '@/services/api';
import { Card } from '@/types';

export type { Card };

export default function CardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);

  const loadCards = async () => {
    try {
      const data = await cardsApi.getAll();
      setCards(data);
    } catch (err) {
      console.error('Error cargando tarjetas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCards();
  };

  const toggleGooglePay = async (card: Card) => {
    const updatedStatus = !card.linkedGoogle;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, linkedGoogle: updatedStatus } : c))
    );

    try {
      await cardsApi.update(card.id, { linkedGoogle: updatedStatus });
    } catch (err) {
      console.error('Error actualizando Google Pay en tarjeta:', err);
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, linkedGoogle: card.linkedGoogle } : c))
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tarjetas</Text>
        <Pressable
          style={styles.addCardButton}
          onPress={() => router.push('/(tabs)/cards/new' as any)}
        >
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
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {cards.length > 0
            ? `${cards.length} ${cards.length === 1 ? 'tarjeta guardada' : 'tarjetas guardadas'} para asignar a tus movimientos. Las vinculadas a Google Pay registran el gasto solas.`
            : 'Administra tus tarjetas de crédito y débito. Las vinculadas a Google Pay registran el gasto solas.'}
        </Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={ThemeTokens.brandFill} style={{ marginTop: 40 }} />
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Sin tarjetas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Agrega tus tarjetas de crédito o débito para asignarlas a tus movimientos.
            </Text>
            <Pressable
              style={styles.emptyAddButton}
              onPress={() => router.push('/(tabs)/cards/new' as any)}
            >
              <Text style={styles.emptyAddButtonText}>Agregar tarjeta</Text>
            </Pressable>
          </View>
        ) : (
          cards.map((card) => {
            const isCredit = card.type === 'credito';
            const isNu = (card.banco || '').toLowerCase().includes('nu');
            const isSantander = (card.banco || '').toLowerCase().includes('santander');

            const cardBg = card.color || (isNu ? '#4A154B' : isSantander ? '#1F223D' : '#281654');
            const chipBg = isNu ? '#6B256C' : isSantander ? '#33385E' : '#4B2C8A';
            const chipBorder = isNu ? '#8A328C' : isSantander ? '#484F7F' : '#6039AA';
            const dividerBg = isNu ? '#632065' : isSantander ? '#2C3154' : '#3E2777';

            return (
              <View key={card.id} style={[styles.cardContainer, { backgroundColor: cardBg }]}>
                {/* Top Row: Bank name & metallic chip */}
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={styles.bankName}>{card.banco}</Text>
                    <Text style={styles.cardTypeLabel}>
                      {isCredit ? 'Crédito' : 'Débito'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metallicChip,
                      { backgroundColor: chipBg, borderColor: chipBorder },
                    ]}
                  />
                </View>

                {/* Card Number & Main Account / Limit */}
                <View style={styles.cardNumberRow}>
                  <Text style={styles.cardNumberText}>•••• {card.last4}</Text>
                  {!isCredit && (
                    <Text style={styles.accountLabel}>{card.alias || 'Cuenta principal'}</Text>
                  )}
                </View>

                {/* Credit info if applicable */}
                {isCredit && (
                  <View style={styles.creditInfoRow}>
                    <Text style={styles.creditInfoText}>
                      Corte día {card.cutDay ?? '—'} · Paga antes del {card.payDay ?? '—'}
                    </Text>
                    {card.alias && (
                      <Text style={styles.creditInfoText}>
                        {card.alias}
                      </Text>
                    )}
                  </View>
                )}

                {/* Divider */}
                <View style={[styles.cardDivider, { backgroundColor: dividerBg }]} />

                {/* Bottom Row: Google Pay toggle */}
                <View style={styles.googlePayRow}>
                  <View style={styles.googlePayInfo}>
                    <SymbolView
                      name={{ ios: 'wave.3.forward', android: 'contactless', web: 'contactless' }}
                      size={16}
                      tintColor="#F2EEFC"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.googlePayLabel}>Vinculada a Google Pay</Text>
                  </View>
                  <Switch
                    value={card.linkedGoogle}
                    onValueChange={() => toggleGooglePay(card)}
                    trackColor={{
                      false: '#241F42',
                      true: '#7C3AED',
                    }}
                    thumbColor="#F2EEFC"
                  />
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
    backgroundColor: '#0D0B1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  addCardButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#17142B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8A7FBD',
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  cardTypeLabel: {
    fontSize: 13,
    color: '#B4A9E0',
    marginTop: 2,
  },
  metallicChip: {
    width: 36,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardNumberText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2EEFC',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  accountLabel: {
    fontSize: 13,
    color: '#B4A9E0',
    fontWeight: '500',
  },
  creditInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  creditInfoText: {
    fontSize: 12,
    color: '#B4A9E0',
  },
  cardDivider: {
    height: 1,
    marginBottom: 14,
  },
  googlePayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  googlePayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googlePayLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#F2EEFC',
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
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyAddButtonText: {
    color: '#F2EEFC',
    fontWeight: '700',
    fontSize: 14,
  },
});