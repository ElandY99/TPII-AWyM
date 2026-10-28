# TurnoMed — Sistema de Gestión de Turnos Médicos (Front-End, Unidad II)

Trabajo Práctico 2 de **Aplicaciones Web y Móvil 2026**, continuando el diseño del TP1.
Implementación completa del front-end en HTML5, CSS3 y JavaScript con datos simulados.

**Integrantes:** Elpeza, Andrés (600213) · Benítez, José (600199) · Susñar, Daniel (600081)

---

## Cómo levantar el proyecto

El sitio usa **módulos ES** y carga los datos con `fetch()`, así que necesita servirse por HTTP.
Abrir los archivos con doble clic (`file://`) no funciona: el navegador bloquea ambos mecanismos.

```bash
cd TP2/html
npx http-server
```

Luego entrar en:
- http://192.168.56.1:8080
- http://192.168.0.24:8080
- http://127.0.0.1:8080
- http://172.21.48.1:8080

> Cualquier servidor estático sirve igual (`npx serve`, Live Server de VS Code, etc.).
> No hace falta instalar dependencias: no hay build, ni `package.json`, ni paso de compilación.

## Cuentas de prueba

La autenticación se simula en el cliente contra `data/usuarios.json`.

| Rol | Correo | Contraseña | Qué ve |
| --- | --- | --- | --- |
| Administrador | `admin@turnos.com` | `admin123` | Indicadores generales, agenda completa, pacientes, solicitud de turno |
| Recepcionista | `recepcion@turnos.com` | `recepcion123` | Pendientes de confirmar, agenda del día, alta de pacientes |
| Profesional médico | `vsosa@turnos.com` | `profesional123` | Su agenda fijada, sus turnos, cambio de estado |
| Profesional médico | `cbravo@turnos.com` | `profesional123` | Igual que el anterior, agenda de cardiología |
| Paciente | `lucia.fernandez@correo.com` | `paciente123` | Solo sus turnos reservados |
| Cuenta inactiva | `inactivo@turnos.com` | `inactivo123` | Rechaza el acceso (mensaje de cuenta deshabilitada) |

Las mismas credenciales están a un clic en la pantalla de Login, dentro del desplegable
**«Cuentas de prueba»**.

---

## Estructura del proyecto

```
TP2/
├── html/                     SPEC-NF-04: una carpeta por tipo de archivo
│   ├── index.html            1. Página principal (Home)
│   ├── login.html            2. Inicio de sesión
│   ├── pacientes.html        3. Registro y consulta de pacientes
│   ├── agenda.html           4. Agenda de turnos
│   ├── turno-form.html       5. Formulario de solicitud de turno
│   └── dashboard.html        6. Panel principal
│
├── css/                      Tokens + sistema de diseño + una hoja por pantalla
│   ├── base.css              Reset, custom properties, tipografía, utilidades accesibles
│   ├── layout.css            Header, navegación, grilla de página, footer
│   ├── components.css        Botones, campos, tarjetas, alertas, badges, diálogos, slots
│   ├── home.css
│   ├── login.css
│   ├── pacientes.css
│   ├── agenda.css
│   ├── turno-form.css
│   └── dashboard.css
│
├── js/
│   ├── core/                 Capa compartida (no depende del DOM de ninguna pantalla)
│   │   ├── format.js         Fechas, estados, roles, formateo
│   │   ├── validators.js     Reglas de validación de campos (SPEC-NF-05)
│   │   ├── seed.js           Lectura de los JSON y re-siembra del estado
│   │   ├── store.js          ÚNICA capa de acceso a datos; aquí viven RN-01, RN-03, RN-04, RN-05
│   │   ├── session.js        Sesión simulada, login, guarda de rutas (RN-06, RN-07)
│   │   ├── nav.js            Menú según rol (RN-08) y cierre de sesión
│   │   └── ui.js             Utilidades de DOM: creación de nodos, alertas, diálogos, badges
│   └── pages/                Un módulo por pantalla
│       ├── home.js  login.js  pacientes.js
│       └── agenda.js  turno.js  dashboard.js
│
├── data/                     Datos simulados, intercambiables sin tocar la lógica de vista
│   ├── usuarios.json         Cuentas y roles
│   ├── especialidades.json
│   ├── profesionales.json
│   ├── disponibilidad.json   Días, franjas y duración de turno por profesional
│   ├── pacientes.json
│   └── turnos.json
│
├── mockups/                  Wireframes del TP1
├── requirements.md           Especificación de la etapa (SDD)
└── README.md
```

### Separación de datos y vista (SPEC-08)

Las páginas **nunca** tocan los JSON directamente. Hablan con `store.js`, que expone:

```js
store.cargar()                          store.altaPaciente(datos)
store.pacientes({ texto })              store.pacientesPorEspecialidad(id)
store.pacientePorDni(dni)               store.buscarPacientes(texto)
store.disponibilidadDe(prof, fecha)     store.slotsDe(prof, fecha)
store.horariosLibres(prof, fecha)       store.agendaDe(prof, fecha)
store.turnos(filtros)                   store.turnosDeHoy()
store.crearTurno(datos)                 store.cambiarEstado(id, estado)
store.indicadores(filtros)              store.transicionesPermitidas(estado)
```

Para cambiar los datos de prueba alcanza con editar `data/*.json` y usar
**«Restablecer datos de prueba»** en el menú de usuario. Ninguna vista se rompe.

---

## Dónde vive cada regla de negocio

| Regla | Implementación | Verificación |
| --- | --- | --- |
| RN-01 · DNI único | `store.altaPaciente()` normaliza y rechaza duplicados con `ErrorNegocio('DNI_DUPLICADO')` | Alta con `30111222` → «ya se encuentra registrado» |
| RN-02 · Campos obligatorios | `validators.js` + control en vivo en cada formulario; los formularios usan `novalidate` para que el JavaScript tome el control | Enviar vacío → mensajes bajo el campo |
| RN-03 · Sin solapamiento | `store.crearTurno()` revalida el horario justo antes de insertar y devuelve `HORARIO_OCUPADO` | Reservar dos veces el mismo horario |
| RN-04 · Solo disponibilidad | `store.slotsDe()` genera la grilla desde `disponibilidad.json` y resta los turnos | Elegir domingo → «no atiende ese día» |
| RN-05 · Secuencia de estados | Matriz `TRANSICIONES` en `store.js`; los estados terminales no tienen salida | `PENDIENTE → ASISTIDO` directo → error |
| RN-06 · Error genérico | `session.iniciarSesion()` devuelve siempre el mismo texto ante credenciales malas | Ver: es idéntico con correo inexistente y con contraseña incorrecta |
| RN-07 · Rutas privadas | `session.redirigirSiFalta()` en las 5 pantallas privadas | Escribir `dashboard.html` en la barra sin sesión |
| RN-08 · Menú por rol | `nav.js` con la matriz `VISIBLES_POR_ROL` | Entrar como paciente vs. como recepción |
| RN-09 · Confirmación crítica | `ui.confirmar()` sobre `<dialog>` nativo antes de cancelar turnos | «Marcar como cancelado» |
| RN-10 · 360 px sin scroll | Base mobile-first, `overflow-x` controlado, grillas que reordenan en vez de scrollear | DevTools a 360 px de ancho |

### Secuencia de estados (RN-05)

```
PENDIENTE ──→ CONFIRMADO ──→ EN_CONSULTORIO ──→ ASISTIDO
    │              │                │
    ├──────────────┴────────────────┴──→ AUSENTE
    └─────────────────────────────────────→ CANCELADO
```

`ASISTIDO`, `AUSENTE` y `CANCELADO` son estados finales: no admiten transiciones.

---

## Diseño responsive (SPEC-NF-03)

Estrategia **mobile-first**: el CSS base ya está pensado para 360 px y los *media queries* solo
agregan comportamiento.

| Ancho | Qué cambia |
| --- | --- |
| Base (360 px) | Una columna. Menú hamburguesa colapsado. Agenda como bloques apilados por día. |
| ≥ 480 px | Grilla de 4 columnas en las tarjetas de rol; se muestra el bajada del logo. |
| ≥ 600 px | Formularios a dos columnas; acciones de diálogo en fila. |
| ≥ 768 px | Navegación horizontal en el header. Agenda a 3 columnas. Agenda de la semana. |
| ≥ 1024 px | Agenda a 4 columnas. Hero de la Home en dos columnas. Login en dos columnas. |

La grilla de la agenda **nunca** hace scroll horizontal: por debajo de 768 px los días se apilan
verticalmente. Eso es deliberado, porque el scroll horizontal rompería RN-10.

### Accesibilidad (SPEC-NF-06)

- Todos los controles tienen `<label for>` asociado; los obligatorios llevan `aria-required`.
- Los errores se anuncian con `role="alert"` y se vinculan con `aria-describedby`.
- `Skip-link` al contenido, foco visible en todo elemento interactivo, estados de turno
  identificados por **color + texto** (nunca solo color).
- `prefers-reduced-motion` desactiva las transiciones.
- Los diálogos usan `<dialog>` nativo, con foco inicial y cierre por `Esc`.

---

## Persistencia: qué es simulado y qué no

Esto es importante para la defensa, porque el alcance de la Unidad II es explícito
(`requirements.md` §0.2):

- **No hay base de datos.** No hay servidor de aplicación. No hay API.
- Los datos de prueba viven en `data/*.json` y se siembran en **`sessionStorage`**
  (clave `sgm.state.v1`) la primera vez que se carga el sistema.
- Los pacientes y turnos creados durante la sesión **sobreviven a la navegación entre páginas**
  pero **se pierden al cerrar la pestaña**. Es lo que permite demostrar de punta a punta que un
  turno reservado aparece en la Agenda.
- La sesión de usuario va en `sgm.session.v1`, también en `sessionStorage`.
- El botón **«Restablecer datos de prueba»** del menú de usuario borra ambas claves y vuelve a
  sembrar desde los JSON. Es lo que hay que usar antes de cada demostración para partir de cero.
- El control de concurrencia (RN-03) se **simula en el cliente**: no hay dos pestañas escribiendo
  sobre el mismo horario en un servidor, sino que la comprobación ocurre contra el estado en
  memoria en el momento de guardar.

### Por qué los turnos de prueba no tienen fecha fija

`data/turnos.json` guarda `diaSemana` (1 = lunes … 7 = domingo) y un `desplazamiento`
(`0` = próxima ocurrencia, `-1` = la anterior) en lugar de una fecha literal.
`seed.js` las resuelve al cargar. Así la demostración **siempre tiene turnos en la semana en curso**
y además todos caen en un día en que ese profesional realmente atiende, en vez de quedar
desalineados con la disponibilidad.

---

## Verificación realizada

Sin dependencias ni build, la validación combinó pruebas automáticas de la capa de datos con una
auditoría estática del marcado.

| Qué | Cómo | Resultado |
| --- | --- | --- |
| Reglas de negocio y store | 76 aserciones sobre `store.js` con un harness de Node y un shim de `sessionStorage`/`fetch` | 76/76 |
| Sesión, roles, RN-06, RN-07 | 37 aserciones sobre `session.js` | 37/37 |
| Marcado, rutas y selectores | Auditoría de 227 comprobaciones: HTML5 semántico, `label for`, `aria-required`, sin `<table>`, sin estilos inline, existencia de scripts, hojas y páginas, resolución de todos los `import` y de todos los selectores `#id` usados por el JS | 227/227 |
| Datos | Los 6 archivos `.json` parsean y todas las referencias cruzadas (turno → paciente → profesional → especialidad) resuelven | OK |
| Serving | Las 6 páginas y sus assets responden `200` bajo `http.server` | OK |

Los dos Bugs reales que encontró la verificación y que quedaron corregidos:

1. El filtro `profesionalLibre` de `store.turnos()` **desactivaba** el filtro por profesional en
   lugar de aplicarlo, de modo que el panel de un profesional médico mostraba los turnos de todo el
   centro (contra RN-08 y SPEC-06). Se eliminó el parámetro.
2. `ui.js` exponía una rama `html:` en su factory que asignaba `innerHTML`. No se usaba en ningún
   lado y abría una vía de inyección de HTML, así que se eliminó.

### Lo que falta verificar a mano

Lo anterior cubre la capa de datos y la integridad del marcado, pero **el renderizado en un
navegador real no se pudo automatizar** (no hay navegador en el entorno de desarrollo). Queda
pendiente esta recorrida visual, guiada por el checklist de abajo.

---

## Checklist de validación manual (WGT-10)

Recorrer en orden. Empezar siempre con **«Restablecer datos de prueba»** desde el menú de usuario.

### HU-01 · Ingresar al sistema
- [ ] Enviar el login con los dos campos vacíos → no navega, muestra «Debés completar todos los campos obligatorios».
- [ ] Correo válido + contraseña de 5 caracteres → mensaje bajo el campo, sin enviar.
- [ ] `admin@turnos.com` con contraseña incorrecta → «Usuario o contraseña incorrectos».
- [ ] `nadie@turnos.com` con cualquier contraseña → **exactamente el mismo mensaje** (RN-06).
- [ ] Tras el error, el campo de contraseña queda vacío y con el foco.
- [ ] `inactivo@turnos.com` / `inactivo123` → «Acceso denegado. Comuníquese con el administrador del sistema».
- [ ] Credenciales correctas → redirige a `dashboard.html` y el menú muestra el rol.

### HU-02 · Conocer el sistema antes de ingresar
- [ ] La Home no muestra nombres de pacientes ni horarios.
- [ ] Hay un botón claro hacia el Login (dos: el del hero y el del cierre).
- [ ] Sin sesión, el menú no muestra ninguna pantalla privada.

### HU-03 · Registrar un paciente nuevo
- [ ] «Nuevo paciente» → el diálogo se abre con el foco en DNI.
- [ ] DNI `30111222` (ya existe) → «El DNI ingresado ya se encuentra registrado en el sistema», y los datos quedan en pantalla.
- [ ] Correo `sin-arroba` y teléfono `123` → errores bajo cada campo.
- [ ] Fecha de nacimiento futura → error.
- [ ] Completar todo y guardar → la tarjeta aparece **arriba** del listado con un resaltado verde, sin recargar la página, y el contador sube.
- [ ] Filtrar por el DNI nuevo → aparece solo esa ficha.
- [ ] «Cancelar» no guarda nada.

### HU-04 · Consultar disponibilidad en la agenda
- [ ] Elegir especialidad → el listado de profesionales se reduce; los que no tienen esa especialidad desaparecen.
- [ ] Elegir un profesional con agenda → la grilla muestra slots con hora, y distingue **Libre** de **Ocupado** por color y por texto.
- [ ] Click en un slot ocupado → diálogo con paciente, DNI, profesional, especialidad, consultorio, fecha, hora, estado y motivo.
- [ ] Cambiar la fecha a un día sin atención → mensaje informativo, sin grilla.
- [ ] Elegir a `Agustina Roldán` (sin agenda configurada) → «Este profesional no tiene horarios de atención».
- [ ] Vista «Toda la semana» → muestra los 7 días y un resumen de cuántos no atiende.
- [ ] Entrar como `vsosa@turnos.com` → los filtros de especialidad y profesional aparecen **deshabilitados** y «Solicitar turno» no está.

### HU-05 · Solicitar un turno
- [ ] El botón «Confirmar turno» arranca deshabilitado.
- [ ] Buscar `gomez` → aparece el paciente; al elegirlo se habilita el paso 2 y se marca el paso en verde.
- [ ] Elegir especialidad y profesional → se habilita el paso 3.
- [ ] La fecha se propone sola en el primer día con disponibilidad real.
- [ ] El desplegable de hora **solo lista horarios libres**; abajo se ve la tira de la grilla con los ocupados tachados.
- [ ] Elegir una fecha sin atención → «El profesional no atiende ese día» y la hora queda vacía.
- [ ] Completar y confirmar → diálogo de confirmación con todos los datos y estado `Pendiente`.
- [ ] «Ver en la agenda» → el horario nuevo figura **ocupado**.
- [ ] Repetir la operación sobre ese mismo horario → «El horario seleccionado acaba de ser tomado» (RN-03) y la lista de horas se refresca.
- [ ] Volver a la Agenda y cambiar el profesional → el horario ya no figura libre.
- [ ] «Cancelar» en cualquier momento → vuelve al panel sin guardar.

### HU-06 · Visualizar un panel resumen
- [ ] Como **recepción**: 4 indicadores con la cantidad de turnos por confirmar, reservas de hoy, pacientes activos y cancelados.
- [ ] Como **profesional** (`vsosa@turnos.com`): los indicadores son de su agenda y los próximos turnos son solo suyos.
- [ ] Como **paciente**: los próximos turnos son los suyos, con su DNI y sus horarios.
- [ ] Como **administrador**: incluye el porcentaje de ocupación de la agenda del día.
- [ ] Hay accesos rápidos según el rol.
- [ ] La sección «Turnos por estado» suma el total de reservas.

### HU-07 · Navegar de forma coherente
- [ ] Toda pantalla privada muestra el menú y «Cerrar sesión» en el menú de usuario.
- [ ] El enlace de la página actual queda marcado con `aria-current="page"`.
- [ ] Como paciente el menú tiene menos entradas que como recepción.
- [ ] «Cerrar sesión» → vuelve a la Home y las pantallas privadas ya no son accesibles.
- [ ] Escribir `dashboard.html` en la barra de direcciones sin sesión → redirige al Login.
- [ ] Recorrer las 6 pantallas y volver: no hay ningún enlace roto ni error 404 en la consola.

### HU-08 · Usar el sistema desde el celular
- [ ] DevTools → 360 px: **ninguna** de las 6 pantallas genera scroll horizontal.
- [ ] Los botones y campos miden al menos 44 px de alto.
- [ ] El menú se colapsa a hamburguesa y se despliega al tocarlo.
- [ ] La agenda se lee bien apilada, sin zoom.
- [ ] Repetir el chequeo en 768 px y 1024 px.

---

## Trazabilidad con la especificación

| Spec / regla | Dónde se implementa |
| --- | --- |
| SPEC-01 · Home sin funciones privadas | `html/index.html`, `js/pages/home.js` |
| SPEC-02 · Login con simulación de autenticación | `html/login.html`, `js/pages/login.js`, `js/core/session.js` |
| SPEC-03 · Alta de pacientes con DNI único y actualización por DOM | `html/pacientes.html`, `js/pages/pacientes.js`, `store.altaPaciente` |
| SPEC-04 · Agenda con grilla dinámica | `html/agenda.html`, `js/pages/agenda.js`, `store.agendaDe` |
| SPEC-05 · Formulario en orden paciente → profesional → fecha/hora | `html/turno-form.html`, `js/pages/turno.js` |
| SPEC-06 · Dashboard por rol | `html/dashboard.html`, `js/pages/dashboard.js` |
| SPEC-07 · Navegación sin enlaces rotos | `js/core/nav.js` + auditoría de enlaces |
| SPEC-08 · Origen de datos intercambiable | `js/core/seed.js` + `js/core/store.js` |
| SPEC-NF-01 · HTML5 semántico | Las 6 páginas, verificado por auditoría |
| SPEC-NF-02 · Flexbox/Grid, sin tablas | `css/layout.css`, `css/components.css` |
| SPEC-NF-03 · Tres breakpoints | `css/layout.css` y hojas por pantalla |
| SPEC-NF-04 · Archivos separados | Carpetas `/html`, `/css`, `/js`, `/data` |
| SPEC-NF-05 · Mensajes claros | `js/core/ui.js` + `validators.js` |
| SPEC-NF-06 · Accesibilidad básica | `label for`, `aria-*`, `<dialog>`, foco visible |
| SPEC-NF-07 · Respuesta inmediata | Sin red real: todo corre en el cliente |

Detalle completo de historias, criterios de aceptación y reglas en `requirements.md`.
