# Especificación de Requerimientos — Extensión para Paciente (TP4 y Segundo Parcial)

## Sistema de Gestión de Turnos Médicos — Salud Turnos

| Dato | Detalle |
| :--- | :--- |
| **Carrera** | Licenciatura en Gestión de Recursos Tecnológicos |
| **Materia** | Aplicaciones Web y Móvil — 2026 |
| **Profesor** | Rodoni, Lucas |
| **Integrantes** | Elpeza, Andrés (600213) · Benitez, José (600199) · Susñar, Daniel (600081) |
| **Versión** | 0.3 — Para desarrollo |
| **Fecha** | 10/11/2026 |
| **Estado** | Especificación cerrada, salvo las 3 dudas del apartado 10.B (DM-27 a DM-29) |

### Historial de versiones

| Versión | Cambio |
| :--- | :--- |
| 0.1 | Primer borrador: asumía pantallas móviles nuevas y personal operando en nombre del paciente. |
| 0.2 | La solución pasa a ser la misma app web responsive extendida; el paciente pasa a ser usuario (nuevo rol); se modifican Back-End, Base de Datos y Front-End; sin PWA ni nativa; sin informes ni entregables. |
| 0.3 | Incorpora las respuestas DM-15 a DM-26. **Cambio principal: el paciente es un usuario más; la ficha y la cuenta se crean juntas** y no existe una sin la otra. El alta de paciente crea también su cuenta. Se agregan 3 dudas derivadas (DM-27 a DM-29). |

---

## Índice

1. Descripción
2. Alcance
3. Punto de partida: qué se reutiliza y qué cambia
4. Actores y permisos
5. Reglas de negocio
6. Requerimientos funcionales
7. Requerimientos no funcionales
8. Historias de usuario y criterios de aceptación
9. Criterios de aceptación globales (checklist de QA)
10. Dudas y puntos a definir
11. Mejoras y consideraciones sugeridas

---

## 1. Descripción

### 1.1. Contexto

Salud Turnos ya cuenta con un Back-End con servicios REST (TP3) y con un Front-End web integrado a él, **completamente responsive** en todas sus funcionalidades. En el TP3 el paciente no se contempló como usuario del sistema (D-01) para simplificar el alcance: solo el personal (Administrador, Recepcionista, Profesional) accede.

La consigna del TP4 y del Segundo Parcial pide que el **paciente** inicie sesión, vea especialidades y profesionales, consulte turnos disponibles, solicite un turno y vea la confirmación, desde un dispositivo móvil.

### 1.2. Decisiones del equipo (resumen)

1. La solución es **la misma aplicación web responsive actual, extendida**. No es PWA ni app nativa (DM-02, DM-14).
2. **El paciente pasa a ser usuario del sistema**, con un nuevo rol. Esto reemplaza lo decidido en D-01 del TP3 y obliga a **modificar el Back-End, la Base de Datos y el Front-End** (DM-01, DM-08).
3. **El paciente es un usuario más.** La cuenta se crea junto con la ficha del paciente: no existe un turno ni un paciente sin usuario, ni se crea el usuario después. Sin verificación por correo; la contraseña inicial se muestra en pantalla, igual que para el resto de los usuarios (DM-15).
4. Se reutiliza todo lo posible: el listado de turnos, el formulario de solicitud, el sistema de avisos (toasts) y la sesión existentes (DM-04).
5. Cada rol sigue viendo la misma interfaz responsive; los permisos deciden qué ve cada uno. El paciente solo ve lo suyo y puede solicitar turnos (DM-03, DM-04).
6. El mismo desarrollo cubre el TP4 y el Segundo Parcial (DM-05).
7. Los informes, justificaciones y entregables los elabora cada alumno y **no forman parte de este documento** (DM-05).

### 1.3. Objetivo

Extender Salud Turnos para que un paciente, con cuenta propia, pueda desde su teléfono o tablet:

1. Iniciar sesión con el servicio de autenticación existente.
2. Visualizar especialidades y profesionales.
3. Consultar los horarios disponibles de un profesional.
4. Solicitar un turno para sí mismo.
5. Visualizar la confirmación de la operación.
6. Consultar sus turnos solicitados.

Sin perder ninguna funcionalidad existente para los demás roles.

### 1.4. Documentos de referencia

| Sigla | Documento |
| :--- | :--- |
| **Consigna** | `consignas.md` (TP4 y Segundo Parcial). |
| **Req. Back** | Especificación de Requerimientos del Back-End (TP3): `RFB-xx`, `RNFB-xx`, `HU-xx`, `D-xx`. |
| **Req. Front–Back** | Requerimientos de integración Front ↔ Back: `FE-xx`, `DT-xx`, `DUDA-xx`, `H-xx`. |
| **Explicaciones** | Arquitectura y funcionamiento integral del sistema (TP3). |
| **Manual** | Manual de instalación y configuración del sistema. |

### 1.5. Convenciones de este documento

| Identificador | Significado |
| :--- | :--- |
| `RFM-xx` / `RNFM-xx` | Requerimiento funcional / no funcional de esta extensión. |
| `RN-xx` | Regla de negocio aplicable (muchas heredadas del TP3). |
| `HU-Mxx` / `CA-Mxx.n` | Historia de usuario / criterio de aceptación número *n* de esa historia. |
| `DM-xx` | Duda de esta extensión (apartado 10). |
| `RFB`, `RNFB`, `D-xx`, `FE-xx`, `DT-xx`, `H-xx` | Referencias a los documentos del TP3. No se redefinen aquí. |
| **[BD] [BE] [FE]** | Capa afectada por el requerimiento: Base de Datos, Back-End, Front-End. |

**Regla de lectura:** donde aparece `(DM-xx)` con duda abierta (apartado 10.B), **no se asumió ninguna resolución**; el requerimiento queda pendiente en ese punto. Lo marcado como **[PROPUESTA]** requiere confirmación.

### 1.6. Glosario

| Término | Significado |
| :--- | :--- |
| **Paciente** | Persona atendida. En el sistema es **una ficha (DNI, nombre, etc.) y una cuenta de usuario con rol PACIENTE, creadas juntas** e inseparables. |
| **Solicitud de turno** | Alta de un turno en estado Pendiente para un horario libre de un profesional. |
| **Personal** | Administrador, Recepcionista y Profesional. |

---

## 2. Alcance

### 2.1. Incluido

1. **Nuevo rol PACIENTE** y su vinculación obligatoria con la ficha de paciente (BD, BE, FE).
2. **Alta de paciente con su cuenta en una sola operación**, con contraseña inicial generada y mostrada en pantalla.
3. Gestión de la cuenta del paciente: reseteo de clave, baja y reactivación.
4. Inicio y cierre de sesión del paciente.
5. Acceso del paciente, en solo lectura, a especialidades y profesionales activos (en los selectores del formulario) y a los horarios libres.
6. Solicitud de turno del paciente para sí mismo.
7. Confirmación en pantalla.
8. Consulta de los turnos propios del paciente.
9. Aislamiento: el paciente solo accede a lo suyo, validado en el servidor.
10. Panel, navegación y "Mi cuenta" adaptados al rol.
11. Actualización de la Base de Datos (esquema, datos iniciales y exportación) para el nuevo rol y vínculo.
12. Tratamiento de los pacientes ya existentes, que hoy no tienen cuenta (DM-27).
13. Corrección del hallazgo H-01 del TP3 (DM-25).
14. Conservación del diseño responsive y de todo lo existente.

### 2.2. Fuera de alcance

**Confirmado por la consigna o por el equipo:**

- PWA y aplicación móvil nativa (DM-02, DM-14).
- Pantallas móviles separadas del sistema web (DM-04).
- Funcionamiento sin conexión, persistencia local y sincronización en segundo plano (consigna).
- Compilar la aplicación o generar APK / IPA (consigna).
- Informes, justificaciones y entregables (DM-05).
- Carga de datos de demostración: la hace el equipo (DM-13).
- Verificación por correo, autoregistro público de pacientes y envío de correos (DM-15).
- Acciones del personal sobre turnos (confirmar, cancelar, reprogramar, estados, llegada, observaciones): ya existen y no se tocan (DM-10).
- Cancelar o reprogramar turnos por parte del paciente (DM-24).
- Edición de datos propios por parte del paciente (DM-19).

**Heredado del TP3 como fuera de alcance:** notificaciones y comprobantes (D-35), feriados y licencias (D-25).

### 2.3. Trazabilidad con la consigna

**Consigna TP4**

| Ítem de la consigna | Requerimientos | Historias |
| :--- | :--- | :--- |
| Alternativa tecnológica (la justificación la redacta el equipo) | RNFM-01 | HU-M12 |
| Integración con el Back-End y servicios REST del TP3, JSON | RFM-04 a RFM-19, RNFM-05 | Todas |
| Inicio de sesión del paciente con el servicio de autenticación del TP3 | RFM-01 a RFM-07, RFM-28, RFM-29 | HU-M01, HU-M02, HU-M03, HU-M14 |
| Visualización de especialidades y profesionales | RFM-08, RFM-09 | HU-M04 |
| Consulta de turnos disponibles | RFM-10, RFM-11 | HU-M05 |
| Solicitud de turnos médicos | RFM-12 a RFM-15 | HU-M06 |
| Visualización de la confirmación | RFM-16 | HU-M07 |
| Interfaces para teléfonos y tablets | RFM-27, RNFM-02 a RNFM-04 | HU-M12 |
| Navegación clara e intuitiva | RFM-21, RFM-22, RFM-27 | HU-M12 |
| Organización y reutilización de componentes | RNFM-09 | — |
| Consumo de al menos dos servicios REST | RNFM-05 | Todas |
| Validación de datos ingresados | RFM-25 | HU-M13 |
| Manejo de respuestas y errores | RFM-25 | HU-M13 |
| Mensajes de confirmación o información | RFM-16, RFM-25 | HU-M07, HU-M13 |
| Sin offline ni persistencia local | RNFM-10 | — |

**Segundo Parcial**

| Requerimiento del parcial | Estado | Referencias |
| :--- | :--- | :--- |
| A. Profesional y especialidad; turnos disponibles; solicitud asociada a un paciente; verificación de disponibilidad | Existe en el TP3. Se **extiende** para que el paciente lo use por sí mismo. | RFM-08 a RFM-15, RN-01 a RN-08 |
| B. GET turnos disponibles; POST solicitud; GET turnos de un paciente; JSON | Existen en el TP3 pero restringidos al personal. Se **amplían permisos** con alcance propio. | RFM-10, RFM-12, RFM-17 |
| C. Validaciones del servidor: obligatorios, turno existente y disponible, sin doble solicitud, respuestas adecuadas | Existe. Debe **mantenerse** también para el rol nuevo. | RN-10, RFM-19, apartado 9 |
| D. Consultas parametrizadas, lógica separada, archivos organizados | Existe. Debe **mantenerse** en todo lo nuevo. | RNFM-09, RNFM-06 |
| E. Interfaz: elegir especialidad o profesional, ver turnos, elegir un turno, ver confirmación | Se **extiende** la interfaz existente. | RFM-08 a RFM-22 |
| F. Integración: consultar turnos, enviar solicitud, procesar JSON, actualizar la interfaz | Se **extiende**. | RFM-10, RFM-12, RFM-25 |
| G. UX y errores: confirmación, aviso sin turnos, errores de validación, navegación sencilla | Se **extiende**. | RFM-11, RFM-16, RFM-25 |
| H. Organización clara y reutilización de código | Se **mantiene**. | RNFM-09 |

---

## 3. Punto de partida: qué se reutiliza y qué cambia

### 3.1. Lo que se reutiliza

| Recurso existente | Uso en esta extensión |
| :--- | :--- |
| Pantalla de login y servicio de autenticación | El paciente inicia sesión con la misma pantalla y servicio. |
| Pantalla de turnos: formulario de solicitud y listado | Se reutilizan para el paciente, con alcance limitado a lo propio. |
| Búsqueda de horarios libres por profesional y fecha | Se reutiliza tal cual en la solicitud. |
| Sistema de avisos (toasts), modales y manejo de errores de la API | Se reutilizan para mensajes y confirmación. |
| Modal de "clave generada, mostrada una sola vez" y reseteo de clave de Usuarios | Se reutilizan en el alta de paciente y en el reseteo. |
| Control de sesión y menú por rol | Se amplían con el rol PACIENTE. |
| "Mi cuenta" (cambio de contraseña) | Disponible también para el paciente. |
| Pantalla de Pacientes (alta, búsqueda, edición, baja) | Se amplía: el alta crea también la cuenta. |
| Pantalla de Usuarios (listado y filtros) | Se amplía para listar también a los usuarios con rol PACIENTE. |
| Diseño responsive actual | Se conserva y se usa como estándar para lo nuevo. |

### 3.2. Lo que cambia (brechas)

1. **[BD]** El modelo de usuarios solo admite tres roles y no vincula usuario con paciente.
2. **[BE]** Autenticación, autorización, listados y alta de turnos reconocen solo al personal. Falta el alcance "solo lo propio" para el paciente.
3. **[BE]** Especialidades, profesionales y horarios libres no son legibles por el paciente.
4. **[BE/FE]** El alta de paciente hoy solo crea la ficha; debe crear también la cuenta en la misma operación.
5. **[FE]** Navegación, panel y pantalla de turnos no contemplan al paciente (por ejemplo, el formulario hoy exige elegir al paciente).
6. **[BD/BE]** Los pacientes ya registrados no tienen cuenta, pero la nueva regla exige que todo paciente la tenga (DM-27).
7. **[BE]** El correo de un paciente pasa a ser el de una cuenta y, por lo tanto, único (DM-29).

### 3.3. Impacto sobre decisiones y requerimientos previos

| Documento | Elemento | Cambio |
| :--- | :--- | :--- |
| Req. Back | **D-01** (el paciente no accede) | **Reemplazado**: el paciente es un usuario más (rol PACIENTE). |
| Req. Back | Matriz de permisos (§2.4) | Se agrega la columna Paciente (apartado 4 de este documento). |
| Req. Back | **D-03**, RFB-52 (los turnos los crea solo la recepción) | **Ampliado**: el paciente puede solicitar turnos solo para sí mismo. |
| Req. Back | **D-05** (un único rol por usuario) | Sin cambio. |
| Req. Back | RFB-32, RFB-33 (alta de pacientes) | El alta crea además la cuenta con contraseña generada (DM-15). |
| Req. Back | RFB-08, RFB-13 (alta de usuarios, solo Administrador) | La cuenta del paciente la crea el alta de paciente (Recepcionista y Administrador, DM-23). El rol PACIENTE no se crea desde Usuarios. |
| Req. Back | RFB-15, RFB-22 (lectura de especialidades y profesionales) | Ampliado al paciente, solo lectura y solo activos. |
| Req. Back | RFB-39 (horarios libres) | Ampliado al paciente. |
| Req. Back | RFB-51 (el Profesional solo ve sus turnos) | Ampliado: el paciente solo ve los suyos. |
| Req. Back | RFB-54 (agenda) | El paciente no accede a la agenda. |
| Req. Back | RFB-57, RFB-58 (panel) | El paciente ve sus indicadores y próximos turnos a 30 días (DM-18). |
| Req. Back | RFB-37, D-15, D-16 (baja de pacientes) | La baja y reactivación afectan también a la cuenta (DM-17). |
| Req. Back | RFB-21, RNFB-09 | Se agrega un vínculo uno a uno **obligatorio** entre paciente y usuario. |
| Req. Back | D-37 (filtros de usuarios por rol) | El rol PACIENTE debe poder filtrarse. |
| Req. Front–Back | **DUDA-03** ("ningún cambio en el back") | **Reemplazada**: se autorizan cambios en el Back-End para esta extensión. |
| Req. Front–Back | **H-01** (Profesional sin vínculo ve datos ajenos) | Se corrige (DM-25, RFM-30). |
| Req. Front–Back | §5 matriz y navegación por rol; FE-GEN-02; FE-NAV-02 | Se incorpora el rol PACIENTE. |
| Req. Front–Back | FE-TUR-01 (selector de paciente) | No se muestra al paciente; la solicitud es siempre para sí. |
| Req. Front–Back | FE-USR-02 (alta de usuarios) | El paciente no se crea desde Usuarios (DM-28). |
| Req. Front–Back | FE-PAC-04, FE-PAC-05 (alta, baja y reactivación de pacientes) | El alta crea la cuenta y muestra la clave; la baja y reactivación afectan a la cuenta. |

---

## 4. Actores y permisos

| Función | Administrador | Recepcionista | Profesional | Paciente |
| :--- | :---: | :---: | :---: | :---: |
| Iniciar y cerrar sesión | Sí | Sí | Sí | Sí |
| Cambiar la propia contraseña | Sí | Sí | Sí | Sí |
| Ver datos propios en "Mi cuenta" | Sí | Sí | Sí | Sí (solo ver, DM-19) |
| Panel | Todo | Todo | Solo sus turnos | Solo lo propio, 30 días (DM-18) |
| Ver especialidades | Sí | Sí | No | Solo lectura, activas, en el formulario (DM-20) |
| Ver profesionales | Sí | Sí | Solo él mismo | Solo lectura, activos, en el formulario, datos limitados (DM-20) |
| Consultar horarios libres | Sí | Sí | No | Sí |
| Solicitar turno | Para cualquier paciente | Para cualquier paciente | No | **Solo para sí mismo** |
| Ver turnos | Todos | Todos | Solo propios | **Solo propios** (sin observaciones, DM-22) |
| Cancelar o reprogramar un turno | Existente | Existente | Existente | **No** (DM-24) |
| Cambiar estados, llegada, observaciones | Existente | Existente | Existente | No |
| Registrar paciente (crea ficha y cuenta) | Sí | Sí | No | No |
| Modificar datos de la ficha del paciente | Sí | Sí | No | No (DM-19) |
| Resetear la contraseña de un paciente | Sí | Sí | No | No |
| Desactivar o reactivar un paciente y su cuenta | Sí | No | No | No |
| Consultar agenda | Sí | Sí | Solo la propia | No |
| Gestionar usuarios del personal | Sí | No | No | No |
| Ver usuarios PACIENTE en el listado de Usuarios | Sí | No | No | No |

**Principio:** el paciente no ve nada más que lo necesario para solicitar turnos y consultar los suyos (DM-04).

---

## 5. Reglas de negocio

| ID | Regla | Origen |
| :--- | :--- | :--- |
| RN-01 | Administrador y Recepcionista solicitan turnos para cualquier paciente. El Paciente solo para sí mismo. El Profesional no solicita turnos. | D-03 (ampliado) |
| RN-02 | Todo turno nuevo nace en estado **Pendiente**. La confirmación la realiza la Recepción; la solicitud del paciente no se confirma sola. | D-28 |
| RN-03 | La duración del turno es de 30 minutos. Los horarios ofrecidos salen solo de la disponibilidad configurada del profesional (08:00 a 21:00). | D-21, D-24 |
| RN-04 | No se pueden solicitar turnos en fecha u hora pasada. Sin anticipación mínima. Hora de Argentina. | D-26, D-40 |
| RN-05 | Un horario ocupado por un turno no cancelado no puede solicitarse. Un turno cancelado libera el horario. | RFB-41, D-29 |
| RN-06 | Un paciente no puede tener dos turnos en la misma fecha y hora. No hay otros límites. | D-27 |
| RN-07 | Solo intervienen pacientes, profesionales y especialidades **activos**. | RFB-17, RFB-24, RFB-37 |
| RN-08 | El consultorio de un turno es el del profesional. | RFB-23 |
| RN-09 | Cada usuario tiene una única sesión activa; iniciar sesión en otro dispositivo cierra la anterior. | D-09, DM-12 |
| RN-10 | Las validaciones del servidor prevalecen siempre; las del cliente son complementarias. | RFB-59 |
| RN-11 | La confirmación es un mensaje en pantalla; sin comprobante ni notificación al paciente. | D-35 |
| RN-12 | Toda acción nueva (alta de paciente con cuenta, solicitud de turno, cambio de clave, bajas) queda auditada. | D-41 |
| RN-13 | Un paciente accede **únicamente** a: sus propios turnos y lo necesario para solicitar (especialidades y profesionales activos, y horarios libres). Nunca ve datos de otros pacientes, ni la agenda, ni usuarios, ni la gestión de pacientes. | DM-04 |
| RN-14 | **Todo paciente es un usuario.** La ficha y la cuenta (rol PACIENTE) se crean juntas, son uno a uno y no existe una sin la otra. No se puede asignar un turno a un paciente sin cuenta. | DM-15 |
| RN-15 | Un usuario PACIENTE sin ficha activa vinculada **no accede a ningún dato**: nunca se interpreta la ausencia de vínculo como "sin restricción". Lo mismo para un Profesional sin vínculo válido. | H-01; DM-25 |
| RN-16 | Un turno Pendiente o Confirmado pasa a Ausente automáticamente a los 30 minutos de su inicio si no cambió de estado. Aplica también a los turnos solicitados por pacientes. | D-30 |
| RN-17 | Contraseñas: mínimo 8 caracteres con mayúscula, minúscula y carácter especial. La inicial se genera automáticamente y se muestra una sola vez en pantalla y consola. Sin envío por correo ni verificación. | D-08, D-10, DM-15 |
| RN-18 | El correo de acceso es el de la ficha al crear la cuenta. Nombre, apellido y correo se mantienen sincronizados entre la ficha y la cuenta. | DM-16 |
| RN-19 | Desactivar la ficha desactiva también la cuenta y cierra sus sesiones; reactivar la ficha reactiva la cuenta. Se mantiene el bloqueo si el paciente tiene turnos futuros activos. | DM-17; D-15 |
| RN-20 | El correo de una cuenta es único entre **todos** los usuarios, incluidos los pacientes (consecuencia de RN-14 y RN-18; ver DM-29). | RFB-08 |
| RN-21 | La cuenta del paciente se gestiona desde la pantalla de Pacientes, no desde Usuarios (alta, edición y baja); Usuarios solo la lista (ver DM-28). | DM-23; DM-28 |

---

## 6. Requerimientos funcionales

### 6.1. Rol Paciente, cuentas y acceso

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-01 | Deberá existir un cuarto rol, **PACIENTE**, además de Administrador, Recepcionista y Profesional. Cada usuario tiene un solo rol. | BD, BE | DM-01; D-05 |
| RFM-02 | Cada ficha de paciente deberá estar vinculada a **exactamente una** cuenta con rol PACIENTE, y cada cuenta PACIENTE a exactamente una ficha (RN-14). | BD, BE | DM-15 |
| RFM-03 | El alta de un paciente deberá crear, en una **única operación atómica**, la ficha y la cuenta (rol PACIENTE, activa), con contraseña inicial autogenerada, mostrada una sola vez en pantalla y consola (RN-17). Si falla la creación de una de las dos, no se crea ninguna. Disponible para Recepcionista y Administrador desde la pantalla de Pacientes. | BE, FE | DM-15, DM-23 |
| RFM-04 | El paciente deberá iniciar sesión con el servicio y la pantalla de login existentes, con los mismos mensajes (credenciales incorrectas sin revelar cuál falló; cuenta inactiva denegada). | BE, FE | RFB-01 a RFB-03 |
| RFM-05 | El paciente deberá poder ver sus datos y cambiar su contraseña desde "Mi cuenta". No puede editar sus datos. | BE, FE | DM-19 |
| RFM-06 | Al desactivar la ficha de un paciente se desactiva su cuenta y se cierran sus sesiones; al reactivarla se reactiva la cuenta (RN-19). Solo el Administrador desactiva o reactiva. | BE, FE | DM-17, DM-23 |
| RFM-07 | El paciente deberá poder cerrar sesión desde cualquier pantalla. La sesión es única (RN-09). | BE, FE | RFB-05 |

### 6.2. Especialidades y profesionales

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-08 | El paciente deberá poder visualizar las especialidades activas, en solo lectura, en los selectores del formulario de solicitud de turno. | BE, FE | Consigna F2; DM-20 |
| RFM-09 | El paciente deberá poder visualizar los profesionales activos, filtrados por la especialidad elegida, en los selectores del formulario, mostrando apellido, nombre, especialidad y consultorio. No se exponen matrícula ni correo de usuario. | BE, FE | Consigna F2; DM-20 |

### 6.3. Disponibilidad

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-10 | El paciente deberá poder consultar los horarios libres de un profesional para una fecha, con los mismos criterios que el personal (RN-03, RN-04, RN-05). La consulta es siempre por profesional. | BE, FE | Consigna F3; DM-06 |
| RFM-11 | Si no hay horarios libres, deberá informarse con el mensaje del servicio y permitir cambiar de fecha o profesional sin reiniciar. | FE | Parcial G |

### 6.4. Solicitud de turno

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-12 | El paciente deberá solicitar turnos **únicamente para sí mismo**: el paciente lo determina el servidor según la sesión; el formulario no ofrece elegir paciente y el servidor rechaza cualquier intento de indicar otro. | BE, FE | RN-01, RN-13 |
| RFM-13 | La solicitud lleva profesional, fecha, hora y motivo opcional (hasta 255 caracteres). Estado inicial Pendiente. Mismas validaciones que para el personal. | BE, FE | RFB-40 a RFB-42 |
| RFM-14 | Si el horario dejó de estar disponible o el paciente ya tiene otro turno en esa fecha y hora, deberá informarse, recalcular los horarios y permitir elegir otro sin perder lo ya seleccionado. | FE | RFB-43; FE-TUR-06 |
| RFM-15 | El personal conserva su flujo de solicitud para cualquier paciente, sin cambios. | FE | RN-01; DM-07 |

### 6.5. Confirmación

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-16 | Ante una solicitud exitosa deberá mostrarse la confirmación con número de turno, profesional, especialidad, consultorio, fecha, hora y estado Pendiente, indicando que queda pendiente de confirmación por la recepción. Usa los avisos existentes. | FE | Consigna F5; RN-11 |

### 6.6. Turnos propios del paciente y aislamiento

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-17 | El paciente deberá poder ver sus turnos (todos: pasados, futuros y cancelados), con el estado visible y sin filtros adicionales. Orden: primero los próximos, del más cercano al más lejano; después los pasados, del más reciente al más antiguo. | BE, FE | DM-09, DM-21; Parcial B |
| RFM-18 | Cada turno propio muestra fecha, hora, profesional, especialidad, consultorio, motivo y estado. **No** incluye las observaciones del profesional. | BE, FE | DM-22 |
| RFM-19 | **Aislamiento:** el servidor deberá garantizar que el paciente accede solo a sus datos, aun si modifica parámetros o consulta los servicios directamente (RN-13, RN-15). | BE | RNFB-03 |

### 6.7. Panel, navegación y pantallas

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-20 | El panel del paciente muestra sus indicadores y sus próximos turnos de los siguientes 30 días, con alcance propio. | BE, FE | DM-18; D-39 |
| RFM-21 | El menú del paciente incluye solo lo permitido: Panel, Turnos, Mi cuenta y Cerrar sesión. El acceso por URL a una pantalla no permitida redirige con aviso y el servidor igualmente lo rechaza. | FE, BE | FE-GEN-02; DM-04 |
| RFM-22 | La pantalla de turnos del paciente reutiliza la existente: formulario de solicitud sin selector de paciente y listado limitado a sus turnos, sin acciones sobre ellos (no cancela ni reprograma). | FE | DM-04, DM-24 |

### 6.8. Gestión de la cuenta por el personal

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-23 | Recepcionista y Administrador deberán poder resetear la contraseña de un paciente desde la pantalla de Pacientes, mostrando la clave una sola vez y cerrando las sesiones de esa cuenta. Solo el Administrador desactiva o reactiva (RFM-06). | BE, FE | DM-23 |
| RFM-24 | El listado de usuarios deberá incluir a los de rol PACIENTE y permitir filtrarlos por rol. **[PROPUESTA]** Desde Usuarios no se crean, editan, desactivan ni reactivan (DM-28). | BE, FE | D-37; DM-28 |

### 6.9. Transversales

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-25 | Validación de datos en cliente y servidor, mensajes de éxito, información y error en español, estados de carga y vacío, con el mismo tratamiento que el resto de la app (FE-GEN-07 a FE-GEN-09). | FE, BE | Consigna |
| RFM-26 | Toda acción nueva queda auditada, incluyendo qué usuario la realizó (RN-12). | BE, BD | D-41 |
| RFM-27 | **No regresión:** todo lo existente funciona igual para los otros roles, el diseño responsive se conserva y lo nuevo cumple el mismo estándar. | FE, BE | DM-02, DM-04 |

### 6.10. Sincronización, migración y correcciones

| ID | Requerimiento | Capa | Origen |
| :--- | :--- | :---: | :--- |
| RFM-28 | Al modificar nombre, apellido o correo en la ficha del paciente, se deberán actualizar también en su cuenta (RN-18). Un correo ya usado por otra cuenta se rechaza indicando el campo. | BE | DM-16; DM-29 |
| RFM-29 | Los pacientes ya registrados deberán contar con cuenta, conservando todos sus datos y turnos. Mecanismo: **DM-27**. | BD, BE | RN-14; D-43 |
| RFM-30 | Un Profesional cuyo vínculo con su ficha no es válido (por ejemplo, profesional inactivo) no deberá obtener datos de turnos ni de agenda de otros profesionales (corrección de H-01). | BE | DM-25; RN-15 |

---

## 7. Requerimientos no funcionales

| ID | Categoría | Requerimiento | Origen |
| :--- | :--- | :--- | :--- |
| RNFM-01 | Tecnología | Aplicación web responsive, la misma ya existente. Sin PWA ni app nativa. | DM-02 |
| RNFM-02 | Adaptabilidad | Todo lo nuevo funciona desde 360 px hasta tablet y escritorio, sin desplazamiento horizontal de la página (breakpoints actuales). | FE-GEN-12 |
| RNFM-03 | Usabilidad táctil | Elementos interactivos de al menos 40 px y campos de texto a 16 px. | FE-GEN-12 |
| RNFM-04 | Compatibilidad | Chrome y Safari; validación con emulación como mínimo y dispositivo real si es posible. | DM-11 |
| RNFM-05 | Integración | Intercambio en JSON con los servicios REST existentes, ampliados. **El contrato actual no cambia para los roles existentes.** | Consigna |
| RNFM-06 | Seguridad | Autorización y aislamiento verificados en el servidor; consultas parametrizadas; contraseñas nunca visibles ni recuperables salvo la clave generada mostrada una sola vez; sin datos de negocio en el almacenamiento del navegador; datos mostrados escapados; entorno local con HTTP. | RNFB-01 a RNFB-03; D-12 |
| RNFM-07 | Consistencia | Mismo idioma, fechas `dd/mm/aaaa`, etiquetas de estado y mensajes que el resto de la app. | FE-GEN-11; DT-10 |
| RNFM-08 | Rendimiento | Referencial: menos de 5 segundos en uso normal. | D-45 |
| RNFM-09 | Organización y reutilización | Reutilizar lo existente (pantallas, formularios, avisos, comunicación con la API, sesión, estilos) y agregar solo lo estrictamente necesario, manteniendo separados Front-End, servicios y acceso a datos. | Consigna; Parcial H |
| RNFM-10 | Conectividad | Sin modo offline; sin conexión solo se informa claramente. | Consigna |
| RNFM-11 | Accesibilidad básica | Etiquetas asociadas, mensajes con `aria-live`, contraste legible. | FE-GEN-13 |
| RNFM-12 | Base de datos | El esquema, los datos iniciales y la exportación SQL reflejan el nuevo rol y vínculo; el reinicio de la base (`db:reset`) sigue funcionando; los datos actuales se conservan. | D-43; RNFB-16 |
| RNFM-13 | Integridad | No pueden existir pacientes sin cuenta ni cuentas PACIENTE sin ficha; el vínculo es único en ambos sentidos. | RN-14; RNFB-09 |
| RNFM-14 | Pruebas automáticas | Las pruebas automáticas existentes del Back-End se mantienen pasando y se agregan casos mínimos para el rol Paciente: alta con cuenta, inicio de sesión, aislamiento y solicitud propia. | DM-26 |

---

## 8. Historias de usuario y criterios de aceptación

Formato: **Dado** una situación, **cuando** ocurre una acción, **entonces** se observa un resultado.

### HU-M01 — Iniciar sesión como paciente

**Como** paciente, **quiero** iniciar sesión con mi correo y contraseña, **para** acceder a mis turnos y solicitar nuevos.

**Relación:** RFM-01, RFM-04 · RFB-01 a RFB-03.

- **CA-M01.1** Dado un paciente con cuenta activa y credenciales correctas, cuando inicia sesión, entonces accede a la app con las opciones del rol Paciente.
- **CA-M01.2** Dados campos vacíos o correo inválido, entonces se indica el campo y el motivo.
- **CA-M01.3** Dadas credenciales incorrectas, entonces recibe *"Usuario o contraseña incorrectos"* sin saber cuál falló.
- **CA-M01.4** Dada una cuenta inactiva, entonces recibe el mensaje de acceso denegado.
- **CA-M01.5** Dado un paciente que inicia sesión en otro dispositivo, entonces la sesión anterior se cierra (RN-09).

### HU-M02 — Cerrar sesión y proteger las pantallas

**Como** usuario autenticado, **quiero** cerrar sesión y que nadie acceda sin sesión válida, **para** proteger mi información.

**Relación:** RFM-07, RFM-21 · RFB-05, RFB-06.

- **CA-M02.1** Dada una sesión activa, cuando cierra sesión, entonces vuelve al login y la sesión queda inválida.
- **CA-M02.2** Dado un acceso por URL a una pantalla privada sin sesión, entonces es redirigido al login.
- **CA-M02.3** Dada una sesión finalizada o iniciada en otro dispositivo, entonces es redirigido con un aviso que lo explica.
- **CA-M02.4** Dado un paciente que abre por URL una pantalla no permitida, entonces es redirigido con aviso y el servidor rechaza la operación.

### HU-M03 — Registrar un paciente con su cuenta

**Como** Recepcionista o Administrador, **quiero** registrar un paciente y que se cree su cuenta en el mismo paso, **para** poder asignarle turnos y que pueda ingresar al sistema.

**Relación:** RFM-02, RFM-03, RFM-26 · RN-14, RN-17, RN-20 · RFB-32, RFB-33.

- **CA-M03.1** Dados datos válidos, un DNI no registrado y un correo no usado por otra cuenta, cuando se registra el paciente, entonces se crean la ficha y la cuenta activa con rol Paciente, y se muestra la contraseña generada una sola vez (en pantalla y consola).
- **CA-M03.2** Dado un DNI ya registrado, entonces es rechazado con *"El DNI ingresado ya se encuentra registrado en el sistema"* y no se crea nada.
- **CA-M03.3** Dado un correo ya usado por otra cuenta (de cualquier rol), entonces es rechazado indicando el campo correo y no se crea nada.
- **CA-M03.4** Dados campos obligatorios faltantes o con formato inválido, entonces es rechazado indicando cada campo y su motivo.
- **CA-M03.5** Dada una falla al crear la ficha o la cuenta, entonces no se crea ninguna de las dos.
- **CA-M03.6** Dado cualquier paciente, entonces nunca existe sin cuenta ni una cuenta Paciente sin ficha.
- **CA-M03.7** Dada cualquier respuesta posterior del sistema, entonces no contiene la contraseña ni un valor derivado.
- **CA-M03.8** Dado un usuario sin permiso para registrar pacientes, entonces es rechazado.
- **Pendiente:** correo único entre pacientes (DM-29).

### HU-M14 — Gestionar la cuenta de un paciente

**Como** personal habilitado, **quiero** resetear la contraseña, mantener sincronizados los datos y dar de baja o reactivar a un paciente, **para** mantener su acceso actualizado.

**Relación:** RFM-06, RFM-23, RFM-28 · RN-18, RN-19, RN-21.

- **CA-M14.1** Dado un paciente, cuando la Recepcionista o el Administrador resetea su contraseña, entonces se muestra la nueva clave una sola vez y se cierran las sesiones de esa cuenta.
- **CA-M14.2** Dado un cambio de nombre, apellido o correo en la ficha, entonces se actualizan también en la cuenta.
- **CA-M14.3** Dado un cambio de correo a uno ya usado por otra cuenta, entonces es rechazado indicando el campo.
- **CA-M14.4** Dado un paciente sin turnos futuros activos, cuando el Administrador lo desactiva, entonces la ficha y la cuenta quedan inactivas, se cierran sus sesiones y se conserva el registro.
- **CA-M14.5** Dado un paciente con turnos futuros activos, cuando se intenta desactivar, entonces se bloquea y se informa el motivo.
- **CA-M14.6** Dado un paciente desactivado, cuando el Administrador lo reactiva, entonces la ficha y la cuenta vuelven a estar activas.
- **CA-M14.7** Dado un usuario Recepcionista, cuando intenta desactivar o reactivar, entonces es rechazado.
- **CA-M14.8** Dado un paciente desactivado, entonces no puede iniciar sesión ni recibir turnos.
- **CA-M14.9** Dada una cuenta Paciente en el listado de Usuarios, entonces se muestra y se puede filtrar por rol, pero no se crea ni se modifica desde allí (DM-28).

### HU-M04 — Ver especialidades y profesionales

**Como** paciente, **quiero** ver las especialidades y los profesionales, **para** elegir con quién sacar turno.

**Relación:** RFM-08, RFM-09 · RFB-15, RFB-22.

- **CA-M04.1** Dado el formulario de solicitud, entonces el selector de especialidades muestra solo las activas.
- **CA-M04.2** Dada una especialidad elegida, entonces el selector de profesionales muestra únicamente sus profesionales activos con apellido, nombre, especialidad y consultorio.
- **CA-M04.3** Dado un profesional, entonces no se exponen datos internos (matrícula, correo de usuario).
- **CA-M04.4** Dada una especialidad sin profesionales activos, entonces se informa.
- **CA-M04.5** Dada una falla de comunicación, entonces se muestra el error y se permite reintentar.

### HU-M05 — Consultar horarios disponibles

**Como** paciente, **quiero** ver los horarios libres de un profesional en una fecha, **para** elegir cuándo atenderme.

**Relación:** RFM-10, RFM-11 · RFB-39.

- **CA-M05.1** Dado un profesional activo con disponibilidad y una fecha, entonces se muestran los horarios libres de ese día ordenados.
- **CA-M05.2** Dada la fecha de hoy, entonces no se ofrecen horarios ya vencidos.
- **CA-M05.3** Dada una fecha pasada, entonces no puede elegirse.
- **CA-M05.4** Dado un día sin horarios libres, entonces se informa con el mensaje del servicio y puede cambiar fecha o profesional sin reiniciar.
- **CA-M05.5** Dado un turno cancelado, entonces su horario vuelve a figurar libre.
- **CA-M05.6** Entre las 21:00 y las 23:59 (hora de Argentina), la fecha por defecto es la de hoy.
- **CA-M05.7** Dada la lista de horarios libres, entonces no contiene datos de otros pacientes.

### HU-M06 — Solicitar un turno

**Como** paciente, **quiero** reservar un horario libre para mí, **para** registrar mi solicitud sin riesgo de superposición.

**Relación:** RFM-12 a RFM-14 · RFB-40 a RFB-43 · RN-01 a RN-08.

- **CA-M06.1** Dados un profesional y un horario libre, cuando confirma, entonces se registra el turno **a su nombre** en estado Pendiente.
- **CA-M06.2** Dados datos faltantes (profesional, fecha u hora), entonces no puede confirmar y se indica cuál falta.
- **CA-M06.3** Dado un horario ocupado por otra persona entre la consulta y la confirmación, entonces se informa, se recalculan los horarios y puede elegir otro sin perder lo seleccionado.
- **CA-M06.4** Dado que ya tiene un turno en esa fecha y hora, entonces se informa el motivo y no se registra.
- **CA-M06.5** Dado un doble toque en confirmar, entonces se envía una sola solicitud.
- **CA-M06.6** Dadas dos solicitudes simultáneas al mismo horario, entonces solo una se registra.
- **CA-M06.7** Dado un intento de solicitar el turno a nombre de otro paciente (por la interfaz o directamente), entonces el servidor lo rechaza y no se crea.
- **CA-M06.8** Dado un paciente inactivo, entonces no puede solicitar turnos.
- **CA-M06.9** Dado el personal con permiso, entonces conserva el flujo existente para cualquier paciente.

### HU-M07 — Ver la confirmación

**Como** paciente, **quiero** ver el resultado de mi solicitud, **para** saber que quedó registrada.

**Relación:** RFM-16 · RN-02, RN-11.

- **CA-M07.1** Dada una solicitud exitosa, entonces se muestra la confirmación con número, profesional, especialidad, consultorio, fecha, hora y estado Pendiente, indicando que la recepción debe confirmarlo.
- **CA-M07.2** Dada la confirmación, entonces puede ir a sus turnos o solicitar otro.
- **CA-M07.3** Dada una recarga de la pantalla, entonces no se vuelve a enviar la solicitud.

### HU-M08 — Consultar mis turnos

**Como** paciente, **quiero** ver mis turnos, **para** conocer su fecha y estado.

**Relación:** RFM-17, RFM-18 · Parcial B.

- **CA-M08.1** Dado un paciente con turnos, entonces se listan todos (pasados, futuros y cancelados) con fecha, hora, profesional, especialidad, consultorio, motivo y estado.
- **CA-M08.2** Dado el listado, entonces primero aparecen los próximos, del más cercano al más lejano, y después los pasados, del más reciente al más antiguo.
- **CA-M08.3** Dado el listado, entonces solo contiene turnos del propio paciente.
- **CA-M08.4** Dado un paciente sin turnos, entonces se informa que no tiene.
- **CA-M08.5** Dado un turno cancelado, ausente o asistido, entonces se muestra con su estado correspondiente.
- **CA-M08.6** Dado un turno que el sistema marcó Ausente automáticamente (RN-16), entonces se muestra Ausente.
- **CA-M08.7** Dado un turno propio, entonces no se muestran las observaciones del profesional.
- **CA-M08.8** Dado el listado del paciente, entonces no ofrece acciones de cancelar ni reprogramar.

### HU-M09 — Privacidad: solo mis datos

**Como** paciente, **quiero** que nadie vea mis datos y no ver los de otros, **para** proteger la privacidad.

**Relación:** RFM-19, RFM-21, RFM-30 · RN-13, RN-15.

- **CA-M09.1** Dado un paciente, cuando consulta turnos, entonces recibe únicamente los propios, aunque modifique filtros o identificadores.
- **CA-M09.2** Dado un paciente, cuando intenta acceder a Pacientes, Agenda, Usuarios, Profesionales (gestión) o Especialidades (gestión), entonces es rechazado.
- **CA-M09.3** Dado un paciente, entonces los horarios ocupados, el panel y las respuestas nunca incluyen nombres o datos de otros pacientes.
- **CA-M09.4** Dado un usuario Paciente sin ficha activa vinculada, entonces no obtiene datos de ningún paciente.
- **CA-M09.5** Dado un paciente, cuando intenta una acción sobre un turno ajeno, entonces es rechazado y no se modifica nada.
- **CA-M09.6** Dado un Profesional con vínculo inválido (por ejemplo, profesional inactivo), cuando consulta turnos o agenda, entonces no obtiene datos de otros profesionales.

### HU-M10 — Mi cuenta

**Como** paciente, **quiero** ver mis datos y cambiar mi contraseña, **para** mantener mi cuenta segura.

**Relación:** RFM-05 · RN-17.

- **CA-M10.1** Dado un paciente, entonces ve sus datos (nombre, DNI, correo) en Mi cuenta.
- **CA-M10.2** Dada una contraseña actual incorrecta o una nueva que incumple la política, entonces se rechaza con el motivo.
- **CA-M10.3** Dado un cambio correcto, entonces la contraseña queda actualizada.
- **CA-M10.4** Dado un paciente, entonces no puede editar sus datos.

### HU-M11 — Panel del paciente

**Como** paciente, **quiero** ver un resumen de mis próximos turnos, **para** tenerlos a mano al ingresar.

**Relación:** RFM-20 · D-39.

- **CA-M11.1** Dado un paciente, cuando abre el panel, entonces solo ve información propia.
- **CA-M11.2** Dado el panel, entonces muestra sus indicadores y sus próximos turnos de los siguientes 30 días, sin turnos pasados ni cancelados en la lista de próximos.
- **CA-M11.3** Dado que no tiene turnos, entonces los indicadores valen cero y la lista indica que no hay turnos.

### HU-M12 — Usar la app cómodamente en teléfono y tablet

**Como** usuario, **quiero** que todo funcione bien desde mi dispositivo, **para** operar sin dificultad.

**Relación:** RFM-21, RFM-22, RFM-27 · RNFM-01 a RNFM-04.

- **CA-M12.1** Dado un teléfono de 360 px, entonces todas las pantallas nuevas se ven y operan sin desplazamiento horizontal de la página.
- **CA-M12.2** Dada una tablet, vertical u horizontal, entonces el contenido no se rompe.
- **CA-M12.3** Dado un elemento táctil, entonces mide al menos 40 px.
- **CA-M12.4** Dado un campo de texto en iPhone, entonces el navegador no hace zoom automático.
- **CA-M12.5** Dados los roles existentes, entonces todas sus pantallas y funciones siguen funcionando como antes.

### HU-M13 — Mensajes y errores claros

**Como** usuario, **quiero** que el sistema me explique qué pasó cuando algo falla, **para** saber cómo seguir.

**Relación:** RFM-25 · FE-GEN-07.

- **CA-M13.1** Dado un error de validación (400), entonces se muestra el motivo junto al dato afectado.
- **CA-M13.2** Dada una sesión inválida (401), entonces se redirige al login con aviso.
- **CA-M13.3** Dada una operación sin permiso (403), entonces se informa.
- **CA-M13.4** Dado un recurso inexistente (404), entonces se informa y se refresca el listado.
- **CA-M13.5** Dado un conflicto (409), entonces se muestra el mensaje del servidor.
- **CA-M13.6** Dado un error del servidor o de red, entonces se muestra un mensaje genérico sin detalles técnicos.
- **CA-M13.7** Dados datos con símbolos (`<`, `>`, `"`), entonces se muestran como texto.

---

## 9. Criterios de aceptación globales (checklist de QA)

Las pruebas son manuales, con emulación del navegador como mínimo y dispositivo real si es posible. Pruebas automáticas del Back-End: RNFM-14.

**Flujo del paciente**
- [ ] Registrar un paciente (se crea su cuenta y se muestra la clave) → iniciar sesión con esa clave → elegir especialidad y profesional en el formulario → elegir fecha y horario → solicitar → ver confirmación → ver el turno en "mis turnos" como Pendiente.
- [ ] Dos solicitudes simultáneas al mismo horario: solo una se registra.
- [ ] Un turno cancelado libera el horario.
- [ ] Un profesional inactivo o sin disponibilidad no ofrece horarios.
- [ ] El panel del paciente muestra solo sus datos de los próximos 30 días.

**Cuentas de pacientes**
- [ ] El alta de paciente crea ficha y cuenta juntas; si falla una, no se crea ninguna.
- [ ] Correo ya usado por otra cuenta: alta rechazada.
- [ ] Cambio de nombre, apellido o correo en la ficha se refleja en la cuenta.
- [ ] Reseteo de clave por Recepcionista y Administrador; cierra las sesiones de la cuenta.
- [ ] Desactivar (solo Administrador) desactiva la cuenta y cierra sus sesiones; reactivar la reactiva; con turnos futuros activos se bloquea.
- [ ] Los pacientes existentes cuentan con cuenta y conservan sus datos y turnos (DM-27).

**Aislamiento y seguridad**
- [ ] El paciente no ve turnos de otros pacientes, ni por interfaz ni modificando parámetros.
- [ ] El paciente no puede solicitar un turno a nombre de otro.
- [ ] El paciente no accede a Pacientes, Agenda, Usuarios, Profesionales ni Especialidades (gestión), ni por URL ni por servicio.
- [ ] El paciente no ve observaciones del profesional ni acciones de cancelar o reprogramar.
- [ ] Un Profesional con vínculo inválido no obtiene datos ajenos (H-01 corregido).
- [ ] Ninguna respuesta contiene contraseñas.
- [ ] Ninguna llamada envía parámetros vacíos ni propiedades extra.
- [ ] No queda ningún dato de negocio en el almacenamiento del navegador.
- [ ] Datos con `<`, `>`, `"` se muestran como texto.

**No regresión**
- [ ] Administrador, Recepcionista y Profesional conservan todas sus pantallas y funciones, con los mismos permisos.
- [ ] Las pruebas automáticas existentes del Back-End siguen pasando y se agregaron las del rol Paciente.
- [ ] La base se puede reiniciar y exportar, con el nuevo rol incluido, sin perder los datos actuales.

**Responsive**
- [ ] Anchos de 360 px, 768 px y escritorio sin desplazamiento horizontal fuera de las tablas con scroll propio.
- [ ] Tablet vertical y horizontal.
- [ ] Chrome y Safari.

**Verificación de lo heredado (Parcial A a D)**
- [ ] El servidor valida obligatorios, existencia y disponibilidad del turno y evita la doble solicitud, también para el rol Paciente.
- [ ] Las consultas a la base de datos de lo nuevo son parametrizadas.
- [ ] Lógica, servicios y acceso a datos siguen separados.

---

## 10. Dudas y puntos a definir

**Prioridad:** **Alta** = bloquea la especificación o el diseño. **Media** = afecta reglas o criterios de aceptación. **Baja** = detalle resoluble durante el desarrollo.

### 10.A. Dudas resueltas

| ID | Tema | Decisión del equipo | Efecto en este documento |
| :--- | :--- | :--- | :--- |
| DM-01 | Quién inicia sesión | El paciente pasa a ser usuario del sistema. Hay que modificar Back-End, Base de Datos y Front-End. | RFM-01 a RFM-07, apartado 3.3 |
| DM-02 | Tecnología | App web responsive, la actual. Sin PWA ni nativa. | RNFM-01 |
| DM-03 | Rol Profesional en el móvil | Todos los usuarios ven lo mismo; cada rol conserva su interfaz. | RFM-27, apartado 4 |
| DM-04 | Relación con el front existente | Se reutiliza todo lo posible. El paciente solo ve lo suyo y puede solicitar turnos, nada más. | RN-13, RFM-19 a RFM-22 |
| DM-05 | TP4 y Parcial; entregables | El mismo desarrollo cubre ambas consignas. Informes y entregables quedan fuera. | Apartados 2.2 y 2.3 |
| DM-06 | Selección | Siempre por profesional. | RFM-10 |
| DM-07 | Momento de identificar al paciente | Ya no aplica: el sistema toma al paciente de la sesión. El personal conserva su selector. | RFM-12, RFM-15 |
| DM-08 | Registro del paciente | Se necesita un rol nuevo; el mecanismo se definió en DM-15. | RFM-03 |
| DM-09 | Consulta de turnos del paciente | Todos, estado visible, sin filtros; los más actuales o futuros arriba. | RFM-17 |
| DM-10 | Acciones sobre el turno | Ya implementadas; no se tocan. | Apartado 2.2 |
| DM-11 | Validación | Emulación como mínimo, dispositivo real si es posible. Chrome y Safari. | RNFM-04 |
| DM-12 | Sesión única | El inicio de sesión cierra cualquier sesión anterior. | RN-09 |
| DM-13 | Datos de demostración | Los carga el estudiante. | Apartado 2.2 |
| DM-14 | PWA | No; solo se extiende la app existente. | Apartado 2.2 |
| DM-15 | Cómo obtiene el paciente su cuenta | El paciente es un usuario más. La cuenta se crea junto con el paciente; no existe un turno ni un paciente sin usuario, ni se crea el usuario después. Sin verificación por correo; la clave se muestra en pantalla como en los otros usuarios. | RN-14, RN-17, RFM-02, RFM-03, HU-M03 |
| DM-16 | Vínculo y datos compartidos | El correo de acceso es el de la ficha al crear la cuenta; nombre, apellido y correo se mantienen sincronizados. | RN-18, RFM-28 |
| DM-17 | Baja y reactivación | Desactivar la ficha desactiva la cuenta y cierra sesiones; reactivar la reactiva. | RN-19, RFM-06, HU-M14 |
| DM-18 | Panel del paciente | Sus indicadores y próximos turnos de los siguientes 30 días, con alcance propio. | RFM-20, HU-M11 |
| DM-19 | Mi cuenta | Solo ver y cambiar contraseña; los datos los edita el personal. | RFM-05, HU-M10 |
| DM-20 | Especialidades y profesionales | Alcanza con verlos en los selectores del formulario de solicitud (con apellido, nombre, especialidad y consultorio; sin matrícula ni correo). | RFM-08, RFM-09, HU-M04 |
| DM-21 | Orden de turnos propios | Primero los próximos (del más cercano al más lejano); después los pasados (del más reciente al más antiguo). | RFM-17, CA-M08.2 |
| DM-22 | Observaciones | El paciente no las ve; solo motivo y estado. | RFM-18 |
| DM-23 | Quién gestiona las cuentas | Recepcionista y Administrador crean el acceso (al registrar al paciente) y resetean la clave desde Pacientes; solo el Administrador desactiva o reactiva. | RFM-03, RFM-06, RFM-23 |
| DM-24 | Acciones del paciente sobre sus turnos | Solo solicitar y consultar. Cancelar o modificar sigue por la recepción. | RFM-22, CA-M08.8 |
| DM-25 | Corrección de H-01 | Sí, se corrige junto con el alcance del paciente. | RN-15, RFM-30 |
| DM-26 | Pruebas automáticas | Se mantienen y se agregan casos mínimos del rol Paciente. | RNFM-14 |

### 10.B. Dudas nuevas (abiertas)

Derivadas de las respuestas anteriores. La columna **Respuesta** queda vacía para completarla.

| ID | Surge en | Duda | Propuesta | Prioridad | Respuesta |
| :--- | :--- | :--- | :--- | :---: | :--- |
| DM-27 | DM-15 ("no existe un paciente sin usuario") vs D-43 (los datos actuales se conservan) | Los pacientes ya registrados (en la base y en los turnos existentes) no tienen cuenta. ¿Cómo se resuelve? **(a)** Una migración única crea la cuenta de cada paciente existente con clave generada (mostrada en consola) y el personal puede resetearla después. **(b)** Los datos iniciales de la base incluyen cuentas de paciente con claves predefinidas, como las del personal (el equipo carga los datos de demo, DM-13). **(c)** Ambas. Además: si hay pacientes existentes con correo repetido o igual al de otra cuenta, ¿cómo se resuelven? | **(c)**: migración única para bases ya en uso y datos iniciales con cuentas de demostración. Los correos repetidos se corrigen a mano antes de migrar. | Alta | Los datos iniciales de la base incluyen cuentas de paciente con claves predefinidas, como las del personal (el equipo carga los datos de demo, DM-13) |
| DM-28 | RN-21; RFM-24 | Los usuarios con rol PACIENTE ¿aparecen en el listado de Usuarios? ¿Se pueden crear, editar, desactivar o reactivar desde ahí, o solo desde Pacientes (como el profesional, que se reactiva desde su propia pantalla)? | Aparecen en el listado y se filtran por rol, pero todo el ciclo de vida se gestiona desde Pacientes. | Baja | Aparecen en el listado y se filtran por rol, pero todo el ciclo de vida se gestiona desde Pacientes. |
| DM-29 | RN-20; D-17 | Como el correo del paciente pasa a ser el de su cuenta, deja de poder repetirse: dos pacientes (por ejemplo, familiares) no pueden compartir el mismo correo, ni un paciente usar el de un usuario del personal. ¿Es aceptable? | Sí: el correo es único entre todas las cuentas. | Media | Sí: el correo es único entre todas las cuentas. |

---

## 11. Mejoras y consideraciones sugeridas

No son requerimientos; se proponen para decidir con el grupo.

1. **Todo paciente tiene cuenta, aunque nunca la use.** Al crear la cuenta junto con la ficha, también se crean cuentas de personas que quizás nunca ingresen. No es un problema funcional, pero conviene que el modal de "clave generada" avise que debe entregarse al paciente.
2. **Correo único (DM-29).** Es la consecuencia más visible de esta decisión: ya no se puede registrar a dos pacientes con el mismo correo. Para el TP alcanza con mostrar el mensaje claro del servidor.
3. **Turnos Pendientes que se vuelven Ausentes (RN-16).** Un turno solicitado por el paciente queda Pendiente hasta que la recepción lo confirma. Si nadie lo confirma, pasa automáticamente a Ausente a los 30 minutos de su inicio. Por eso el mensaje de confirmación aclara que queda pendiente de confirmación (RFM-16).
4. **Sin límites de solicitudes (D-27).** Con el paciente solicitando por sí mismo, nada impide que reserve muchos horarios. Hoy no hay ningún máximo; si se quisiera evitar, habría que definirlo.
5. **Ausencia de vínculo = sin acceso (RN-15).** El hallazgo H-01 del TP3 muestra el riesgo de interpretar "sin vínculo" como "sin restricción". La regla por defecto, también para el paciente, debe ser siempre denegar.
6. **Sesión única en pruebas (RN-09).** Probar desde el celular y la computadora con el mismo usuario se cierra mutuamente. Usar cuentas distintas para cada dispositivo.
7. **Reutilización.** El modal de clave generada, el reseteo de clave y los avisos ya existen para los usuarios del personal; reutilizarlos en el alta y el reseteo de pacientes reduce el trabajo y mantiene la coherencia (RNFM-09).