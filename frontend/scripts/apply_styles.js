const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../src/app/(tabs)');

const folders = [
  {
    name: 'cards',
    title: 'Mis Tarjetas',
    itemTitle: 'bankname',
    itemSubtitle: (item) => `\`\${item.alias} •••• \${item.last4}\``,
    apiEndpoint: '/card',
    typeDef: `export type Card = {
    id: string;
    bankname: string;
    alias: string;
    last4: string;
    userid: string;
};`,
    typeName: 'Card',
    addTitle: 'Tarjeta',
    fields: [
      { key: 'bankname', label: 'Banco', placeholder: 'Ej: Santander', isNumber: false },
      { key: 'alias', label: 'Alias', placeholder: 'Ej: Crédito', isNumber: false },
      { key: 'last4', label: 'Últimos 4 dígitos', placeholder: 'Ej: 4321', isNumber: true, maxLength: 4 },
    ],
    loadTransform: 'response.data', // Wait, cards uses response.data in new.tsx? In cards/index.tsx it uses response.data. In [id].tsx it uses response.data.
  },
  {
    name: 'categoria',
    title: 'Mis Categorías',
    itemTitle: 'name',
    itemSubtitle: (item) => `\`Color: \${item.color}\``,
    apiEndpoint: '/category',
    typeDef: `export type Categoria = {
    id: string;
    name: string;
    color: string;
    user_id: string;
};`,
    typeName: 'Categoria',
    addTitle: 'Categoría',
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'Ej: Comida', isNumber: false },
      { key: 'color', label: 'Color', placeholder: 'Ej: #FF0000', isNumber: false },
    ],
    loadTransform: 'response.data.data || []',
    singleLoadTransform: 'response.data.data?.find((c: any) => c.id === id)',
  },
  {
    name: 'transaccion',
    title: 'Mis Transacciones',
    itemTitle: 'title',
    itemSubtitle: (item) => `\`$\${item.amount}\``,
    apiEndpoint: '/transactions',
    typeDef: `export type Transaccion = {
    id: string;
    title: string;
    amount: number;
    category_id: string;
    is_auto: boolean;
    card_id: string;
    user_id: string;
    date: string;
};`,
    typeName: 'Transaccion',
    addTitle: 'Transacción',
    fields: [
      { key: 'title', label: 'Título', placeholder: 'Ej: Supermercado', isNumber: false },
      { key: 'amount', label: 'Monto', placeholder: 'Ej: 100', isNumber: true },
    ],
    loadTransform: 'response.data.data || []',
    singleLoadTransform: 'response.data.data',
    apiEndpointId: '`/transactions?id=${id}`'
  }
];

function generateIndex(folder) {
  return `import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import api from '@/services/api';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, View, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";

${folder.typeDef}

export default function ${folder.typeName}Page() {
    const router = useRouter();
    const theme = useTheme();

    const [items, setItems] = useState<${folder.typeName}[]>([]);
    const [loading, setLoading] = useState(false);

    const loadItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('${folder.apiEndpoint}');
            setItems(${folder.name === 'cards' ? 'response.data.data || response.data' : folder.loadTransform});
        } catch (error) {
            console.error("Error cargando ${folder.title.toLowerCase()}:", error);
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
                            ${folder.name === 'cards' 
                                ? `await api.delete(\`${folder.apiEndpoint}/\${itemId}\`);`
                                : `await api.delete('${folder.apiEndpoint}', { data: { id: itemId } });`}
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
                <ThemedText type="title" style={styles.headerTitle}>${folder.title}</ThemedText>
                
                {loading ? (
                    <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.listContainer}>
                        {items.length === 0 ? (
                            <ThemedText style={styles.emptyText}>No hay elementos registrados aún.</ThemedText>
                        ) : (
                            items.map((item) => (
                                <View key={item.id} style={[styles.cardContainer, { backgroundColor: theme.backgroundElement }]}>
                                    <View style={styles.cardInfo}>
                                        <ThemedText type="subtitle" style={styles.itemTitle}>{item.${folder.itemTitle}}</ThemedText>
                                        <ThemedText style={styles.itemSubtitle}>{${folder.itemSubtitle('item')}}</ThemedText>
                                    </View>
                                    
                                    <View style={styles.cardActions}>
                                        <Pressable 
                                            style={({ pressed }) => [styles.actionButton, styles.editButton, pressed && { opacity: 0.8 }]}
                                            onPress={() => router.push(\`/${folder.name}/\${item.id}\`)}
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
                    </View>
                )}

                <Pressable 
                    style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push(\`/${folder.name}/new\`)}
                >
                    <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={24} tintColor="#fff" />
                    <ThemedText style={styles.addButtonText}>Agregar ${folder.addTitle}</ThemedText>
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
`;
}

function generateNew(folder) {
  const isTransaccion = folder.name === 'transaccion';
  return `import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import api from "@/services/api";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View${isTransaccion ? ', Switch' : ''} } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { ${folder.typeName} } from "./index";

export default function New${folder.typeName}Page() {
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<${folder.typeName}>>({
        ${folder.fields.map(f => `${f.key}: ${f.isNumber ? '0' : '""'}`).join(',\n        ')}${isTransaccion ? ',\n        is_auto: false' : ''}
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.post('${folder.apiEndpoint}', itemData);
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
                        <SymbolView name={{ ios: 'chevron.backward', android: 'arrow-back', web: 'arrow-back' }} size={24} tintColor={theme.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Nueva ${folder.addTitle}</ThemedText>
                </View>
                
                <View style={styles.formContainer}>
                    ${folder.fields.map(f => `
                    <ThemedText style={styles.label}>${f.label}</ThemedText>
                    <TextInput
                        style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                        placeholderTextColor={theme.textSecondary}
                        placeholder='${f.placeholder}'
                        ${f.isNumber ? 'keyboardType="numeric"' : ''}
                        ${f.maxLength ? `maxLength={${f.maxLength}}` : ''}
                        value={itemData.${f.key} ? itemData.${f.key}.toString() : ""}
                        onChangeText={(value) => setItemData({ ...itemData, ${f.key}: ${f.isNumber ? 'parseFloat(value) || 0' : 'value'} })}
                    />`).join('')}

                    ${isTransaccion ? `
                    <View style={styles.switchContainer}>
                        <ThemedText style={styles.switchLabel}>¿Pago Automático?</ThemedText>
                        <Switch
                            value={itemData.is_auto}
                            onValueChange={(value) => setItemData({ ...itemData, is_auto: value })}
                            trackColor={{ false: theme.backgroundElement, true: '#10B981' }}
                        />
                    </View>` : ''}

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
`;
}

function generateId(folder) {
  const isTransaccion = folder.name === 'transaccion';
  return `import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import api from "@/services/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View${isTransaccion ? ', Switch' : ''} } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { ${folder.typeName} } from "./index";

export default function Edit${folder.typeName}Page() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const theme = useTheme();

    const [itemData, setItemData] = useState<Partial<${folder.typeName}>>({
        id: "",
        ${folder.fields.map(f => `${f.key}: ${f.isNumber ? '0' : '""'}`).join(',\n        ')}${isTransaccion ? ',\n        is_auto: false' : ''}
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchItem = async () => {
                if (!id) return;
                try {
                    setIsLoading(true);
                    ${folder.name === 'cards' 
                        ? `const response = await api.get(\`${folder.apiEndpoint}/\${id}\`);
                           setItemData(response.data.data || response.data);` 
                        : `const response = await api.get(${folder.apiEndpointId || `'${folder.apiEndpoint}'`});
                           const item = ${folder.singleLoadTransform};
                           if (item) setItemData(item);`
                    }
                } catch (error) {
                    console.error("Error obteniendo:", error);
                    Alert.alert("Error", "No se pudo cargar la información.");
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
            ${folder.name === 'cards'
                ? `await api.put(\`${folder.apiEndpoint}/\${id}\`, itemData);`
                : `await api.put('${folder.apiEndpoint}', { ...itemData, id });`
            }
            Alert.alert("Éxito", "Actualizado correctamente", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error editando:", error);
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
                        <SymbolView name={{ ios: 'chevron.backward', android: 'arrow-back', web: 'arrow-back' }} size={24} tintColor={theme.text} />
                    </Pressable>
                    <ThemedText type="title" style={styles.title}>Editar ${folder.addTitle}</ThemedText>
                </View>
                
                {isLoading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.formContainer}>
                        ${folder.fields.map(f => `
                        <ThemedText style={styles.label}>${f.label}</ThemedText>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.backgroundElement }]}
                            placeholderTextColor={theme.textSecondary}
                            placeholder='${f.placeholder}'
                            ${f.isNumber ? 'keyboardType="numeric"' : ''}
                            ${f.maxLength ? `maxLength={${f.maxLength}}` : ''}
                            value={itemData.${f.key} ? itemData.${f.key}.toString() : ""}
                            onChangeText={(value) => setItemData({ ...itemData, ${f.key}: ${f.isNumber ? 'parseFloat(value) || 0' : 'value'} })}
                        />`).join('')}

                        ${isTransaccion ? `
                        <View style={styles.switchContainer}>
                            <ThemedText style={styles.switchLabel}>¿Pago Automático?</ThemedText>
                            <Switch
                                value={itemData.is_auto}
                                onValueChange={(value) => setItemData({ ...itemData, is_auto: value })}
                                trackColor={{ false: theme.backgroundElement, true: '#3B82F6' }}
                            />
                        </View>` : ''}

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
`;
}

folders.forEach(folder => {
  const dir = path.join(baseDir, folder.name);
  if (fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, 'index.tsx'), generateIndex(folder));
    fs.writeFileSync(path.join(dir, 'new.tsx'), generateNew(folder));
    fs.writeFileSync(path.join(dir, '[id].tsx'), generateId(folder));
    console.log(`Updated ${folder.name}`);
  }
});
