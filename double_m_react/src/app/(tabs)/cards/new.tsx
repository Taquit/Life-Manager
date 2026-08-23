import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import api from "@/services/api";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "./index";

export default function NewCardPage() {
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<Card>>({
        bankname: "",
        alias: "",
        last4: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.post('/card', itemData);
            Alert.alert('Éxito', 'Creado correctamente', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error guardando:", error);
            Alert.alert("Error", "No se pudo guardar.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <SymbolView name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={theme.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Nueva Tarjeta</ThemedText>
                </View>

                <View style={styles.formContainer}>

                    <ThemedText style={styles.label}>Banco</ThemedText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        placeholderTextColor={theme.textSecondary}
                        placeholder='Ej: Santander'


                        value={itemData.bankname ? itemData.bankname.toString() : ""}
                        onChangeText={(value) => setItemData({ ...itemData, bankname: value })}
                    />
                    <ThemedText style={styles.label}>Alias</ThemedText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        placeholderTextColor={theme.textSecondary}
                        placeholder='Ej: Crédito'


                        value={itemData.alias ? itemData.alias.toString() : ""}
                        onChangeText={(value) => setItemData({ ...itemData, alias: value })}
                    />
                    <ThemedText style={styles.label}>Últimos 4 dígitos</ThemedText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        placeholderTextColor={theme.textSecondary}
                        placeholder='Ej: 4321'
                        keyboardType="numeric"
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
                                <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
                            </>
                        )}
                    </Pressable>
                </View>
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
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingVertical: 8 },
    switchLabel: { fontSize: 16, fontWeight: '600' },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 8,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 }
});
