import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { cardsApi, getApiErrorMessage } from '@/services/api';
import { Card } from '@/types';

const COLOR_OPTIONS = [
  '#7C3AED', // Brand Purple
  '#39FFC4', // Neon Green
  '#4D9EFF', // Neon Blue
  '#FF5C7A', // Neon Red/Pink
  '#FF9142', // Neon Orange
  '#FFD23F', // Neon Yellow
];

export default function EditCardPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [itemData, setItemData] = useState<Partial<Card>>({
    id: '',
    banco: '',
    alias: '',
    last4: '',
    type: 'debito',
    color: '#7C3AED',
    linkedGoogle: false,
    cutDay: null,
    payDay: null,
  });

  const [cutDayStr, setCutDayStr] = useState('');
  const [payDayStr, setPayDayStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchItem = async () => {
        if (!id) return;
        try {
          setIsLoading(true);
          const card = await cardsApi.getById(id);
          if (card) {
            setItemData(card);
            setCutDayStr(card.cutDay ? String(card.cutDay) : '');
            setPayDayStr(card.payDay ? String(card.payDay) : '');
          }
        } catch (error) {
          console.error('Error obteniendo tarjeta:', error);
          Alert.alert('Error', getApiErrorMessage(error));
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }, [id])
  );

  const isCredit = itemData.type === 'credito';

  const handleSave = async () => {
    if (!id) return;
    if (!itemData.banco?.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del banco o emisor');
      return;
    }
    if (!itemData.last4 || !/^\d{4}$/.test(itemData.last4.trim())) {
      Alert.alert('Error', 'Debes ingresar los últimos 4 dígitos numéricos');
      return;
    }

    try {
      setIsSaving(true);
      await cardsApi.update(id, {
        banco: itemData.banco.trim(),
        alias: itemData.alias?.trim() || null,
        last4: itemData.last4.trim(),
        type: itemData.type,
        color: itemData.color || '#7C3AED',
        linkedGoogle: itemData.linkedGoogle ?? false,
        cutDay: isCredit && cutDayStr.trim() ? parseInt(cutDayStr, 10) : null,
        payDay: isCredit && payDayStr.trim() ? parseInt(payDayStr, 10) : null,
      });
      router.back();
    } catch (error) {
      console.error('Error editando tarjeta:', error);
      Alert.alert('Error', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Tarjeta',
      `¿Deseas eliminar la tarjeta ${itemData.banco} (•••• ${itemData.last4})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              setIsDeleting(true);
              await cardsApi.delete(id);
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
        <Text style={styles.headerTitle}>Editar Tarjeta</Text>
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
          {/* Segmented Control Tipo */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segmentItem, !isCredit && styles.segmentItemActive]}
              onPress={() => setItemData({ ...itemData, type: 'debito' })}
            >
              <Text style={[styles.segmentText, !isCredit && styles.segmentTextActive]}>
                Débito
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, isCredit && styles.segmentItemActive]}
              onPress={() => setItemData({ ...itemData, type: 'credito' })}
            >
              <Text style={[styles.segmentText, isCredit && styles.segmentTextActive]}>
                Crédito
              </Text>
            </Pressable>
          </View>

          {/* Banco */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Banco o Institución</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: BBVA, Santander, Nu..."
              placeholderTextColor={ThemeTokens.placeholder}
              value={itemData.banco || ''}
              onChangeText={(text) => setItemData({ ...itemData, banco: text })}
            />
          </View>

          {/* Alias */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Alias / Nombre para identificarla</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Tarjeta Nómina, Gastos Diarios..."
              placeholderTextColor={ThemeTokens.placeholder}
              value={itemData.alias || ''}
              onChangeText={(text) => setItemData({ ...itemData, alias: text })}
            />
          </View>

          {/* Últimos 4 dígitos */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Últimos 4 dígitos</Text>
            <TextInput
              style={styles.textInput}
              placeholder="4321"
              placeholderTextColor={ThemeTokens.placeholder}
              maxLength={4}
              keyboardType="number-pad"
              value={itemData.last4 || ''}
              onChangeText={(text) => setItemData({ ...itemData, last4: text })}
            />
          </View>

          {/* Datos de Crédito si aplica */}
          {isCredit && (
            <View style={styles.creditRow}>
              <View style={[styles.fieldSection, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Día de corte</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: 15"
                  placeholderTextColor={ThemeTokens.placeholder}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={cutDayStr}
                  onChangeText={setCutDayStr}
                />
              </View>
              <View style={[styles.fieldSection, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>Día límite de pago</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: 5"
                  placeholderTextColor={ThemeTokens.placeholder}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={payDayStr}
                  onChangeText={setPayDayStr}
                />
              </View>
            </View>
          )}

          {/* Switch Google Pay */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <SymbolView
                name={{ ios: 'wave.3.forward', android: 'contactless', web: 'contactless' }}
                size={20}
                tintColor={ThemeTokens.brandSoftText}
              />
              <Text style={styles.switchLabel}>Vinculada a Google Pay</Text>
            </View>
            <Switch
              value={Boolean(itemData.linkedGoogle)}
              onValueChange={(val) => setItemData({ ...itemData, linkedGoogle: val })}
              trackColor={{ false: ThemeTokens.surfaceTrack, true: ThemeTokens.brandFill }}
              thumbColor={itemData.linkedGoogle ? ThemeTokens.incomeText : ThemeTokens.placeholder}
            />
          </View>

          {/* Selector de Color */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Color de la tarjeta</Text>
            <View style={styles.colorsGrid}>
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    itemData.color === c && styles.colorCircleSelected,
                  ]}
                  onPress={() => setItemData({ ...itemData, color: c })}
                />
              ))}
            </View>
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

          {/* Botón Eliminar */}
          <Pressable
            style={[styles.deleteBottomButton, isDeleting && { opacity: 0.7 }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor={ThemeTokens.expenseText}
            />
            <Text style={styles.deleteBottomButtonText}>Eliminar Tarjeta</Text>
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.full,
  },
  segmentItemActive: {
    backgroundColor: ThemeTokens.brandFill,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: ThemeTokens.textSecondary,
  },
  segmentTextActive: {
    color: '#F2EEFC',
    fontWeight: '700',
  },
  fieldSection: {
    marginBottom: 20,
  },
  creditRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeTokens.textSecondary,
    marginBottom: 8,
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
    marginBottom: 20,
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
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: ThemeTokens.brandFill,
  },
  saveButton: {
    backgroundColor: ThemeTokens.brandFill,
    paddingVertical: 16,
    borderRadius: Radii.button,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#F2EEFC',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ThemeTokens.expenseText,
    paddingVertical: 14,
    borderRadius: Radii.button,
    marginTop: 14,
  },
  deleteBottomButtonText: {
    color: ThemeTokens.expenseText,
    fontSize: 15,
    fontWeight: '700',
  },
});
