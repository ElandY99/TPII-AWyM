# Trabajo Práctico I
 
## Diseño del Sistema de Gestión de Turnos (Unidad I)
 
---
 
**Carrera:** Licenciatura en Gestión de Recursos Tecnológicos
 
**Materia:** Aplicaciones Web y Mòvil \- 2026
 
**Profesor:** Rodoni, Lucas
 
**Integrantes:**
 
* Elpeza, Andrés \- 600213  
* Benitez, José \- 600199  
* Susñar, Daniel: 600081
# **I. Descripción del sistema**
 
El presente desarrollo web centraliza la asignación y el seguimiento de turnos entre pacientes y profesionales de la salud. El mismo permitirá registrar usuarios, pacientes, profesionales y especialidades. Se propone: 
 
* Disponibilidad de la atención  
* Consultar horarios libres  
* Crear, modificar y cancelar turnos  
* Autenticar usuarios
## **I.1. Problema identificado**
 
Cuando la asignación de turnos se gestiona en base a una agenda manual o planillas, resulta difícil de administrar la atención al paciente, saber turnos libres en forma rápida y efectiva, evitar solapar turnos y obtener información confiable sobre la actividad diaria. Esta forma de administrar es propensa a cometer errores y carece de trazabilidad. 
 
## **I.2. Objetivo general**
 
Diseñar un sistema web específico que administre de forma centralizada, segura y trazable los turnos médicos, relacionando pacientes, profesionales, especialidades y disponibilidades, e identificando el consultorio fijo asignado a cada profesional.
 
## **I.3. Objetivos específicos**
 
Registrar y mantener actualizados los datos de pacientes, profesionales y especialidades, incluyendo el consultorio asignado a cada profesional
 
## **I.4. Alcance**
 
La solución contempla: ABM de pacientes de profesionales y especialidades incluyendo la asignación del consultorio correspondiente al profesional. 
 
## **I.5. Actores involucrados**
 
1. Administrador: Gestiona los usuarios y la configuración general.  
2. Recepcionista: Registra pacientes, administra turnos y consulta agenda.   
3. Profesional médico: Consulta su agenda y estado de turnos asignados.   
4. Paciente: Es la persona a que se asigna, solicita modificar o cancela el turno. Su alta al sistema lo realiza personal autorizado.
# **II. Requerimientos del sistema**
 
## **II.1. Requerimientos funcionales**
 
* **RF-01 Autenticar usuarios:** El sistema deberá validar el correo y contraseña y habilitar el acceso a funciones de acuerdo al rol asignado.   
* **RF-02 Gestionar Usuarios:** El administrador podrá crear, consultar, modificar y desactivar usuarios del sistema.   
* **RF-03 Gestionar pacientes:** Los usuarios asignados podrán registrar, consultar, modificar y desactivar pacientes validando que el DNI no se repita.   
* **RF-04 Administrar especialidades:** El administrador podrá gestionar las especialidades registradas en el sistema.   
* **RF-05 Administrar profesionales:** El administrador podrá registrar profesionales y asociarlos con una especialidad validando a través de su matricula.   
* **RF-06 Consultar disponibilidad:** El sistema debe mostrar horarios libres filtrados por fecha, profesional o especialidad.   
* **RF-07 Configurar Agenda del Profesional:** El sistema deberá permitir definir para cada profesional sus días de atención, franjas horarias y duración de los turnos. El consultorio será obtenido automáticamente de los datos registrados para el profesional.  
* **RF-08 Asignar turno:** El usuario autorizado podrá seleccionar paciente y asignar turno disponible evitando superposición.  
* **RF-09 Modificación de turno:** El usuario podrá modificar el turno validando nuevamente la disponibilidad.   
* **RF-10 Cancelar turno:** El usuario podrá cancelar el turno asignado.  
* **RF-11 Gestión de Estados de Turno:** El sistema deberá permitir al recepcionista o médico actualizar el estado del turno en tiempo real ("Pendiente", "Confirmado", "En Consultorio", "Asistido", "Ausente", "Cancelado").  
* **RF-12 Buscar y filtrar:** Los listados admitirán búsqueda por datos relevantes y filtros.  
* **RF-13 Asignar consultorio al profesional:** El administrador podrá registrar y modificar el consultorio fijo de cada profesional. El sistema deberá validar que el valor no se encuentre asignado a otro profesional. 
## **II.2. Requerimientos no funcionales**
 
* **RNF-01 Usabilidad:** La aplicación utilizará mensajes claros, validación de campos y confirmación cuando se realicen operaciones críticas.   
* **RNF-02 Consultas:** Las consultas en cargas normales de trabajo no deberán exceder los 5 segundos.  
* **RNF-03 Disponibilidad:** La aplicación deberá permanecer disponible en un promedio de 98% del tiempo mensual.  
* **RNF-04 Integridad:** La base de datos aplicará claves y evitará duplicar turnos.  
* **RNF-05 Portabilidad y Diseño Responsivo (Mobile-First):** La interfaz web del cliente deberá ser responsiva, adaptándose dinámicamente a pantallas de dispositivos móviles (smartphones y tablets) y ordenadores de escritorio, garantizando una correcta experiencia de usuario (UI/UX),  
* **RNF-06 Encriptación de Datos Sensibles:** Las contraseñas deberán almacenarse en la base de datos utilizando un algoritmo de hash seguro y unidireccional, protegiendo la información de accesos no autorizados.
# **III. Casos de uso**
 
## **III.1. Iniciar Sesión**
 
| CU-01 INICIAR SESIÓN |  |
| ----- | :---- |
| **Actor principal** | Administrador, Recepcionista, Profesional. |
| **Objetivo** | Autenticarse en el sistema mediante credenciales de acceso para ingresar al panel principal de acuerdo con los permisos asignados a su rol. |
| **Precondiciones** | 1\. El usuario debe encontrarse registrado en la base de datos. 2\. El sistema y el servidor de base de datos deben estar operativos y comunicados a través de HTTPS. |
| **Flujo Principal** | 1\. El actor accede a la pantalla de **Inicio de Sesión**. 2\. El actor ingresa su correo electrónico y su contraseña. 3\. El actor presiona el botón **Iniciar Sesión**. 4\. El sistema valida del lado del cliente que los campos requeridos no se encuentren vacíos y posean un formato básico válido. 5\. El servidor recibe las credenciales, verifica la autenticidad de la información y constata que el usuario se encuentre con estado activo en la base de datos. 6\. El servidor crea una sesión única de trabajo, le asigna un identificador (Session ID) y asocia los permisos correspondientes al perfil del usuario. 7\. El sistema redirige al actor al **Panel Principal** (Dashboard) habilitando únicamente las funcionalidades autorizadas para su rol. |
| **Flujos alternativos** | **4a. Campos incompletos o vacíos:** 1\. El sistema no envía la solicitud al servidor y resalta los campos que requieren atención. 2\. El sistema muestra un mensaje informativo: *"Debe completar todos los campos obligatorios"*. 3\. El actor ingresa los valores faltantes y continúa en el paso 3\. **5a. Credenciales inválidas o usuario inexistente:** 1\. El servidor constata que los datos de acceso no coinciden con un registro válido. 2\. El sistema mantiene al usuario en la pantalla de inicio de sesión y despliega una alerta de seguridad genérica: *"Usuario o contraseña incorrectos"* (impidiendo identificar si el fallo proviene del correo o de la clave). 3\. El sistema limpia el campo de contraseña y permite un nuevo intento de autenticación. **5b. Cuenta inactiva o deshabilitada:** 1\. El servidor identifica que las credenciales son válidas, pero la cuenta registra una baja lógica o suspensión. 2\. El sistema deniega el acceso y muestra el mensaje: *"Acceso denegado. Comuníquese con el administrador del sistema"*. 3\. El sistema finaliza el flujo sin crear sesión activa. |
| **Resultado esperado** | El actor accede satisfactoriamente al panel principal con la sesión creada y las opciones operativas delimitadas de acuerdo a sus privilegios de acceso. |
 
## **III.2. Registrar Paciente**
 
| CU-02 REGISTRAR PACIENTE |  |
| ----- | :---- |
| **Actor principal** | Administrador, Recepcionista. |
| **Objetivo** | Dar de alta a un paciente en el sistema para posibilitar la asignación de turnos médicos. |
| **Precondiciones** | 1\. El actor ha iniciado sesión con credenciales válidas y rol autorizado. 2\. El sistema tiene conexión activa con la base de datos. |
| **Flujo Principal** | 1\. El actor accede al módulo **Gestión de Pacientes**. 2\. El actor presiona el botón **Nuevo Paciente**. 3\. El sistema presenta el formulario de alta solicitando los datos requeridos (DNI, Nombre, Apellido, Teléfono y Correo). 4\. El actor completa la información y presiona **Guardar**. 5\. El sistema valida el formato de los datos ingresados y comprueba que el DNI no exista en la base de datos. 6\. El sistema registra al paciente en la base de datos con estado activo. 7\. El sistema muestra un mensaje de confirmación y redirige al listado actualizado de pacientes. |
| **Flujos alternativos** | **5a. Campos obligatorios incompletos o formato inválido:** 1\. El sistema no guarda la información y resalta en el formulario los campos con error o incompletos. 2\. El actor corrige los valores y vuelve al paso 4\. **5b. DNI duplicado:** 1\. El sistema detecta que el documento ya pertenece a un paciente registrado. 2\. El sistema muestra una alerta: *"El DNI ingresado ya se encuentra registrado en el sistema"* y mantiene los datos en pantalla para su revisión. **Cancelación de la operación:** 1\. En cualquier momento previo a confirmar, el actor presiona **Cancelar**. 2\. El sistema descarta los cambios y regresa al listado de pacientes sin persistir datos. |
| **Resultado Esperado** | El paciente queda registrado correctamente en el sistema, activo y habilitado para que se le asignen turnos médicos. |
 
## **III.3. Asignar Turno Médico**
 
| CU-03 ASIGNAR TURNO MÉDICO |  |
| ----- | :---- |
| **Actor principal** | Administrador, Recepcionista. |
| **Objetivo** | Reservar un horario de atención médica para un paciente con un profesional en una fecha y hora determinadas. |
| **Precondiciones** | 1\. El actor inició sesión con permisos de gestión de turnos. 2\. El paciente se encuentra registrado y activo. 3\. El profesional médico y la especialidad están activos y cuentan con disponibilidad de agenda configurada. |
| **Flujo Principal** | 1\. El actor ingresa a **Gestión de Turnos** y selecciona **Nuevo Turno**. 2\. El actor busca y selecciona al paciente mediante su DNI o apellido. 3\. El actor selecciona la especialidad médica y el profesional. 4\. El sistema consulta la agenda del profesional y presenta en pantalla los días y franjas horarias disponibles. 5\. El actor selecciona una fecha y horario libre. 6\. El actor presiona el botón **Confirmar Turno**. 7\. El sistema verifica a nivel de persistencia que no exista solapamiento o concurrencia sobre ese horario. 8\. El sistema almacena el turno con estado *Pendiente* / *Confirmado* y bloquea el horario en la agenda. 9\. El sistema emite un comprobante/mensaje de confirmación de la reserva. |
| **Flujos alternativos** | **2a. Paciente no registrado:** 1\. El sistema informa que no se hallaron resultados para la búsqueda. 2\. El actor puede cancelar la operación o invocar el caso de uso **CU-02 (Registrar Paciente)**. **4a. Sin disponibilidad horaria:** 1\. El sistema informa que el profesional no posee turnos libres en el rango seleccionado. 2\. El actor puede modificar los filtros de fecha o elegir otro profesional de la misma especialidad (vuelve al paso 3). **7a. Conflicto de concurrencia (Horario tomado simultáneamente):** 1\. El sistema detecta que el intervalo dejó de estar disponible antes de guardar. 2\. El sistema cancela la grabación, emite una advertencia de turno no disponible y recarga la grilla de disponibilidad (vuelve al paso 4). |
| **Resultado esperado** | El turno queda guardado en la base de datos, vinculado al paciente y al médico, impidiendo cualquier doble asignación sobre ese mismo intervalo horario. |
 
## **III.4. Consultar Agenda Médica**
 
| CU-04 CONSULTAR AGENDA MÉDICA |  |
| ----- | :---- |
| **Actor principal** | Profesional médico, Recepcionista, Administrador. |
| **Objetivo** | Visualizar y filtrar el cronograma de turnos programados y la disponibilidad horaria en un período determinado. |
| **Precondiciones** | 1\. El usuario se encuentra autenticado en el sistema. 2\. Existen profesionales y agendas registradas en la base de datos. |
| **Flujo Principal** | 1\. El actor ingresa a la sección **Agenda Médica**. 2\. El sistema determina el rol del actor: si es *Profesional*, bloquea la vista a su propia agenda; si es *Administrador* o *Recepcionista*, habilita la selección de cualquier profesional o especialidad. 3\. El actor selecciona el período temporal (vista diaria, semanal o mensual) y la fecha de referencia. 4\. El sistema recupera de la base de datos las franjas horarias y turnos programados para el criterio elegido. 5\. El sistema presenta la grilla cronológica diferenciando visualmente los horarios libres de los turnos asignados (con datos del paciente y estado del turno). 6\. El actor selecciona un turno específico para consultar sus datos en detalle. |
| **Flujos alternativos** | **4a. Período sin actividad o sin agenda configurada:** 1\. El sistema detecta que no hay franjas de atención definidas para las fechas seleccionadas. 2\. El sistema muestra un mensaje informativo: *"No se registran horarios de atención para el período seleccionado"*, manteniendo la interfaz disponible para cambiar el filtro. **2a. Profesional sin agenda activa:** 1\. Si el profesional consultado no posee días/horarios asignados, el sistema advierte de la situación y no despliega grilla horaria. |
| **Resultado esperado** | El actor visualiza la planificación de atención médica de forma cronológica, ordenada y restringida estrictamente a los permisos de su rol. |
 
## **III.5. Configurar Agenda y Disponibilidad Médica**
 
| CU-05 CONFIGURAR AGENDA Y DISPONIBILIDAD MÉDICA |  |
| ----- | :---- |
| **Actor principal** | Administrador. |
| **Objetivo** | Definir los días, horarios y duración de la atención de un profesional, estableciendo su disponibilidad para la asignación de turnos médicos. |
| **Precondiciones** | 1\. El actor ha iniciado sesión con credenciales válidas y posee permisos de administración 2\. El profesional médico se encuentra registrado y activo en el sistema. 3\. El sistema tiene conexión activa con la base de datos. |
| **Flujo Principal** | 1\. El actor ingresa a la sección **Agenda Médica** o **Configuración de Agendas**. 2\. El actor selecciona al profesional médico cuya agenda desea configurar. 3\. El sistema muestra la configuración actual de la agenda y las opciones de disponibilidad. 4\. El actor selecciona los días de atención, horario de inicio y finalización. 5\. El actor presiona el botón **Guardar Configuración**. 6\. El sistema valida que los datos ingresados sean correctos y que los horarios configurados sean válidos. 7\. El sistema verifica que no existan conflictos con otras agendas o asignaciones previamente registradas. 8\. El sistema registra o actualiza la configuración de disponibilidad en la base de datos. 9\. El sistema muestra un mensaje de confirmación y actualiza la agenda del profesional. |
| **Flujos alternativos** | **6a. Datos incompletos o inválidos:** 1\. El sistema detecta que faltan datos obligatorios o que los horarios ingresados no son válidos. 2\. El sistema resalta los campos correspondientes y muestra un mensaje informativo. 3\. El actor corrige los datos y vuelve al paso 5\. **7a. Conflicto de horario:** 1\. El sistema detecta que el profesional ya posee una asignación incompatible para el período seleccionado. 2\. El sistema informa el conflicto y no guarda la configuración. 3\. El actor modifica los horarios, días y vuelve al paso 4\. **Cancelación de la operación:** 1\. Antes de confirmar, el actor presiona **Cancelar**. 2\. El sistema descarta los cambios y regresa a la pantalla anterior sin modificar la agenda existente. |
| **Resultado esperado** | La agenda del profesional queda configurada correctamente con sus días, horarios de atención, generando disponibilidad para la asignación de nuevos turnos. |
 
## **III.6. Registrar Asistencia del Paciente**
 
| CU-06 REGISTRAR ASISTENCIA DEL PACIENTE |  |
| ----- | :---- |
| **Actor principal** | Recepcionista. |
| **Objetivo** | Cambiar el estado de un turno a **En Consultorio** o **Asistido** cuando el paciente se presenta en la recepción física, notificando visualmente al médico en su panel. |
| **Precondiciones** | 1\. El actor ha iniciado sesión con credenciales válidas y posee permisos de recepción. 2\. El paciente posee un turno registrado para la fecha correspondiente. 3\. El turno se encuentra en un estado que permita registrar la llegada del paciente. 4\. El sistema tiene conexión activa con la base de datos. |
| **Flujo Principal** | 1\. El actor ingresa a la sección **Gestión de Turnos** o a la agenda del día. 2\. El actor busca el turno correspondiente mediante los datos del paciente, fecha o profesional. 3\. El sistema muestra la información del turno y su estado actual. 4\. El actor selecciona la opción **Registrar Llegada**. 5\. El sistema verifica que el turno corresponda al día actual y que permita registrar la asistencia. 6\. El sistema actualiza el estado del turno a **En Consultorio**. 7\. El sistema registra la fecha y hora de la llegada del paciente. 8\. El sistema actualiza la información disponible en el panel del profesional para indicar que el paciente se encuentra presente. 9\. Una vez finalizada la atención, el actor o el sistema permite actualizar el estado del turno a **Asistido**. |
| **Flujos alternativos** | **5a. Turno inexistente:** 1\. El sistema no encuentra un turno asociado a los criterios de búsqueda. 2\. El sistema muestra un mensaje informativo y permite realizar una nueva búsqueda. **5b. Turno en estado no válido:** 1\. El sistema detecta que el turno se encuentra cancelado, ausente o en un estado que no permite registrar la llegada. 2\. El sistema informa que la asistencia no puede registrarse y mantiene el estado actual del turno. **5c. Turno correspondiente a otra fecha:** 1\. El sistema verifica que la fecha del turno no coincide con la fecha actual. 2\. El sistema informa que la llegada no puede registrarse para esa fecha y no modifica el turno. **Error de actualización:** 1\. Si ocurre un error al guardar el cambio de estado, el sistema informa que la operación no pudo completarse. 2\. El estado del turno permanece sin modificaciones y el actor puede volver a intentar la operación. |
| **Resultado esperado** | El turno queda actualizado con el estado correspondiente a la llegada o atención del paciente, registrando la hora de asistencia y reflejando visualmente dicha situación en el panel del profesional. |
 
# **IV. Diseño de la Arquitectura Cliente–Servidor**
 
La propuesta utiliza una arquitectura cliente-servidor con separación entre presentación, lógica de negocio y persistencia. Los clientes no acceden directamente a la base de datos. Puesto que envían solicitudes https al servidor web, que deriva a la aplicación; esta valida permisos y reglas, consulta la base y devuelve respuestas. 
 
![][image1]
 
* **Cliente:** Dispositivo utilizado por el usuario: computadora, tablet o teléfono. Ejecuta las peticiones y presenta los resultados.   
* **Navegador:** Ejecuta la interfaz HTML, CSS y javascript; valida aspectos de la presentación y consume la API y adapta el diseño al tamaño de la pantalla.   
* **Servidor Web:** Recibe las conexiones entrantes HTTPS, entrega recursos y redirige a las solicitudes del negocio a la aplicación.   
* **Servidor de aplicaciones:** Autentica, autoriza, aplica reglas de turnos y disponibilidad, ejecuta operaciones y genera respuesta.   
* **Base de datos:** Se encarga de la persistencia de los usuarios, pacientes, profesionales, especialidades, disponibilidad, turnos, aplicando restricciones de integridad. 
# **V. Diagrama de navegación**
 
El recorrido de la aplicación comienza en un área pública y continúa, luego de la autenticación, en un panel privado. 
 
El menú se adapta al rol del usuario, por ejemplo: Un profesional consulta su agenda, mientras que un administrador puede acceder a usuarios y especialidades. 
 
![][image2]
 
**Criterio de navegación:** 
 
* Toda pantalla privada ofrece acceso al menú principal y al cierre de sesión de la aplicación.   
* Los formularios regresan al listado correspondiente después de guardar o cancelar.   
* Las operaciones de modificación se inician desde el listado, agenda o detalle del registro.
# **VI. Mapa del sitio**
 
**![][image3]**
 
| Inicio | Presentación e inicio de sesión | Público |
| ----- | ----- | ----- |
| Panel principal | Indicadores y próximos turnos. | Todos los roles autenticados |
| Pacientes | Listado, búsqueda, alta, detalle y modificación. | Administrador / Recepción |
| Turnos | Listado, filtros, alta, modificación, cancelación y detalle. | Administrador / Recepción |
| Agenda médica | Vista diaria/semanal y detalle autorizado. | Todos, según alcance del rol |
| Usuarios, profesionales, especialidades | Usuarios, especialidades, profesionales. | Administrador |
 
# **VII. Mockups**
 
**![][image4]**
 
**Pantalla de inicio:** Presenta el sistema y realiza un llamado a la acción, evitando funciones privadas antes de autenticar.
 
**![][image5]**
 
**Inicio de sesión:** Solicita correo y contraseña, informa errores generales de acceso y no expone datos sensibles.
 
**![][image6]**
 
**Panel principal:** Resume la actividad del día y permite llegar rápidamente a las funciones habituales.
 
**![][image7]**
 
**Gestión de pacientes:** Combina búsqueda, listado y acción de alta. La edición parte de cada fila.
 
**![][image8]**
 
**Gestión de turnos:** Expone filtros y estados, la acción Nuevo conduce al formulario con verificación de disponibilidad.
 
**![][image9]**
 
**Agenda médica:** Ordena horarios cronológicamente y diferencia intervalos ocupados y libres.
 
**![][image10]**
 
**Formulario de Alta/modificación de turnos:** Agrupa datos en orden: paciente, profesional/especialidad, fecha y hora; Guardar se habilita tras las validaciones.
 
# **VIII. Diseño de la Base de Datos**
 
El modelo de base de datos propuesto organiza la información para administrar usuarios, pacientes, profesionales, especialidades, disponibilidades y turnos. No se incorpora una entidad Consultorio, debido a que cada espacio de atención se considera asignado de manera fija al profesional. Por lo tanto, la ocupación se determina mediante la agenda del médico y la combinación profesional, fecha y hora.
 
## **VIII.1. Entidades y atributos**
 
| Entidad | Atributos |
| :---- | :---- |
| **Usuario** (Control de accesos y seguridad) | id\_usuario PK INT nombre VARCHAR(50) NOT NULL apellido VARCHAR(50) NOT NULL correo VARCHAR(100) UNIQUE NOT NULL clave\_hash VARCHAR(255) NOT NULL rol VARCHAR(20) NOT NULL estado BOOLEAN NOT NULL |
| **Paciente** (Datos de las personas que asisten) | id\_paciente PK INT dni VARCHAR(15) UNIQUE NOT NULL nombre VARCHAR(50) NOT NULL apellido VARCHAR(50) NOT NULL telefono VARCHAR(20) NULLABLE correo VARCHAR(100) NULLABLE fecha\_nacimiento DATE NULLABLE obra\_social VARCHAR NULLABLE estado BOOLEAN NOT NULL |
| **Especialidad** (Áreas médicas de atención)  | id\_especialidad PK INT nombre VARCHAR(80) UNIQUE NOT NULL descripcion VARCHAR(255) NULLABLE estado BOOLEAN NOT NULL |
| **Profesional** (Datos del cuerpo médico) | id\_profesional PK INT id\_especialidad FK INT id\_usuario FK INT UNIQUE NULLABLE matricula VARCHAR(30) UNIQUE NOT NULL nombre VARCHAR(50) NOT NULL apellido VARCHAR(50) NOT NULL consultorio VARCHAR(20) UNIQUE NOT NULL estado BOOLEAN NOT NULL |
| **Disponibilidad** (La agenda configurada de los médicos) | id\_disponibilidad PK INT id\_profesional FK INT dia\_semana VARCHAR(15) NOT NULL hora\_inicio TIME NOT NULL hora\_fin TIME NOT NULL duracion\_min INT NOT NULL estado BOOLEAN NOT NULL |
| **Turno** (La reserva concreta efectuada) | id\_turno PK INT id\_paciente FK INT id\_profesional FK INT fecha DATE NOT NULL hora TIME NOT NULL estado VARCHAR(20) NOT NULL motivo\_consulta VARCHAR(255) NULLABLE observaciones VARCHAR(500) NULLABLE fecha\_creacion DATETIME NOT NULL fecha\_hora\_llegada DATETIME NULLABLE |
 
**Estados permitidos del turno:** PENDIENTE, CONFIRMADO, EN\_CONSULTORIO, ASISTIDO, AUSENTE y CANCELADO
 
## **VIII.2. Relaciones y cardinalidades**
 
| Relación | Relación | Interpretación |
| ----- | :---: | ----- |
| Usuario \- Profesional | 1 : 0..1 | Un usuario puede vincularse opcionalmente con un profesional. Cada profesional puede tener una única cuenta. |
| Especialidad/Profesional | 1 : N | Una especialidad agrupa varios profesionales; cada profesional pertenece a una especialidad. |
| Profesional/Disponibilidad | 1 : N | Un profesional puede definir varias franjas horarias. |
| Paciente/Turno | 1 : N | Un paciente puede registrar varios turnos. |
| Profesional/Turno | 1 : N | Un profesional puede atender numerosos turnos. |
 
## **VIII.3. Diagrama de entidad-relación**
 
**![][image11]**