import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api, { getErrorMessage } from '@/services/api';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";

export type Transaccion = {
    id: string;
    title: string;
    amount: number;
    category_id: string;
    is_auto: boolean;
    card_id: string;
    user_id: string;
    date: string;
};

export default function TransaccionPage() {
    const router = useRouter();
    const theme = useTheme();

    const [items, setItems] = useState<Transaccion[]>([]);
    const [cards, setCards] = useState<any[]>([]);
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

            const [transRes, cardRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/card').catch(() => ({ data: { data: [] } }))
            ]);

            setItems(transRes.data.data || []);
            setCards(cardRes.data.data || []);
        } catch (error) {
            console.error("Error cargando mis transacciones:", error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        Alert.alert(
            "Eliminar Transacción",
            "¿Estás seguro de que deseas eliminar esta transacción?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await api.delete('/transactions', { data: { id: itemId } });
                            loadItems();
                        } catch (error) {
                            console.error("Error eliminando transacción:", error);
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
                <ThemedText type="title" style={styles.headerTitle}>Mis Transacciones</ThemedText>
                
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
                            <ThemedText style={styles.emptyText}>No hay transacciones registradas aún.</ThemedText>
                        ) : (
                            items.map((item) => {
                                const card = cards.find(c => c.id === item.card_id);
                                const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'Sin fecha';
                                return (
                                    <View key={item.id} style={[styles.cardContainer, { backgroundColor: theme.backgroundElement }]}>
                                        <View style={styles.cardInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <ThemedText type="subtitle" style={styles.itemTitle}>{item.title}</ThemedText>
                                                {item.is_auto && (
                                                    <View style={styles.autoBadge}>
                                                        <ThemedText style={styles.autoBadgeText}>⚡ Auto NFC</ThemedText>
                                                    </View>
                                                )}
                                            </View>
                                            
                                            <ThemedText style={styles.itemSubtitle}>{`$${Number(item.amount).toFixed(2)}`}</ThemedText>
                                            
                                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                                {card && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <SymbolView name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }} size={14} tintColor={theme.textSecondary} />
                                                        <ThemedText style={{ fontSize: 13, opacity: 0.6 }}>{card.alias} (••{card.last4})</ThemedText>
                                                    </View>
                                                )}
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    <SymbolView name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }} size={14} tintColor={theme.textSecondary} />
                                                    <ThemedText style={{ fontSize: 13, opacity: 0.6 }}>{dateStr}</ThemedText>
                                                </View>
                                            </View>
                                        </View>
                                    
                                        <View style={styles.cardActions}>
                                            <Pressable 
                                                style={({ pressed }) => [styles.actionButton, styles.editButton, pressed && { opacity: 0.8 }]}
                                                onPress={() => router.push(`/transaccion/${item.id}`)}
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
                                );
                            })
                        )}
                    </ScrollView>
                )}

                <Pressable 
                    style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push(`/transaccion/new`)}
                >
                    <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={24} tintColor="#fff" />
                    <ThemedText style={styles.addButtonText}>Agregar Transacción</ThemedText>
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
    itemTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    itemSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
    autoBadge: {
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    autoBadgeText: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: 'bold',
    },
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
