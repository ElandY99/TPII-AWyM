# Requerimientos de integración Front (TP2) ↔ Back (TP3) — Salud Turnos

> Estado del documento: **BORRADOR para validación**. Todo lo marcado como **[PROPUESTA]** o referenciado como **DUDA-xx** necesita confirmación antes de implementarse.
> Fecha de análisis: 27/10/2026. Base analizada: repo completo con back terminado (`backend/`) y front en estado mockup (`public/`, `js/`, `css/`, `data/`).

---

## 1. Objetivo y alcance

Conectar el front del TP2 (HTML/CSS/JS vanilla con datos simulados en `localStorage`) con el back del TP3 (Express 5 + SQLite + Zod), eliminando por completo la persistencia local y **implementando en el front todas las vistas y funciones que el back ya soporta**.

**Dentro del alcance**
- Reemplazar `localStorage`/`sessionStorage` simulados por llamadas a la API.
- Autenticación real por cookie HttpOnly (`st_sid`), control por rol (ADMINISTRADOR, RECEPCIONISTA, PROFESIONAL).
- Adaptar pantallas existentes: Inicio, Login, Panel, Pacientes, Turnos, Agenda.
- Crear pantallas nuevas: Especialidades, Usuarios, Profesionales (con Disponibilidad), Cambio de contraseña.
- Manejo uniforme de errores, validaciones, estados de carga y vacíos.

**Fuera de alcance (salvo que se confirme lo contrario)**
- Cambios en el back (ver sección 12: hallazgos y DUDA-03).
- Pantalla de auditoría (no existe endpoint; DUDA-17).
- Migrar a un framework o agregar build system (DUDA-02).

---

## 2. Estado actual y brecha

| Archivo front | Hoy | Debe pasar a |
|---|---|---|
| `js/data.js` | Datos por defecto + `AppData.read/write` sobre `localStorage`; además define `showToast` y el `MutationObserver` de mensajes | Eliminar datos y `AppData`. **Conservar** toasts y observer (mover a un archivo de UI, ver DT-02) |
| `js/common.js` | Guard con `sessionStorage('saludturnos_user')`; logout local; menú móvil; `AppHelpers` | Guard vía `GET /api/auth/me`; logout vía `POST /api/auth/logout`; nav por rol |
| `js/login.js` | Compara contra `AppData.defaults.users` (`admin@… / 1234`) | `POST /api/auth/login` `{correo, clave}` |
| `js/dashboard.js` | Calcula métricas en cliente | `GET /api/dashboard` |
| `js/pacientes.js` | Alta/listado local; correo opcional; sin edición ni baja | CRUD completo vía API, búsqueda server-side |
| `js/turnos.js` | Horas hardcodeadas 08:30–11:30; estados "Pendiente/Confirmado/Cancelado"; solo alta y cancelar | Horarios desde `/api/turnos/disponibles`; 6 estados; filtros; reprogramar; observaciones; cambios de estado |
| `js/agenda.js` | Un profesional, un día, horas fijas | Diaria y mensual desde `/api/agenda`; filtro por profesional/especialidad |
| `data/datos.json` | Ejemplo obsoleto (servido en `/data`) | Eliminar archivo y la ruta estática `/data` |
| HTML | 6 páginas, nav duplicada en cada una | + `especialidades.html`, `usuarios.html`, `profesionales.html`; nav única por rol |

**Funcionalidades del back sin pantalla hoy:** gestión de especialidades, usuarios, profesionales, disponibilidad semanal, edición/desactivación/reactivación de pacientes, filtros de turnos, reprogramación, observaciones de consulta, transiciones de estado (confirmar, llegada, asistido, ausente), cambio de contraseña, reseteo de contraseña, agenda mensual.

---

## 3. Decisiones técnicas propuestas

Todas **[PROPUESTA]**; objetar cualquiera.

- **DT-01 Mismo origen.** El front lo sirve Express (`public/`, `/css`, `/js`). Se usa `fetch(url, { credentials: 'same-origin' })`. No hay CORS ni tokens en JS: la sesión viaja en cookie HttpOnly. (DUDA-01)
- **DT-02 Estructura de scripts.**
  - `js/api.js` (nuevo): wrapper de `fetch`, un método por endpoint.
  - `js/ui.js` (renombra la parte de toasts/observer de `data.js`): toasts, modales, helpers de render.
  - `js/common.js`: sesión, nav, logout, helpers compartidos.
  - `js/<pantalla>.js`: lógica por pantalla.
  - Orden de carga: `api.js` → `ui.js` → `common.js` → `<pantalla>.js`.
- **DT-03 Wrapper de API (`api.js`).**
  - Envía/recibe JSON y lanza `ApiError { status, error, campos }` ante respuestas no 2xx.
  - Ante `401` (salvo en `/auth/login`) redirige a `login.html` con aviso de sesión finalizada.
  - **Omite parámetros vacíos/`undefined` en query strings** (ver FE-GEN-03).
  - Errores de red → mensaje genérico "No se pudo conectar con el servidor".
- **DT-04 Sesión asíncrona.** `common.js` expone `AppSession.ready` (Promise que resuelve con `usuario`). Las páginas ejecutan su lógica **después** de `ready`. Mientras no resuelve, el contenido permanece oculto (evita parpadeo de contenido privado y llamadas sin saber el rol).
- **DT-05 Navegación por rol desde un solo lugar.** El sidebar se genera en `common.js` desde una única definición `{ href, label, roles }`, eliminando la nav duplicada en cada HTML. Marca `active` según la página actual.
- **DT-06 Escape de HTML obligatorio.** Todo dato proveniente de la API que se interpole en `innerHTML` pasa por `AppHelpers.esc()` (o se usa `textContent`). Aplica también a mensajes de toast. Los TP2 actuales interpolan sin escapar (riesgo XSS con nombres, motivos, observaciones).
- **DT-07 Fechas locales, no UTC.** `new Date().toISOString().slice(0,10)` devuelve la fecha UTC: en Argentina (UTC‑3) **después de las 21:00 devuelve el día siguiente**. Se reemplaza por `AppHelpers.todayLocal()` (arma `YYYY-MM-DD` con `getFullYear/getMonth/getDate`). Afecta `agenda.js` y `turnos.js` (valor inicial y `min`).
- **DT-08 Refrescar después de escribir.** Tras POST/PUT/PATCH/DELETE se vuelve a consultar el listado; no se mutan arrays locales. Motivo: la respuesta de `POST/PUT /api/turnos` usa un set de campos distinto al del listado (p. ej. sin `paciente_telefono`).
- **DT-09 Prevención de doble envío.** Botones de submit deshabilitados con estado "Guardando…" mientras hay un request en curso.
- **DT-10 Estados de turno centralizados.** Un único mapa `ESTADOS = { PENDIENTE: {label, css}, … }` para etiquetas, badges y acciones (el helper actual `status.toLowerCase().replaceAll(' ', '-')` no cubre `EN_CONSULTORIO`).
- **DT-11 Búsquedas.** Debounce de 300 ms y cancelación de la petición anterior con `AbortController` para evitar respuestas fuera de orden.
- **DT-12 Modales reutilizables** (confirmación, formularios de edición, clave generada) con foco atrapado, cierre con `Esc` y `aria-modal`. (DUDA-25 sobre usar o no `window.confirm`.)

Todas las propuestas son aceptadas.

---

## 4. Contrato de la API (resumen para el front)

Convenciones: éxito `{ data, mensaje? }`; error `{ error, campos? }`; `campos` es un mapa `campo → mensaje`. Las claves de `campos` pueden ser planas (`dni`) o con punto (`profesional.matricula`) — ver H-04. ADMINISTRADOR pasa todos los `requireRole`.

| Recurso | Endpoint | Roles |
|---|---|---|
| Auth | `POST /api/auth/login` `{correo, clave}` | público |
| | `POST /api/auth/logout` · `GET /api/auth/me` · `PUT /api/auth/clave` `{clave_actual, clave_nueva}` | autenticado |
| Usuarios | `GET /api/usuarios` (filtros `nombre, apellido, correo, rol, estado`) · `GET /:id` | ADMIN |
| | `POST /api/usuarios` · `PUT /:id` · `DELETE /:id` (desactiva) · `PATCH /:id/activar` · `POST /:id/clave` (reset) | ADMIN |
| Profesionales | `GET /api/profesionales` (filtros `especialidad` *(texto)*, `nombre`, `estado`) · `GET /:id` · `GET /:id/disponibilidad` | todos (PROFESIONAL solo a sí mismo) |
| | `PUT /:id` · `DELETE /:id` · `PATCH /:id/activar` · `PUT /:id/disponibilidad` `{franjas}` | ADMIN |
| Especialidades | `GET /api/especialidades` (`nombre`, `estado`) · `GET /:id` | ADMIN, RECEP |
| | `POST` · `PUT /:id` · `DELETE /:id` · `PATCH /:id/activar` | ADMIN |
| Pacientes | `GET /api/pacientes` (`q, dni, nombre, telefono, correo, estado`) · `GET /:id` · `POST` · `PUT /:id` | ADMIN, RECEP |
| | `DELETE /:id` (desactiva) · `PATCH /:id/activar` | ADMIN |
| Turnos | `GET /api/turnos/disponibles?fecha&(id_profesional\|id_especialidad)` | ADMIN, RECEP |
| | `GET /api/turnos` (`fecha, hora, paciente, profesional, estado`) · `GET /:id` | todos (PROFESIONAL: solo propios) |
| | `POST /api/turnos` · `DELETE /:id` (cancela) | ADMIN, RECEP |
| | `PUT /api/turnos/:id` (reprogramar / observaciones) | todos (PROFESIONAL: solo observaciones) |
| | `PATCH /api/turnos/:id/estado` `{estado}` | todos (PROFESIONAL no puede `CANCELADO`) |
| Agenda | `GET /api/agenda?(fecha\|mes)&id_profesional&id_especialidad` | autenticado (PROFESIONAL forzado a la suya) |
| Dashboard | `GET /api/dashboard` | autenticado (PROFESIONAL: solo propios) |

**Formas de respuesta relevantes**
- Login/`me`: `usuario { id, nombre, apellido, correo, rol, id_profesional|null }` (ojo: `id`, mientras `/api/usuarios` devuelve `id_usuario`).
- Listado de usuarios **no incluye** `id_profesional`; `GET /usuarios/:id` sí (`id_profesional, matricula, consultorio, id_especialidad`).
- Profesional: `id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, estado, especialidad_nombre, usuario_correo`.
- Turno (listado): `id_turno, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, fecha_cancelacion, id_paciente, paciente_{dni,nombre,apellido,telefono,correo}, id_profesional, profesional_{matricula,nombre,apellido}, consultorio, id_especialidad, especialidad_nombre`.
- Horarios libres: `[{ id_profesional, profesional, consultorio, horarios: ['08:00', …] }]`.
- Agenda: `[{ id_profesional, profesional, especialidad, consultorio, tiene_agenda, mensaje?, dias: [{ fecha, dia_semana, slots: [{ hora, estado: 'LIBRE'|'OCUPADO', turno: {id_turno, estado, motivo, paciente, paciente_dni} | null }] }] }]`.
- Dashboard: `{ ventana:{desde,hasta}, indicadores:{ total, confirmados, cancelados, por_estado:{6 estados} }, proximos:[≤5] }`.
- Generación de clave (`POST /usuarios`, `POST /usuarios/:id/clave`): `clave_generada` se devuelve **una sola vez**.

---

## 5. Matriz de permisos (qué ve y qué puede hacer cada rol)

| Pantalla / acción | ADMINISTRADOR | RECEPCIONISTA | PROFESIONAL |
|---|:-:|:-:|:-:|
| Panel | ✔ todo | ✔ todo | ✔ solo sus turnos |
| Pacientes: ver, buscar, alta, editar | ✔ | ✔ | ✖ |
| Pacientes: desactivar / reactivar | ✔ | ✖ | ✖ |
| Especialidades: ver | ✔ | ✔ | ✖ |
| Especialidades: alta, editar, desactivar, reactivar | ✔ | ✖ | ✖ |
| Usuarios (todo, incl. reseteo de clave) | ✔ | ✖ | ✖ |
| Profesionales: ver lista | ✔ | ✔ | ✔ solo él/ella |
| Profesionales: editar, baja/alta | ✔ | ✖ | ✖ |
| Disponibilidad: ver | ✔ | ✔ | ✔ la propia |
| Disponibilidad: editar | ✔ | ✖ | ✖ |
| Turnos: ver listado/detalle | ✔ | ✔ | ✔ solo propios |
| Turnos: crear, reprogramar, cancelar | ✔ | ✔ | ✖ |
| Turnos: observaciones (solo `EN_CONSULTORIO`) | ✔ | ✔ | ✔ propios |
| Turnos: cambio de estado | ✔ | ✔ | ✔ sin `CANCELADO` (⚠ ver DUDA-06) |
| Agenda | ✔ | ✔ | ✔ solo la propia |
| Cambiar propia contraseña | ✔ | ✔ | ✔ |

Navegación resultante **[PROPUESTA]**:
- ADMIN: Panel · Pacientes · Turnos · Agenda · Profesionales · Especialidades · Usuarios · Mi cuenta · Cerrar sesión
- RECEPCIONISTA: Panel · Pacientes · Turnos · Agenda · Profesionales (solo lectura) · Especialidades (solo lectura) · Mi cuenta · Cerrar sesión
- PROFESIONAL: Panel · Turnos (mis turnos) · Agenda · Mi cuenta · Cerrar sesión

---

## 6. Requisitos transversales

- **FE-GEN-01** Ningún dato de negocio se guarda en `localStorage`/`sessionStorage`. El rol y usuario se obtienen de `/api/auth/me` en cada carga de página.
- **FE-GEN-02** Cada pantalla privada llama a `AppSession.ready` antes de renderizar. Si el rol no tiene acceso a la pantalla, se redirige a `dashboard.html` con toast informativo (el back igualmente responde 403).
- **FE-GEN-03** **No enviar parámetros vacíos.** Los esquemas de query son `.strict()` y validan enums: `estado=''` → 400; `id_profesional=''` (coerce → 0) → 400; cualquier parámetro desconocido (p. ej. cache-buster `_=`) → 400.
- **FE-GEN-04** **Campos opcionales vacíos se envían como `null` u omitidos, nunca como `''`.** Ej.: `telefono: ''` falla la regex `^\d{1,12}$`; `fecha_nacimiento: ''` falla el formato.
- **FE-GEN-05** Los IDs en el body se envían como **número** (`id_paciente`, `id_profesional`, `id_especialidad` usan `z.number()` estricto). Los `value` de los `<select>` llegan como texto: convertir con `Number()`.
- **FE-GEN-06** Los bodies de POST/PUT son `.strict()`: no enviar propiedades extra (p. ej. `estado`, `id`, o el objeto completo recibido en el GET).
- **FE-GEN-07** Mapeo de errores:

| Código | Comportamiento |
|---|---|
| 400 | Mostrar `campos[campo]` junto al input correspondiente (ver mapeos por pantalla); si el campo no tiene input, toast con `error` |
| 401 | Login: mostrar `error` en el formulario. Resto: limpiar estado y redirigir a login con aviso "Su sesión finalizó" |
| 403 | Toast con `error`; si fue al cargar una pantalla, redirigir a `dashboard.html` |
| 404 | Toast + volver al listado y refrescarlo |
| 409 | Toast con `error` (mensajes ya redactados para el usuario); si trae `campos`, marcar el input |
| 5xx / red | Toast genérico; nunca mostrar trazas |

- **FE-GEN-08** Listados vacíos: mostrar fila/estado vacío (usar `mensaje` del back cuando exista). Listados cargando: indicador de carga.
- **FE-GEN-09** Mensajes del back se muestran tal cual (ya están en español para el usuario final). Las validaciones del front que se anticipan al back usan los mismos textos cuando sea posible.
- **FE-GEN-10** Las pantallas que muestran estados que cambian solos (turnos → `AUSENTE` automático a los 30 min) ofrecen botón "Actualizar" y se refrescan al volver el foco a la pestaña (DUDA-27).
- **FE-GEN-11** Formato de visualización de fechas: **[PROPUESTA]** `dd/mm/aaaa` en pantalla, `YYYY-MM-DD` en la API (DUDA-09) | Propuesta aceptada.
- **FE-GEN-12** Mantener responsive actual (breakpoints 768 px y 520 px), tablas dentro de `.table-wrap`, objetivos táctiles ≥ 40 px, `font-size: 16px` en inputs.
- **FE-GEN-13** Accesibilidad: `label` asociado a cada input, `aria-live` para mensajes, errores vinculados con `aria-describedby`, foco gestionado en modales.
- **FE-GEN-14** Estilos nuevos para badges `en_consultorio`, `asistido`, `ausente` (hoy solo existen `confirmado`, `pendiente`, `cancelado`), badges de activo/inactivo, modales, pestañas/filtros y botones de acción compactos.

---

## 7. Requisitos por pantalla — existentes

### 7.1 Inicio (`index.html`)
- **FE-INI-01** Mantener contenido. **[PROPUESTA]** Si ya hay sesión válida, el botón principal pasa a "Ir al panel".
- **FE-INI-02** Actualizar el pie "Trabajo Práctico 2" (DUDA-26).

### 7.2 Login (`login.html`, `login.js`)
- **FE-LOG-01** `POST /api/auth/login` con `{correo, clave}` (sin propiedades extra). El correo se envía `trim`; el server lo normaliza.
- **FE-LOG-02** Si ya hay sesión (`/me` responde 200) → redirigir a `dashboard.html`.
- **FE-LOG-03** Errores: 400 → `campos.correo` / `campos.clave` bajo cada input; 401 → "Usuario o contraseña incorrectos" (mensaje genérico, limpiar contraseña); 403 → mensaje de cuenta inactiva del back.
- **FE-LOG-04** Éxito → redirigir a `dashboard.html`. No guardar nada en storage.
- **FE-LOG-05** Eliminar o ajustar el recuadro de credenciales "admin@saludturnos.com / 1234" (la clave real del seed es otra y la clave en pantalla es un riesgo; DUDA-13).
- **FE-LOG-06** `autocomplete="username"` / `current-password`. Botón deshabilitado durante el request.

### 7.3 Shell privado (`common.js` + nav)
- **FE-NAV-01** Guard asíncrono por `/me` (DT-04). Si 401 → login.
- **FE-NAV-02** Nav por rol (sección 5) con ítem activo, mostrando nombre, apellido y rol del usuario en el sidebar o topbar.
- **FE-NAV-03** "Cerrar sesión" → `POST /api/auth/logout`; ante cualquier resultado (incluso 401) redirigir a login.
- **FE-NAV-04** Mantener el menú hamburguesa móvil existente funcionando con la nav generada dinámicamente.
- **FE-NAV-05** La sesión es **única por usuario**: si inicia sesión en otro navegador, la actual recibe 401. El mensaje de redirección debe explicarlo ("Su sesión finalizó o fue iniciada en otro dispositivo").

### 7.4 Panel (`dashboard.html`, `dashboard.js`)
- **FE-DAS-01** Consumir `GET /api/dashboard`. Indicadores: Total, Confirmados, Cancelados (+ ver DUDA-11 por los demás estados).
- **FE-DAS-02** Aclarar el período en pantalla: "Turnos desde {desde} hasta {hasta}" (ventana de 30 días desde hoy, no el histórico; hoy el rótulo "Turnos registrados" es engañoso).
- **FE-DAS-03** Tabla "Próximos turnos" con hasta 5 filas del back (campos `paciente_nombre/apellido`, `profesional_nombre/apellido`, `consultorio`, `estado`). Mostrar consultorio (nuevo respecto del TP2).
- **FE-DAS-04** Botón "Nuevo turno" visible solo ADMIN/RECEP.
- **FE-DAS-05** Para PROFESIONAL el panel aclara que se muestran solo sus turnos.

### 7.5 Pacientes (`pacientes.html`, `pacientes.js`)
**Campos del formulario (alta/edición) y reglas del back**

| Input | Campo API | Regla | Cambio vs TP2 |
|---|---|---|---|
| `dni` | `dni` | obligatorio, 7–8 dígitos, sin puntos | hoy `maxlength=15` y sin formato |
| `nombre` | `nombre` | obligatorio, 2–50 | — |
| `apellido` | `apellido` | obligatorio, 2–50 | — |
| `telefono` | `telefono` | opcional, solo dígitos, ≤ 12 | hoy acepta guiones, `maxlength=20` |
| `correo` | `correo` | **obligatorio**, email válido | hoy era opcional |
| `fecha_nacimiento` (nuevo) | idem | opcional, `YYYY-MM-DD`, ≥ 1900-01-01 y no futura | campo nuevo |
| `obra_social` (nuevo) | idem | opcional, ≤ 100 | campo nuevo |

- **FE-PAC-01** Listado desde `GET /api/pacientes`; búsqueda con parámetro `q` (DNI, nombre o apellido; insensible a tildes/mayúsculas) con debounce (DT-11).
- **FE-PAC-02** Filtro de estado Activos / Inactivos / Todos (`estado=1|0|todos`; sin parámetro el back devuelve todos). **[PROPUESTA]** default: Activos.
- **FE-PAC-03** Columnas: DNI, Apellido y nombre, Teléfono, Correo, Fecha de nacimiento, Obra social, Estado, Acciones.
- **FE-PAC-04** Alta (`POST`) y **edición** (`PUT /:id`, requiere enviar todos los campos obligatorios). Reutilizar el formulario existente en modo edición.
- **FE-PAC-05** Desactivar / reactivar solo para ADMIN (`DELETE /:id`, `PATCH /:id/activar`) con confirmación. 409 si tiene turnos futuros activos → mostrar el mensaje del back.
- **FE-PAC-06** Errores: `campos.dni|nombre|apellido|telefono|correo|fecha_nacimiento|obra_social` → mismo id de input. DNI duplicado → 409 con `campos.dni`.
- **FE-PAC-07** Validaciones previas en cliente que replican las del back (para no depender solo del 400).
- **FE-PAC-08** Dato del teléfono con guiones: ver DUDA-22.

---

## 8. Requisitos por pantalla — Turnos y Agenda

### 8.1 Turnos (`turno.html`, `turnos.js`) — ver DUDA-05
**Alta de turno (solo ADMIN/RECEP; oculto para PROFESIONAL)**
- **FE-TUR-01** Paciente: selector con **búsqueda** (`GET /api/pacientes?q=…&estado=1`) en lugar de cargar todos en un `<select>` (DUDA-20).
- **FE-TUR-02** Especialidad: `GET /api/especialidades?estado=1`. Profesional: `GET /api/profesionales?estado=1` y filtrado en cliente por `id_especialidad` (el filtro `especialidad` del back es por **nombre**, no por id). Mostrar "Apellido, Nombre — Consultorio X"; sin títulos Dr./Dra. (el back no los tiene; DUDA-10).
- **FE-TUR-03** Fecha: `min` = hoy local (DT-07). Hora: opciones desde `GET /api/turnos/disponibles?fecha=…&id_profesional=…` (reemplaza `hours` hardcodeado). Se recalcula al cambiar profesional o fecha. Si `horarios` viene vacío, mostrar el `mensaje` del back y deshabilitar Hora.
- **FE-TUR-04** Motivo (opcional, ≤ 255). Campo `observaciones` **no** se pide al crear (solo aplica durante la consulta; DUDA-05).
- **FE-TUR-05** `POST /api/turnos` con `{id_paciente, id_profesional, fecha, hora, motivo_consulta}`. Estado inicial `PENDIENTE`.
- **FE-TUR-06** Conflictos 409 ("El horario dejó de estar disponible…", "El paciente ya posee otro turno…") → mostrar mensaje y recalcular horarios.
- **FE-TUR-07** Reglas que el back valida y el front debe anticipar: no fechas/horas pasadas; horario dentro de la disponibilidad del profesional; profesional activo y con consultorio; paciente activo.

**Listado de turnos (todos los roles; PROFESIONAL ve solo los suyos)**
- **FE-TUR-10** `GET /api/turnos` con filtros: fecha (exacta), hora, paciente (DNI/nombre), profesional (nombre; no aplica a PROFESIONAL), estado. Sin rango de fechas en el back (DUDA-08).
- **FE-TUR-11** Columnas: Fecha, Hora, Paciente (DNI), Profesional, Especialidad, Consultorio, Motivo, Estado, Acciones.
- **FE-TUR-12** Detalle expandible o modal con: observaciones, motivo, `fecha_hora_llegada`, `fecha_cancelacion`, contacto del paciente.
- **FE-TUR-13** Orden: el back devuelve ascendente por fecha y hora.

**Acciones por turno** (botones visibles según estado, rol y regla del back)

| Estado actual | Acciones posibles (back) | Restricciones adicionales |
|---|---|---|
| PENDIENTE | → CONFIRMADO · → CANCELADO · reprogramar | Reprogramar/cancelar: no PROFESIONAL |
| CONFIRMADO | → EN_CONSULTORIO · → AUSENTE · → CANCELADO · reprogramar | `EN_CONSULTORIO` solo el **día del turno** y dentro de su franja `[hora, hora+30)`; reprogramar solo antes del inicio |
| EN_CONSULTORIO | → ASISTIDO · editar observaciones | Observaciones solo en este estado |
| ASISTIDO / AUSENTE / CANCELADO | ninguna (finales) | — |

- **FE-TUR-20** Cambio de estado: `PATCH /api/turnos/:id/estado {estado}`. Cancelación vía `DELETE /:id` (equivalente) con confirmación. **Quién ve cada botón: ver DUDA-06.**
- **FE-TUR-21** "Registrar llegada" se habilita solo si el turno es de hoy y está en su franja; si no, botón deshabilitado con tooltip explicativo (el back valida igual).
- **FE-TUR-22** Reprogramar (`PUT /:id`, modal): permite cambiar profesional, fecha, hora y motivo; **el paciente no es modificable**. Enviar solo campos modificados. ⚠ `GET /disponibles` excluye el slot ocupado por **este mismo turno**: el modal debe agregar manualmente el horario actual como opción cuando profesional y fecha no cambian.
- **FE-TUR-23** Observaciones: `PUT /:id {observaciones}` solo con turno `EN_CONSULTORIO` (≤ 500). Disponible para ADMIN, RECEP y el PROFESIONAL asignado.
- **FE-TUR-24** Tras cada acción: refrescar listado y, si hay formulario de alta abierto, recalcular horarios.

### 8.2 Agenda (`agenda.html`, `agenda.js`) — ver DUDA-12
- **FE-AGE-01** Consumir `GET /api/agenda`. Requiere `fecha` (`YYYY-MM-DD`) **o** `mes` (`YYYY-MM`); filtros `id_profesional` / `id_especialidad`.
- **FE-AGE-02** Vista **diaria** (default) y vista **mensual** (nueva). Selector de modo.
- **FE-AGE-03** Filtros para ADMIN/RECEP: Especialidad y Profesional (con opción "Todos"); para PROFESIONAL los filtros se ocultan (el back fuerza su agenda).
- **FE-AGE-04** Render por profesional → día → slots. Estados `LIBRE` / `OCUPADO` con estilos actuales (`agenda-slot free/busy`); `OCUPADO` muestra paciente (DNI), estado del turno y motivo.
- **FE-AGE-05** Mostrar los casos del back: `tiene_agenda=false` → mensaje "no posee agenda activa"; día sin franjas → no aparece (en la vista mensual solo se listan días de atención).
- **FE-AGE-06** Fecha inicial = hoy local (DT-07), no UTC.
- **FE-AGE-07** **[PROPUESTA]** Clic en slot `LIBRE` (ADMIN/RECEP, futuro) → ir a `turno.html` con profesional/fecha/hora precargados; clic en `OCUPADO` → detalle/acciones del turno.
- **FE-AGE-08** Slots `LIBRE` ya vencidos (hoy, hora pasada) se muestran atenuados/no seleccionables (el back los devuelve como `LIBRE`).

---

## 9. Requisitos por pantalla — nuevas (ADMIN / lectura RECEP)

### 9.1 Especialidades (`especialidades.html`)
- **FE-ESP-01** Listado con filtro por nombre y estado (`nombre`, `estado`). ADMIN y RECEP la ven; RECEP solo lectura.
- **FE-ESP-02** ADMIN: alta, edición (nombre 3–80, descripción ≤ 255), desactivar y reactivar.
- **FE-ESP-03** Desactivar con profesionales activos → 409 con el detalle del back ("posee N profesional(es) activo(s)…").
- **FE-ESP-04** Nombre duplicado (insensible a tildes/mayúsculas) → 409 con `campos.nombre`.

### 9.2 Usuarios (`usuarios.html`) — solo ADMIN
- **FE-USR-01** Listado con filtros `nombre, apellido, correo, rol, estado`. Columnas: Nombre, Correo, Rol, Estado, Fecha de creación, Acciones.
- **FE-USR-02** Alta de usuario con rol **RECEPCIONISTA** o **PROFESIONAL** (no se pueden crear ADMIN). Campos: nombre, apellido, correo.
- **FE-USR-03** Si el rol es PROFESIONAL el formulario exige además: especialidad activa, matrícula (exactamente 5 dígitos), consultorio (≤ 20; único ignorando mayúsculas, tildes y espacios) y **al menos una franja** de disponibilidad (editor de 9.3). Se envía todo en un único `POST /api/usuarios` (alta atómica).
- **FE-USR-04** Tras crear: modal con **clave generada**, aviso "se muestra una sola vez", botón copiar. Al cerrarlo no puede recuperarse (DUDA-16).
- **FE-USR-05** Edición (`PUT /:id`): solo nombre, apellido y correo; **el rol no se modifica**. Si es profesional, el back sincroniza nombre/apellido.
- **FE-USR-06** Desactivar (`DELETE /:id`) / reactivar (`PATCH /:id/activar`) con confirmación. Restricciones a reflejar en la UI:
  - No se puede desactivar la propia cuenta ni a otros ADMIN.
  - Un usuario vinculado a un profesional **activo** no se puede desactivar (hay que dar de baja primero al profesional).
  - Un ADMIN no puede editar ni resetear la clave de **otro** ADMIN (sí la propia). Para filas ADMIN ajenas, acciones deshabilitadas con explicación.
- **FE-USR-07** Reseteo de contraseña (`POST /:id/clave`) con confirmación; muestra la nueva clave en el modal de FE-USR-04. Cierra las sesiones del usuario.
- **FE-USR-08** Para usuarios con rol PROFESIONAL, mostrar el vínculo (matrícula/consultorio) cruzando con `GET /api/profesionales` por `id_usuario` (el listado de usuarios no trae `id_profesional`).
- **FE-USR-09** **Reactivar un usuario PROFESIONAL** debe hacerse desde Profesionales (reactiva ambos). En Usuarios ese botón se oculta o redirige (ver H-01, DUDA-03).
- **FE-USR-10** Errores: 409 `campos.correo` (duplicado); mapear `profesional.id_especialidad|matricula|consultorio` (ver H-04 sobre claves anidadas).

### 9.3 Profesionales y Disponibilidad (`profesionales.html`)
- **FE-PRO-01** Listado (ADMIN y RECEP) con filtros `especialidad` (texto), `nombre`, `estado`. Columnas: Apellido y nombre, Especialidad, Matrícula, Consultorio, Usuario (correo), Estado, Acciones. El PROFESIONAL no accede a esta pantalla (su dato se ve en Mi cuenta; DUDA-07).
- **FE-PRO-02** Edición ADMIN (`PUT /:id`): `id_especialidad` (activa), `matricula` (5 dígitos), `consultorio` (texto ≤ 20 **o vacío para liberarlo**, se envía `null`).
- **FE-PRO-03** Editor de **disponibilidad semanal** (`GET/PUT /:id/disponibilidad`, reemplazo completo):
  - Por día LUNES–DOMINGO, **múltiples franjas por día**.
  - Horas en pasos de 30 min: inicio 08:00–20:30, fin 08:30–21:00, fin > inicio, **sin solapamiento** dentro del mismo día (el back lo valida; el front lo anticipa).
  - Se guarda con `{franjas:[{dia_semana, hora_inicio, hora_fin}]}`. Duración de turno fija de 30 min (no configurable).
  - Si hay turnos futuros `PENDIENTE/CONFIRMADO` que quedarían fuera de la nueva agenda → 409 listando los turnos (mostrar completo).
  - Disponibilidad vacía permitida solo para preparar la baja.
- **FE-PRO-04** **Baja de profesional** (`DELETE /:id`) tiene precondiciones del back: (1) sin turnos futuros activos, (2) consultorio liberado (`null`), (3) sin franjas de disponibilidad. Al darse de baja, también se desactiva el usuario vinculado y se cierran sus sesiones. La UI presenta un **checklist de bloqueos** con acciones por paso (DUDA-23).
- **FE-PRO-05** Reactivación (`PATCH /:id/activar`) reactiva también al usuario. Tras reactivar, el profesional queda **sin consultorio y sin agenda**: la UI debe advertirlo y guiar a asignarlos (sin consultorio no se pueden crear turnos con él).
- **FE-PRO-06** Alta de profesional **no** existe como endpoint propio: se hace desde Usuarios (FE-USR-03).

### 9.4 Mi cuenta / Cambio de contraseña (todos los roles)
- **FE-CTA-01** Pantalla o modal accesible desde la nav. `PUT /api/auth/clave` con `{clave_actual, clave_nueva}`.
- **FE-CTA-02** Política mostrada y validada en cliente: ≥ 8 caracteres, al menos una mayúscula, una minúscula y un carácter especial **del conjunto `# $ @ ! % * ? &`** (otros símbolos no cuentan). Confirmación de nueva clave (solo front).
- **FE-CTA-03** Errores: `campos.clave_actual` ("Contraseña actual incorrecta"), `campos.clave_nueva`.
- **FE-CTA-04** Mostrar datos de la cuenta (nombre, correo, rol; y matrícula/consultorio/especialidad si es PROFESIONAL).

---

## 10. Reglas de negocio que el front debe reflejar (referencia rápida)

1. Turnos en intervalos de 30 min, entre 08:00 y 20:30 (según agenda del profesional).
2. Estados: `PENDIENTE → CONFIRMADO → EN_CONSULTORIO → ASISTIDO`; alternativas `AUSENTE` (desde CONFIRMADO) y `CANCELADO` (desde PENDIENTE/CONFIRMADO). Finales: ASISTIDO, AUSENTE, CANCELADO.
3. Pase automático a `AUSENTE` cuando pasan 30 min del inicio sin cambio (PENDIENTE/CONFIRMADO), evaluado en el back.
4. Cancelar libera el horario. Un paciente no puede tener dos turnos activos en el mismo día y hora.
5. Un consultorio solo puede estar asignado a un profesional activo a la vez.
6. Un profesional solo puede ver/operar sobre sus propios turnos y agenda.
7. Un usuario tiene una sola sesión activa.
8. Zona horaria de negocio: America/Argentina/Buenos_Aires (la decide el servidor).

---

## 11. Plan de implementación por fases

| Fase | Contenido | Resultado verificable |
|---|---|---|
| **F0 Base** | `api.js`, `ui.js` (toasts/modales/esc), `common.js` con sesión asíncrona y nav por rol, estilos nuevos (badges/modales), eliminar `AppData` | Páginas cargan con guard real y nav correcta por rol |
| **F1 Acceso** | Login, logout, redirecciones, Mi cuenta (cambio de clave) | Login/logout/`me` reales, 401 manejado |
| **F2 Pacientes** | Listado, búsqueda, alta, edición, baja/alta | CRUD completo con roles |
| **F3 Administración** | Especialidades, Usuarios, Profesionales, Disponibilidad, clave generada | Alta de profesional atómica; baja guiada |
| **F4 Turnos** | Horarios libres, alta, listado con filtros, estados, reprogramación, observaciones | Ciclo de vida completo del turno |
| **F5 Agenda y Panel** | Agenda diaria/mensual, prefill desde slot libre, dashboard | Agenda por rol; panel con ventana de 30 días |
| **F6 Cierre** | Responsive, accesibilidad, QA por rol, limpieza (`data.js`, `/data`, `datos.json`), textos | Checklist de la sección 13 completo |

---

## 12. Hallazgos en el back detectados durante el análisis

No son requisitos del front: se listan para decidir si se corrigen (DUDA-03).

- **H-01 (media) Posible fuga de datos a un PROFESIONAL con profesional inactivo.** `requireAuth` hace `LEFT JOIN profesional … AND p.estado = 1`, por lo que `req.user.id_profesional` queda `null` si el profesional está inactivo. Con `id_profesional = null`: `GET /api/turnos` no aplica filtro (`if (id_profesional_scope)` falso) y `GET /api/agenda` termina devolviendo todos los profesionales activos con nombres de pacientes. **Es alcanzable**: dar de baja un profesional (desactiva su usuario) y luego `PATCH /api/usuarios/:id/activar` sobre ese usuario. Mitigación sugerida: tratar PROFESIONAL sin `id_profesional` como sin acceso (403/lista vacía) y/o impedir reactivar un usuario cuyo profesional vinculado está inactivo.
- **H-02 Tests con fecha fija.** `turnos.test.js` usa `2026-11-02`: desde esa fecha el alta falla por "fecha pasada". Conviene calcular el próximo lunes dinámicamente.
- **H-03 Semilla vencida.** Los turnos semilla son del `2026-10-06` (ya pasado); al primer acceso el pase automático los convierte en `AUSENTE`, por lo que Panel y Agenda quedan sin datos útiles para demo.
- **H-04 Claves de `campos` inconsistentes.** Los errores de Zod (`validate.js` con `flatten().fieldErrors`) se agrupan por el **primer segmento** del path (`profesional`, `disponibilidad`) y no por campo anidado; los errores del servicio usan clave con punto (`profesional.matricula`). El front debe manejar ambos formatos.
- **H-05** `franjaHorariaSchema.hora_fin` acepta `21:30` aunque el mensaje dice "hasta 21:00".
- **H-06** `PATCH /turnos/:id/estado` está abierto a los tres roles; el único bloqueo por rol es `CANCELADO` para PROFESIONAL. Hoy un PROFESIONAL podría confirmar un turno y la recepción marcarlo `ASISTIDO` (DUDA-06).
- **H-07** Las claves generadas se imprimen en la consola del servidor (`console.log`). Confirmar si es aceptable para el TP. | está hecho así a propósito ya que no hay envío de mails ni nada.
- **H-08** No hay expiración de sesión por inactividad ni límite de intentos de login. | Esto es así a propósito, para no complicar de más el proyecto.
- **H-09 (verificar)** `getNowInArgentina()` usa `hour12:false` con `es-AR`; en algunas versiones de ICU/Node la medianoche puede salir como `24:xx`. Probar entre 00:00 y 00:59.

---

## 13. Criterios de aceptación globales / checklist de QA

**General**
- [ ] No queda ninguna referencia a `AppData`, `saludturnos_*` en storage ni a `data/datos.json`.
- [ ] Ninguna llamada envía parámetros vacíos ni propiedades extra (sin 400 "inesperados").
- [ ] Datos con `<`, `>`, `"` en nombre/motivo/observaciones se muestran como texto (sin ejecutar HTML).
- [ ] Entre 21:00 y 23:59 hora local, la fecha por defecto de Agenda/Turnos es la de hoy (no mañana).
- [ ] Acceder por URL directa a una pantalla no permitida redirige con aviso.
- [ ] Sesión vencida o iniciada en otro lugar → redirección clara a login.

**Por rol (ADMIN / RECEP / PROFESIONAL)**
- [ ] La nav muestra exactamente lo de la sección 5.
- [ ] PROFESIONAL solo ve sus turnos, su agenda y su panel; no ve Pacientes ni formulario de alta de turno.
- [ ] RECEP no puede desactivar pacientes ni gestionar especialidades/usuarios/profesionales.

**Flujos de punta a punta**
- [ ] Alta de profesional completa (usuario + datos + agenda) → ingreso con la clave generada → ve su agenda.
- [ ] Alta de turno → doble reserva en el mismo slot rechazada con mensaje → confirmar → registrar llegada en franja → observaciones → asistido.
- [ ] Reprogramar un turno conservando su horario actual y cambiando de profesional/fecha.
- [ ] Cancelar libera el horario en Agenda y en horarios disponibles.
- [ ] Baja guiada de profesional con sus 3 precondiciones y reactivación posterior.
- [ ] Cambio de contraseña con clave actual errónea y con política incumplida.
- [ ] Vista en 360 px, 768 px y escritorio sin scroll horizontal fuera de `.table-wrap`.

---

## 14. Dudas abiertas

Cada duda trae una **propuesta por defecto** que se aplicará si no hay objeción.

### Bloqueantes (afectan el diseño de varias pantallas)
- **DUDA-01 Origen del front.** ¿El front siempre se sirve desde Express (mismo origen)? Si se usara Live Server u otro puerto, las cookies HttpOnly/SameSite=Lax no viajarían sin cambios en el back. | Sí, siempre Express.
- **DUDA-02 Stack.** ¿Se mantiene HTML + JS vanilla, sin build ni librerías? ¿Se permiten librerías por CDN (p. ej. para calendario)? | Vanilla, sin dependencias.
- **DUDA-03 Alcance sobre el back.** ¿Se pueden hacer cambios mínimos en el back? Candidatos: H-01 (fuga), H-02/H-03 (tests y semilla con fechas relativas), un endpoint de hora del servidor, rango de fechas/paginación en `/api/turnos`. | Ningún cambio en el back.
- **DUDA-06 Permisos de transición de estado.** El back deja el `PATCH estado` abierto a todos los roles (salvo cancelar para PROFESIONAL). ¿Quién debería poder hacer cada paso? *Propuesta de UI:* Confirmar → RECEP/ADMIN; Registrar llegada (`EN_CONSULTORIO`) → RECEP/ADMIN; Marcar ASISTIDO y editar observaciones → PROFESIONAL (y ADMIN); Marcar AUSENTE manual → RECEP/ADMIN; Cancelar → RECEP/ADMIN. ¿Se restringe también en el back? | Cambia solo para que el PROFESIONAL pueda marcar como (`EN_CONSULTORIO` y `ATENDIDO`) el resto de estados los manejan los otros roles.
- **DUDA-04 Organización de pantallas nuevas.** ¿Tres páginas separadas (`especialidades`, `usuarios`, `profesionales`) o una sola "Administración" con pestañas? | Tres páginas; la disponibilidad se edita en modal desde Profesionales.
- **DUDA-05 `turno.html`.** ¿Se mantiene una sola pantalla (formulario de alta + listado con filtros/acciones) o se separa "Nuevo turno" y "Turnos"? | Una pantalla. El formulario de alta es un panel plegable como en Pacientes.

### Importantes
- **DUDA-07 Vista del PROFESIONAL.** ¿Confirmar que no ve Pacientes ni Profesionales/Especialidades, y que sí ve en sus turnos los datos de contacto del paciente (la API los devuelve)? ¿Dónde ve sus datos de matrícula/consultorio? | Ve sus datos en Mi cuenta. Si puede ver la info de sus pacientes en sus turnos.
- **DUDA-08 Listado de turnos.** El back devuelve todo el histórico sin paginar y filtra solo por fecha exacta. | Filtro de fecha por defecto = hoy con opción "Ver todos", y paginación en cliente de 20 filas.
- **DUDA-11 Panel.** ¿Solo los 3 indicadores del TP2 o también Pendientes/En consultorio/Asistidos/Ausentes (el back los entrega)? ¿Se aclara "próximos 30 días"? | 3 destacados + resto en fila secundaria, con el período visible.
- **DUDA-12 Agenda.** (a) Vista mensual: ¿calendario en grilla o lista por día? (b) ¿Clic en `LIBRE` precarga un turno y clic en `OCUPADO` abre el detalle? (c) ¿Opción "Todos los profesionales" para ADMIN/RECEP? | (a) lista por día agrupada; (b) sí; (c) sí.
- **DUDA-16 Clave generada.** ¿Se entrega por modal "una sola vez" con botón copiar? ¿Se debe forzar al usuario a cambiarla en su primer ingreso (el back no tiene ese flag)? | modal con copiar; sin forzado.
- **DUDA-18 Datos de demostración.** Los turnos semilla del 06/10/2026 ya pasaron (H-03). ¿Se regenera la semilla con fechas relativas a la fecha actual? | Se dejan los turno que ya están y se crean otros actuales.
- **DUDA-20 Selector de paciente.** ¿Combobox con búsqueda o `<select>` simple con todos los activos? | combo con búsqueda.
- **DUDA-21 Reprogramación.** ¿Confirmamos modal "Editar turno" (profesional, fecha, hora, motivo)? | Si.
- **DUDA-22 Pacientes.** (a) ¿Confirmás que el correo pasa a ser **obligatorio** (hoy opcional en el front)? (b) Teléfono: el seed del TP2 tenía guiones (`3764-111111`); el back exige solo dígitos. ¿Se normaliza quitando separadores o se exige ingresar solo números? (c) ¿Se agregan los campos fecha de nacimiento y obra social al formulario? | (a) si, email obligatorio; (b) si; (c) si.
- **DUDA-23 Baja de profesional.** ¿Checklist con botones por paso (liberar consultorio → vaciar agenda → dar de baja) o un único botón que ejecuta los pasos? | checklist manual; no se cancelan turnos automáticamente porque es irreversible.

### Menores
- **DUDA-09** Formato de fecha en pantalla | `dd/mm/aaaa`.
- **DUDA-10** Sin títulos "Dr./Dra." (el back no los guarda). | sin título
- **DUDA-13** ¿Se quita el recuadro de credenciales de prueba del login o se deja en modo demo (con las claves reales del seed)? | Se deja con las claves reales del seed.
- **DUDA-14** ¿Se necesita expiración por inactividad (hoy el back no la tiene)? | No
- **DUDA-15** ¿"Mi cuenta" como página propia o modal desde el sidebar? | Página propia
- **DUDA-17** ¿Hace falta pantalla de auditoría? No hay endpoint. | Fuera de alcance.
- **DUDA-19** Para el `min` de los inputs de fecha se usa el reloj del navegador y el servidor es la autoridad real (zona Argentina). ¿Aceptable? | Si.
- **DUDA-24** ¿Navegadores/dispositivos objetivo para la validación? | Con que ande bien en chrome y safari y siga siendo responsive está bien.
- **DUDA-25** ¿Modales propios para confirmaciones o se permite `window.confirm`? | Modales propios.
- **DUDA-26** ¿Se actualizan los textos del pie ("Trabajo Práctico 2") y títulos a TP3? | Eso lo hago yo.
- **DUDA-27** Refresco automático: ¿refrescar al volver el foco + botón "Actualizar" (propuesto) o sondeo cada 60 s (como el job del back)? | Ambas.
- **DUDA-28** `.gitignore` incluye `*.md`: este archivo **no se versionaría**. ¿Se agrega excepción (`!requirements.md`)? | No te preocupes por el versionado.
- **DUDA-29** ¿Pruebas del front solo manuales (checklist de la sección 13) o se espera algún tipo de test automatizado? | Todo manual.
- **DUDA-30** Las páginas HTML privadas se sirven sin autenticación (el guard es del cliente; la seguridad real está en la API). ¿Es aceptable? | Si, obviá esto.

---

## 15. Glosario de nomenclatura

- **FE-xx**: requisito del front. **DT-xx**: decisión técnica. **H-xx**: hallazgo del back. **DUDA-xx**: pendiente de aclarar.
- Los identificadores D-xx / Q-xx / RF-xx / CU-xx referenciados en comentarios del código del back corresponden a la documentación del TP1/TP3 y no se redefinen acá.