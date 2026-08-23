# Gestor de Dinero (Life-Manager)

Una aplicación Full-Stack para la gestión de finanzas personales, control de gastos, administración de tarjetas y categorización de transacciones.

## Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:

### 1. Frontend (`/double_m_react`)
Aplicación móvil desarrollada con **React Native** utilizando el ecosistema de **Expo**.
* **Framework:** React Native + Expo (incluyendo `expo-router` para navegación).
* **Consumo de API:** `axios`.
* **Características especiales:** Integración de notificaciones push, `react-native-android-notification-listener` (posiblemente para leer notificaciones bancarias de forma automática).
* **Gestión de estado/Almacenamiento:** `@react-native-async-storage/async-storage` y `expo-secure-store`.

### 2. Backend (`/backend`)
Arquitectura *Serverless* (sin servidor) alojada en AWS y gestionada con **SST (Serverless Stack) v4**.
* **Lenguaje:** TypeScript / Node.js.
* **Infraestructura:** AWS Lambda + API Gateway V2.
* **Base de Datos:** PostgreSQL (alojada en Supabase, conectada mediante el driver nativo `pg`).
* **Autenticación:** JWT (`jsonwebtoken`) y `bcryptjs` para contraseñas.
* **Entidades principales:** Usuarios (`user`), Transacciones (`transactions`), Categorías (`category`) y Tarjetas (`card`, incluye búsqueda por últimos 4 dígitos).

## Requisitos Previos
* [Node.js](https://nodejs.org/)
* [AWS CLI](https://aws.amazon.com/cli/) configurado (para el backend)
* [Expo CLI](https://docs.expo.dev/) (para el frontend)

## Instalación y Ejecución

**Para el Backend:**
```bash
cd backend
npm install
# Para ejecutar en desarrollo con SST
npx sst dev
```

**Para el Frontend:**
```bash
cd double_m_react
npm install
# Para iniciar el servidor de Expo
npm start
```
