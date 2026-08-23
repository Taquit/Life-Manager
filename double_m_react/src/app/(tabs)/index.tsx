import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomePage() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Bienvenido</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>Aquí podrás ver que no se roban tu dinero, ¡lo gastaste tú!</ThemedText>
        </View>

        <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]} 
            onPress={logout}
        >
          <ThemedText style={styles.logoutText}>Cerrar Sesión</ThemedText>
        </Pressable>

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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'space-between', // Separa el contenido superior del botón de cerrar sesión
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  menuContainer: {
    flex: 1,
    width: '100%',
    gap: 16, // Espacio entre los botones
    justifyContent: 'center',
  },
  menuButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Sombra para Android
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
})