import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from '@/services/api';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View, StyleSheet, ActivityIndicator } from "react-native";
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

    const loadItems = async () => {
        try {
            setLoading(true);
            const [transRes, cardRes] = await Promise.all([
                api.get('/transactions').catch(() => ({ data: { data: [] } })),
                api.get('/card').catch(() => ({ data: { data: [] } }))
            ]);
            setItems(transRes.data.data || []);
            setCards(cardRes.data.data || []);
        } catch (error) {
            console.error("Error cargando mis transacciones:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (itemId: string) => {
        Alert.alert(
            "Eliminar",
            "¿Estás seguro de que quieres eliminar este elemento?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete('/transactions', { data: { id: itemId } });
                            loadItems();
                        } catch (error) {
                            console.error("Error eliminando:", error);
                        }
                    }
                }
            ]
        )
    }

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="title" style={styles.headerTitle}>Mis Transacciones</ThemedText>
                
                {loading ? (
                    <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.listContainer}>
                        {items.length === 0 ? (
                            <ThemedText style={styles.emptyText}>No hay elementos registrados aún.</ThemedText>
                        ) : (
                            items.map((item) => {
                                const card = cards.find(c => c.id === item.card_id);
                                const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'Sin fecha';
                                return (
                                    <View key={item.id} style={[styles.cardContainer, { backgroundColor: theme.backgroundElement }]}>
                                        <View style={styles.cardInfo}>
                                            <ThemedText type="subtitle" style={styles.itemTitle}>{item.title}</ThemedText>
                                            <ThemedText style={styles.itemSubtitle}>{`$${item.amount}`}</ThemedText>
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
                    </View>
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
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    headerTitle: { fontSize: 32, fontWeight: '800', marginBottom: 24 },
    listContainer: { flex: 1 },
    emptyText: { textAlign: 'center', marginTop: 40, opacity: 0.5, fontSize: 16 },
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
