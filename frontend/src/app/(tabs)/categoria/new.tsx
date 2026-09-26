import React, { useState } from 'react';
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
import { ThemeTokens, Radii } from '@/constants/theme';
import { categoriesApi, getApiErrorMessage } from '@/services/api';

const CATEGORY_COLORS = [
  '#FF9142', // Alimentación
  '#4D9EFF', // Transporte
  '#FFD23F', // Servicios
  '#E14FFF', // Entretenimiento
  '#FF6FB3', // Salud
  '#2DE1C2', // Hogar
  '#9B6BFF', // Compras
  '#8B82B8', // Otros
  '#39FFC4', // Nómina
];

export default function NewCategoryScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría.');
      return;
    }

    setSaving(true);
    try {
      await categoriesApi.create({
        name: name.trim(),
        type,
        color,
        icon: 'tag',
      });

      router.back();
    } catch (err) {
      console.error('Error creando categoría:', err);
      Alert.alert('Error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>Nueva Categoría</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Type Selector */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentItem,
              type === 'gasto' && { backgroundColor: ThemeTokens.expenseFill },
            ]}
            onPress={() => setType('gasto')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'gasto' ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Gasto
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentItem,
              type === 'ingreso' && { backgroundColor: ThemeTokens.incomeFill },
            ]}
            onPress={() => setType('ingreso')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'ingreso' ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
            >
              Ingreso
            </Text>
          </Pressable>
        </View>

        {/* Name input */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Nombre de la categoría</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Cafetería, Gimnasio, Freelance..."
            placeholderTextColor={ThemeTokens.placeholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Color Palette */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Color representativo</Text>
          <View style={styles.colorsGrid}>
            {CATEGORY_COLORS.map((c) => (
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
            <Text style={styles.saveButtonText}>Crear Categoría</Text>
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
    marginBottom: 24,
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
    borderColor: '#FFFFFF',
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
