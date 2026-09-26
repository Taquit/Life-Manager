# Guía: Cómo crear pantallas en la aplicación

Esta aplicación está construida utilizando **Expo (con Expo Router)** para la navegación y **React Native** para la interfaz, utilizando componentes personalizados que se adaptan a los modos claro y oscuro.

A continuación, tienes todo lo que necesitas saber para crear tus propias pantallas:

## 1. ¿Dónde se crean las pantallas? (El enrutamiento)

La aplicación usa un sistema llamado **File-based routing** (Enrutamiento basado en archivos) gracias a Expo Router. Esto significa que **cada archivo `.tsx` que crees dentro de la carpeta `src/app` se convertirá automáticamente en una pantalla/ruta.**

* Si creas `src/app/perfil.tsx`, automáticamente puedes ir a la ruta `/perfil`.
* Si creas `src/app/ajustes.tsx`, la ruta será `/ajustes`.

## 2. Los Componentes Principales que debes usar

En lugar de usar los componentes estándar de React Native (`View` o `Text`), tu proyecto ya tiene unos componentes especiales creados en `src/components/` que se adaptan automáticamente al **Modo Claro / Modo Oscuro**. 

Siempre debes importar estos componentes en tus pantallas:

* **`ThemedView`**: Es el equivalente a un contenedor (`div` en web o `View` en React Native). Se encarga de poner el color de fondo correcto dependiendo del tema.
* **`ThemedText`**: Es para todo tu texto. Trae varios "tipos" listos para usar, como: `title` (Títulos grandes), `subtitle`, `default` (Texto normal), `small` (Texto pequeño), `link`, o `code`.
* **`SafeAreaView`**: Viene de `react-native-safe-area-context`. Siempre úsalo como contenedor principal de tu pantalla para que el contenido no quede escondido detrás del "notch" (la cámara) o la barra de batería del celular.

## 3. El Sistema de Estilos (CSS de React Native)

Para darle diseño a tus componentes, usarás **`StyleSheet`** de `react-native`. Funciona de forma muy parecida a CSS, pero escrito en JavaScript (usando CamelCase en vez de guiones, ej. `backgroundColor` en lugar de `background-color`).

Tu proyecto también cuenta con un archivo `src/constants/theme.ts` de donde puedes importar constantes como **`Spacing`** para mantener los márgenes y paddings consistentes en toda la app.

---

## 🌟 Ejemplo Práctico: Plantilla para una nueva pantalla

Si quisieras crear una pantalla llamada **"Ajustes"**, crearías el archivo `src/app/ajustes.tsx` con el siguiente código:

```tsx
// 1. Importaciones de librerías
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 2. Importaciones de tus propios componentes y temas
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// 3. El componente principal (La Pantalla)
export default function AjustesScreen() {
  return (
    // ThemedView nos da el color de fondo oscuro/claro
    <ThemedView style={styles.container}>
      {/* SafeAreaView evita que el notch tape el contenido */}
      <SafeAreaView style={styles.safeArea}>
        
        {/* Usamos ThemedText con type="title" para el encabezado */}
        <ThemedText type="title">Mis Ajustes</ThemedText>
        
        <ThemedView style={styles.tarjeta}>
          <ThemedText type="subtitle">Perfil</ThemedText>
          <ThemedText type="default">
            Aquí puedes modificar los datos de tu cuenta.
          </ThemedText>
        </ThemedView>

      </SafeAreaView>
    </ThemedView>
  );
}

// 4. Los estilos visuales
const styles = StyleSheet.create({
  container: {
    flex: 1, // Esto hace que ocupe toda la pantalla
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four, // Usamos los espacios de tu tema
    paddingTop: Spacing.four,
    gap: Spacing.three, // Espacio entre cada elemento
  },
  tarjeta: {
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: Spacing.two,
  }
});
```

## 4. ¿Cómo navego hacia mi nueva pantalla?

Tienes dos formas de hacer que el usuario llegue a la pantalla que acabas de crear:

### Opción A: Mediante un enlace (Botón invisible)
Si quieres ir a la pantalla desde otra parte (por ejemplo, desde el `index.tsx`), debes importar el componente `<Link>` de `expo-router` y envolver algún texto o botón:

```tsx
import { Link } from 'expo-router';

// En el return de tu componente:
<Link href="/ajustes">
  <ThemedText type="linkPrimary">Ir a los ajustes</ThemedText>
</Link>
```

### Opción B: Añadiéndola al Menú de Pestañas (Abajo)
Si quieres que tu nueva pantalla sea un ícono fijo en la barra inferior, debes editar el archivo `src/components/app-tabs.tsx`. Solo necesitas agregar un nuevo `<NativeTabs.Trigger>` asegurándote de que el atributo `name` coincida con el nombre de tu archivo (sin el `.tsx`):

```tsx
// Dentro de src/components/app-tabs.tsx, dentro de <NativeTabs>

<NativeTabs.Trigger name="ajustes">
  <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
  {/* Si tienes un ícono, lo pones aquí, si no, puedes omitirlo por ahora */}
</NativeTabs.Trigger>
```

## Resumen del flujo de trabajo ideal
1. Crea tu archivo en `src/app/nombre.tsx`.
2. Escribe tu estructura usando `<ThemedView>` y `<ThemedText>`.
3. Dale diseño usando `StyleSheet.create`.
4. Añade un `<Link href="/nombre">` en alguna parte de tu app para navegar hacia ella.
