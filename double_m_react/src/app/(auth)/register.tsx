import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

import api from '@/services/api';

export default function Register() {
    // Estados para guardar los datos de registro
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    const theme = useTheme();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Por favor completa todos los campos");
            return;
        }

        setCargando(true);
        try {
            const payload = {
                name: name,
                email: email,
                password: password
            };

            // TODO: Ajusta la URL de registro a la correcta de tu backend
            await api.post('/user', payload);

            Alert.alert(
                "¡Éxito!",
                "Tu cuenta ha sido creada exitosamente. Por favor inicia sesión.",
                [{ text: "OK", onPress: () => router.replace('/login') }]
            );

        } catch (error) {
            console.error("Error en registro:", error);
            Alert.alert("Error", "Hubo un problema al crear la cuenta. Verifica los datos o intenta de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="title" style={styles.title}>Crear Cuenta</ThemedText>
                <ThemedText type='smallBold' style={styles.subtitle}>
                    Únete a nosotros para tomar el control de tu dinero.
                </ThemedText>

                <ThemedText type='subtitle' style={styles.label}>Nombre</ThemedText>
                <TextInput
                    style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                    placeholder='Tu nombre completo'
                    value={name}
                    onChangeText={setName}
                />

                <ThemedText type='subtitle' style={styles.label}>Email</ThemedText>
                <TextInput
                    style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                    placeholder='tu_correo@gmail.com'
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <ThemedText type='subtitle' style={styles.label}>Password</ThemedText>
                <TextInput
                    style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                    placeholder='Crea una contraseña'
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Pressable
                    style={[styles.but, cargando && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={cargando}
                >
                    {cargando ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <ThemedText style={styles.butText}>Registrarse</ThemedText>
                    )}
                </Pressable>

                {/* Link para regresar al login si ya tiene cuenta */}
                <View style={styles.loginLinkContainer}>
                    <ThemedText type="default">¿Ya tienes una cuenta? </ThemedText>
                    <Link href="/login" asChild>
                        <Pressable>
                            <ThemedText type="linkPrimary" style={styles.linkText}>Inicia Sesión</ThemedText>
                        </Pressable>
                    </Link>
                </View>

            </SafeAreaView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        width: '100%',
        marginTop: 12,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 4,
        width: '100%',
    },
    but: {
        marginTop: 32,
        backgroundColor: '#28a745', // Color verde para diferenciar del login
        padding: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    butText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    loginLinkContainer: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkText: {
        fontWeight: 'bold',
    }
})
