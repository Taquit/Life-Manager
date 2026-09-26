import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { cardsApi, getApiErrorMessage } from "@/services/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/types";

export default function EditCardPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<Card>>({
        id: "",
        banco: "",
        alias: "",
        last4: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchItem = async () => {
                if (!id) return;
                try {
                    setIsLoading(true);
                    const cards = await cardsApi.getAll();
                    const item = cards.find((c) => c.id === id);
                    if (item) setItemData(item);
                } catch (error) {
                    console.error("Error obteniendo tarjeta:", error);
                    Alert.alert("Error", getApiErrorMessage(error));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItem();
        }, [id])
    );

    const handleSave = async () => {
        if (!id) return;
        try {
            setIsSaving(true);
            await cardsApi.update(id, {
                banco: itemData.banco,
                alias: itemData.alias,
                last4: itemData.last4,
                type: itemData.type,
                color: itemData.color,
                linkedGoogle: itemData.linkedGoogle,
                cutDay: itemData.cutDay,
                payDay: itemData.payDay,
            });
            Alert.alert("Exito", "Actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error editando tarjeta:", error);
            Alert.alert("Error", getApiErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <SymbolView name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={theme.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Editar Tarjeta</ThemedText>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.formContainer}>

                        <ThemedText style={styles.label}>Banco</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder="Ej: Santander"
                            value={itemData.banco ? itemData.banco.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, banco: value })}
                        />
                        <ThemedText style={styles.label}>Alias</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder="Ej: Credito"
                            value={itemData.alias ? itemData.alias.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, alias: value })}
                        />
                        <ThemedText style={styles.label}>Ultimos 4 digitos</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder="Ej: 4321"
                            maxLength={4}
                            value={itemData.last4 ? itemData.last4.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, last4: value })}
                        />

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
                    </View>
                )}
            </SafeAreaView>
        </ThemedView>
    );
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
