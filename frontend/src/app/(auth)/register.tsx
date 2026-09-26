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
import { Link, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemeTokens, Radii } from '@/constants/theme';
import api from '@/services/api';

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/user', {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert(
        '¡Cuenta Creada!',
        'Tu cuenta ha sido creada exitosamente. Inicia sesión para continuar.',
        [{ text: 'Iniciar Sesión', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Error en registro:', error);
      const serverMessage =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        'No se pudo crear la cuenta. Intenta de nuevo.';
      Alert.alert('Error', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={ThemeTokens.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={styles.brandContainer}>
          <Text style={styles.eyebrow}>MONEY_APP</Text>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Toma el control inteligente de tus finanzas personales</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tu nombre"
              placeholderTextColor={ThemeTokens.placeholder}
              value={name}
              onChangeText={setName}
            />
          </View>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={ThemeTokens.placeholder}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0D0B1A" />
            ) : (
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerLinkContainer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.linkHighlight}>Inicia sesión</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.icon,
    backgroundColor: ThemeTokens.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandContainer: {
    marginBottom: 24,
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
    gap: 14,
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
    paddingVertical: 13,
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
    marginTop: 24,
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
