import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api, { getErrorMessage } from '@/services/api';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";

export type Categoria = {
    id: string;
    name: string;
    color: string;
    user_id: string;
};

export default function CategoriaPage() {
    const router = useRouter();
    const theme = useTheme();

    const [items, setItems] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadItems = async (isPullToRefresh = false) => {
        try {
            if (isPullToRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setErrorMessage(null);
            const response = await api.get('/category');
            setItems(response.data.data || []);
        } catch (error) {
            console.error("Error cargando mis categorías:", error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        Alert.alert(
            "Eliminar Categoría",
            "¿Estás seguro de que deseas eliminar esta categoría?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.delete('/category', { data: { id: itemId } });
                            loadItems();
                        } catch (error) {
                            console.error("Error eliminando categoría:", error);
                            Alert.alert("Error al eliminar", getErrorMessage(error));
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="title" style={styles.headerTitle}>Mis Categorías</ThemedText>

                {errorMessage && (
                    <View style={styles.errorBanner}>
                        <ThemedText style={styles.errorText}>⚠️ {errorMessage}</ThemedText>
                        <Pressable onPress={() => loadItems()} style={styles.retryButton}>
                            <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
                        </Pressable>
                    </View>
                )}
                
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView 
                        style={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => loadItems(true)} colors={['#10B981']} />
                        }
                    >
                        {items.length === 0 ? (
                            <ThemedText style={styles.emptyText}>No hay categorías registradas aún.</ThemedText>
                        ) : (
                            items.map((item) => (
                                <View key={item.id} style={[styles.cardContainer, { backgroundColor: theme.backgroundElement }]}>
                                    <View style={styles.cardInfo}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <View style={[styles.colorDot, { backgroundColor: item.color || '#8B5CF6' }]} />
                                            <ThemedText type="subtitle" style={styles.itemTitle}>{item.name}</ThemedText>
                                        </View>
                                        <ThemedText style={styles.itemSubtitle}>{`Color: ${item.color}`}</ThemedText>
                                    </View>
                                    
                                    <View style={styles.cardActions}>
                                        <Pressable 
                                            style={({ pressed }) => [styles.actionButton, styles.editButton, pressed && { opacity: 0.8 }]}
                                            onPress={() => router.push(`/categoria/${item.id}`)}
                                        >
                                            <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={16} tintColor="#fff" />
                                            <ThemedText style={styles.actionText}>Editar</ThemedText>
                                        </Pressable>
                                        
                                        <Pressable 
                                            style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && { opacity: 0.8 }]}
                                            onPress={() => handleDelete(item.id)}
                                        >
                                            <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={16} tintColor="#fff" />
                                            <ThemedText style={styles.actionText}>Eliminar</ThemedText>
                                        </Pressable>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}

                <Pressable 
                    style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push(`/categoria/new`)}
                >
                    <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={24} tintColor="#fff" />
                    <ThemedText style={styles.addButtonText}>Agregar Categoría</ThemedText>
                </Pressable>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    headerTitle: { fontSize: 32, fontWeight: '800', marginBottom: 20 },
    listContainer: { flex: 1 },
    emptyText: { textAlign: 'center', marginTop: 40, opacity: 0.5, fontSize: 16 },
    errorBanner: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorText: { color: '#B91C1C', fontSize: 14, flex: 1 },
    retryButton: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
    retryButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    cardContainer: { 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 16, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    cardInfo: { marginBottom: 16 },
    colorDot: { width: 14, height: 14, borderRadius: 7 },
    itemTitle: { fontSize: 20, fontWeight: '700' },
    itemSubtitle: { fontSize: 15, opacity: 0.6 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    actionButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 12,
        gap: 6
    },
    editButton: { backgroundColor: '#3B82F6' },
    deleteButton: { backgroundColor: '#EF4444' },
    actionText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
    addButton: { 
        flexDirection: 'row',
        backgroundColor: '#10B981', 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
        shadowColor: "#10B981", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 4 
    },
    addButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});
