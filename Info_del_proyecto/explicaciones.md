# Arquitectura y Funcionamiento Integral — Salud Turnos (TP3)
## Guía Didáctica y Técnica del Sistema para el Equipo de Desarrollo

| Información | Detalle |
| :--- | :--- |
| **Proyecto** | Sistema de Gestión de Turnos Médicos — *Salud Turnos* |
| **Materia** | Aplicaciones Web y Móvil (2026) |
| **Carrera** | Licenciatura en Gestión de Recursos Tecnológicos |
| **Profesor** | Ing. Lucas M. Rodoni |
| **Integrantes** | Andrés Elpeza (600213) · José Benitez (600199) · Daniel Susñar (600081) |
| **Documento** | Explicación Arquitectónica, Decisiones Tecnológicas y Funcionamiento General |

---

## 1. Introducción: ¿De qué se trata este documento?

Este documento está redactado pensando especialmente en **José y Daniel**, para que cualquier miembro del equipo —tenga o no experiencia previa en programación backend— pueda:
1. **Entender de punta a punta cómo funciona la aplicación**, desde que alguien hace clic en la pantalla hasta que un dato se graba en el disco.
2. **Conocer con claridad los conceptos técnicos clave** (como *Middleware*, *Router*, *Schema*, *API REST*, *Cookies de sesión*, etc.) explicados con analogías sencillas del mundo real.
3. **Defender y justificar con solidez las decisiones tecnológicas** que tomamos (por qué usamos **Express**, **Zod** y **SQLite**), tanto en el informe como en una eventual presentación oral o defensa ante el profesor.
4. **Saber qué hace cada archivo y dependencia del proyecto** para poder responder cualquier pregunta con seguridad.

---

## 2. La Gran Analogía: El Sistema Explicado como un Sanatorio Médico

Para entender la arquitectura sin perderse en el código, imaginemos cómo funciona un sanatorio médico tradicional en la vida real:

```
[PACIENTE EN SALA DE ESPERA]
             │
             ▼
[MOSTRADOR DE ENTRADA / RECEPCIÓN]  <─── (FRONT-END: lo visual, botones y formularios)
             │
   (Papeleta con el pedido)         <─── (PETICIÓN HTTP: viaja por la red con JSON)
             │
             ▼
[CONTROL DE SEGURIDAD / ADUANA]     <─── (MIDDLEWARES: ¿quién sos?, ¿tenés carnet válido?)
             │
             ▼
[SECRETARÍA MÉDICA CENTRAL]         <─── (ROUTER + CONTROLADOR: deriva el pedido al área correcta)
             │
             ▼
[MÉDICO JEFE DE SERVICIO]           <─── (SERVICIO: aplica las reglas médicas y de negocio)
             │
             ▼
[BIBLIOTECARIO DE ARCHIVO]          <─── (REPOSITORIO: busca y escribe en las fichas)
             │
             ▼
[CAJA FUERTE / ARCHIVERO CENTRAL]   <─── (BASE DE DATOS SQLite: guarda todo de forma permanente)
```

1. **El Front-End (Mostrador / Recepción):** Es la cara visible. Lo que el usuario ve en su navegador: las páginas bonitas, los formularios con campos para escribir, las tablas de turnos y los botones de colores. No toma decisiones críticas por sí mismo; solo le pide cosas al Back-End.
2. **La Petición HTTP (El Mensajero):** Cuando hacés clic en "Guardar Turno", el navegador escribe una nota formal en un sobre cerrado (un mensaje en formato de texto llamado **JSON**) y la manda por internet al servidor.
3. **Los Middlewares (El Control de Seguridad):** Antes de que la nota llegue a los médicos, hay personal de seguridad que revisa: *¿Quién sos? ¿Tenés la pulsera de acceso válida? ¿Tenés permiso para pedir esto o sos solo un visitante?*.
4. **Los Routers y Controladores (La Mesa de Entradas):** Leen el sobre y dicen: *"Ah, esto es para la sección de Turnos, pasáselo al encargado de Turnos"*.
5. **Los Servicios (La Cabeza del Negocio):** Es donde vive la inteligencia médica de la clínica. Dice: *"A ver, ¿el Dr. Gómez atiende los martes a las 10:00? Sí. ¿Ese horario ya está ocupado por otro paciente? No. ¿El paciente ya tiene otro turno a la misma hora? No. Perfecto, el turno es válido"*.
6. **Los Repositorios y SQLite (El Archivero Central con Candado):** Una vez aprobado el turno, el bibliotecario va a la caja fuerte (el archivo `salud_turnos.db`) y anota con tinta indeleble la reserva para que nunca se borre ni se pierda aunque se corte la luz.
7. **La Respuesta HTTP (La Confirmación):** El servidor le manda una respuesta al mostrador: *"Listo, turno reservado con éxito bajo el número #145"*. El navegador recibe eso y muestra un cartelito verde flotante en la pantalla.

---

## 3. Arquitectura General del Sistema

Nuestra aplicación sigue el patrón clásico de **Arquitectura Cliente-Servidor en Tres Capas**:

```
┌─────────────────────────────────────────────────────────────┐
│                      CAPA 1: CLIENTE                        │
│                 (Front-End en el Navegador)                 │
│  - HTML5 (Estructura de pantallas)                          │
│  - CSS3 (Diseño visual y estilos)                           │
│  - JavaScript Vanilla (Interacción, llamadas a la API)      │
│  - Archivos: login.js, turnos.js, pacientes.js, etc.        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Llamadas fetch HTTP con JSON
                Cookie segura de sesión (st_sid)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     CAPA 2: SERVIDOR                        │
│                     (Back-End Node.js)                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Servidor Express 5 (Escucha peticiones HTTP: 3000) │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2. Middlewares (Aduana: auth.js, roles.js, validate)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3. Controladores (Reciben la petición y envían JSON)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 4. Servicios (Reglas médicas, estados, validaciones)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 5. Repositorios (Consultas SQL preparadas)            │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │
               Lectura y Escritura SQL (C++ nativo)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               CAPA 3: PERSISTENCIA DE DATOS                 │
│         (Base de Datos SQLite con better-sqlite3)           │
│  - Archivo físico: backend/data/salud_turnos.db             │
│  - Tablas: usuario, sesion, especialidad, profesional,       │
│    disponibilidad, paciente, turno, auditoria               │
│  - Integridad referencial (Claves foráneas y unicidad)       │
└─────────────────────────────────────────────────────────────┘
```

### El Principio de "Mismo Origen" (Same-Origin)

Una decisión de diseño muy inteligente que tomamos fue que **el mismo servidor Express se encarga de todo**:
1. Le entrega al navegador los archivos HTML, CSS e imágenes (páginas web).
2. Procesa las llamadas de datos de la API (`/api/turnos`, `/api/pacientes`, etc.).

**¿Por qué es esto una gran ventaja?**
En proyectos donde el frontend corre en un puerto (ej. `localhost:5173`) y el backend en otro (ej. `localhost:3000`), los navegadores activan por seguridad bloqueos llamados **CORS** (*Cross-Origin Resource Sharing*) y muchas veces impiden que las cookies de sesión se guarden o se envíen. Al servir todo desde `localhost:3000`, eliminamos de raíz los problemas de CORS y el sistema funciona fluido y sin configuraciones raras.

---

## 4. El Front-End: Estructura y Funcionamiento

El Front-End es la parte del sistema que se ejecuta en la computadora de la recepcionista, del médico o del administrador, dentro de su navegador web (Chrome, Edge, Firefox, etc.).

### 4.1. Tecnologías Utilizadas

- **HTML5:** Define el esqueleto y los elementos de cada pantalla (formularios, botones, tablas, campos de texto).
- **CSS3:** Define el diseño, los colores, la tipografía, la adaptación a pantallas de celulares o computadoras (diseño responsivo) y las animaciones suaves.
- **JavaScript "Vanilla" (Puro):** Se le llama "vanilla" cuando se utiliza JavaScript estándar del navegador sin frameworks gigantescos como React, Vue o Angular. Esto hace que el sitio cargue instantáneamente, no requiera procesos de compilación lentos y sea 100% comprensible y modificable.

### 4.2. ¿Cómo se organizan los scripts de JavaScript?

En lugar de tener un archivo gigante con miles de líneas mezcladas, el Front-End está ordenado de forma modular en 4 niveles bien definidos:

```
frontend/js/
├── api.js         <── Nivel 1: El Mensajero (Comunicación HTTP con el Servidor)
├── ui.js          <── Nivel 2: La Pantalla (Mensajes visuales, modales, formatos)
├── common.js      <── Nivel 3: El Guardia (Control de sesión y menú de navegación)
└── [pantalla].js  <── Nivel 4: La Lógica Específica (turnos.js, pacientes.js, etc.)
```

1. **`api.js` (El Mensajero):**
   - Centraliza todas las llamadas a la API usando la función nativa `fetch`.
   - Si una llamada falla (por ejemplo, el servidor está apagado o los datos son incorrectos), captura el error y crea un objeto `ApiError` con los mensajes claros que devuelve el backend.
   - Limpia automáticamente parámetros vacíos para que las consultas no viajen con datos basura.
   - Si el servidor devuelve un error de *"Sesión expirada"* (código 401), redirige automáticamente al usuario a la pantalla de login.

2. **`ui.js` (Los Avisos Visuales):**
   - Maneja los **Toasts**: esos cartelitos flotantes verdes de éxito (*"Turno guardado con éxito"*) o rojos de error (*"El DNI ya existe"*).
   - Maneja los **Modales**: las ventanitas emergentes que se abren para dar de alta un paciente, editar un turno o pedir confirmación antes de cancelar.
   - Formatea fechas y horas para que en pantalla se lean en formato argentino amigable (ej: `28/10/2026` en vez de `2026-10-28T00:00:00Z`).

3. **`common.js` (La Seguridad del Navegador y el Menú):**
   - Cuando una pantalla privada carga (por ejemplo `turnos.html`), `common.js` le pregunta de inmediato al backend: *"¿Quién es el usuario conectado?"* (`GET /api/auth/me`).
   - Si no hay nadie logueado, expulsa al usuario al `login.html`.
   - Si el usuario está conectado pero es un **PROFESIONAL**, oculta del menú las opciones que no le corresponden (como *Usuarios*, *Pacientes* o *Especialidades*) y solo le deja ver su *Agenda*, sus *Turnos* y su *Cuenta*.
   - Implementa un mecanismo llamado `AppSession.ready`: la pantalla se mantiene con un efecto suave de carga hasta que se confirman los permisos del usuario, evitando ese feo "parpadeo" donde se ven cosas prohibidas por un milisegundo.

4. **Scripts específicos por pantalla (`turnos.js`, `pacientes.js`, `agenda.js`, etc.):**
   - Escuchan los clics del usuario en esa página concreta.
   - Toman los datos de los formularios.
   - Llaman a `api.js` para pedir o enviar datos.
   - Llaman a `ui.js` para dibujar los resultados en las tablas o mostrar alertas.

---

## 5. El Back-End: Arquitectura en Capas (SoC)

El Back-End es el motor invisible que corre en el servidor. Su misión es garantizar que **ningún dato inválido o no autorizado llegue a la base de datos**.

Para construirlo utilizamos el principio de **Separación de Responsabilidades** (*Separation of Concerns* o SoC). Cada carpeta tiene un único trabajo bien delimitado.

```
backend/
├── server.js               <── Punto de arranque del servidor y tareas programadas
└── src/
    ├── app.js              <── Configuración de Express, middlewares y rutas
    ├── config/             <── Variables de configuración (puerto, base de datos)
    ├── core/               <── Herramientas nucleares (seguridad, contraseñas, errores)
    ├── db/                 <── Conexión a SQLite y archivos de esquema SQL
    ├── middleware/         <── Filtros de seguridad, roles y validación Zod
    ├── routes/             <── Mapa de URLs de la API
    ├── schemas/            <── Moldes de validación de datos (Zod)
    ├── controllers/        <── Traductores HTTP (reciben request, devuelven response)
    ├── services/           <── Las reglas del negocio (lógica médica y validaciones)
    └── repositories/       <── Los encargados de escribir y leer en SQLite (SQL puro)
```

### 5.1. Explicación de cada capa

#### 1. Rutas (`routes/`)
Es la guía de teléfonos o el conmutador. Le dice a Express:
- *"Cuando llegue una petición `GET` a `/api/turnos`, mandásela al controlador de turnos"*.
- *"Cuando llegue un `POST` a `/api/pacientes`, primero pasala por el control de roles y el validador, y después al controlador"*.

#### 2. Middlewares (`middleware/`)
Son los filtros que se ejecutan **antes** de que el pedido llegue al controlador. Funcionan en cadena:
- **`auth.js` (`requireAuth`):** Mira la cookie de la petición. Si no hay sesión válida registrada en la base de datos, rechaza la petición con código 401 (*No autorizado*).
- **`roles.js` (`requireRole`):** Si la ruta es solo para Administradores y quien hace la petición es una Recepcionista, corta la petición con código 403 (*Prohibido*). Los administradores tienen pase libre universal.
- **`validate.js` (`validate`):** Compara los datos enviados contra el molde de Zod. Si faltan datos obligatorios o tienen mal formato, rechaza la petición con código 400 (*Datos inválidos*) y detalla campo por campo qué estuvo mal.

#### 3. Esquemas (`schemas/`)
Son las definiciones estrictas de cómo debe ser cada dato. Por ejemplo, en `pacienteSchema.js`:
- El DNI debe ser numérico y tener entre 7 y 8 dígitos.
- El correo electrónico debe tener formato de email válido.
- El teléfono no puede superar los 12 dígitos.

#### 4. Controladores (`controllers/`)
Son los coordinadores del tráfico HTTP. Su trabajo es muy simple y limpio:
1. Reciben la petición de Express (`req`).
2. Toman los datos ya validados.
3. Llaman al **Servicio** correspondiente para que haga el trabajo pesado.
4. Devuelven la respuesta en formato JSON (`res.json(...)`) con el código de estado correspondiente (ej. `200 OK` o `201 Creado`).

#### 5. Servicios (`services/`)
Aquí está el **corazón del sistema**. Es donde se programan las reglas del negocio de la clínica médica, independientes de si la petición vino por web o por móvil:
- ¿Un profesional puede atender dos turnos al mismo tiempo? **No**, el servicio lo comprueba y frena la operación.
- ¿Se puede pasar un turno de estado `CANCELADO` a `EN_CONSULTORIO`? **No**, la máquina de estados de `turnoService.js` solo permite transiciones lógicas (ej: `PENDIENTE` → `CONFIRMADO` → `EN_CONSULTORIO` → `ASISTIDO`).
- ¿Qué pasa si el paciente no llegó y pasó la hora de atención? Una tarea automática en segundo plano marca el turno como `AUSENTE`.

#### 6. Repositorios (`repositories/`)
Son la única capa del sistema autorizada a hablar directamente con SQLite. 
- Contienen las sentencias SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- Utilizan **consultas preparadas** (*prepared statements*), lo que hace físicamente imposible que un atacante inyecte código malicioso en la base de datos.
- Desacoplan la base de datos del resto del sistema: si el día de mañana la clínica decide migrar de SQLite a PostgreSQL, solo se modifican los repositorios; los servicios y controladores no cambian en lo absoluto.

---

## 6. Glosario Didáctico de Conceptos Técnicos

Para que cuando lean el código o hablen en una presentación no queden dudas sobre qué significa cada término, acá están las definiciones en lenguaje claro:

### ¿Qué es una API REST?
Una **API** (*Interfaz de Programación de Aplicaciones*) es un puente de comunicación entre dos programas. Decimos que es **REST** (*Representational State Transfer*) cuando respeta un conjunto de reglas estándar de internet:
- Las cosas que administramos se llaman **Recursos** (ej: `/api/turnos`, `/api/pacientes`).
- Para interactuar con ellos, usamos los **Métodos o Verbos HTTP**:
  - **GET**: Consultar o leer información (ej: *"Dame la lista de médicos"*).
  - **POST**: Crear algo nuevo (ej: *"Creá un nuevo turno con estos datos"*).
  - **PUT**: Modificar un registro completo existente (ej: *"Actualizá todos los datos de este paciente"*).
  - **PATCH**: Modificar un dato puntual (ej: *"Cambiá solo el estado de este turno a ASISTIDO"*).
  - **DELETE**: Eliminar o desactivar un registro (ej: *"Dá de baja a este usuario"*).

### ¿Qué son los Códigos de Estado HTTP?
Son números estándar que el servidor devuelve para avisar cómo salió la operación:
- **`200 OK`**: Todo salió perfecto.
- **`201 Created`**: El recurso se creó exitosamente (ej: nuevo turno guardado).
- **`400 Bad Request`**: Los datos enviados están mal o incompletos (ej: pusiste letras en el DNI).
- **`401 Unauthorized`**: No iniciaste sesión o tu sesión expiró.
- **`403 Forbidden`**: Estás logueado, pero tu rol no tiene permiso para hacer esto (ej: un recepcionista intentando borrar un usuario administrador).
- **`404 Not Found`**: Lo que buscás no existe (ej: paciente con ID 999 no encontrado).
- **`409 Conflict`**: Conflicto con los datos existentes (ej: el médico ya tiene un turno reservado a esa misma hora, o el correo ya está registrado).
- **`500 Internal Server Error`**: Ocurrió un error inesperado en el servidor (se cayó el sistema o falló algo imprevisto).

### ¿Qué es un Router?
En Express, un **Router** es como una pequeña centralita telefónica interna. En lugar de amontonar todas las rutas de la clínica en un solo archivo inmenso, creamos un router para cada tema: `pacienteRouter`, `turnoRouter`, `authRouter`. Cada uno se encarga de sus propias direcciones.

### ¿Qué es un Middleware?
Es una función que se para en el medio del camino entre que el cliente hace un pedido y el controlador lo procesa. Es como la cinta de seguridad del aeropuerto: tu valija pasa primero por el detector de metales (middleware de autenticación), luego por el control de aduana (middleware de roles), y recién si pasa ambos controles, podés subir al avión (controlador).

### ¿Qué es un Schema (Esquema de Validación)?
Es un molde que define la "forma" exacta que deben tener los datos. Con Zod, definimos esquemas que dicen: *"El nombre es un texto obligatorio de hasta 50 letras, la edad es un número entero positivo, y el correo debe tener una arroba y un punto"*. Si el usuario envía algo que no encaja en el molde, el esquema lo rebota inmediatamente.

### ¿Qué es una Sesión con Cookie HttpOnly?
Cuando iniciás sesión, el servidor no guarda tu contraseña en el navegador (eso sería peligrosísimo). En su lugar:
1. El servidor genera un código secreto aleatorio de 64 caracteres llamado **Token de sesión**.
2. Guarda ese token en la tabla `sesion` de la base de datos.
3. Se lo entrega a tu navegador dentro de una **Cookie** especial configurada como **HttpOnly**.
4. **¿Por qué HttpOnly?** Porque esa propiedad le prohíbe terminantemente a cualquier script de JavaScript leer la cookie. Esto significa que si un hacker intenta meter un código malicioso en la página (ataque XSS), no puede robar tu sesión porque el navegador la oculta bajo llave y solo se la muestra al servidor en cada petición.

### ¿Qué es el Hashing de Contraseñas (PBKDF2 / SHA-256)?
Las contraseñas de los usuarios **nunca** se guardan en texto plano en la base de datos. Si alguien abriera el archivo de la base de datos, no vería `clave123`, sino un texto incomprensible de 128 caracteres.
- El **Hashing** es como una máquina de picar carne: podés meter un bife y sacar carne picada, pero jamás podés reconstruir el bife a partir de la carne picada.
- Le agregamos un **Salt** (una cadena aleatoria de bytes única por cada usuario) para que ni siquiera dos usuarios con la misma contraseña tengan el mismo hash, impidiendo ataques con tablas comparativas precalculadas (*Rainbow Tables*).

### ¿Qué son las Consultas Preparadas (Prepared Statements)?
Es la técnica de escribir consultas SQL donde los datos del usuario se envían por separado de la instrucción SQL usando el signo de interrogación `?`.
- **Mal (Vulnerable a Inyección SQL):** `db.exec("SELECT * FROM usuario WHERE correo = '" + correo + "'");` (Si el usuario escribe mañas en el correo, puede borrar la base de datos).
- **Bien (Nuestra implementación):** `db.prepare("SELECT * FROM usuario WHERE correo = ?").get(correo);` (SQLite trata al correo estrictamente como un texto inofensivo, sin importar lo que contenga).

---

## 7. Decisiones Tecnológicas: ¿Por qué Express, Zod y SQLite?

Esta sección es fundamental para el informe del TP y para responder preguntas del profesor sobre los fundamentos de ingeniería de software.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NUESTRA ELECCIÓN DE TECNOLOGÍAS                      │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Framework Web   │ Express v5.3.0 (Minimalista, estándar, asíncrono)    │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Validación      │ Zod v4.6.7 (Esquemas declarativos, tipados y seguros)│
├─────────────────┼──────────────────────────────────────────────────────┤
│ Base de Datos   │ SQLite con better-sqlite3 v13.0.3 (Local, rápida)    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

### 7.1. ¿Por qué Express (Versión 5)?

1. **El estándar de la industria en Node.js:** Express es el framework web más probado, documentado y utilizado del mundo en el ecosistema JavaScript.
2. **Arquitectura basada en Middlewares:** Encaja perfectamente con la consigna de separar la autenticación, la autorización y el manejo de errores en capas modulares reutilizables.
3. **Novedad y robustez de Express 5:** En las versiones anteriores (Express 4), si una función asíncrona (`async/await`) fallaba dentro de una ruta, el servidor podía quedar colgado o caerse si no ponías un `try/catch` manual en cada rincón. En **Express 5**, el soporte para promesas y asincronismo es **nativo**: cualquier error lanzado dentro de una función asíncrona es atrapado automáticamente y derivado al `errorHandler` centralizado.
4. **Capacidad de servir Front y Back juntos:** Con una sola línea (`app.use(express.static(...))`), Express entrega todos los archivos del Front-End sin necesidad de configurar un servidor web adicional como NGINX o Apache.

### 7.2. ¿Por qué Zod?

1. **La regla de oro de la seguridad:** *"Nunca confíes en los datos que vienen del cliente"*. Aunque el front-end tenga validaciones en sus formularios, cualquier persona con conocimientos básicos puede abrir la consola del navegador o usar programas como Postman y mandar datos corruptos directamente a la API. Zod actúa como el guardia estricto en la puerta del servidor.
2. **Definición declarativa y limpia:** En lugar de escribir docenas de `if` anidados para verificar si un campo existe, si es string, si tiene el largo correcto y si cumple una expresión regular, Zod nos permite definir el contrato en 5 líneas legibles.
3. **Mensajes de error detallados para el usuario:** Cuando algo falla, Zod no dice simplemente "error". Nos dice exactamente: `{ matricula: "Debe tener exactamente 5 dígitos numéricos" }`. Esto le permite al Front-End iluminar el campo de la matrícula en color rojo con el mensaje exacto para que el usuario sepa qué corregir.
4. **Transformación y saneamiento de datos:** Zod no solo valida, sino que limpia:
   - Convierte números que viajan como texto en la URL (`"15"` → `15`) usando `z.coerce.number()`.
   - Remueve espacios en blanco accidentales al principio o al final de los textos usando `.trim()`.

### 7.3. ¿Por qué SQLite con `better-sqlite3`?

1. **Cero fricción de instalación (Portabilidad Total):**
   - Si hubiésemos elegido MySQL, PostgreSQL o SQL Server, cada integrante del grupo y el profesor tendrían que instalar un motor de base de datos pesado en su computadora, configurar usuarios, contraseñas, puertos (3306, 5432) y servicios que consumen memoria de fondo.
   - Con **SQLite**, la base de datos es un único archivo (`salud_turnos.db`) que vive dentro de la carpeta del proyecto. Cualquier integrante descarga el repositorio, ejecuta `pnpm install` y la aplicación funciona al 100% de inmediato.
2. **Es una Base de Datos Relacional Completa:**
   - A pesar de estar en un solo archivo, SQLite soporta **SQL estándar completo**: tablas, claves primarias autoincrementales, claves foráneas con eliminación en cascada (`ON DELETE CASCADE`), restricciones de verificación (`CHECK`), índices únicos y transacciones atómicas (ACID). Cumple con creces todos los requisitos del modelo de datos del TP1.
3. **Rendimiento extremo con `better-sqlite3`:**
   - La librería tradicional `sqlite3` de Node.js es asíncrona y tiene demoras de comunicación entre hilos.
   - En cambio, **`better-sqlite3`** compila directamente en lenguaje C++ y se ejecuta en el mismo proceso de Node.js, siendo hasta **10 veces más rápida** que cualquier otra librería de SQLite.
4. **Modo WAL (Write-Ahead Logging):**
   - Configuramos la base de datos con `PRAGMA journal_mode = WAL;`.
   - Esto permite que múltiples lecturas se ejecuten en paralelo mientras se escribe un registro, evitando que la base de datos se bloquee cuando muchas personas consultan turnos al mismo tiempo.

---

## 8. Inventario de Dependencias y Tecnologías del Proyecto

A continuación se detalla cada una de las herramientas que componen el proyecto, su versión y su función exacta:

### 8.1. Dependencias Principales (`package.json`)

| Dependencia | Versión | ¿Para qué sirve en nuestro sistema? |
| :--- | :--- | :--- |
| **`express`** | `^5.3.0` | Framework web del servidor. Maneja las rutas HTTP, los middlewares y sirve los archivos HTML/CSS/JS del frontend. |
| **`better-sqlite3`** | `^13.0.3` | Driver de conexión ultrarrápido entre Node.js y la base de datos SQLite en disco. Ejecuta nuestras sentencias SQL. |
| **`zod`** | `^4.6.7` | Librería de validación de esquemas. Revisa que los datos enviados en cada formulario cumplan estrictamente las reglas antes de ser procesados. |

### 8.2. Módulos Nativos de Node.js (Sin librerías externas)

Para mantener el proyecto liviano, seguro y profesional, no instalamos librerías accesorias para cosas que Node.js ya resuelve de forma excelente:
- **`node:crypto`**: Utilizado en `passwords.js` y `auth.js` para generar números aleatorios criptográficamente seguros para los tokens de sesión y para calcular los hashes de contraseñas con PBKDF2 y SHA-256.
- **`node:fs` y `node:path`**: Utilizados para leer archivos de esquemas SQL (`schema.sql`, `seed.sql`) y manejar rutas de carpetas compatibles tanto con Windows como con Linux o Mac.
- **`node:test`**: Motor nativo de pruebas automatizadas de Node.js (se ejecuta con `pnpm test`) para verificar que todos los servicios y validaciones funcionen sin romper nada.

### 8.3. Scripts de Ejecución (`package.json`)

En la terminal podemos ejecutar los siguientes comandos:

- **`pnpm start`**: Enciende el servidor en modo producción normal ejecutando `node backend/server.js`.
- **`pnpm dev`**: Enciende el servidor en modo desarrollo con la opción `--watch` de Node.js. Si modificamos cualquier archivo del backend, el servidor se reinicia solo automáticamente.
- **`pnpm db:reset`**: Borra la base de datos existente y la vuelve a crear de cero ejecutando el esquema (`schema.sql`) y los datos de prueba iniciales (`seed.sql`). Ideal si se ensucian los datos durante las pruebas.
- **`pnpm db:export`**: Exporta el contenido actual de la base de datos a un archivo SQL para respaldar o entregar.
- **`pnpm test`**: Ejecuta las pruebas automatizadas del backend para comprobar que todas las rutas y reglas de negocio pasen con éxito.

---

## 9. Flujo de Seguridad, Autenticación y Control por Roles

El sistema implementa un modelo de seguridad basado en **Roles** (*Role-Based Access Control* o RBAC).

```
                              ┌────────────────────┐
                              │  USUARIO CONECTADO │
                              └─────────┬──────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  [ADMINISTRADOR]               [RECEPCIONISTA]               [PROFESIONAL]
  - Acceso irrestricto          - Pacientes (CRUD)            - Su propia agenda
  - Gestión de usuarios         - Turnos (CRUD)               - Sus propios turnos
  - Profesionales y agenda      - Profesionales (lectura)     - Registrar evolución
  - Especialidades              - Especialidades (lectura)    - Asistencia médica
  - Auditoría y métricas        - Agenda médica general       - Mi cuenta (perfil)
```

### 9.1. ¿Cómo funciona el Login paso a paso?

1. El usuario entra a `login.html`, escribe su correo y su clave, y hace clic en *"Ingresar"*.
2. El frontend envía un `POST /api/auth/login` con `{ correo, clave }`.
3. `authController` y `authService` buscan al usuario en la tabla `usuario`.
4. El sistema toma la clave ingresada, la pasa por la función de hash criptográfico y la compara con el `clave_hash` guardado en la base de datos.
5. Si coinciden:
   - Se crea un token aleatorio seguro.
   - Se guarda el hash del token en la tabla `sesion` (si el usuario ya tenía una sesión vieja abierta en otra computadora, se reemplaza para que haya **una sola sesión activa a la vez**).
   - Se devuelve la cookie `st_sid` en la cabecera HTTP con flags de protección (`HttpOnly`, `SameSite=Lax`, `Path=/`).
   - Se responde un JSON con los datos del usuario y su rol.
6. El navegador almacena la cookie de forma automática e invisible. `login.js` redirige al usuario a `dashboard.html`.

### 9.2. Los Tres Roles y sus Permisos

1. **ADMINISTRADOR (Superusuario):**
   - Es el rol con máximos privilegios de la clínica.
   - Puede crear, editar, dar de baja o resetear claves de **Usuarios**.
   - Puede administrar **Especialidades Médicas** y **Profesionales** (asignándoles matrícula, consultorio y disponibilidad horaria semanal).
   - Puede ver métricas globales de toda la clínica.

2. **RECEPCIONISTA:**
   - Es el operador diario del mostrador.
   - Da de alta y actualiza fichas de **Pacientes** (buscándolos rápidamente por DNI o apellido).
   - Gestiona los **Turnos**: consulta huecos libres disponibles por médico o especialidad, reserva turnos, los reprograma y registra la llegada del paciente a la sala de espera (`EN_CONSULTORIO`).
   - Puede consultar la agenda de todos los médicos, pero **no puede** crear usuarios ni tocar configuraciones sensibles del sistema.

3. **PROFESIONAL (Médico):**
   - Su acceso está pensado para el consultorio.
   - Solo ve **sus propios turnos** y su **propia agenda**. No ve los turnos de otros colegas ni la lista general de usuarios.
   - Puede cambiar el estado de sus turnos a `ASISTIDO` (si el paciente entró y fue atendido) o `AUSENTE`.
   - Puede escribir **Observaciones médicas** de la consulta (diagnósticos o notas de atención).

---

## 10. Módulos Funcionales Principales del Sistema

A continuación se resumen las funciones de cada módulo y cómo interactúan las capas:

### 10.1. Módulo de Pacientes (`pacientes.html`)
- **Búsqueda en tiempo real:** Permite tipear un DNI, nombre o apellido y el backend busca con coincidencias parciales sin importar tildes ni mayúsculas (usando una función personalizada SQL llamada `normalizar`).
- **Validaciones clave:** El DNI debe ser único en toda la clínica. No se permite duplicar pacientes.
- **Baja lógica:** Los pacientes nunca se borran físicamente del disco para no romper el historial médico; se marcan con estado inactivo (`estado = 0`) y pueden ser reactivados si regresan.

### 10.2. Módulo de Profesionales y Disponibilidad (`profesionales.html`)
- Cada profesional tiene una **matrícula única de 5 dígitos** y un **consultorio exclusivo** (dos médicos no pueden compartir el mismo consultorio físico al mismo tiempo).
- **Configuración de Disponibilidad:** Se define qué días de la semana atiende cada médico y en qué franja horaria (ej: Lunes de 08:00 a 14:00, con turnos de 30 minutos).

### 10.3. Módulo de Turnos (`turno.html`) — El Corazón del Sistema
- **Buscador de horarios disponibles (`/api/turnos/disponibles`):**
  - La recepcionista elige una fecha y una especialidad o médico.
  - El sistema cruza la disponibilidad semanal del médico con los turnos ya otorgados para ese día y devuelve únicamente los huecos libres reales de 30 minutos.
- **Máquina de Estados Estricta:**
  Un turno no puede cambiar a cualquier estado arbitrariamente; debe seguir el ciclo natural de la atención médica:
  ```
  [PENDIENTE] ──► [CONFIRMADO] ──► [EN CONSULTORIO] ──► [ASISTIDO]
       │                │                 │
       ▼                ▼                 ▼
  [CANCELADO]      [CANCELADO]        [AUSENTE]
  ```
- **Control Automático de Ausentes:**
  En `backend/server.js` se ejecuta un temporizador en segundo plano cada 60 segundos. Si un turno del día superó su horario programado y sigue en estado pendiente o confirmado sin que se haya registrado la llegada del paciente, el sistema lo pasa automáticamente a `AUSENTE`.

### 10.4. Módulo de Agenda Médica (`agenda.html`)
- Ofrece dos vistas visuales interactivas:
  - **Vista Diaria:** Grilla con los horarios del día elegido desglosados en bloques de 30 minutos, mostrando en colores el estado de cada turno y qué profesional atiende en qué consultorio.
  - **Vista Mensual:** Calendario tradicional con indicadores del volumen de turnos día por día.

### 10.5. Módulo de Panel de Control / Dashboard (`dashboard.html`)
- Al ingresar al sistema, muestra los indicadores clave del día:
  - Cantidad total de turnos programados para hoy.
  - Cuántos pacientes ya fueron atendidos, cuántos están en espera y cuántos ausentes.
  - Tabla de próximos turnos inmediatos con acceso directo para registrar llegada o cambiar estados.

---

## 11. Preguntas Frecuentes y Respuestas para la Defensa Oral

Respuestas listas para lucirse ante preguntas típicas que un docente o evaluador puede formular:

### 1. "¿Por qué eligieron SQLite y no una base de datos más tradicional como MySQL o PostgreSQL?"
> *"Elegimos SQLite mediante `better-sqlite3` por tres razones fundamentales: primero, porque es una base de datos relacional robusta que soporta 100% de integridad referencial, claves foráneas, restricciones de unicidad y transacciones atómicas completas, cumpliendo rigurosamente el modelo de datos diseñado en el TP1. Segundo, por portabilidad: no requiere instalar servidores externos pesados ni configurar puertos o credenciales en cada máquina, lo que permite que el proyecto funcione de forma idéntica en cualquier entorno de evaluación con un solo comando. Y tercero, por rendimiento: `better-sqlite3` opera en C++ dentro del mismo proceso y con el modo WAL activado ofrece lecturas concurrentes a velocidades extremadamente altas."*

### 2. "¿Qué es un middleware y dónde lo aplicaron en el código?"
> *"Un middleware es una función intermedia que intercepta una petición HTTP antes de que llegue a la lógica del controlador. En nuestro sistema lo aplicamos en tres aspectos esenciales: en la autenticación (`requireAuth`), verificando que la cookie de sesión exista y sea válida; en la autorización (`requireRole`), controlando si el rol del usuario tiene permiso para ejecutar la acción solicitada; y en la validación (`validate`), donde utilizamos Zod para chequear que los datos del cuerpo, parámetros o filtros cumplan con los esquemas antes de tocar la lógica del negocio."*

### 3. "¿Cómo evitaron que dos usuarios reserven el mismo turno al mismo tiempo?"
> *"Implementamos una doble barrera de protección. A nivel de lógica de negocio en el servicio (`turnoService.js`), se consulta si el profesional ya cuenta con un turno activo en esa fecha y hora. Pero además, como garantía absoluta contra condiciones de carrera concurrentes, en la base de datos SQLite definimos un índice único parcial (`ux_turno_slot_profesional`) que prohíbe físicamente insertar dos turnos con el mismo médico, fecha y hora si su estado no es cancelado. Si dos peticiones llegaran exactamente al mismo milisegundo, la base de datos rechaza la segunda y el manejador de errores devuelve un código `409 Conflicto` de manera limpia."*

### 4. "¿Por qué validan con Zod en el backend si el formulario web ya tiene validaciones en HTML y JavaScript?"
> *"Porque las validaciones en el frontend solo existen para mejorar la experiencia del usuario, pero no brindan seguridad real. Cualquier usuario puede desactivar JavaScript, alterar el código desde las herramientas de desarrollador o enviar peticiones directas con herramientas como Postman o cURL. La única validación que garantiza la integridad y seguridad del sistema es la validación en el servidor. Con Zod aseguramos que ningún dato corrupto, malicioso o incompleto pueda vulnerar las reglas del negocio ni la base de datos."*

### 5. "¿Cómo viaja la sesión y por qué no usaron JWT en localStorage?"
> *"Optamos por sesiones persistidas en base de datos con cookies `HttpOnly` y `SameSite`. Guardar tokens JWT en el `localStorage` del navegador es una práctica vulnerable a ataques de tipo XSS (Cross-Site Scripting), ya que cualquier script malicioso inyectado puede leer el token y robar la cuenta. Al usar cookies con bandera `HttpOnly`, el navegador prohíbe el acceso a la cookie desde JavaScript; la cookie viaja automáticamente en cada petición HTTP y solo el servidor puede leerla. Además, mantener la sesión en la base de datos nos permite invalidar sesiones al instante cuando el usuario hace logout o cuando un administrador desactiva una cuenta."*

---

## 12. Resumen Final

El sistema **Salud Turnos** integra con éxito los tres trabajos prácticos de la materia:
- El diseño y modelado de datos del **TP1**.
- La interfaz visual e interactiva del **TP2**.
- La lógica de negocio, persistencia relacional, seguridad y servicios REST del **TP3**.

Gracias a la separación en capas, el uso de contratos estrictos con **Zod**, la robustez de **Express 5** y la confiabilidad de **SQLite**, el proyecto cuenta con una arquitectura profesional, escalable, fácil de entender y lista para su presentación y puesta en marcha.
