# Especificación de Requerimientos del Back-End

## Sistema de Gestión de Turnos Médicos — Salud Turnos

| Dato | Detalle |
| :--- | :--- |
| **Carrera** | Licenciatura en Gestión de Recursos Tecnológicos |
| **Materia** | Aplicaciones Web y Móvil — 2026 |
| **Profesor** | Rodoni, Lucas |
| **Integrantes** | Elpeza, Andrés (600213) · Benitez, José (600199) · Susñar, Daniel (600081) |
| **Versión** | 0.1 — Borrador |
| **Fecha** | 26/10/2026 |
| **Estado** | Pendiente de resolución de las dudas del apartado 7 |

---

## Índice

1. Descripción
2. Alcance
3. Punto de partida: relación con lo ya desarrollado
4. Requerimientos funcionales
5. Requerimientos no funcionales
6. Historias de usuario y criterios de aceptación
7. Dudas y puntos a definir

---

## 1. Descripción

### 1.1. Contexto

El Sistema de Gestión de Turnos Médicos centraliza la asignación y el seguimiento de turnos entre pacientes y profesionales de la salud (TP1). Hasta hoy cuenta con un Front-End completo (TP2) que funciona con datos simulados guardados en el propio navegador: no hay servidor, no hay persistencia real, no hay usuarios reales ni control de permisos.

### 1.2. Problema que resuelve esta etapa

Sin un Back-End, la información no se comparte entre usuarios ni dispositivos, no se conserva de forma confiable, las validaciones pueden evitarse porque solo existen en el cliente, y no se puede controlar quién accede a qué. Esto contradice el objetivo general del TP1: administrar los turnos médicos de forma **centralizada, segura y trazable**.

### 1.3. Objetivo del Back-End

Implementar la lógica de negocio, la persistencia de datos y los servicios de comunicación que permitan al Front-End del TP2 operar sobre información real, cumpliendo el modelo de datos y los casos de uso definidos en el TP1 y los módulos mínimos exigidos por la consigna: autenticación de usuarios, gestión de pacientes, médicos, especialidades y turnos, administración de usuarios según roles y servicios REST.

### 1.4. Documentos de referencia

| Sigla | Documento |
| :--- | :--- |
| **TP1** | Trabajo Práctico I — Diseño del Sistema de Gestión de Turnos (requerimientos, casos de uso, navegación, mapa del sitio, mockups y modelo de datos). |
| **TP2** | Front-End implementado (`GUIA.md`, `README.txt` y consigna del TP2). |
| **Consigna BE** | Consigna del Back-End (módulos mínimos, aspectos a considerar y entrega). |

### 1.5. Convenciones de este documento

| Identificador | Significado |
| :--- | :--- |
| `RF-xx`, `RNF-xx`, `CU-xx` | Requerimientos y casos de uso **originales del TP1**. |
| `RFB-xx` | Requerimiento funcional del Back-End (este documento). |
| `RNFB-xx` | Requerimiento no funcional del Back-End (este documento). |
| `HU-xx` / `CA-xx.n` | Historia de usuario / criterio de aceptación número *n* de esa historia. |
| `D-xx` | Duda abierta registrada en el apartado 7. |

**Regla de lectura:** donde aparece `(D-xx)`, el documento original es ambiguo, contradictorio o no define el comportamiento. En esos puntos **no se asumió ninguna resolución**; el requerimiento o criterio queda pendiente hasta responder la duda.

### 1.6. Glosario

| Término | Significado |
| :--- | :--- |
| **Profesional** | Persona de salud que atiende pacientes (la consigna del Back-End lo llama "médico"; ver D-20). Tiene especialidad, matrícula y un consultorio fijo. |
| **Paciente** | Persona a quien se asigna un turno. |
| **Disponibilidad** | Días, franjas horarias y duración de turno que un profesional ofrece para atender. |
| **Turno** | Reserva concreta de un paciente con un profesional, en una fecha y hora. |
| **Agenda** | Vista cronológica de los horarios libres y los turnos asignados de un profesional. |
| **Estado del turno** | Situación del turno: Pendiente, Confirmado, En Consultorio, Asistido, Ausente o Cancelado. |
| **Consultorio** | Espacio de atención asignado de forma fija a un único profesional. No es una entidad separada. |

---

## 2. Alcance

### 2.1. Incluido

El Back-End deberá cubrir:

1. **Autenticación y sesiones** de usuarios.
2. **Autorización basada en roles** (Administrador, Recepcionista, Profesional).
3. **Administración de usuarios.**
4. **Gestión de especialidades.**
5. **Gestión de profesionales**, incluida su matrícula y el consultorio fijo asignado.
6. **Configuración de la disponibilidad** (agenda) de cada profesional.
7. **Gestión de pacientes.**
8. **Gestión de turnos:** consulta de horarios libres, asignación, modificación, cancelación y gestión de estados, incluido el registro de llegada del paciente.
9. **Consulta de agenda médica.**
10. **Datos para el panel principal** (indicadores y próximos turnos).
11. **Búsqueda y filtrado** en los listados.
12. **Validación de datos en el servidor** e integridad de la información.
13. **Servicios de comunicación REST** con el Front-End (métodos GET, POST, PUT y DELETE; intercambio en formato JSON), tal como lo exige la consigna.
14. **Integración** del Front-End del TP2 con el Back-End.

### 2.2. Entregables exigidos por la consigna

- Código fuente completo del proyecto.
- Base de datos exportada (archivo SQL).
- Scripts de creación de la base de datos.
- Manual de instalación y configuración.
- Todo en un único archivo comprimido (.ZIP), con presentación grupal.

### 2.3. Fuera de alcance

**Confirmado por los documentos:**

- No existe una entidad *Consultorio* independiente: el consultorio es un dato del profesional (TP1, apartado VIII).

**Pendiente de decisión** (los documentos no los mencionan ni los excluyen; se consultan en el apartado 7): notificaciones al paciente (D-35), feriados y licencias de profesionales (D-25), auditoría o historial de cambios (D-41), pantallas de administración en el Front-End (D-42).

### 2.4. Actores y matriz de permisos

El TP1 define cuatro actores. Tres tienen acceso al sistema (Administrador, Recepcionista, Profesional). El Paciente figura como actor, pero no se define si accede al sistema (D-01).

La siguiente matriz refleja **solo lo que el TP1 define**. Donde dice `D-xx`, la definición es ambigua.

| Función | Administrador | Recepcionista | Profesional | Fuente |
| :--- | :---: | :---: | :---: | :--- |
| Iniciar y cerrar sesión | Sí | Sí | Sí | CU-01 |
| Administrar usuarios | Sí | No | No | RF-02, mapa del sitio |
| Alta, modificación y baja de especialidades | Sí | No | No | RF-04 |
| Alta, modificación y baja de profesionales y su consultorio | Sí | No | No | RF-05, RF-13 |
| Consultar especialidades y profesionales | Sí | D-07 | D-07 | Mapa del sitio vs CU-03 y CU-04 |
| Configurar disponibilidad | Sí | No | No | CU-05 |
| Gestionar pacientes (alta, consulta, modificación, baja) | Sí | Sí | D-02 | RF-03, CU-02, mapa del sitio |
| Consultar horarios libres y asignar turno | Sí | Sí | No | RF-06, CU-03 |
| Modificar y cancelar turno | Sí | Sí | D-04 | RF-09, RF-10 ("el usuario") |
| Registrar llegada del paciente | D-05 | Sí | No | CU-06 |
| Actualizar otros estados del turno | D-03 | Sí | Sí, según D-03 | RF-11 |
| Consultar agenda médica | Cualquiera | Cualquiera | Solo la propia | CU-04 |
| Ver panel principal | Sí | Sí | Sí | Mapa del sitio (contenido: D-39) |

---

## 3. Punto de partida: relación con lo ya desarrollado

### 3.1. Lo que define el TP1

- 13 requerimientos funcionales (RF-01 a RF-13) y 6 no funcionales (RNF-01 a RNF-06).
- 6 casos de uso detallados: CU-01 Iniciar sesión, CU-02 Registrar paciente, CU-03 Asignar turno, CU-04 Consultar agenda, CU-05 Configurar agenda y disponibilidad, CU-06 Registrar asistencia.
- Modelo de datos con 6 entidades: Usuario, Paciente, Especialidad, Profesional, Disponibilidad y Turno, con sus atributos, restricciones, relaciones y los seis estados permitidos del turno.

### 3.2. Lo que implementa hoy el Front-End (TP2)

| Pantalla | Qué hace hoy (según `GUIA.md` y `README.txt`) | De dónde salen los datos hoy | Qué cambia con el Back-End |
| :--- | :--- | :--- | :--- |
| **Home** | Página pública de bienvenida con acceso al login. | — | Sigue siendo pública. |
| **Login** | Valida que los campos no estén vacíos, compara contra usuarios de prueba y crea una sesión simulada. Muestra el error en una notificación flotante. | Usuarios de prueba predefinidos. | La autenticación y la sesión pasan al servidor. Se mantienen los mensajes de CU-01. |
| **Dashboard** | Muestra contadores (total, confirmados, cancelados) y los 5 próximos turnos no cancelados, ordenados por fecha y hora. | Calculado en el navegador sobre turnos simulados. | Indicadores y próximos turnos provistos por el servidor (D-39). |
| **Pacientes** | Alta con validación (DNI obligatorio y no duplicado, nombre, apellido, formato de correo), búsqueda en tiempo real por DNI, nombre o apellido, y tabla. | Pacientes simulados guardados en el navegador. | Alta, consulta y búsqueda persistentes y validadas por el servidor. Hoy **no existe** modificación ni desactivación. |
| **Turno** | Selección en cascada de paciente, especialidad, profesional, fecha y hora libre. Valida disponibilidad, lista los turnos y permite cancelar. | Especialidades fijas (Clínica médica, Pediatría, Cardiología), profesionales y horarios simulados. | Especialidades, profesionales y horarios libres salen de datos administrados. El control de superposición pasa al servidor. Hoy **no existe** modificación de turno ni cambio de estado distinto de cancelar. |
| **Agenda** | Permite elegir fecha y profesional y muestra la grilla de horarios LIBRE u OCUPADO con el nombre del paciente. | Una lista de horarios del sistema, comparada contra los turnos simulados. | La grilla debe construirse a partir de la disponibilidad configurada (D-24). Hoy solo existe vista de un día (D-38). |

### 3.3. Brechas entre TP1, Front-End y consigna del Back-End

1. **Módulos exigidos por la consigna sin pantalla en el Front-End:** administración de usuarios, gestión de profesionales, gestión de especialidades (hoy son una lista fija) y configuración de agenda. Ver D-42.
2. **Funciones del TP1 sin soporte en el Front-End:** modificar o desactivar paciente, modificar turno, cambiar estados (solo se cancela), registrar llegada (CU-06) y la vista propia del profesional.
3. **Estados del turno:** el TP1 define seis; la documentación del Front-End describe insignias para tres (Confirmado, Pendiente, Cancelado).
4. **Validaciones:** las del Front-End son solo del lado del cliente. El Back-End debe validar todo por su cuenta.
5. **Sesión y roles:** la sesión actual es simulada. La documentación del Front-End no evidencia comportamiento diferenciado por rol; con el Back-End los roles pasan a ser reales.
6. **Datos del modelo TP1 que el Front-End no maneja:** fecha de nacimiento y obra social del paciente, matrícula y consultorio del profesional, motivo, observaciones y fecha y hora de llegada del turno.
7. **Inconsistencias entre los propios documentos:** se detallan en el apartado 7.

### 3.4. Cobertura por módulo

| Módulo | TP1 | Front-End TP2 | Aporte del Back-End |
| :--- | :--- | :--- | :--- |
| Autenticación y sesión | RF-01, CU-01, RNF-06 | Login y control de sesión simulados | Autenticación real, sesión, roles y protección de contraseñas. |
| Usuarios | RF-02 | Sin pantalla | Todo nuevo. |
| Especialidades | RF-04 | Lista fija | Alta, consulta, modificación y baja. |
| Profesionales | RF-05, RF-13 | Datos simulados | Alta, consulta, modificación y baja, con matrícula y consultorio únicos. |
| Disponibilidad | RF-07, CU-05 | Lista de horarios del sistema | Configuración por profesional. |
| Pacientes | RF-03, CU-02 | Alta y búsqueda | Persistencia, modificación y baja. |
| Turnos | RF-06, RF-08 a RF-11, CU-03, CU-06 | Alta y cancelación | Modificación, estados completos, llegada, control de superposición. |
| Agenda | CU-04 | Grilla diaria | Agenda por rol y por período. |
| Panel principal | Mapa del sitio, mockups | Contadores y próximos turnos | Datos calculados en el servidor. |
| Búsqueda y filtros | RF-12 | Solo en pacientes | Todos los listados. |

---

## 4. Requerimientos funcionales

### 4.1. Autenticación y sesión

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-01 | El sistema deberá validar el correo y la contraseña y permitir el acceso únicamente si son correctos y la cuenta está activa. | RF-01, CU-01 | HU-01 |
| RFB-02 | Ante credenciales incorrectas o usuario inexistente, deberá responder con un mensaje único que no revele cuál de los dos datos falló. | CU-01 (5a) | HU-01 |
| RFB-03 | Ante credenciales válidas de una cuenta inactiva, deberá denegar el acceso indicando que se comunique con el administrador, sin crear sesión. | CU-01 (5b) | HU-01 |
| RFB-04 | Al autenticar, deberá crear una sesión de trabajo individual asociada al usuario y a su rol (duración y reglas: D-09). | CU-01 (paso 6) | HU-01 |
| RFB-05 | Deberá permitir cerrar la sesión, que debe quedar inválida de inmediato. | TP1 apartado V; Front-End (cerrar sesión) | HU-02 |
| RFB-06 | Deberá rechazar toda solicitud a funciones privadas sin sesión válida, y distinguir ese caso del de una sesión válida sin permiso para la función. | Consigna BE (autenticación y autorización) | HU-02, HU-03 |
| RFB-07 | Deberá informar al Front-End quién es el usuario autenticado y cuál es su rol, para adaptar el menú y las opciones. | TP1 apartados V y VI | HU-03 |

### 4.2. Usuarios

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-08 | Deberá permitir crear usuarios con nombre, apellido, correo (único) y rol. La contraseña inicial queda sujeta a D-10. | RF-02 | HU-04 |
| RFB-09 | Deberá permitir consultar el listado y el detalle de usuarios, sin devolver nunca la contraseña ni ningún valor derivado de ella. | RF-02, RNF-06 | HU-04 |
| RFB-10 | Deberá permitir modificar los datos y el rol de un usuario. | RF-02 | HU-04 |
| RFB-11 | Deberá permitir desactivar usuarios (reactivación: D-16). Un usuario desactivado no puede iniciar sesión; el efecto sobre sus sesiones abiertas queda sujeto a D-09 y la desactivación de la propia cuenta a D-13. | RF-02 | HU-04 |
| RFB-12 | Deberá almacenar las contraseñas de forma que el valor original no pueda recuperarse. | RNF-06 | HU-01, HU-04 |
| RFB-13 | Deberá restringir la administración de usuarios al rol Administrador. | RF-02, mapa del sitio | HU-04 |

### 4.3. Especialidades

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-14 | Deberá permitir registrar especialidades con nombre único y descripción opcional. | RF-04, modelo | HU-05 |
| RFB-15 | Deberá permitir consultar el listado y el detalle de especialidades (visibilidad por rol: D-07). | RF-04, CU-03 (paso 3) | HU-05 |
| RFB-16 | Deberá permitir modificar el nombre y la descripción, manteniendo la unicidad del nombre. | RF-04 | HU-05 |
| RFB-17 | Deberá permitir desactivar especialidades. Una especialidad inactiva no puede usarse para asignar turnos nuevos. El tratamiento de profesionales asociados queda sujeto a D-15. | RF-04, CU-03 (precondición 3) | HU-05 |
| RFB-18 | Deberá restringir el alta, la modificación y la baja de especialidades al rol Administrador. | RF-04 | HU-05 |

### 4.4. Profesionales

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-19 | Deberá permitir registrar profesionales con nombre, apellido, especialidad, matrícula (única) y consultorio (único entre profesionales). | RF-05, RF-13 | HU-06 |
| RFB-20 | Deberá validar que la especialidad asociada exista y esté activa. | RF-05 | HU-06 |
| RFB-21 | Deberá permitir vincular opcionalmente un profesional con un usuario, con relación uno a uno (cada usuario a lo sumo un profesional y cada profesional a lo sumo un usuario). Alcance y comportamiento: D-06. | TP1 apartado VIII.2 | HU-06 |
| RFB-22 | Deberá permitir consultar el listado y el detalle de profesionales y filtrarlos por especialidad (visibilidad por rol: D-07). | RF-05, RF-06, CU-03 (paso 3) | HU-06 |
| RFB-23 | Deberá permitir modificar los datos del profesional, incluido el consultorio, validando que no esté asignado a otro profesional. El consultorio de un turno se obtiene siempre del profesional y no se carga por turno. | RF-13, RF-07 | HU-06 |
| RFB-24 | Deberá permitir desactivar profesionales (reglas: D-15 y D-16). Un profesional inactivo no ofrece turnos nuevos. | CU-03 (precondición 3) | HU-06, HU-12 |
| RFB-25 | Deberá restringir el alta, la modificación y la baja de profesionales y de su consultorio al rol Administrador. | RF-05, RF-13 | HU-06 |

### 4.5. Disponibilidad (agenda del profesional)

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-26 | Deberá permitir definir, para cada profesional, los días de atención, las franjas horarias y la duración de los turnos (cantidad de franjas por día y ubicación de la duración: D-21). | RF-07, CU-05 | HU-07 |
| RFB-27 | Deberá validar que los datos estén completos y que los horarios sean válidos, y que no existan conflictos (alcance de "conflicto": D-22). | CU-05 (pasos 6 y 7) | HU-07 |
| RFB-28 | No deberá solicitar el consultorio al configurar la disponibilidad: se obtiene automáticamente del profesional. | RF-07 | HU-07 |
| RFB-29 | Deberá permitir consultar la disponibilidad configurada de un profesional. | CU-04 (2a), CU-05 (paso 3) | HU-07, HU-17 |
| RFB-30 | Deberá definir qué ocurre con los turnos ya asignados cuando se modifica la disponibilidad (D-23). | CU-05 | HU-07 |
| RFB-31 | Deberá restringir la configuración de disponibilidad al rol Administrador. | CU-05 | HU-07 |

### 4.6. Pacientes

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-32 | Deberá permitir registrar pacientes con DNI (único), nombre y apellido; teléfono y correo (obligatoriedad: D-17) y datos opcionales del modelo (D-19). | RF-03, CU-02 | HU-08 |
| RFB-33 | Deberá validar el formato de los datos (D-18) y que el DNI no esté ya registrado, informando el motivo del rechazo. | CU-02 (5a y 5b) | HU-08 |
| RFB-34 | Deberá permitir consultar el listado y el detalle de pacientes. | RF-03 | HU-09 |
| RFB-35 | Deberá permitir buscar pacientes por DNI, nombre o apellido (criterios exactos: D-37). | RF-12; Front-End (búsqueda en tiempo real) | HU-09 |
| RFB-36 | Deberá permitir modificar los datos de un paciente, manteniendo la unicidad del DNI. | RF-03 | HU-10 |
| RFB-37 | Deberá permitir desactivar pacientes (reglas: D-15 y D-16). Un paciente inactivo no puede recibir turnos nuevos. | RF-03, CU-03 (precondición 2) | HU-10 |
| RFB-38 | Deberá permitir la gestión de pacientes a los roles Administrador y Recepcionista (acceso del Profesional: D-02). | RF-03, mapa del sitio | HU-08, HU-09, HU-10 |

### 4.7. Turnos

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-39 | Deberá mostrar los horarios libres filtrados por fecha, profesional o especialidad, obtenidos de la disponibilidad del profesional descontando los turnos ocupados. | RF-06, CU-03 (paso 4) | HU-11 |
| RFB-40 | Deberá permitir asignar un turno a un paciente activo con un profesional activo (y especialidad activa), en un horario libre dentro de su disponibilidad. | RF-08, CU-03 | HU-12 |
| RFB-41 | Deberá impedir la superposición de turnos de un mismo profesional en un horario ocupado por un turno no cancelado, incluso cuando dos solicitudes llegan al mismo tiempo. | RF-08, RNF-04, CU-03 (7a) | HU-12 |
| RFB-42 | Al asignar un turno, deberá registrar su estado inicial (D-28), la fecha de creación y, de forma opcional, motivo de consulta y observaciones. | CU-03, modelo | HU-12 |
| RFB-43 | Si el horario dejó de estar disponible, deberá informarlo y permitir elegir otro. | CU-03 (7a) | HU-12 |
| RFB-44 | Deberá permitir modificar un turno revalidando disponibilidad y ausencia de superposición (campos y estados modificables: D-33). | RF-09 | HU-13 |
| RFB-45 | Deberá permitir cancelar un turno: pasa al estado Cancelado, se conserva el registro y el horario vuelve a quedar libre (motivo y registro de quién cancela: D-36; permisos: D-04). | RF-10 | HU-14 |
| RFB-46 | Deberá gestionar los seis estados del turno: Pendiente, Confirmado, En Consultorio, Asistido, Ausente y Cancelado. Los cambios los realizan los roles habilitados (D-03) y siguen las transiciones que se definan (D-29). | RF-11 | HU-16 |
| RFB-47 | Deberá permitir registrar la llegada del paciente: solo para turnos del día actual y en un estado que lo permita (D-32). El turno pasa a En Consultorio y se guardan fecha y hora de llegada. | CU-06 | HU-16 |
| RFB-48 | Deberá rechazar el registro de llegada si el turno no existe, es de otra fecha o está en un estado no válido, sin modificarlo. | CU-06 (5a, 5b, 5c) | HU-16 |
| RFB-49 | Si falla la actualización de un estado, deberá avisarlo y dejar el turno sin cambios. | CU-06 (error de actualización) | HU-16 |
| RFB-50 | Deberá hacer visible al profesional que su paciente llegó (forma e inmediatez: D-34). | CU-06 (paso 8), RF-11 | HU-16 |
| RFB-51 | Deberá permitir listar turnos con filtros y ordenamiento (D-37). El Profesional solo accede a sus propios turnos. | RF-12, CU-04 (paso 2) | HU-15 |
| RFB-52 | Deberá restringir el alta, la modificación y la cancelación de turnos a Administrador y Recepcionista (Profesional: D-04). | RF-08, RF-09, RF-10 | HU-12, HU-13, HU-14 |

### 4.8. Agenda médica

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-53 | Deberá entregar, para un profesional y un período, la grilla cronológica que distingue horarios libres de turnos asignados, incluyendo paciente y estado en los asignados. | CU-04 (pasos 4 y 5) | HU-17 |
| RFB-54 | El Profesional solo podrá ver su propia agenda; Administrador y Recepcionista podrán consultar la de cualquier profesional o especialidad. | CU-04 (paso 2) | HU-17 |
| RFB-55 | Los períodos soportados quedan sujetos a D-38. | CU-04 (paso 3) | HU-17 |
| RFB-56 | Deberá informar cuando el período no tiene horarios de atención o el profesional no tiene agenda activa. | CU-04 (4a y 2a) | HU-17 |

### 4.9. Panel principal

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-57 | Deberá entregar los indicadores (hoy: total de turnos, confirmados y cancelados) y los próximos turnos. Período y definición de "próximo": D-39. | Mapa del sitio; Front-End (`dashboard.js`) | HU-18 |
| RFB-58 | El contenido del panel según el rol queda sujeto a D-39. | Mapa del sitio | HU-18 |

### 4.10. Requerimientos transversales

| ID | Requerimiento | Origen | HU |
| :--- | :--- | :--- | :--- |
| RFB-59 | Deberá validar en el servidor todos los datos recibidos (obligatoriedad, formato, unicidad y existencia de las referencias), sin depender de lo que valide el Front-End. | Consigna BE (validación en el servidor) | Todas |
| RFB-60 | Deberá informar los errores de validación indicando el campo afectado y el motivo. | RNF-01 | Todas |
| RFB-61 | Deberá impedir referencias a registros inexistentes y respetar las relaciones del modelo del TP1. | Consigna BE (integridad referencial), RNF-04 | Todas |
| RFB-62 | Deberá conservar la información entre reinicios del sistema, reemplazando la persistencia simulada del Front-End. | Consigna BE | HU-19, HU-20 |
| RFB-63 | Deberá ofrecer alta, consulta, modificación y baja para pacientes, profesionales, especialidades, usuarios y turnos (significado de "baja": D-14). | Consigna BE (CRUD) | HU-04 a HU-14 |

---

## 5. Requerimientos no funcionales

| ID | Categoría | Requerimiento | Origen |
| :--- | :--- | :--- | :--- |
| RNFB-01 | Seguridad — credenciales | Las contraseñas no deben poder recuperarse, ni aparecer en respuestas, mensajes de error o registros. | RNF-06; consigna BE (protección de credenciales) |
| RNFB-02 | Seguridad — datos de entrada | Todo dato enviado por el usuario debe tratarse como dato y no como instrucción. La consigna exige consultas parametrizadas. | Consigna BE |
| RNFB-03 | Seguridad — autorización | Cada función debe verificar sesión y rol en el servidor, sin depender de lo que el Front-End oculte. | Consigna BE (autorización basada en roles) |
| RNFB-04 | Seguridad — sesiones | El identificador de sesión no debe ser predecible. Vida útil y cierre: D-09. | CU-01 (paso 6); consigna BE (gestión de sesiones) |
| RNFB-05 | Seguridad — transporte | Las comunicaciones deben realizarse por un canal seguro (HTTPS). Alcance en el entorno de entrega: D-12. | CU-01 (precondición 2) |
| RNFB-06 | Seguridad — errores | Los errores no deben exponer detalles internos (estructura de datos, trazas). | Complementario a la consigna de seguridad |
| RNFB-07 | Rendimiento | Las consultas en cargas normales de trabajo no deben exceder los 5 segundos (cómo se verifica: D-45). | RNF-02 |
| RNFB-08 | Disponibilidad | Disponibilidad promedio del 98 % mensual (aplicabilidad y verificación: D-45). | RNF-03 |
| RNFB-09 | Integridad | Deben cumplirse las claves y unicidades del modelo: DNI, correo de usuario, matrícula, consultorio, nombre de especialidad y vínculo usuario–profesional. No deben existir turnos duplicados. | RNF-04; TP1 apartado VIII |
| RNFB-10 | Consistencia concurrente | Dos solicitudes simultáneas sobre un mismo horario no pueden generar dos turnos activos. | RF-08; CU-03 (7a) |
| RNFB-11 | Interfaz de comunicación | Servicios REST con los métodos GET, POST, PUT y DELETE e intercambio de información en JSON. Las respuestas deben permitir distinguir éxito, error de validación, no autenticado, no autorizado, no encontrado y conflicto de horario. | Consigna BE |
| RNFB-12 | Usabilidad de mensajes | Los mensajes deben estar en español, ser claros, indicar campo y motivo, y ser coherentes con los que muestra hoy el Front-End. | RNF-01 |
| RNFB-13 | Compatibilidad con el Front-End | La integración no debe alterar los flujos visibles del TP2, salvo lo definido en este documento. | Consigna BE (integración) |
| RNFB-14 | Organización | Debe existir separación entre presentación, lógica de negocio y acceso a datos, con organización modular. Su definición concreta corresponde a los documentos de diseño. | Consigna BE |
| RNFB-15 | Instalabilidad | El sistema debe poder instalarse y ponerse en marcha en un equipo nuevo siguiendo únicamente el manual entregado. | Consigna BE (entrega) |
| RNFB-16 | Reproducibilidad | La base de datos debe poder crearse desde los scripts entregados y obtener un estado inicial conocido (datos iniciales: D-43). | Consigna BE (entrega) |
| RNFB-17 | Trazabilidad | **Pendiente de definición** (D-41). | Objetivo general del TP1 |

---

## 6. Historias de usuario y criterios de aceptación

Formato de los criterios: **Dado** una situación, **cuando** ocurre una acción, **entonces** se observa un resultado.

### Épica A — Autenticación y control de acceso

#### HU-01 — Iniciar sesión

**Como** Administrador, Recepcionista o Profesional, **quiero** iniciar sesión con mi correo y contraseña, **para** acceder a las funciones que corresponden a mi rol.

**Relación:** RF-01, CU-01, RNF-06 · RFB-01 a RFB-04, RFB-12 · Front-End: `login.html` y `login.js` (hoy valida contra usuarios de prueba y crea una sesión simulada).

- **CA-01.1** Dado un usuario activo con credenciales correctas, cuando inicia sesión, entonces accede al panel principal con las funciones de su rol.
- **CA-01.2** Dado un correo inexistente o una contraseña incorrecta, cuando intenta iniciar sesión, entonces recibe el mensaje *"Usuario o contraseña incorrectos"* sin saber cuál dato falló y no se crea sesión.
- **CA-01.3** Dado un usuario inactivo con credenciales correctas, cuando intenta iniciar sesión, entonces recibe *"Acceso denegado. Comuníquese con el administrador del sistema"* y no se crea sesión.
- **CA-01.4** Dado un intento con campos vacíos, cuando llega al servidor, entonces es rechazado indicando los campos obligatorios, aunque el Front-End ya los valide.
- **CA-01.5** Dada cualquier respuesta del sistema, entonces nunca contiene la contraseña ni un valor derivado de ella.
- **Pendiente:** política de contraseñas (D-08), duración de la sesión (D-09), bloqueo por intentos fallidos (D-11), HTTPS (D-12).

#### HU-02 — Cerrar sesión y proteger las funciones privadas

**Como** usuario autenticado, **quiero** cerrar mi sesión y que nadie pueda usar funciones privadas sin una sesión válida, **para** proteger la información.

**Relación:** RFB-05, RFB-06 · TP1 apartado V (todo acceso privado ofrece cierre de sesión) · Front-End: botón cerrar sesión y control de sesión de `common.js`.

- **CA-02.1** Dada una sesión activa, cuando el usuario cierra sesión, entonces la sesión queda inválida y no puede usarse para nuevas solicitudes.
- **CA-02.2** Dada una solicitud sin sesión (o con sesión inválida), cuando pide cualquier función privada, entonces es rechazada como no autenticada y el Front-End redirige al inicio de sesión.
- **CA-02.3** Dada una solicitud a las funciones públicas (inicio e inicio de sesión), cuando se realiza sin sesión, entonces se permite.
- **Pendiente:** vencimiento de la sesión (D-09).

#### HU-03 — Acceso según el rol

**Como** Administrador del sistema, **quiero** que cada función esté disponible solo para los roles autorizados, **para** proteger los datos y las operaciones.

**Relación:** RFB-06, RFB-07, RNFB-03 · TP1 apartados V y VI · matriz de permisos (apartado 2.4).

- **CA-03.1** Dado un usuario autenticado sin permiso para una función, cuando la solicita directamente (aunque el Front-End no la muestre), entonces es rechazado como no autorizado y no se modifica ningún dato.
- **CA-03.2** Dado un Profesional, cuando consulta agenda o turnos, entonces recibe únicamente los propios.
- **CA-03.3** Dado un usuario autenticado, cuando el Front-End consulta su identidad, entonces recibe su nombre y su rol.
- **CA-03.4** Los permisos de la matriz del apartado 2.4 se cumplen. Los marcados con `D-xx` no se implementan hasta resolver la duda.

### Épica B — Administración de datos maestros

#### HU-04 — Gestionar usuarios

**Como** Administrador, **quiero** crear, consultar, modificar y desactivar usuarios, **para** controlar quién accede al sistema y con qué rol.

**Relación:** RF-02, RNF-06 · RFB-08 a RFB-13 · Front-End: sin pantalla (D-42).

- **CA-04.1** Dados datos válidos y un correo no registrado, cuando el Administrador crea un usuario, entonces queda registrado, activo y con el rol asignado.
- **CA-04.2** Dado un correo ya registrado, cuando se intenta crear o modificar un usuario, entonces es rechazado indicando que el campo correo está duplicado.
- **CA-04.3** Dada una consulta de listado o detalle, entonces ninguna respuesta incluye la contraseña ni un valor derivado.
- **CA-04.4** Dado un usuario desactivado, entonces su registro se conserva y no puede iniciar sesión (CA-01.3).
- **CA-04.5** Dado un usuario que no es Administrador, cuando intenta cualquiera de estas operaciones, entonces es rechazado como no autorizado.
- **CA-04.6** Dados los datos almacenados, entonces no es posible conocer ninguna contraseña original.
- **Pendiente:** contraseña inicial, cambio y restablecimiento (D-10), reactivación (D-16), autodesactivación y último administrador (D-13).

#### HU-05 — Gestionar especialidades

**Como** Administrador, **quiero** gestionar las especialidades médicas, **para** agrupar a los profesionales y ofrecer turnos por especialidad.

**Relación:** RF-04 · RFB-14 a RFB-18 · Front-End: lista fija de especialidades en `turnos.js`.

- **CA-05.1** Dado un nombre no existente, cuando el Administrador crea una especialidad, entonces queda registrada y activa.
- **CA-05.2** Dado un nombre ya existente, cuando se intenta crear o modificar, entonces es rechazado indicando el campo duplicado.
- **CA-05.3** Dada una especialidad desactivada, entonces no se ofrece para asignar turnos nuevos y sus registros históricos se conservan.
- **CA-05.4** Dada una consulta de especialidades, entonces se devuelve el listado con nombre, descripción y estado.
- **CA-05.5** Dado un usuario que no es Administrador, cuando intenta crear, modificar o desactivar, entonces es rechazado.
- **Pendiente:** visibilidad de lectura por rol (D-07), desactivar con profesionales asociados (D-15).

#### HU-06 — Gestionar profesionales y su consultorio

**Como** Administrador, **quiero** registrar profesionales con su especialidad, matrícula y consultorio fijo, **para** que puedan recibir turnos.

**Relación:** RF-05, RF-13 · RFB-19 a RFB-25 · Front-End: profesionales simulados (sin pantalla de gestión, D-42).

- **CA-06.1** Dados una especialidad activa, una matrícula no registrada y un consultorio libre, cuando el Administrador crea el profesional, entonces queda registrado y activo.
- **CA-06.2** Dada una matrícula ya registrada, entonces es rechazado indicando el campo matrícula.
- **CA-06.3** Dado un consultorio ya asignado a otro profesional, entonces es rechazado indicando el campo consultorio (RF-13).
- **CA-06.4** Dada una especialidad inexistente o inactiva, entonces es rechazado.
- **CA-06.5** Dado un cambio de consultorio a uno libre, entonces se actualiza y la agenda y los turnos del profesional muestran el nuevo consultorio sin cargarlo en cada turno.
- **CA-06.6** Dado un profesional desactivado, entonces no ofrece turnos nuevos.
- **CA-06.7** Dado un usuario ya vinculado a otro profesional, cuando se intenta vincularlo, entonces es rechazado.
- **CA-06.8** Dado un usuario que no es Administrador, cuando intenta crear, modificar o desactivar, entonces es rechazado.
- **Pendiente:** vínculo usuario–profesional (D-06), visibilidad de lectura (D-07), turnos de un profesional desactivado (D-15), formato de matrícula y consultorio (D-18).

#### HU-07 — Configurar la disponibilidad del profesional

**Como** Administrador, **quiero** definir los días, franjas horarias y duración de los turnos de cada profesional, **para** generar la disponibilidad con la que se asignan turnos.

**Relación:** RF-07, CU-05 · RFB-26 a RFB-31 · Front-End: sin pantalla; hoy usa una lista de horarios del sistema (D-24).

- **CA-07.1** Dado un profesional activo y datos válidos de días, horarios y duración, cuando el Administrador guarda, entonces la disponibilidad queda registrada y habilita la asignación de turnos.
- **CA-07.2** Dados datos incompletos o una hora de fin no posterior a la de inicio, cuando intenta guardar, entonces es rechazado con el detalle de cada campo y no se guarda nada.
- **CA-07.3** Dado un conflicto de horario, cuando intenta guardar, entonces el sistema lo informa y no guarda.
- **CA-07.4** Dado el guardado de la disponibilidad, entonces no se solicita el consultorio: se obtiene del profesional.
- **CA-07.5** Dado un profesional inexistente o inactivo, entonces es rechazado.
- **CA-07.6** Dado un usuario que no es Administrador, entonces es rechazado.
- **Pendiente:** duración y franjas múltiples (D-21), qué es un "conflicto" (D-22), turnos existentes al cambiar la disponibilidad (D-23), feriados y licencias (D-25).

### Épica C — Pacientes

#### HU-08 — Registrar paciente

**Como** Recepcionista o Administrador, **quiero** dar de alta a un paciente, **para** poder asignarle turnos.

**Relación:** RF-03, CU-02 · RFB-32, RFB-33, RFB-38 · Front-End: `pacientes.html` y `pacientes.js` (alta con validación local).

- **CA-08.1** Dados datos válidos y un DNI no registrado, cuando se guarda, entonces el paciente queda registrado y activo, y se confirma la operación.
- **CA-08.2** Dado un DNI ya registrado, cuando se guarda, entonces es rechazado con el mensaje *"El DNI ingresado ya se encuentra registrado en el sistema"*.
- **CA-08.3** Dados campos obligatorios faltantes o con formato inválido, cuando se guarda, entonces es rechazado indicando cada campo y su motivo.
- **CA-08.4** Dado un paciente registrado, cuando se reinicia el sistema, entonces el paciente sigue existiendo.
- **CA-08.5** Dado un usuario con rol Profesional, entonces la gestión de pacientes no está habilitada según lo definido en el TP1 (apartado VI).
- **Pendiente:** teléfono y correo obligatorios u opcionales (D-17), formatos (D-18), fecha de nacimiento y obra social (D-19), acceso del Profesional (D-02).

#### HU-09 — Consultar y buscar pacientes

**Como** Recepcionista o Administrador, **quiero** listar y buscar pacientes por DNI, nombre o apellido, **para** encontrarlos rápido.

**Relación:** RF-03, RF-12 · RFB-34, RFB-35 · Front-End: búsqueda en tiempo real en `pacientes.js`.

- **CA-09.1** Dada una consulta sin filtros, cuando se solicita el listado, entonces se devuelven los pacientes con sus datos básicos y su estado.
- **CA-09.2** Dado un texto de búsqueda, cuando se solicita, entonces se devuelven solo los pacientes cuyo DNI, nombre o apellido coincidan.
- **CA-09.3** Dada una búsqueda sin resultados, entonces se devuelve una respuesta vacía informativa, no un error.
- **CA-09.4** Dado el identificador de un paciente inexistente, entonces se informa que no fue encontrado.
- **Pendiente:** criterio de coincidencia, inclusión de inactivos y paginación (D-37).

#### HU-10 — Modificar y desactivar paciente

**Como** Recepcionista o Administrador, **quiero** corregir datos de un paciente y desactivarlo, **para** mantener el registro actualizado.

**Relación:** RF-03, CU-03 (precondición 2) · RFB-36, RFB-37 · Front-End: sin modificación ni desactivación hoy.

- **CA-10.1** Dados datos válidos, cuando se modifica un paciente, entonces se actualizan.
- **CA-10.2** Dado un DNI que ya pertenece a otro paciente, cuando se intenta modificar, entonces es rechazado.
- **CA-10.3** Dado un paciente desactivado, entonces se conserva su registro y no puede recibir turnos nuevos.
- **CA-10.4** Dado un paciente inexistente, entonces se informa que no fue encontrado.
- **Pendiente:** turnos existentes de un paciente desactivado (D-15), reactivación y unicidad del DNI (D-16).

### Épica D — Turnos y agenda

#### HU-11 — Consultar horarios libres

**Como** Recepcionista o Administrador, **quiero** ver los horarios libres por fecha, profesional o especialidad, **para** ofrecer turnos al paciente.

**Relación:** RF-06, CU-03 (paso 4) · RFB-39 · Front-End: `turnos.js` (hoy calcula horarios libres sobre una lista de horarios).

- **CA-11.1** Dado un profesional activo con disponibilidad y una fecha, cuando se consulta, entonces se devuelven las franjas horarias de ese día que no tienen un turno no cancelado.
- **CA-11.2** Dada una especialidad y una fecha, cuando se consulta, entonces se devuelven los horarios libres de los profesionales activos de esa especialidad.
- **CA-11.3** Dado un turno cancelado, entonces su horario vuelve a figurar como libre.
- **CA-11.4** Dado un profesional sin turnos libres en el rango, entonces se informa la ausencia de disponibilidad (CU-03, 4a).
- **CA-11.5** Dado un profesional inactivo o sin disponibilidad configurada, entonces no se ofrecen horarios.
- **Pendiente:** fechas pasadas y horizonte máximo (D-26).

#### HU-12 — Asignar turno

**Como** Recepcionista o Administrador, **quiero** asignar un turno a un paciente en un horario libre, **para** reservar la atención sin riesgo de superposición.

**Relación:** RF-08, RNF-04, CU-03 · RFB-40 a RFB-43, RFB-52 · Front-End: `turno.html` y `turnos.js` (alta con doble verificación local).

- **CA-12.1** Dados un paciente activo, un profesional activo y un horario libre, cuando se confirma, entonces el turno queda registrado, vinculado a ambos y el horario ocupado, y se confirma la reserva.
- **CA-12.2** Dado un horario ya ocupado, cuando se confirma, entonces es rechazado informando que el turno no está disponible y se puede elegir otro horario.
- **CA-12.3** Dadas dos solicitudes simultáneas para el mismo horario, entonces solo una queda registrada y la otra recibe el aviso de no disponibilidad.
- **CA-12.4** Dado un horario fuera de la disponibilidad del profesional, entonces es rechazado.
- **CA-12.5** Dado un paciente o profesional inactivo o inexistente, entonces es rechazado.
- **CA-12.6** Dado un turno cancelado en ese horario, entonces no impide asignar uno nuevo.
- **CA-12.7** Dado el alta, entonces se guarda la fecha de creación y, si se informan, motivo de consulta y observaciones.
- **CA-12.8** Dado un usuario con rol Profesional, cuando intenta asignar un turno, entonces es rechazado.
- **Pendiente:** estado inicial (D-28), turnos en el pasado y anticipación (D-26), paciente con turnos simultáneos (D-27), comprobante y notificaciones (D-35).

#### HU-13 — Modificar turno

**Como** Recepcionista o Administrador, **quiero** modificar un turno asignado, **para** reprogramarlo o corregir sus datos.

**Relación:** RF-09 · RFB-44 · Front-End: no existe hoy.

- **CA-13.1** Dado un nuevo horario libre y válido, cuando se modifica el turno, entonces se actualiza y el horario anterior queda libre.
- **CA-13.2** Dado un nuevo horario ocupado, cuando se intenta modificar, entonces es rechazado y el turno original no cambia.
- **CA-13.3** Dado un turno inexistente, entonces se informa que no fue encontrado.
- **Pendiente:** campos modificables y estados que lo impiden (D-33), permisos (D-04).

#### HU-14 — Cancelar turno

**Como** Recepcionista o Administrador, **quiero** cancelar un turno, **para** liberar el horario cuando el paciente no asistirá.

**Relación:** RF-10 · RFB-45 · Front-End: cancelación en `turnos.js` (cambia el estado a Cancelado).

- **CA-14.1** Dado un turno cancelable, cuando se cancela, entonces pasa a Cancelado, el registro se conserva y el horario queda libre.
- **CA-14.2** Dado un turno cancelado, entonces sigue apareciendo en los listados con su estado y cuenta como cancelado en los indicadores.
- **CA-14.3** Dado un turno inexistente, entonces se informa que no fue encontrado.
- **Pendiente:** estados desde los que se puede cancelar (D-29), motivo y registro de quién cancela (D-36), permisos (D-04).

#### HU-15 — Listar y filtrar turnos

**Como** Recepcionista, Administrador o Profesional, **quiero** listar los turnos con filtros, **para** seguir la actividad de atención.

**Relación:** RF-12, CU-04 · RFB-51 · Front-End: tabla de turnos de `turnos.js` (ordenada por fecha y hora).

- **CA-15.1** Dado un Administrador o Recepcionista, cuando consulta los turnos, entonces recibe los de cualquier profesional ordenados por fecha y hora.
- **CA-15.2** Dados filtros de fecha, profesional, paciente o estado, entonces se devuelven solo los turnos que cumplen.
- **CA-15.3** Dado un Profesional, entonces recibe únicamente sus turnos, aunque solicite los de otro profesional.
- **CA-15.4** Dado cada turno devuelto, entonces incluye paciente, profesional, especialidad, consultorio, fecha, hora y estado.
- **CA-15.5** Dada una consulta sin resultados, entonces se devuelve una respuesta vacía informativa.
- **Pendiente:** filtros exactos, ordenamiento y paginación (D-37).

#### HU-16 — Registrar llegada y gestionar estados del turno

**Como** Recepcionista (o Profesional, según D-03), **quiero** registrar la llegada del paciente y actualizar el estado del turno, **para** que el equipo sepa en qué situación está cada atención.

**Relación:** RF-11, CU-06 · RFB-46 a RFB-50 · Front-End: no existe hoy.

- **CA-16.1** Dado un turno del día actual en un estado que lo permite, cuando se registra la llegada, entonces pasa a En Consultorio y se guardan la fecha y la hora de llegada.
- **CA-16.2** Dado un turno inexistente, entonces se informa y no se modifica nada.
- **CA-16.3** Dado un turno cancelado, ausente o en otro estado no válido, entonces se informa que no puede registrarse la asistencia y el estado no cambia.
- **CA-16.4** Dado un turno de otra fecha, entonces se informa y el turno no se modifica.
- **CA-16.5** Dado un fallo al guardar, entonces se informa que la operación no se completó y el estado permanece sin cambios.
- **CA-16.6** Dado un estado fuera de los seis definidos, entonces es rechazado.
- **CA-16.7** Dada la llegada del paciente, entonces el Profesional puede ver que está presente.
- **Pendiente:** quién cambia cada estado (D-03), transiciones (D-29), Ausente (D-30), Asistido (D-31), estados y tolerancia horaria para la llegada (D-32), inmediatez (D-34), rol Administrador (D-05).

#### HU-17 — Consultar la agenda médica

**Como** Profesional, Recepcionista o Administrador, **quiero** ver la agenda de un profesional, **para** conocer los horarios libres y los turnos asignados.

**Relación:** CU-04 · RFB-53 a RFB-56 · Front-End: `agenda.html` y `agenda.js` (grilla LIBRE / OCUPADO de un día).

- **CA-17.1** Dados un profesional (o especialidad) y una fecha, cuando consulta un Administrador o Recepcionista, entonces recibe la grilla cronológica con los horarios libres y los turnos asignados con paciente y estado.
- **CA-17.2** Dado un Profesional, entonces recibe solo su propia agenda.
- **CA-17.3** Dado un período sin horarios de atención, entonces se informa *"No se registran horarios de atención para el período seleccionado"*.
- **CA-17.4** Dado un profesional sin agenda activa, entonces se advierte y no se entrega grilla horaria.
- **CA-17.5** Dado un turno cancelado, entonces su horario se muestra como libre.
- **Pendiente:** períodos diario, semanal o mensual (D-38), cambio desde la grilla fija del Front-End (D-24).

#### HU-18 — Ver el panel principal

**Como** usuario autenticado, **quiero** ver indicadores y próximos turnos, **para** tener un resumen de la actividad.

**Relación:** mapa del sitio, mockup del panel · RFB-57, RFB-58 · Front-End: `dashboard.html` y `dashboard.js`.

- **CA-18.1** Dado un usuario autenticado, cuando abre el panel, entonces recibe los indicadores (total de turnos, confirmados y cancelados) coherentes con los listados de turnos.
- **CA-18.2** Dados los próximos turnos, entonces excluyen los cancelados y se ordenan cronológicamente, con la misma cantidad que hoy muestra el Front-End (5).
- **CA-18.3** Dado que no hay turnos, entonces los indicadores valen cero y la lista indica que no hay turnos.
- **Pendiente:** período de los indicadores, definición de "próximo", alcance por rol e indicadores adicionales (D-39).

### Épica E — Integración y entrega

#### HU-19 — Integrar el Front-End con el Back-End

**Como** equipo de desarrollo, **quiero** que el Front-End del TP2 use el Back-End en lugar de los datos simulados, **para** completar la integración exigida.

**Relación:** Consigna BE (integración) · RFB-62, RNFB-13 · Front-End: reemplazo de la persistencia simulada.

- **CA-19.1** Dada cada pantalla del TP2 (Home, Login, Pacientes, Turno, Agenda y Dashboard), entonces lee y guarda datos solo a través del Back-End.
- **CA-19.2** Dados los flujos actuales (alta de paciente, solicitud y cancelación de turno, agenda LIBRE u OCUPADO, notificaciones flotantes), entonces se mantienen.
- **CA-19.3** Dado un dato creado desde el Front-End, cuando se recarga la página o se reinicia el sistema, entonces el dato persiste.
- **CA-19.4** Dado un error del Back-End (validación, no autenticado, no autorizado o conflicto de horario), entonces el Front-End lo comunica con un mensaje claro.
- **CA-19.5** Dada una sesión no válida, entonces el Front-End redirige al inicio de sesión.
- **Pendiente:** pantallas inexistentes en el Front-End (D-42).

#### HU-20 — Instalar el sistema y cargar los datos iniciales

**Como** integrante o evaluador, **quiero** instalar y ejecutar el sistema desde el material entregado, **para** verificar el trabajo.

**Relación:** Consigna BE (entrega) · RNFB-15, RNFB-16.

- **CA-20.1** Dado el archivo comprimido entregado, entonces contiene código fuente, base de datos exportada, scripts de creación y manual de instalación.
- **CA-20.2** Dado el manual, cuando una persona que no participó del desarrollo lo sigue paso a paso, entonces logra poner en marcha el sistema e ingresar con un usuario Administrador inicial.
- **CA-20.3** Dados los scripts, cuando se crea la base de datos, entonces respeta el modelo del TP1 (entidades, atributos, relaciones y estados permitidos del turno), con las ampliaciones que se aprueben (D-44).
- **Pendiente:** contenido de los datos iniciales y credenciales del Administrador inicial (D-43).

---

## 7. Dudas y puntos a definir

**Prioridad:** **Alta** = bloquea la especificación o el diseño. **Media** = afecta reglas de negocio o criterios de aceptación. **Baja** = detalle que se puede resolver durante el desarrollo.

La columna **Respuesta** queda vacía para completarla con el grupo o con el profesor.

### A. Roles y permisos

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-01 | TP1 §I.5 (actor Paciente) y CU-01 | El Paciente figura como actor que "solicita modificar o cancela el turno", pero su alta la hace personal autorizado y los roles con acceso son tres. ¿El paciente accede al sistema con usuario propio? Si es así, existe un cuarto rol y hacen falta historias de autogestión. | Alta | No, no existe un cuarto rol, el paciente solo es aministrado/consultado por el personal |
| D-02 | RF-03 ("usuarios asignados"), CU-02, mapa del sitio y CU-04 | La gestión de pacientes figura solo para Administrador y Recepción, pero la agenda del Profesional muestra datos del paciente. ¿El Profesional puede consultar pacientes? ¿Qué datos ve? | Media | El profesional solo ve los turnos que tiene asignados, y en esos turnos aparece la info del paciente, pero no puede consultar más información que la que aparece en sus turnos |
| D-03 | RF-11 (recepcionista o médico) y CU-06 (solo Recepcionista) | ¿Quién puede cambiar cada estado? ¿El Administrador también? ¿El Profesional puede marcar Asistido o Ausente? | Alta | Los turnos pueden ser creados solamente por la recepció. Tanto la recepción como los profesionales pueden cambiar los estados de los turnos |
| D-04 | RF-09 y RF-10 ("el usuario podrá…") | ¿Qué roles pueden modificar y cancelar un turno? ¿El Profesional puede cancelar los suyos? | Media | Solo los recepcionistas pueden cancelar un turno en el día a día (el profesional debe hacer un aviso formal que está fuera de este proyecto) |
| D-05 | CU-02 y CU-03 (Administrador incluido) vs CU-06 (solo Recepcionista); campo `rol` del modelo | ¿Cada usuario tiene un único rol? ¿El Administrador hereda todo lo que hace Recepción, incluido registrar llegada? | Media | El rol de administrador puede hacer todo, está pensado solo para resolver problemas técnicos o auditoría, no para ser usado en el día a día. Cada usuario puede tener un solo rol |
| D-06 | TP1 §VIII.2 (Usuario–Profesional 1:0..1) y RF-05 | ¿Al crear un profesional se crea su usuario automáticamente? ¿Un usuario con rol Profesional puede existir sin registro de profesional? ¿Qué vería en ese caso? | Media | Los usuarios se crean y se le asigna un rol. En caso de crear un profesional, para terminar de crear ese usuario debe pedir explícitamente rellenar la información necesaria |
| D-07 | Mapa del sitio (especialidades y profesionales solo para Administrador) vs CU-03 (paso 3) y CU-04 (paso 2) | Recepción necesita elegir especialidad y profesional al asignar turnos, y el Profesional consulta agendas. ¿Pueden **leer** esos catálogos aunque no los administren? | Alta | Los administradores crea las especialidades, los recepcionistas pueden verlas pero no gestionarlas, solo elegirlas para crear turnos, los profesionales solo pueden ver sus turnos y su información |

### B. Autenticación y usuarios

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-08 | CU-01; credencial de prueba del Front-End (`1234`) | ¿Hay política de contraseñas (largo mínimo, complejidad)? | Media | Mínimo 8 caracteres, mayúscula, minúscula y caracter especial |
| D-09 | CU-01 (paso 6, "sesión única de trabajo") | ¿Cuánto dura la sesión? ¿Vence por inactividad? ¿Se permiten sesiones simultáneas del mismo usuario? ¿Qué pasa con las sesiones abiertas de un usuario desactivado? | Media | No hay duración, se termina cuando se cierra la pestaña o se cierra sesión. No hay sesiones simultaneas. Se cierran todas las sesiones de los usuarios desactivados |
| D-10 | RF-02 (solo crear, consultar, modificar y desactivar) | ¿Quién define la contraseña inicial? ¿Puede el usuario cambiar la suya? ¿El Administrador puede restablecerla? El TP1 no lo contempla. | Alta | La contraseña inicial se genera automáticamente (debe imprimirse por pantalla y por consola para el prototipo). El usuario puede cambiar su contraseña pero no hay envío de correos o procesos extra. El administrador puede cambiar la contraseña de otros usuarios pero no se contempla el envío de correos |
| D-11 | CU-01 (5a) | ¿Se bloquea la cuenta o se limita el acceso tras intentos fallidos repetidos? | Baja | No |
| D-12 | CU-01 (precondición 2, HTTPS) | ¿HTTPS es obligatorio en el entorno de la entrega o solo en un entorno de producción? | Media | No es una aplicación real, es un TP, todo se va a hacer en un entorno local y con http |
| D-13 | RF-02 | ¿Puede un Administrador desactivarse a sí mismo o desactivar al último Administrador activo? | Baja | No y no, los administradores solo pueden gestionar usuarios de menor nivel. Los usuarios de administradores se manejan a través de la BD a mano |

### C. Bajas, eliminación y dependencias

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-14 | Consigna BE ("eliminación de registros") vs TP1 (RF-02 y RF-03 hablan de "desactivar") | ¿La baja es siempre lógica (se conserva el registro) o alguna entidad admite eliminación física? Para los turnos, ¿"eliminar" equivale a cancelar? | Alta | Toda elminiación o baja es lógica, nada se elimina realmente |
| D-15 | RF-03, RF-04 y RF-05 | Al desactivar, ¿qué ocurre con las dependencias? Especialidad con profesionales activos, profesional con turnos futuros, paciente con turnos futuros: ¿se bloquea la baja, se cancelan los turnos o se permite sin más? | Alta | al desactivar, se debe asegurar que no existan dependencias de eso que se desactiva (ej: si se desactiva un profesional, primero debería desactivarse a mano cada turno en caso de que hayan y el consultorio y horario del mismo). El sistema debe mostrar una notificación de por qué no es posible desactivar algo |
| D-16 | Restricciones únicas del modelo (DNI, correo, matrícula, consultorio) | ¿Existe la reactivación de registros desactivados, y quién la hace? ¿El DNI, la matrícula, el correo o el consultorio de un registro desactivado siguen ocupados o se liberan? | Media | Las acivaciones y desactivaciones solo las hacen los administradores. Los datos personales siguen ocupados, pero los concultorios y turnos se liberan antes de la desactivación del profesional |

### D. Datos de las entidades

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-17 | CU-02 (paso 3, teléfono y correo requeridos) vs modelo (ambos NULLABLE) | ¿Teléfono y correo del paciente son obligatorios u opcionales? El Front-End valida el formato del correo. | Alta | El correo es requerido, el teléfono es opcional |
| D-18 | Modelo (DNI hasta 15 caracteres, matrícula, teléfono, consultorio de 20 caracteres) | ¿Qué formato debe cumplir cada uno? ¿DNI solo numérico y con qué largo (¿extranjeros?)? ¿Teléfono? ¿Matrícula? ¿El consultorio es texto libre y se distingue "1" de "Consultorio 1" o mayúsculas de minúsculas? | Media | El DNI es solo numérico y nacional. El teléfono debe ser solo numérico y tomar como máximo 12 números para dar espacio a carácterísticas locales y demás (todo en un solo campo). La matrícula es un número de 5 cifras sin más. COnsultorio es un campo de texto único que no distingue mayúsculas de minúsculas ni espacios (Consultorio 1 === consultorio1) |
| D-19 | Modelo (`fecha_nacimiento`, `obra_social`) vs Front-End (sin esos campos) | ¿Se incorporan al formulario del Front-End? ¿La obra social es texto libre o un catálogo? ¿Se valida que la fecha de nacimiento no sea futura? | Media | Si se incorporan. La OS es texto libre, la fecha debe tener validaciones para fecha futura y anterior a 1900 (no creo que exista una persona de 126 años)|
| D-20 | TP1 (profesionales de la salud, profesional médico) vs consigna BE ("médicos") | ¿"Profesional" y "médico" son el mismo concepto? ¿Se contemplan profesionales no médicos (por ejemplo psicólogos o kinesiólogos)? ¿La matrícula aplica a todos? | Baja | Son la misma entidad, pero en el sistema se llaman Profesionales |

### E. Disponibilidad y asignación

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-21 | RF-07 (incluye duración del turno) vs CU-05 (solo días, inicio y fin) | ¿La duración se define en esta pantalla? ¿Se admiten varias franjas el mismo día (mañana y tarde)? ¿La duración es por franja o por profesional? | Alta | La duración es por defecto de 30 minutos y no se puede modificar. La franja horaria se define al momento de crear el usuario del profesional con los días y horarios para cada uno (puede ir de 8 de la mañana hasta las  21 horas, con saltos de media hora entre uno y otro.) |
| D-22 | CU-05 (paso 7, "conflictos con otras agendas") | Con consultorio fijo y único por profesional, ¿qué es un conflicto? ¿Solo la superposición de franjas del propio profesional, o también choques con turnos ya asignados? | Alta | No debería existir conflicto ya que el consultorio no se comparte (es un texto plano único, atributo de la propia entidad profesional), y no debería dejar asignar varios turnos en el mismo horario ya que cuando se utiliza un horario este desaparece de la selección disponible |
| D-23 | CU-05 y RF-07 | Si se modifica la disponibilidad y ya hay turnos futuros que quedan fuera o con otra duración, ¿se bloquea el cambio, se conservan los turnos, se cancelan o se reprograman? | Alta | Se debe bloquear la modificación hasta que los turnos se cancelen o se reprogramen a mano |
| D-24 | `GUIA.md` (agenda con una lista de horarios del sistema) vs TP1 (horarios por profesional) | Con el Back-End la oferta de horarios saldrá solo de la disponibilidad configurada. ¿Se confirma? ¿Hay horarios por defecto en los datos de demostración? | Media | La disponibilidad se configura en el propio profesional, con un rango entre las 8hs y las 21hs. No existen horarios por defecto, deben configurarse siempre |
| D-25 | No definido en TP1 | ¿Se contemplan feriados, licencias o días bloqueados de un profesional? ¿O quedan fuera de alcance? | Baja | Todo fuera de alcance|
| D-26 | RF-08 y CU-03 | ¿Se puede asignar un turno en una fecha u hora ya pasada? ¿Hay anticipación mínima o un horizonte máximo de reserva? | Media | No se pueden asignar turnos para fechas y horas pasadas. No existe un tiempo de anticipación |
| D-27 | RF-08 (evita solo la superposición del profesional) | ¿Se permite que un mismo paciente tenga dos turnos activos a la misma hora con profesionales distintos? ¿Hay límite de turnos por día o por especialidad? | Media | Un paciente solo puede tener un turno en un horario. No hay límites de turnos de ningún tipo|

### F. Turnos y estados

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-28 | CU-03 (paso 8, "Pendiente / Confirmado") | ¿Cuál es el estado inicial de un turno nuevo? ¿Depende de algo? ¿Qué significa "confirmar" y quién lo hace? | Alta | El estado inicial de un turno es "Pendiente" y se espera una confirmación por parte del paciente (un proceso en la vida real, como una llamada o un mail que está fuera del alcance). El recepcionista confirma el turno cuando el paciente le avisa. En el caso de que el paciente se acerque de forma presencial, el turno se crea y se confirma al toque por el recepcionista |
| D-29 | RF-11 (seis estados, sin reglas de cambio) | ¿Qué transiciones están permitidas? Por ejemplo: ¿se puede reabrir un Cancelado?, ¿pasar de Pendiente a Asistido?, ¿volver de Asistido a En Consultorio? | Alta | El ciclo de estados es el siguiente siempre: PENDIENTE, CONFIRMADO, EN_CONSULTORIO, ASISTIDO/AUSENTE/CANCELADO. No se puede volver para atrás ni obviar un estado anterior. No se puede reabrir un turno cancelado pero ese horario y profesional se libera |
| D-30 | RF-11 y CU-06 (5b) | ¿Ausente se marca manualmente o por vencimiento del horario? ¿Lo hace Recepción, el Profesional o el sistema? | Media | El estado "Ausente" se marca a mano por recepcionista o profesional, y se marca automáticamente cuando pasó exactamente media hora desde el inicio del turno y no se cambió a algún otro estado en este tiempo |
| D-31 | CU-06 (paso 9, "el actor o el sistema permite actualizar a Asistido") | ¿Quién cierra la atención y marca Asistido? ¿Qué significa exactamente ese estado: fin de la consulta o simple presencia? | Media | El estado "Asistido" representa el fin de la consulta. La presencia se marca con "En Consultorio" |
| D-32 | CU-06 (precondición 3 y paso 5) | ¿Se puede registrar la llegada de un turno Pendiente o solo de uno Confirmado? ¿Hay tolerancia horaria (llegada muy anticipada o muy tardía)? | Media | Solamente se pueden registrar llegadas de turnos confirmados. No hay ningún tipo de tolerancia, el turno comienza y termina en esa media hora específica |
| D-33 | RF-09 | ¿Qué campos de un turno son modificables (paciente, profesional, fecha, hora, motivo, observaciones)? ¿Qué estados impiden modificarlo (Asistido, Ausente, Cancelado)? | Media | Se puede modificar el profesional, la fecha y la hora si no está ocupado para el nuevo momento solicitado. El motivo se puede modificar antes de que inicie, las observaciones solo durante la consulta. El estado Asistido o Cancelado no permiten cambiar la información del turno |
| D-34 | RF-11 ("en tiempo real") y CU-06 (paso 8, "notificando visualmente al médico") | ¿El panel del profesional debe actualizarse solo, sin recargar, o alcanza con que vea el cambio al consultar o recargar? ¿Qué demora es aceptable? | Alta | Debe recargar la pagina para que se actualice. No hay inconvenientes con la demora. |
| D-35 | CU-03 (paso 9, "comprobante/mensaje de confirmación") | ¿Es solo un mensaje en pantalla o un comprobante imprimible o descargable? ¿Se notifica al paciente por correo o SMS? ¿O queda fuera de alcance? | Media | Queda fuera de alcance, es solo un mensajito en pantalla |
| D-36 | RF-10 y modelo (sin campo de motivo de cancelación) | ¿La cancelación requiere motivo? ¿Se registra quién y cuándo canceló? | Media | No requiere motivo, solo se registra usuario que canceló y cuándo |

### G. Consultas, agenda y panel

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-37 | RF-12 ("datos relevantes y filtros") | ¿Qué filtros y búsquedas lleva cada listado? ¿La coincidencia es parcial o exacta, y distingue mayúsculas y acentos? ¿Los listados incluyen registros inactivos por defecto? ¿Se requiere paginación y ordenamiento? | Media | Los **Pacientes** se filtra por: DNI	Nombre	Teléfono	Correo	Estado. Los **turnos** se filtran por: Fecha	Hora	Paciente	Profesional	Estado. Los **Usuarios** se filtran por: Nombre Apellido Correo Rol Estado. Las **Especialidades** se filtran por: Nombre Estado.|
| D-38 | CU-04 (diaria, semanal o mensual), mockup (diaria o semanal) y Front-End (solo diaria) | ¿Qué períodos debe soportar el Back-End? | Media | mensual |
| D-39 | Mapa del sitio, mockup ("actividad del día") y `dashboard.js` | ¿Sobre qué período se calculan los indicadores (hoy, mes, histórico)? ¿"Próximos" son los futuros desde el momento actual? El Front-End hoy toma los primeros 5 no cancelados sin distinguir pasados. ¿El panel cambia según el rol? ¿Se agregan indicadores (asistidos, ausentes)? | Media | Se toman todos los turnos desde la fecha actual hasta 30 días después. No se ven turnos pasados. El panel para los recepcionistas muestra todos los turnos independientemente del estado, en los profesionales solo muestra sus turnos independientemente del estado |
| D-40 | CU-06 (5c) y "próximos turnos" | ¿La referencia de "día actual" y "ahora" es la hora local de Argentina? | Baja | si |

### H. Trazabilidad, integración y entrega

| ID | Surge en | Duda | Prioridad | Respuesta |
| :--- | :--- | :--- | :---: | :--- |
| D-41 | TP1 §I.1 y §I.2 (trazabilidad) vs modelo (sin entidad de auditoría) | El problema y el objetivo hablan de trazabilidad, pero el modelo solo guarda la fecha de creación y la de llegada del turno. ¿Se requiere registrar quién y cuándo creó, modificó, canceló o cambió el estado? ¿Se necesita un historial consultable? | Alta | hay que registrar todo, acciones, creciones, modificaciones y eliminaciones. La consultoría es solamente para administradores a través de la BD |
| D-42 | Consigna BE ("integrar completamente") vs Front-End (sin pantallas de usuarios, profesionales, especialidades, configuración de agenda, modificación de turno ni cambio de estados) | ¿La integración completa incluye construir esas pantallas, o alcanza con que los servicios existan y funcionen? | Alta | Las pantallas ya están construídas, deben implementarse los servicios,  vinvularse con las pantallas y modificarlas en caso de ser necesario (este archivo solo contempla el desarrollo del backend, la modificación y vinculación viene después)|
| D-43 | Datos simulados del Front-End y `README.txt` (usuario de prueba) | ¿Se migran los datos simulados actuales como datos iniciales? ¿La base se entrega vacía con un Administrador o con datos de demostración? ¿Se conservan las credenciales de prueba actuales? | Media | Todos los datos actuales se conservan |
| D-44 | Consigna BE (base exportada y scripts) y modelo del TP1 | ¿La cátedra impone restricciones sobre la base de datos entregada (tipo de motor o formato del script)? ¿Se pueden ampliar el modelo del TP1 con elementos necesarios (por ejemplo, para sesiones o auditoría) o debe implementarse tal cual? | Alta | Se puede y se debe ampliar. No hay restricciones sobre las BDs |
| D-45 | RNF-02 ("cargas normales") y RNF-03 (98 %) | ¿Qué volumen de usuarios y datos es una "carga normal"? ¿Cómo se verificará la disponibilidad del 98 % en un contexto académico? ¿Es exigible o referencial? | Baja | Es solo referencial, es un sistema de juguete para aprobar la materia |****