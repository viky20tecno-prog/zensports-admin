# ZenSports — Documento de Diagnóstico Estratégico
**Versión:** Mayo 2026 | **Preparado por:** Equipo ZenSports

---

## 1. MAPA COMPLETO DEL PRODUCTO

### Estado actual por módulo

| Módulo | Estado | Notas |
|---|---|---|
| **Autenticación club** | ✅ Completo | JWT httpOnly, login por slug, roles Admin/Entrenador |
| **Dashboard principal** | ✅ Completo | KPIs, métricas en tiempo real, gráficas |
| **Gestión de jugadores** | ✅ Completo | CRUD, hoja de vida, foto, categorías, equipos, filtros, exportar CSV |
| **Importación masiva Excel** | ✅ Completo | Upload .xlsx/.csv con preview y validación |
| **Cobro automático WA** | ✅ Completo* | Ciclo completo días 27/1/4/7/8/9, mensajes WA automatizados |
| **Uniformes** | ✅ Completo | Catálogo de prendas, tallas, pedidos por jugador |
| **Arbitraje / Pagos árbitros** | ✅ Completo | Registro de partidos, pagos, gestión por fecha |
| **Calendario** | ✅ Completo | Vista mensual, eventos, partidos |
| **Conciliación bancaria** | ✅ Completo | Cruce de pagos manuales vs registros |
| **Finanzas** | ✅ Completo | Ingresos/egresos, categorías, resumen mensual |
| **Estado de cuenta jugador** | ✅ Completo | Historial de pagos, deudas, PDF descargable |
| **Inscripción online** | ✅ Completo | Formulario público por slug, sin login requerido |
| **Torneos** | ⚠️ Parcial | Estructura básica, falta fixture/llaves automáticas |
| **WhatsApp Bot IA** | ❌ No iniciado | Planeado: Q&A, difusiones, notificaciones |
| **App móvil** | ❌ No iniciado | Web responsive por ahora |
| **Portal Padre/Atleta** | ❌ No iniciado | Vista read-only del atleta, planeado |

> *Cobro automático WA: funcional en Twilio Sandbox. Migración a número WhatsApp Business propio pendiente.

### Panel Administrador ZenSports (Back-office interno)

| Sección | Estado |
|---|---|
| Dashboard ejecutivo (KPIs, MRR, gráficas) | ✅ Completo |
| Gestión de clubes (tabla, filtros, acciones) | ✅ Completo |
| Detalle club (jugadores, pagos, auditoría, notas, módulos) | ✅ Completo |
| Módulos por plan (toggle + lock por plan) | ✅ Completo |
| Audit Logs (historial de acciones admin) | ✅ Completo |
| Gestión de administradores (CRUD, roles) | ✅ Completo |
| Analytics SaaS (MRR, churn, revenue, crecimiento) | ✅ Completo |

### Acceso Demo — OPCIÓN A

Para generar accesos demo se requiere:
- **[ PENDIENTE ]** Crear club demo en producción con datos realistas
- **[ PENDIENTE ]** Generar usuarios demo por rol:

| Rol | URL | Usuario | Contraseña |
|---|---|---|---|
| Admin club | `[slug].zensports.app` o similar | `demo@zensports.co` | `[ PENDIENTE ]` |
| Admin ZenSports | `zensports-admin.vercel.app` | `diego31escobar@gmail.com` | `Admin2026!` |
| Entrenador | misma URL | `[ PENDIENTE ]` | `[ PENDIENTE ]` |
| Padre/Atleta | — | No disponible aún | — |

> **Recomendación inmediata:** Crear club `demo-fc` con 20 jugadores ficticios, 3 meses de pagos y todos los módulos activos para demos en vivo.

---

## 2. STACK TECNOLÓGICO

### Frontend — Dashboard del Club
- **Framework:** React 18 + Vite
- **Estilos:** TailwindCSS + CSS variables de tema (soporta tema claro/oscuro)
- **Gráficas:** Recharts
- **PDF:** jsPDF + html2canvas
- **Excel:** SheetJS (xlsx)
- **Auth:** JWT httpOnly (cookie)
- **Iconos:** Lucide React
- **Hosting:** Vercel

### Backend — API REST
- **Framework:** Express.js (Node.js)
- **Hosting:** Vercel Serverless Functions
- **Auth:** JWT firmado, bcrypt para contraseñas
- **URL:** `city-fc-api-v2.vercel.app` *(nombre técnico, no de marca)*

### Panel Admin (Back-office interno)
- **Framework:** Next.js 14 App Router
- **TypeScript:** Sí
- **UI:** @base-ui/react + TailwindCSS + Framer Motion
- **Tabla:** TanStack Table v8
- **Hosting:** Vercel

### Base de Datos
- **Motor:** PostgreSQL vía **Supabase**
- **Proyecto:** `olcevdnhmexaahymfzii` (región us-east-1)
- **Tablas principales:** `clubs`, `players`, `pagos`, `audit_logs`, `admin_users`
- **Arquitectura:** Multi-tenant por `club_id` (UUID) y `slug`
- **Storage:** Supabase Storage (bucket `player-photos` para fotos jugadores)

### Comunicaciones
- **WhatsApp:** Twilio API (Sandbox activo, WABA producción pendiente)
- **Email:** `[ PENDIENTE — no hay proveedor configurado ]`
- **SMS:** No

### IA / Automatización
- **Modelo:** Claude (Anthropic) — usado internamente para desarrollo
- **En producto:** No implementado aún (WhatsApp Bot IA es el siguiente paso)
- **Planeado:** Agente IA dentro de la plataforma para soporte, difusiones, cobranza conversacional

### Analytics / Observabilidad
- **Analytics de producto:** Básico (conteos en BD)
- **Error tracking:** `[ PENDIENTE — no hay Sentry ni similar ]`
- **Logs:** Vercel logs básicos
- **Business analytics:** Panel admin propio

### Pagos / Monetización
- **Pagos de clubes a ZenSports:** `[ PENDIENTE — Wompi/MercadoPago en landing, botones no activos ]`
- **Pagos de socios al club:** Manual (comprobante WA → revisión → aprobación)

### Dominio
- `[ PENDIENTE — confirmar dominio principal comprado ]`
- Deployments actuales: `*.vercel.app` (desarrollo/producción temporal)

---

## 3. ROADMAP ACTUAL

### Inmediato (listo para salir)
- Migrar cobro automático WA de Sandbox a número WABA real
- Activar botones de pago en landing (Wompi o MercadoPago)
- Club demo con datos realistas para ventas
- Cargar datos reales City FC (primer cliente real)

### Corto plazo (1-2 meses)
- Agente IA WhatsApp: Q&A del club, difusiones por equipo, notificaciones pagos
- Portal del atleta/padre (vista read-only)
- Torneos: fixture automático, llaves, resultados
- App móvil (PWA o React Native)

### Mediano plazo (3-6 meses)
- Integración pagos online (PSE, Nequi, Wompi) directo en plataforma
- Módulo de comunicaciones masivas (no solo WhatsApp)
- Reportes avanzados y exportación para directivos
- API pública para integraciones de terceros

### Visión largo plazo
- Marketplace de servicios deportivos (uniformes, proveedores)
- Plataforma de scouting / perfil público del atleta
- Expansión a ligas y federaciones
- `[ PENDIENTE — ajustar según input estratégico ]`

---

## 4. MODELO DE NEGOCIO ACTUAL

### Pricing (definido, no activo en sistema de cobro aún)

| Plan | Precio COP/mes | USD aprox. | Módulos |
|---|---|---|---|
| **Trial** | $0 | $0 | Solo jugadores (14 días) |
| **Starter** | $59.000 | ~$14 | Jugadores + Uniformes + Cobro WA |
| **Pro** | $99.000 | ~$24 | Todo Starter + Torneos + Arbitraje + WhatsApp |
| **Total** | $149.000 | ~$36 | Todo incluido |

### Estado de clientes
- **Clubes registrados:** 5 (city-fc, palmeiras, niupy, test-cors, club-prueba-demo)
- **Clubes pagando:** 0 (todos en trial o prueba)
- **Primer cliente real:** City FC (en proceso de onboarding completo)
- **MRR actual:** $0 COP

### Costos de operación
- Vercel (hosting): ~$0-20 USD/mes (plan gratuito actual)
- Supabase: ~$0-25 USD/mes (plan gratuito actual)
- Twilio (WhatsApp): por mensaje (~$0.005 USD/mensaje)
- Claude API: por uso
- **`[ PENDIENTE — calcular costo real por club activo ]`**

### Objeciones recibidas
- `[ PENDIENTE — documentar objeciones de prospectos ]`

### Validación de precios
- `[ PENDIENTE — sesiones de descubrimiento con clubes objetivo ]`

---

## 5. MERCADO OBJETIVO REAL

### Segmentos disponibles

| Segmento | Sofisticación digital | Capacidad de pago | Volum |
|---|---|---|---|
| Escuela de barrio (<50 atletas) | Baja | Baja ($0-30k COP/mes) | Muy alto |
| **Academia formativa (50-200)** | **Media** | **Media ($50-150k COP/mes)** | **Alto** |
| Club amateur competitivo | Media-Alta | Media-Alta | Medio |
| Club semiprofesional | Alta | Alta | Bajo |
| Liga / Federación | Alta | Alta | Muy bajo |

### Recomendación de foco inicial
**Academias formativas y clubes amateur competitivos** (50-300 atletas):
- Sienten el dolor de la gestión manual (WhatsApp + Excel)
- Tienen capacidad de pago real
- Son replicables (un caso de éxito genera referidos)
- No requieren funcionalidades enterprise complejas

### Geografía
- **Fase 1:** Colombia (validación completa)
- **Fase 2:** México, Perú, Chile (mismo modelo)
- **Fase 3:** España, EEUU Latino

### Deportes objetivo
- **Foco inicial:** Fútbol (mayor volumen)
- **Expansión natural:** Fútbol sala, baloncesto, natación, atletismo
- La plataforma es agnóstica al deporte en su arquitectura

---

## 6. COMPETENCIA

### Conocidos
- **Cluubi** — gestión de clubes deportivos
- `[ PENDIENTE — agregar links, pricing, capturas y análisis de cada competidor ]`
- `[ PENDIENTE — revisar: SportEasy, Spond, Pitchero, TeamSnap, PlayMetrics ]`

### Ventajas competitivas actuales de ZenSports
1. **WhatsApp nativo:** El cobro automático por WhatsApp es un diferenciador real  (la mayoría compite con email)
2. **Multi-deporte y multi-tenant** desde el diseño inicial
3. **Precio en moneda local** con estructura flexible por plan
4. **Panel admin propio** para operar el SaaS sin depender de Supabase manualmente
5. **Onboarding guiado** desde el primer login

### Huecos identificados (hipótesis)
- `[ PENDIENTE — validar contra competencia real ]`

---

## 7. IDENTIDAD DE MARCA

### Actual
- **Nombre:** ZenSports
- **Color principal:** `#E14924` (naranja/rojo energético)
- **Tema:** Oscuro (dark mode por defecto), soporte claro disponible
- **Logo:** `[ PENDIENTE — adjuntar archivo ]`
- **Dominio:** `[ PENDIENTE — confirmar dominio comprado ]`
- **Tono:** Profesional pero accesible, orientado a resultados

### Visión de marca (por definir formalmente)
- `[ PENDIENTE — statement de visión y misión ]`
- `[ PENDIENTE — narrativa de marca (story) ]`

### Percepción objetivo
Startup tecnológica latinoamericana, premium pero accesible, que hace que cualquier club se vea y opere como uno profesional.

---

## 8. MÉTRICAS ACTUALES

| Métrica | Valor actual |
|---|---|
| Clubes registrados | 5 |
| Clubes activos (usando) | 1-2 |
| Jugadores en plataforma | ~25 (City FC) |
| MRR | $0 COP |
| Pagos procesados | 32 (datos de prueba) |
| Módulo más usado | Gestión de jugadores |
| Tasa de conversión trial→pago | 0% (sin cobro activo) |
| Tiempo promedio en plataforma | `[ PENDIENTE ]` |
| NPS / satisfacción | `[ PENDIENTE ]` |

### Señales cualitativas
- City FC adoptó todos los módulos disponibles (plan total)
- El cobro automático por WhatsApp fue el feature que más interés generó
- `[ PENDIENTE — agregar feedback directo de usuarios ]`

---

## LO QUE CONVIERTE A ZENSPORTS EN IMPRESCINDIBLE

### El dolor real que resuelve
Un club de fútbol formativo  hoy opera así:
- **Pagos:** Lista de WhatsApp, "recuerda pagar", screenshot del comprobante, Excel manual
- **Jugadores:** Carpeta física o Google Sheets desactualizado
- **Comunicación:** Grupos de WhatsApp caóticos
- **Cobros morosos:** Sin seguimiento sistemático, ingresos impredecibles

ZenSports reemplaza todo eso con una sola plataforma que el administrador puede operar desde el celular.

### El diferenciador que genera retención (hipótesis a validar)
**El cobro automático por WhatsApp.** Cuando un club activa este módulo y ve que los pagos llegan solos —sin perseguir manualmente a cada padre— el churn cae a casi cero. Ese es el "aha moment" y el gancho de retención.

### Para el pitch
> *"ZenSports es el sistema operativo del club deportivo latinoamericano. Reemplazamos el Excel, el WhatsApp manual y la carpeta física con una plataforma que gestiona jugadores, cobra automáticamente y le da al director una visión completa de su club en tiempo real."*

---

## CAMPOS PENDIENTES DE COMPLETAR

Los siguientes ítems requieren input de Diego para completar el diagnóstico:

- [ ] Dominio comprado y URLs definitivas
- [ ] Logo en alta resolución y guía de marca
- [ ] Visión/misión formal de la empresa
- [ ] Objeciones reales recibidas de prospectos
- [ ] Análisis de competidores (links, precios, capturas)
- [ ] Feedback cualitativo de usuarios actuales (City FC)
- [ ] Costo real de operación por mes
- [ ] Validación de precios con mercado
- [ ] Segmento objetivo confirmado (academias formativas vs otro)
- [ ] Proveedor de pagos elegido (Wompi, MercadoPago, Stripe)
- [ ] Número WhatsApp Business para producción
- [ ] Proveedor de email transaccional (Resend, SendGrid, etc.)

---

*Documento generado con contexto técnico completo del producto. Versión 1.0 — Mayo 2026.*
