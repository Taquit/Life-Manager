// frontend/src/app/(tabs)/categoria/index.tsx
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
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens } from '@/constants/theme';
import { categoriesApi } from '@/services/api';
import { Category } from '@/types';
import { CategoryIcon } from '@/components/CategoryIcon';

export type Categoria = Category;

export default function CategoriasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'gasto' | 'ingreso'>('gasto');
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getAll(activeTab);
      setCategories(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const isGasto = activeTab === 'gasto';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor="#F2EEFC"
          />
        </Pressable>
        <Text style={styles.headerTitle}>Categorías</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/categoria/new' as any)}
        >
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={20}
            tintColor="#F2EEFC"
          />
        </Pressable>
      </View>

      {/* Tabs: Gasto vs Ingreso */}
      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentItem,
            isGasto && { backgroundColor: '#FF5C7A' },
          ]}
          onPress={() => setActiveTab('gasto')}
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
          onPress={() => setActiveTab('ingreso')}
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
          <View style={styles.listCard}>
            {categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay categorías de {isGasto ? 'gasto' : 'ingreso'} registradas
                </Text>
              </View>
            ) : (
              categories.map((cat, idx) => (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    idx < categories.length - 1 && styles.categoryDivider,
                  ]}
                >
                  <CategoryIcon
                    name={cat.name}
                    color={cat.color}
                    size={42}
                    iconSize={22}
                    borderRadius={12}
                    style={{ marginRight: 14 }}
                  />
                  <View style={styles.catDetails}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catCount}>
                      {((cat as any).count ?? 0)} movimientos
                    </Text>
                  </View>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => router.push(`/(tabs)/categoria/${cat.id}` as any)}
                  >
                    <SymbolView
                      name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                      size={18}
                      tintColor="#8A7FBD"
                    />
                  </Pressable>
                </View>
              ))
            )}

            {/* Bottom Row: Nueva categoría */}
            <Pressable
              style={styles.newCategoryRow}
              onPress={() => router.push('/(tabs)/categoria/new' as any)}
            >
              <View style={styles.newCategorySquircle}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={18}
                  tintColor="#8A7FBD"
                />
              </View>
              <Text style={styles.newCategoryText}>
                {isGasto ? 'Nueva categoría de gasto' : 'Nueva categoría de ingreso'}
              </Text>
            </Pressable>
          </View>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F2EEFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#17142B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2757',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#17142B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2757',
    padding: 4,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 20,
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
    color: '#B4A9E0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: '#17142B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E2757',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8A7FBD',
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#241F42',
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2EEFC',
    marginBottom: 2,
  },
  catCount: {
    fontSize: 12,
    color: '#8A7FBD',
  },
  editButton: {
    padding: 8,
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  newCategorySquircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4A4178',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  newCategoryText: {
    fontSize: 14,
    color: '#B4A9E0',
    fontWeight: '500',
  },
});