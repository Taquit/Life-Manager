# Money_app — Especificación de diseño para desarrollo (Android)

App de finanzas personales, solo Android. Este documento traduce el diseño del canvas ("Money_app") a valores exactos que un agente de código puede usar para construir la app (Jetpack Compose + Material 3 recomendado). "Money_app" es un nombre de trabajo — cámbialo si quieres otro.

Referencia visual completa (pantallas y guía de estilo): https://claude.ai/artifact/KurEBMM4HULABw2wPXjUUs

---

## 1. Sistema de color (modo oscuro / neón)

### Base
| Token | Hex | Uso |
|---|---|---|
| `background` | `#0D0B1A` | Fondo de pantalla |
| `surface` | `#17142B` | Tarjetas, barra inferior, inputs, chips no seleccionados |
| `surfaceTrack` | `#241F42` | Fondo de barras de progreso |
| `borderSubtle` | `#2E2757` | Divisores |
| `borderDashed` | `#4A4178` | Bordes punteados ("agregar nuevo"), aros de checkbox |
| `textPrimary` | `#F2EEFC` | Texto principal |
| `textSecondary` | `#B4A9E0` | Texto secundario / subtítulos |
| `textTertiary` | `#8A7FBD` | Captions, íconos neutros |
| `placeholder` | `#6E6494` | Placeholder de inputs |

### Marca
| Token | Hex | Uso |
|---|---|---|
| `brandText` | `#B84FFF` | Links, íconos activos, texto de marca |
| `brandFill` | `#7C3AED` | Botón primario, FAB, chip "Todas" seleccionado (con texto oscuro `#0D0B1A` encima) |
| `brandDeepSurface` | `#26134D` / `#20103F` | Tarjetas grandes tipo "hero" (balance, tarjeta vinculada) |
| `brandSoftText` | `#C7A9FF` | Texto de acento sobre superficies oscuras (avatar, links secundarios) |

### Semántica
| Token | Hex | Uso |
|---|---|---|
| `incomeText` | `#39FFC4` | Montos de ingreso, ícono flecha arriba |
| `incomeFill` | `#0FAE7C` | Relleno de botón/tab cuando el contexto es "ingreso" |
| `expenseText` | `#FF5C7A` | Montos de gasto, ícono flecha abajo |
| `expenseFill` | `#D6294B` | Relleno de botón/tab cuando el contexto es "gasto" |
| `pendingText` | `#FFC94D` | Estado "Pendiente", fechas de vencimiento |
| `pendingBg` | `#3A2B12` / `#241C0D` | Fondo de pill/tarjeta "pendiente" |
| `paidBg` | `#0F3324` | Fondo de pill "pagado" |
| `overdueBg` | `#3A0F1A` | Fondo de pill "vencido" |

### Categorías (8 fijas + reutilizadas en ingresos)
| Categoría | Hex |
|---|---|
| Alimentación | `#FF9142` |
| Transporte (y Freelance en ingresos) | `#4D9EFF` |
| Servicios | `#FFD23F` |
| Entretenimiento | `#E14FFF` |
| Salud | `#FF6FB3` |
| Hogar | `#2DE1C2` |
| Compras | `#9B6BFF` |
| Otros (y Otros ingresos) | `#8B82B8` |
| Nómina (ingreso) | `#39FFC4` |

**Regla de contraste:** los colores de categoría son claros/neón. Cualquier ícono dibujado sobre un círculo de categoría va en `#0D0B1A` (oscuro), nunca blanco.

---

## 2. Tipografía

- **Display / encabezados:** Sora, pesos 400/600/700 (Google Fonts)
- **Cuerpo / UI:** Manrope, pesos 400/500/600/700 (Google Fonts)

| Estilo | Fuente | Peso | Tamaño |
|---|---|---|---|
| Cifra de balance | Sora | 700 | 38–44px, `letter-spacing:-0.5px`, tabular-nums |
| Título de pantalla | Sora | 600 | 19–20px |
| Encabezado de sección | Sora | 600 | 14–15px |
| Título de fila/lista | Manrope | 600 | 15px |
| Cuerpo | Manrope | 400 | 14px |
| Caption | Manrope | 500–600 | 11.5–12px |
| Eyebrow (etiqueta mayúscula) | Manrope | 700 | 10.5px, `letter-spacing:0.08em`, uppercase |

Todas las cifras monetarias usan `font-variant-numeric: tabular-nums`.

---

## 3. Espaciado, radios y layout

- Retícula base: **8dp** (usar 8/12/16/20/24/32/40).
- Márgenes de pantalla: 20px laterales.
- Barra superior: 76px de alto. Barra inferior: 80px de alto.
- Radios: `999` (chips, pills, botones, toggle), `20` (tarjetas grandes), `14` (botones rectangulares, inputs), `12` (contenedores de ícono), `6` (elementos pequeños).
- Tamaño de pantalla de referencia usado en los mockups: **412×915dp** (equivalente a un Pixel).
- Objetivo mínimo de touch target: 44dp.

---

## 4. Componentes

- **Bottom nav:** 5 destinos fijos (Inicio, Movimientos, Tarjetas, Servicios, Reportes). Ícono/label activo en `brandText` con un `drop-shadow` sutil de 5px; inactivo en `textTertiary`.
- **FAB:** 56×56dp, radio 17, `brandFill`, ícono "+" blanco, sombra con glow (`box-shadow: 0 0 26px rgba(124,58,237,0.6)`).
- **Botón primario:** radio 14, texto `#F2EEFC` o `#0D0B1A` según el fondo, con glow sutil del color de relleno.
- **Chip/pill de categoría o filtro:** radio 999; seleccionado = relleno de color con texto de alto contraste; no seleccionado = `surface` con texto `textSecondary`.
- **Status pill (Pendiente/Pagado/Vencido):** radio 999, fondo = tinte oscuro del semántico, texto = versión brillante del mismo color.
- **Toggle (interruptor):** track 42×24 radio 999, thumb 20×20. Usado para "tarjeta vinculada a Google Pay".
- **Badge de origen automático:** ícono de "contactless" (arcos concéntricos + punto) de 13–15px en `textTertiary`, junto al monto — indica que la transacción se generó sola vía Google Pay.
- **Segmented control (Gasto/Ingreso, Todos/Pendientes/Pagados):** track en `surface`, segmento activo con relleno saturado (`expenseFill`/`incomeFill`/`brandFill` según contexto).
- **Fila de movimiento:** ícono de categoría (círculo 38–40px) + título + subtítulo (categoría · tarjeta) + [badge automático] + monto (coloreado por tipo).
- **Iconografía:** trazo simple (stroke), sin emojis, sin set de íconos de terceros — son SVG originales, fáciles de convertir a vector drawables de Android.

---

## 5. Modelos de datos

1. **Transacción** — `id`, `tipo` (gasto | ingreso), `monto`, `categoria_id`, `tarjeta_id` (nullable), `fecha`, `nota`, `origen` (manual | automático_google_pay).
2. **Tarjeta** — `id`, `banco`, `tipo` (débito | crédito), `ultimos_4`, `color_acento`, `vinculada_google_pay` (bool), `dia_corte` (solo crédito), `dia_pago` (solo crédito — fecha límite de pago, distinta del corte), `limite` (solo crédito).
3. **Categoría** — `id`, `nombre`, `tipo` (gasto | ingreso), `color`, `icono`.
4. **Servicio a pagar** — `id`, `nombre`, `categoria_id`, `monto`, `fecha_vencimiento`, `estado` (pendiente | pagado | vencido), `fecha_pago` (nullable).
5. **Balance mensual** — `mes`, `ingresos_total`, `gastos_total`, `balance_neto`; el desglose por categoría es una vista calculada sobre Transacción, no requiere tabla propia.
6. **Usuario** — `id`, `nombre`, `email`, `metodo_auth` (email_password | google), `hash_password` (nullable si `metodo_auth = google`), `fecha_registro`. Todas las tablas anteriores (Transacción, Tarjeta, Categoría, Servicio a pagar) se relacionan con `usuario_id`.

**Sugerido para una siguiente iteración (no incluido en las pantallas actuales):** un modelo de *Presupuesto* (límite mensual por categoría) para comparar gasto real vs. planeado.

---

## 6. Pantallas

### Iniciar sesión
Marca (logo + nombre "Money_app"), título de bienvenida. Campos correo y contraseña. Botón primario "Iniciar sesión". Divisor "o continúa con" y botón secundario "Continuar con Google". Link "¿No tienes cuenta? Regístrate" hacia Registro. Al iniciar sesión con éxito, navega a Inicio.

### Crear cuenta
Flecha atrás hacia Iniciar sesión. Campos nombre, correo, contraseña y confirmar contraseña. Checkbox de aceptación de términos y condiciones. Botón primario "Crear cuenta". Mismo bloque "o continúa con Google" que Iniciar sesión. Link "¿Ya tienes cuenta? Inicia sesión" hacia Iniciar sesión. Al registrarse con éxito, navega a Inicio.

### Inicio (dashboard)
Balance neto del mes en tarjeta destacada (ingresos/gastos desglosados), carrusel horizontal de "próximos servicios", top 3 categorías del mes con barra de progreso, lista de movimientos recientes. FAB para nueva transacción.

### Movimientos
Selector de mes, chips de filtro (tipo/categoría), lista de transacciones agrupada por fecha ("Hoy", "Ayer", fecha). Ícono de acceso a Categorías. FAB para nueva transacción.

### Nueva transacción
Modal/pantalla completa. Toggle Gasto/Ingreso (cambia color de acento y el set de categorías mostrado). Monto grande editable. Selector de categoría (chips horizontales, con acceso a "nueva categoría"). Selector de tarjeta. Selector de fecha. Nota opcional. Botón guardar con color dinámico según tipo.

### Tarjetas
Lista de tarjetas guardadas (banco, tipo, últimos 4 dígitos). Si es de crédito, muestra día de corte, fecha límite de pago y límite de crédito. Interruptor "Vinculada a Google Pay" por tarjeta. Botón agregar tarjeta.

### Categorías
Tabs Gasto/Ingreso. Lista de categorías con ícono, color, nombre y conteo de movimientos. Acceso para editar o crear nuevas.

### Servicios a pagar
Resumen del total pendiente del mes. Filtro Todos/Pendientes/Pagados. Lista de servicios con vencimiento, monto y acción rápida para marcar como pagado.

### Reportes (balance mensual)
Balance neto con variación vs. mes anterior. Distribución de gastos por categoría (dona). Comparación ingresos vs. gastos (barras). Tendencia de balance neto de los últimos 6 meses.

---

## 7. Navegación

**Iniciar sesión** es el punto de entrada de la app para un usuario no autenticado; al autenticarse (o registrarse) pasa a **Inicio**. Iniciar sesión y Crear cuenta se enlazan entre sí. A partir de ahí, barra inferior con 5 destinos: **Inicio, Movimientos, Tarjetas, Servicios, Reportes**.

- El FAB (+) en Inicio y Movimientos abre **Nueva transacción** (modal, regresa con Cancelar/Guardar).
- **Categorías** se abre desde Movimientos (ícono de etiqueta) o desde el selector de categoría en Nueva transacción; regresa con flecha atrás.
- "Agregar tarjeta" y "Agregar servicio" siguen el mismo patrón visual que Nueva transacción (no están construidas como pantallas aparte todavía).

---

## 8. Función clave: captura automática vía Google Pay

Cuando el usuario paga con una tarjeta marcada como "vinculada a Google Pay" (toggle en la pantalla Tarjetas), la transacción se crea sola con `origen = automático_google_pay`. En las listas de movimientos, esas filas muestran el ícono de "contactless" junto al monto; las transacciones sin ese ícono se agregaron a mano desde el formulario. El formulario de Nueva transacción sigue existiendo para efectivo, transferencias y cualquier compra que Google Pay no capture.

---

## 9. Notas para implementación en Android

- Recomendado: Jetpack Compose + Material 3, sobrescribiendo el `ColorScheme` con los tokens de la sección 1.
- Sora y Manrope están en Google Fonts — se pueden cargar con el proveedor de Downloadable Fonts de Android o empaquetar los `.ttf`.
- Los valores de espaciado y radio de la sección 3 están ya en dp, listos para usarse como constantes de tema.
- Los datos de ejemplo usados en los mockups (montos, tarjetas, categorías) son ilustrativos — no son requisitos de producto, solo contenido de referencia para ver el diseño poblado.
- "Continuar con Google" en Iniciar sesión / Crear cuenta se implementa con Credential Manager + Sign in with Google (no con el logo exacto de Google en el mockup — solo un marcador circular "G" genérico; usa el asset oficial de Google al construir el botón real, siguiendo sus guías de marca).
