// 1. Importaciones de librerías
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

// 2. Importaciones de tus propios componentes y temas
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

// 3. Importamos nuestra API y el Contexto
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function Login() {
    // Estados para guardar lo que el usuario escribe
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    const theme = useTheme();
    const { login } = useAuth(); // Sacamos la función login de nuestro altavoz global

    // 4. La lógica real de inicio de sesión
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingresa correo y contraseña");
            return;
        }

        setCargando(true);
        try {
            // Construimos el payload (los datos a enviar)
            const payload = {
                email: email,
                password: password
            };

            // Hacemos la petición al backend enviando el payload
            const respuesta = await api.post('/user/login', payload);

            // Asumiendo que tu backend devuelve { token: "eyJhbG..." }
            const tokenDelBackend = respuesta.data.token;

            if (tokenDelBackend) {
                // Guardamos el token de forma segura (¡Esto avisa a toda la app!)
                await login(tokenDelBackend);
            } else {
                Alert.alert("Error", "El servidor no devolvió un token.");
            }

        } catch (error) {
            console.error("Error en login:", error);
            Alert.alert("Error", "Credenciales incorrectas o servidor fallando.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ThemedText type="title" style={styles.title}>Iniciar Sesión</ThemedText>
                <ThemedText type='smallBold'>Ingresa tus credenciales para acceder a la aplicación.</ThemedText>

                <ThemedText type='subtitle' style={styles.label}>Email</ThemedText>
                <TextInput
                    style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                    placeholder='tu_correo@gmail.com'
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none" // Importante para correos
                    keyboardType="email-address"
                />

                <ThemedText type='subtitle' style={styles.label}>Password</ThemedText>
                <TextInput
                    style={[styles.textInput, { borderColor: theme.backgroundElement, color: theme.text }]}
                    placeholderTextColor={theme.textSecondary}
                    placeholder='tu_contraseña'
                    secureTextEntry // Para ocultar la contraseña
                    value={password}
                    onChangeText={setPassword}
                />

                <Pressable
                    style={[styles.but, cargando && { opacity: 0.7 }]}
                    onPress={handleLogin}
                    disabled={cargando}
                >
                    {cargando ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <ThemedText style={styles.butText}>Iniciar Sesión</ThemedText>
                    )}
                </Pressable>

                {/* Link para ir a crear cuenta */}
                <View style={styles.registerLinkContainer}>
                    <ThemedText type="default">¿No tienes una cuenta? </ThemedText>
                    <Link href="/register" asChild>
                        <Pressable>
                            <ThemedText type="linkPrimary" style={styles.linkText}>Regístrate aquí</ThemedText>
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
        paddingHorizontal: 20, // Agregado para que no toque los bordes
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
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
        marginTop: 24,
        backgroundColor: '#007bff',
        padding: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    butText: {
        color: '#ffffff', // Texto blanco para el botón
        fontWeight: 'bold',
    },
    registerLinkContainer: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkText: {
        fontWeight: 'bold',
    }
})