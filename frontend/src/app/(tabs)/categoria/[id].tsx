import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import { categoriesApi, getApiErrorMessage } from '@/services/api';
import { Category } from '@/types';

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

export default function EditCategoriaPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [itemData, setItemData] = useState<Partial<Category>>({
    id: '',
    name: '',
    color: CATEGORY_COLORS[0],
    type: 'gasto',
    budget: null,
  });

  const [budgetStr, setBudgetStr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchItem = async () => {
        if (!id) return;
        try {
          setIsLoading(true);
          const allCats = await categoriesApi.getAll();
          const found = allCats.find((c) => c.id === id);
          if (found) {
            setItemData(found);
            setBudgetStr(found.budget ? String(found.budget) : '');
          }
        } catch (error) {
          console.error('Error obteniendo categoría:', error);
          Alert.alert('Error', getApiErrorMessage(error));
        } finally {
          setIsLoading(false);
        }
      };
      fetchItem();
    }, [id])
  );

  const handleSave = async () => {
    if (!id) return;
    if (!itemData.name?.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    const parsedBudget = budgetStr.trim() ? parseFloat(budgetStr) : null;
    if (parsedBudget !== null && (isNaN(parsedBudget) || parsedBudget < 0)) {
      Alert.alert('Error', 'Por favor ingresa un monto de presupuesto válido');
      return;
    }

    try {
      setIsSaving(true);
      await categoriesApi.update(id, {
        name: itemData.name.trim(),
        color: itemData.color || CATEGORY_COLORS[0],
        type: itemData.type || 'gasto',
        budget: parsedBudget,
      });
      router.back();
    } catch (error) {
      console.error('Error editando categoría:', error);
      Alert.alert('Error', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Deseas eliminar la categoría "${itemData.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              setIsDeleting(true);
              await categoriesApi.delete(id);
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
        <Text style={styles.headerTitle}>Editar Categoría</Text>
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
          {/* Nombre */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Nombre de la categoría</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Cafetería, Gimnasio..."
              placeholderTextColor={ThemeTokens.placeholder}
              value={itemData.name || ''}
              onChangeText={(text) => setItemData({ ...itemData, name: text })}
            />
          </View>

          {/* Presupuesto */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Presupuesto mensual ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: 3000.00 (opcional)"
              placeholderTextColor={ThemeTokens.placeholder}
              keyboardType="decimal-pad"
              value={budgetStr}
              onChangeText={setBudgetStr}
            />
          </View>

          {/* Color */}
          <View style={styles.fieldSection}>
            <Text style={styles.label}>Color representativo</Text>
            <View style={styles.colorsGrid}>
              {CATEGORY_COLORS.map((c) => (
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
});
