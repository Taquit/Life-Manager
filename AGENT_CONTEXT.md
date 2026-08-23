# Contexto para Agentes de IA (Agent Context)

Este documento proporciona contexto crítico sobre la base de código `Gestor_Dinero` para que los agentes de IA (como Antigravity u otros) entiendan las convenciones, tecnologías y arquitectura al sugerir o aplicar cambios.

## Visión General
Esta es una aplicación *Full-Stack* orientada al control de finanzas personales (Life-Manager). El código está dividido rígidamente en dos repositorios/carpetas: `backend` y `double_m_react` (frontend móvil).

---

## 1. Contexto del Backend (`/backend`)
* **Infraestructura como Código (IaC):** Utiliza **SST v4** (`sst.config.ts`). **CUALQUIER** nueva ruta de la API, función Lambda o secreto debe ser registrado y aprovisionado primero en `sst.config.ts`.
* **Enrutamiento:** Se usa API Gateway V2. Cada endpoint (GET, POST, PUT, DELETE) tiene su propio archivo `.handler` separado dentro de su carpeta de entidad correspondiente (e.g., `src/transactions/get.ts`). Mantén esta separación modular; no crees monolitos.
* **Base de datos:** Postgres alojado en Supabase. Se interactúa de manera directa mediante el driver `pg` (SQL crudo). **NO** se usa Prisma ni ORMs (al menos que se modifiquen las dependencias).
* **Autenticación:** Las rutas protegidas deberían validar el JWT generado con `jsonwebtoken`.
* **Variables de Entorno/Secretos:** Se gestionan a través de SST (`sst.Secret`). Específicamente `DATABASE_URL` y `JWT_SECRET`.

---

## 2. Contexto del Frontend (`/double_m_react`)
* **Framework:** Es una aplicación **React Native** administrada completamente por **Expo**. **NO** sugieras librerías de React Native que requieran enlaces nativos (`react-native link`) a menos que sean compatibles con el ecosistema de Expo (Plugins de Expo).
* **Navegación:** Usa `expo-router` (enrutamiento basado en archivos).
* **Escucha de Notificaciones:** Hace uso de `react-native-android-notification-listener`, lo cual sugiere que la app lee los SMS o notificaciones push del sistema (probablemente del banco del usuario) para registrar transacciones de forma automática. Ten mucho cuidado al modificar permisos de Android en `app.json` relacionados con este feature.
* **Llamadas a API:** Se manejan con `axios`. Al agregar endpoints, asegúrate de apuntar a la URL de API Gateway generada por SST (o a variables de entorno locales provistas por Expo).

---

## Directrices para el Agente (Code Guidelines)
1. **Separación de Contextos:** Al realizar tareas full-stack, asegúrate de aplicar cambios coordinados pero independientes en ambas carpetas.
2. **Ejecución de Comandos:** 
   - Comandos de AWS/SST siempre deben correrse con `Cwd` en `/backend`.
   - Comandos de Expo/React siempre deben correrse con `Cwd` en `/double_m_react`.
3. **Idiomas:** El código base probablemente tiene lógica, variables y comentarios mixtos o en español/inglés. Manten el estilo de nomenclatura original (e.g. `MiApiGateway` en `sst.config.ts`, rutas en inglés `/transactions`).
