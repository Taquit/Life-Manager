import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import api from "@/services/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { Categoria } from "./index";

export default function NewCategoriaPage() {
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<Categoria>>({
        name: "",
        color: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.post('/category', itemData);
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
                    <ThemedText type="title" style={styles.title}>Nueva Categoría</ThemedText>
                </View>
                
                <View style={styles.formContainer}>
                    
                    <ThemedText style={styles.label}>Nombre</ThemedText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        placeholderTextColor={theme.textSecondary}
                        placeholder='Ej: Comida'
                        
                        
                        value={itemData.name ? itemData.name.toString() : ""}
                        onChangeText={(value) => setItemData({ ...itemData, name: value })}
                    />
                    <ThemedText style={styles.label}>Color</ThemedText>
                    <View style={styles.colorPickerContainer}>
                        {['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map((color) => (
                            <Pressable
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color },
                                    itemData.color === color && styles.colorCircleSelected
                                ]}
                                onPress={() => setItemData({ ...itemData, color })}
                            >
                                {itemData.color === color && (
                                    <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={20} tintColor="#fff" />
                                )}
                            </Pressable>
                        ))}
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
    saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },
    colorPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingVertical: 8 },
    colorCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    colorCircleSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }
});
