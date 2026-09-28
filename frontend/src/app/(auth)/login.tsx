import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { ThemeTokens, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/user/login', {
        email: email.trim(),
        password,
      });

      const token = res.data.token;
      if (token) {
        await login(token);
      } else {
        Alert.alert('Error', 'No se recibió el token de autenticación.');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      const serverMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Credenciales incorrectas o problema en el servidor.';
      Alert.alert('Error', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brandContainer}>
          <Text style={styles.eyebrow}>MONEY_APP</Text>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión para gestionar tus finanzas</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.textInput}
              placeholder="tu_correo@ejemplo.com"
              placeholderTextColor={ThemeTokens.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={ThemeTokens.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0D0B1A" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            )}
          </Pressable>
        </View>

        {/* Footer Link */}
        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.linkHighlight}>Regístrate aquí</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeTokens.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandContainer: {
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeTokens.brandText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: ThemeTokens.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: ThemeTokens.textSecondary,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeTokens.textSecondary,
  },
  textInput: {
    backgroundColor: ThemeTokens.surface,
    borderWidth: 1,
    borderColor: ThemeTokens.borderSubtle,
    borderRadius: Radii.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: ThemeTokens.textPrimary,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: ThemeTokens.brandFill,
    borderRadius: Radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#0D0B1A',
    fontSize: 15,
    fontWeight: '700',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13.5,
    color: ThemeTokens.textSecondary,
  },
  linkHighlight: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ThemeTokens.brandText,
  },
});