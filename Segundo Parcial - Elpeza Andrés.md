# Informe Técnico — Segundo Parcial
## Sistema de Gestión de Turnos Médicos: *Salud Turnos*

| Información Académica | Detalle |
| :--- | :--- |
| **Carrera** | Licenciatura en Gestión de Recursos Tecnológicos |
| **Asignatura** | Aplicaciones Web y Móvil (Ciclo Lectivo 2026) |
| **Profesor** | Ing. Lucas M. Rodoni |
| **Estudiante** | **Andrés Elpeza** (Leg. 600213) |
| **Proyecto** | Extensión e Integración Móvil: Consulta y Solicitud de Turnos para Pacientes |

---

## 1. Descripción de la Funcionalidad Implementada

En el marco del **Segundo Parcial**, se extendió el sistema *Salud Turnos* para incorporar de manera integral al **Paciente** como actor activo del ecosistema digital, permitiéndole interactuar de forma autónoma desde cualquier dispositivo móvil (smartphones y tablets) o de escritorio.

### 1.1. Alcance y Arquitectura Funcional
La solución se construyó como una **aplicación web responsive** accesible desde el navegador móvil (sin requerir compilación nativa ni PWA), conservando y reutilizando la infraestructura preexistente de Front-End y Back-End:

1. **Nuevo Rol de Usuario (`PACIENTE`):** Se incorporó un modelo de seguridad con control de acceso basado en roles (RBAC). Cada paciente posee una cuenta de acceso unívoca vinculada uno a uno con su ficha médica (`id_paciente` ↔ `id_usuario`).
2. **Autenticación Unificada:** El paciente accede mediante el servicio de autenticación centralizado (`/api/auth/login`) con su correo y contraseña, recibiendo una sesión gestionada por cookies `HttpOnly` seguras.
3. **Exploración Dinámica de Prestadores:** La interfaz permite seleccionar especialidades médicas activas y filtra en tiempo real los profesionales habilitados asociados a dicha especialidad, exponiendo su consultorio de atención sin filtrar datos privados (matrícula o email interno).
4. **Consulta de Disponibilidad en Tiempo Real:** El usuario selecciona la fecha deseada (a partir de la fecha actual) y el sistema consulta los turnos libres de 30 minutos configurados dentro de la franja de atención del médico (08:00 a 21:00 hs), excluyendo horarios ocupados o pasados.
5. **Solicitud de Cita Médica con Aislamiento Estricto:** El paciente confirma la reserva exclusivamente para sí mismo. El Back-End extrae el identificador del paciente directamente de la sesión validada en el servidor, garantizando que ningún usuario pueda reservar o consultar turnos ajenos.
6. **Validación Transaccional y Reglas de Negocio:**
   - Verificación de no superposición: Si dos pacientes intentan reservar el mismo turno simultáneamente, o si el paciente ya cuenta con otro turno en la misma fecha y hora, el sistema rechaza la colisión y notifica con claridad.
   - Todo turno nuevo nace en estado **`PENDIENTE`**, requiriendo posterior confirmación por el personal de recepción médica.
7. **Confirmación Inmediata en Pantalla:** Al concretarse el alta, se presenta un modal informativo con el número identificador del turno (`#id_turno`), profesional, especialidad, consultorio, fecha y hora asignada.
8. **Gestión y Consulta de Turnos Propios ("Mis Turnos"):** Listado ordenado cronológicamente que prioriza citas futuras y permite al paciente cancelar turnos pendientes o confirmados, liberando el slot para la clínica.

---

## 2. Servicios REST Utilizados y sus Métodos

La comunicación entre el cliente móvil y el servidor se realiza íntegramente mediante el protocolo **HTTP/1.1**, consumiendo una API REST desarrollada con **Node.js y Express 5**, utilizando **JSON** como formato de intercambio y códigos de estado estándar.

| Método | Endpoint | Roles Permitidos | Parámetros / Body | Descripción y Lógica de Negocio |
| :---: | :--- | :---: | :--- | :--- |
| **`POST`** | `/api/auth/login` | Público | **Body:** `{ correo, password }` | Valida credenciales, genera la sesión activa en el servidor y emite una cookie de sesión firmada `HttpOnly`. |
| **`POST`** | `/api/auth/logout` | Autenticado | Ninguno | Destruye la sesión activa en la base de datos y expira la cookie en el navegador móvil. |
| **`GET`** | `/api/auth/me` | Autenticado | Ninguno | Devuelve la identidad del usuario actual (`id_usuario`, `rol`, `nombre`, `correo`, `id_paciente`). Permite al Front-End adaptar vistas y menú. |
| **`GET`** | `/api/especialidades` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR` | **Query:** `?solo_activas=true` | Obtiene el catálogo de especialidades médicas activas para alimentar el primer selector del formulario. |
| **`GET`** | `/api/profesionales` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR` | **Query:** `?especialidad_id=X&solo_activos=true` | Lista los médicos activos asignados a la especialidad elegida, incluyendo su consultorio fijo de atención. |
| **`GET`** | `/api/turnos/disponibles` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR` | **Query:** `?id_profesional=X&fecha=YYYY-MM-DD` | Calcula en el servidor los intervalos libres de 30 minutos según la disponibilidad semanal del profesional y los turnos ya tomados. |
| **`POST`** | `/api/turnos` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR` | **Body:** `{ id_profesional, fecha, hora, motivo_consulta }` | Registra la solicitud de turno en estado `PENDIENTE`. En rol `PACIENTE`, el Back-End ignora cualquier `id_paciente` foráneo y asigna forzosamente el propio. |
| **`GET`** | `/api/turnos` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR`, `PROFESIONAL` | **Query:** `?fecha=...&estado=...` | Consulta el listado de turnos. Para el rol `PACIENTE`, el servidor aplica un filtro inmutable (`id_paciente_scope`) y omite las observaciones clínicas privadas. |
| **`DELETE`**| `/api/turnos/:id` | `PACIENTE`, `RECEPCIONISTA`, `ADMINISTRADOR` | **Params:** `id` (ID del turno) | Permite al paciente cancelar un turno propio en estado `PENDIENTE` o `CONFIRMADO`, marcándolo como `CANCELADO` y liberando el horario. |

---

## 3. Explicación de la Integración entre la Interfaz y el Back-End

La integración sigue una arquitectura de capas desacopladas (**Separation of Concerns**) que vincula una interfaz web reactiva (*Single Page-like*) con una API REST robusta:

```
[ Dispositivo Móvil (Browser) ]
       │  HTML5 + CSS3 Mobile-First (Viewport, Flexbox/Grid, Touch targets >= 44px)
       ▼
[ Cliente HTTP: frontend/js/api.js ]
       │  Peticiones fetch() asíncronas con credentials: 'same-origin' (JSON)
       ▼  HTTP / REST
[ Middleware de Seguridad (Express 5) ]
       ├─ requireAuth: Valida la sesión activa a través de cookies HttpOnly.
       ├─ requireRole('PACIENTE'): Autoriza el acceso a los endpoints según la matriz de permisos.
       └─ validate: Validación estricta de esquemas de entrada (Query, Params, Body) con Zod.
       ▼
[ Capa de Controladores y Servicios (turnoController.js / turnoService.js) ]
       │  Aislamiento: user.rol === 'PACIENTE' -> fuerza user.id_paciente.
       │  Reglas de negocio: verificación de horarios libres, fechas futuras, turnos simultáneos.
       ▼
[ Repositorio y Base de Datos (turnoRepository.js / db.js) ]
       └─ SQLite (better-sqlite3) con consultas parametrizadas (prevención de SQL Injection).
```

### Mecanismos Clave de Integración:
1. **Cliente HTTP Centralizado (`api.js`):** La interfaz utiliza un cliente asíncrono que encapsula la API `fetch` nativa. Maneja automáticamente los encabezados `Content-Type: application/json` y `Accept: application/json`, serializa parámetros de consulta y gestiona errores devueltos por el servidor (`ApiError`). Ante un código `401 Unauthorized`, redirige de forma transparente al login informando la expiración de sesión.
2. **Doble Validación (Isomórfica):** 
   - *Front-End (`turnos.js`):* Bloquea envíos prematuros, comprueba campos requeridos y deshabilita botones durante el procesamiento (`setLoading`) para impedir solicitudes duplicadas por doble toque en pantalla táctil.
   - *Back-End (`validate.js` + `Zod`):* Valida tipos, formatos de fecha (`AAAA-MM-DD`), horas (`HH:MM`) y rango permitido antes de procesar cualquier dato.
3. **Aislamiento y Seguridad en el Servidor:** La seguridad no recae en la interfaz. Aunque un atacante manipule el cliente o modifique peticiones HTTP manuales, el servicio `turnoService.js` obtiene la identidad del paciente exclusivamente desde `req.user.id_paciente`, impidiendo cualquier escalamiento de privilegios o acceso a datos de terceros.
4. **Manejo de Respuestas y Feedback UI:** El servidor responde con estructuras estandarizadas (`{ ok: true, data: [...] }` o `{ ok: false, error: "...", campos: { ... } }`). El módulo `ui.js` interpreta estas respuestas proyectando componentes accesibles: toasts flotantes de éxito o error, badges coloreados de estado y ventanas modales de confirmación.

---

## 4. Capturas de Pantalla de la Interfaz Adaptada a Dispositivos Móviles

La interfaz gráfica fue adaptada con diseño adaptable (**Responsive Design**) bajo criterios *Mobile-First*, garantizando compatibilidad total en pantallas de 360 px en adelante (smartphones y tablets), con tipografía legible (16 px en inputs para prevenir zoom automático en iOS), campos amplios y controles táctiles de al menos 40 px.

> *Nota: Inserte a continuación las imágenes de respaldo tomadas desde las herramientas de desarrollo en emulación móvil (p. ej. iPhone 14 / Pixel 7) o dispositivo físico.*

### 4.1. Inicio de Sesión desde Dispositivo Móvil
Formulario centrado y optimizado con campos táctiles para correo electrónico y contraseña, botón de visibilidad de clave y mensajes de error contextuales.

![Login de Paciente en Dispositivo Móvil](./capturas/01-login-mobile.png)
*Figura 1: Pantalla de inicio de sesión de Salud Turnos adaptada a smartphone (390 × 844 px).*

---

### 4.2. Formulario de Solicitud: Selección de Especialidad y Profesional
Selectores en cascada que se habilitan secuencialmente. El paciente no requiere buscarse a sí mismo: el sistema reconoce su identidad automáticamente.

![Selección de Especialidad y Profesional](./capturas/02-seleccion-especialidad-profesional.png)
*Figura 2: Filtro por especialidad médica y selección de profesional activo con indicación de consultorio.*

---

### 4.3. Consulta de Disponibilidad Horaria en Tiempo Real
Visualización reactiva de los horarios libres calculados por el Back-End para la fecha seleccionada. Si no existen turnos, se notifica sin recargar la página.

![Consulta de Horarios Disponibles](./capturas/03-horarios-disponibles.png)
*Figura 3: Selector dinámico con los bloques horarios disponibles de 30 minutos provistos por el servicio REST.*

---

### 4.4. Confirmación de Turno Registrado en Pantalla
Modal accesible desplegado inmediatamente tras la respuesta afirmativa `201 Created` del servidor, informando el estado inicial `PENDIENTE`.

![Confirmación de Turno en Pantalla](./capturas/04-confirmacion-turno.png)
*Figura 4: Ventana de confirmación con los datos de la cita (ID, profesional, consultorio, fecha y horario).*

---

### 4.5. Vista "Mis Turnos" y Cancelación de Citas
Listado adaptado a vista de tarjeta/tabla móvil con estado en badges semánticos y opción de cancelación directa para el paciente.

![Listado de Turnos del Paciente](./capturas/05-mis-turnos-mobile.png)
*Figura 5: Vista de turnos solicitados propios con orden cronológico y botón de cancelación para citas pendientes.*

---

## 5. Conclusión

La solución desarrollada satisface la totalidad de los requerimientos del **Segundo Parcial**: implementa los servicios REST requeridos (`GET /disponibles`, `POST /turnos`, `GET /turnos`), valida rigurosamente los datos del lado del servidor asegurando la integridad de la agenda médica, y entrega una experiencia de usuario fluida, accesible y completamente optimizada para dispositivos móviles mediante tecnologías web estándar y reutilizables.

