import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { cardsApi, getApiErrorMessage } from '@/services/api';

const COLOR_OPTIONS = [
  '#7C3AED', // Brand Purple
  '#39FFC4', // Neon Green
  '#4D9EFF', // Neon Blue
  '#FF5C7A', // Neon Red/Pink
  '#FF9142', // Neon Orange
  '#FFD23F', // Neon Yellow
];

export default function NewCardScreen() {
  const router = useRouter();

  const [alias, setAlias] = useState('');
  const [banco, setBanco] = useState('');
  const [type, setType] = useState<'debito' | 'credito'>('debito');
  const [last4, setLast4] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [linkedGoogle, setLinkedGoogle] = useState(false);
  const [cutDay, setCutDay] = useState('');
  const [payDay, setPayDay] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!banco.trim() || last4.trim().length !== 4) {
      Alert.alert('Error', 'Ingresa el nombre del banco y los 4 dígitos de la tarjeta.');
      return;
    }

    setSaving(true);
    try {
      await cardsApi.create({
        alias: alias.trim() || undefined,
        banco: banco.trim(),
        type,
        last4: last4.trim(),
        color,
        linkedGoogle,
        cutDay: cutDay ? parseInt(cutDay, 10) : null,
        payDay: payDay ? parseInt(payDay, 10) : null,
      });

      router.back();
    } catch (err) {
      console.error('Error creando tarjeta:', err);
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const isCredit = type === 'credito';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={ThemeTokens.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Agregar Tarjeta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type selector */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentItem,
              !isCredit && { backgroundColor: ThemeTokens.brandFill },
            ]}
            onPress={() => setType('debito')}
          >
            <Text
              style={[
                styles.segmentText,
                !isCredit ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Débito
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentItem,
              isCredit && { backgroundColor: ThemeTokens.brandFill },
            ]}
            onPress={() => setType('credito')}
          >
            <Text
              style={[
                styles.segmentText,
                isCredit ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Crédito
            </Text>
          </Pressable>
        </View>

        {/* Card Form */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Alias de la tarjeta (opcional, ej. Nómina, Personal)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Nómina, Personal, Gastos diarios..."
            placeholderTextColor={ThemeTokens.placeholder}
            value={alias}
            onChangeText={setAlias}
          />
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.label}>Banco o Institución</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: BBVA, Nu, Santander, Banorte..."
            placeholderTextColor={ThemeTokens.placeholder}
            value={banco}
            onChangeText={setBanco}
          />
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.label}>Últimos 4 dígitos</Text>
          <TextInput
            style={styles.textInput}
            placeholder="1234"
            placeholderTextColor={ThemeTokens.placeholder}
            keyboardType="number-pad"
            maxLength={4}
            value={last4}
            onChangeText={setLast4}
          />
        </View>

        {/* Credit details if credit */}
        {isCredit && (
          <View style={styles.creditDetailsRow}>
            <View style={[styles.fieldSection, { flex: 1 }]}>
              <Text style={styles.label}>Día de corte</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1 - 31"
                placeholderTextColor={ThemeTokens.placeholder}
                keyboardType="number-pad"
                maxLength={2}
                value={cutDay}
                onChangeText={setCutDay}
              />
            </View>
            <View style={[styles.fieldSection, { flex: 1 }]}>
              <Text style={styles.label}>Día de pago</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1 - 31"
                placeholderTextColor={ThemeTokens.placeholder}
                keyboardType="number-pad"
                maxLength={2}
                value={payDay}
                onChangeText={setPayDay}
              />
            </View>
          </View>
        )}

        {/* Card Accent Color */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Color de la tarjeta</Text>
          <View style={styles.colorsRow}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && styles.colorCircleSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Google Pay Toggle */}
        <View style={styles.googlePayCard}>
          <View style={styles.googlePayInfo}>
            <SymbolView
              name={{ ios: 'wave.3.forward', android: 'contactless', web: 'contactless' }}
              size={20}
              tintColor={ThemeTokens.incomeText}
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={styles.googlePayTitle}>Vincular a Google Pay</Text>
              <Text style={styles.googlePaySubtitle}>
                Captura automáticamente compras hechas con esta tarjeta
              </Text>
            </View>
          </View>
          <Switch
            value={linkedGoogle}
            onValueChange={setLinkedGoogle}
            trackColor={{
              false: ThemeTokens.surfaceTrack,
              true: 'rgba(57, 255, 196, 0.3)',
            }}
            thumbColor={linkedGoogle ? ThemeTokens.incomeText : ThemeTokens.placeholder}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#0D0B1A" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Tarjeta</Text>
          )}
        </Pressable>
      </View>
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
    fontSize: 18,
    fontWeight: '600',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: 24,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.full,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#0D0B1A',
  },
  segmentTextInactive: {
    color: ThemeTokens.textSecondary,
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
  creditDetailsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  googlePayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ThemeTokens.surface,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    marginTop: 8,
  },
  googlePayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  googlePayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ThemeTokens.textPrimary,
  },
  googlePaySubtitle: {
    fontSize: 11.5,
    color: ThemeTokens.textTertiary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  saveButton: {
    backgroundColor: ThemeTokens.brandFill,
    paddingVertical: 16,
    borderRadius: Radii.button,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0D0B1A',
    fontSize: 16,
    fontWeight: '700',
  },
});
