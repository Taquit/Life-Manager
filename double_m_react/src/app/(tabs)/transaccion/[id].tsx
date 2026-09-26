import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import api, { getErrorMessage } from "@/services/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View, Switch, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaccion } from "./index";
import { Categoria } from "../categoria/index";
import { Card } from "../cards/index";

export default function EditTransaccionPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<Transaccion>>({
        id: "",
        title: "",
        amount: 0,
        is_auto: false,
    });
    
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoadingCards, setIsLoadingCards] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/category').catch(err => { console.error("Error obteniendo categorías", err); return { data: { data: [] } }; }),
            api.get('/card').catch(err => { console.error("Error obteniendo tarjetas", err); return { data: { data: [] } }; })
        ]).then(([catRes, cardRes]) => {
            setCategories(catRes.data.data || []);
            setCards(cardRes.data.data || []);
        }).finally(() => {
            setIsLoadingCategories(false);
            setIsLoadingCards(false);
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            const fetchItem = async () => {
                if (!id) return;
                try {
                    setIsLoading(true);
                    const response = await api.get(`/transactions?id=${id}`);
                           const item = response.data.data;
                           if (item) {
                               setItemData(item);
                               if (item.date) setDate(new Date(item.date));
                           }
                } catch (error) {
                    console.error("Error obteniendo:", error);
                    Alert.alert("Error", getErrorMessage(error));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItem();
        }, [id])
    );

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.put('/transactions', { ...itemData, id, isAuto: itemData.is_auto, date: date.toISOString() });
            Alert.alert("Éxito", "Actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error editando:", error);
            Alert.alert("Error", getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <SymbolView name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={theme.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Editar Transacción</ThemedText>
                </View>
                
                {isLoading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
                ) : (
                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        
                        <ThemedText style={styles.label}>Título</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder='Ej: Supermercado'
                            
                            
                            value={itemData.title ? itemData.title.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, title: value })}
                        />
                        <ThemedText style={styles.label}>Monto</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder='Ej: 100'
                            keyboardType="numeric"
                            
                            value={itemData.amount ? itemData.amount.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, amount: parseFloat(value) || 0 })}
                        />

                        <ThemedText style={styles.label}>Categoría</ThemedText>
                        {isLoadingCategories ? (
                            <ActivityIndicator size="small" color="#3B82F6" style={{ alignSelf: 'flex-start', marginBottom: 24 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                                {categories.map(cat => (
                                    <Pressable 
                                        key={cat.id} 
                                        style={[
                                            styles.categoryChip, 
                                            { backgroundColor: cat.color + '20', borderColor: cat.color },
                                            itemData.category_id === cat.id && { backgroundColor: cat.color }
                                        ]}
                                        onPress={() => setItemData({...itemData, category_id: cat.id})}
                                    >
                                        <ThemedText style={[styles.categoryChipText, { color: itemData.category_id === cat.id ? '#fff' : cat.color }]}>
                                            {cat.name}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                                {categories.length === 0 && (
                                    <ThemedText style={{ opacity: 0.5, fontStyle: 'italic', marginBottom: 24 }}>No hay categorías creadas.</ThemedText>
                                )}
                            </ScrollView>
                        )}

                        <ThemedText style={styles.label}>Tarjeta de Pago</ThemedText>
                        {isLoadingCards ? (
                            <ActivityIndicator size="small" color="#3B82F6" style={{ alignSelf: 'flex-start', marginBottom: 24 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                                {cards.map(card => {
                                    const isSelected = itemData.card_id === card.id;
                                    return (
                                        <Pressable 
                                            key={card.id} 
                                            style={[
                                                styles.categoryChip, 
                                                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundElement },
                                                isSelected && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                                            ]}
                                            onPress={() => setItemData({...itemData, card_id: card.id})}
                                        >
                                            <ThemedText style={[styles.categoryChipText, { color: isSelected ? '#fff' : theme.text }]}>
                                                {card.alias} (••{card.last4})
                                            </ThemedText>
                                        </Pressable>
                                    );
                                })}
                                {cards.length === 0 && (
                                    <ThemedText style={{ opacity: 0.5, fontStyle: 'italic', marginBottom: 24 }}>No hay tarjetas creadas.</ThemedText>
                                )}
                            </ScrollView>
                        )}

                        <ThemedText style={styles.label}>Fecha</ThemedText>
                        <Pressable 
                            style={[styles.textInput, { borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement, justifyContent: 'center' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <ThemedText>{date.toLocaleDateString()}</ThemedText>
                        </Pressable>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        
                        <View style={styles.switchContainer}>
                            <ThemedText style={styles.switchLabel}>¿Pago Automático?</ThemedText>
                            <Switch
                                value={itemData.is_auto}
                                onValueChange={(value) => setItemData({ ...itemData, is_auto: value })}
                                trackColor={{ false: theme.backgroundElement, true: '#3B82F6' }}
                            />
                        </View>

                        <Pressable 
                            style={({ pressed }) => [styles.saveButton, (isSaving || pressed) && { opacity: 0.8 }]} 
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={20} tintColor="#fff" />
                                    <ThemedText style={styles.saveButtonText}>Guardar Cambios</ThemedText>
                                </>
                            )}
                        </Pressable>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 32, gap: 16 },
    backButton: { padding: 8, marginLeft: -8 },
    title: { fontSize: 28, fontWeight: '800' },
    formContainer: { paddingHorizontal: 24 },
    label: { marginBottom: 8, fontSize: 15, fontWeight: '600', opacity: 0.8 },
    textInput: { 
        borderWidth: 1, 
        borderRadius: 16, 
        padding: 18, 
        marginBottom: 24, 
        width: '100%', 
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
    },
    categoriesContainer: { marginBottom: 24, flexDirection: 'row' },
    categoryChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        borderWidth: 1, 
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
    },
    categoryChipText: { 
        fontWeight: '600', 
        fontSize: 14 
    },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingVertical: 8 },
    switchLabel: { fontSize: 16, fontWeight: '600' },
    saveButton: { 
        flexDirection: 'row',
        backgroundColor: '#3B82F6', 
        paddingVertical: 18, 
        borderRadius: 16, 
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10, 
        gap: 8,
        shadowColor: "#3B82F6", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 4 
    },
    saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 }
});
