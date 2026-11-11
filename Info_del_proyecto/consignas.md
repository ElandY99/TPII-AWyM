# TP 4

## 1. CONSIGNAS
Continuando con el proyecto integrador de la asignatura, cada grupo deberá desarrollar
una versión del Sistema de Gestión de Turnos Médicos adaptada a dispositivos móviles,
utilizando las tecnologías y herramientas de desarrollo que considere apropiadas.

### La solución podrá implementarse mediante alguna de las siguientes alternativas:
• Aplicación web móvil: interfaz adaptada a teléfonos inteligentes y tablets, accesible
desde el navegador.
• Aplicación móvil: solución desarrollada mediante un framework o tecnología específica para dispositivos móviles.
• Progressive Web Application (PWA), siempre que se justifique la tecnología seleccionada y se cumplan los requerimientos funcionales.

En cualquiera de las alternativas, la solución deberá integrarse con el Back-End y los
Servicios REST desarrollados en el Trabajo Práctico N.º 3, permitiendo acceder a
información del sistema desde un dispositivo móvil.

### La solución deberá contemplar, como mínimo, las siguientes funcionalidades:
• Inicio de sesión del paciente, utilizando el servicio de autenticación disponible en el
TP3.
• Visualización de especialidades y profesionales.
• Consulta de turnos disponibles.
• Solicitud de turnos médicos.
• Visualización de la confirmación de la operación realizada.

No se requiere desarrollar nuevamente el Back-End, modificar el sistema web existente
ni reconstruir la Base de Datos. Se deberán reutilizar los servicios y recursos
implementados previamente.

## 2. ASPECTOS A CONSIDERAR
Durante el desarrollo del proyecto deberán contemplarse, como mínimo, los siguientes
aspectos:

### Desarrollo móvil
• Diseño de interfaces adaptadas a teléfonos inteligentes y tablets.
• Navegación clara e intuitiva entre las pantallas.
• Organización básica del proyecto y reutilización de componentes cuando
corresponda.
• Justificación de la tecnología seleccionada: web móvil, PWA o aplicación móvil.
Integración con Back-End
• Consumo de al menos dos Servicios REST desarrollados en el TP3.
• Intercambio de información mediante JSON.
• Visualización de los datos recibidos desde el servidor.
• Utilización del servicio de autenticación, si se encuentra implementado y disponible
en el TP3.

### Funcionamiento
• Validación de los datos ingresados por el usuario.
• Manejo de respuestas y errores de comunicación.
• Presentación de mensajes de confirmación o información al usuario.
• No se exige implementar funcionamiento sin conexión (Offline), persistencia local ni
sincronización en segundo plano.

# Segundo Parcial

## CONSIGNAS
Desarrollo de una funcionalidad para la consulta y solicitud de turnos médicos.
Un centro médico desea mejorar su sistema de gestión de turnos, incorporando una
funcionalidad que permita a los pacientes consultar los turnos disponibles de los
profesionales y solicitar una nueva cita.
La solución deberá contemplar el procesamiento de información del lado del servidor, el
acceso a una base de datos y la utilización de servicios web REST para intercambiar
información con una interfaz adaptada a dispositivos móviles.
La interfaz podrá implementarse como una aplicación web responsive, una Progressive
Web App (PWA) o una aplicación móvil desarrollada mediante un framework. En todos
los casos deberá poder utilizarse desde un dispositivo móvil.
Se deberá desarrollar una solución funcional que permita consultar la disponibilidad de
turnos y registrar una solicitud, contemplando las validaciones necesarias y la
comunicación entre el Front-End y el Back-End.

## REQUERIMIENTOS
### A. Gestión de turnos y acceso a datos
La aplicación deberá utilizar una base de datos para consultar y registrar la
información relacionada con los turnos médicos. Como mínimo, deberá contemplar:
▪ Identificación del profesional y su especialidad.
▪ Consulta de los turnos disponibles de un profesional.
▪ Registro de una solicitud de turno asociada a un paciente.
▪ Verificación de la disponibilidad antes de registrar la solicitud.

### B. Desarrollo de servicios web REST
Se deberán implementar servicios REST que permitan realizar las operaciones principales de la funcionalidad. Como mínimo:
▪ GET: consultar los turnos disponibles de un profesional.
▪ POST: registrar una solicitud de turno.
▪ GET: consultar los turnos solicitados por un paciente.
▪ Los servicios deberán intercambiar información utilizando el formato JSON.

### C. Procesamiento y validaciones del lado del servidor
El Back-End deberá procesar las solicitudes recibidas y realizar las validaciones
necesarias. Como mínimo, se deberá:
▪ Verificar que los datos obligatorios estén completos.
▪ Comprobar que el turno seleccionado exista y se encuentre disponible.
▪ Evitar que se registre más de una solicitud para el mismo turno.
▪ Devolver respuestas adecuadas ante operaciones exitosas o situaciones de error.

### D. Seguridad y organización del código
La solución deberá contemplar buenas prácticas básicas de desarrollo del lado del
servidor:
▪ Utilizar consultas parametrizadas para el acceso a la base de datos.
▪ Separar la lógica de procesamiento de los servicios REST.
▪ Organizar adecuadamente los archivos de conexión, configuración y servicios.

### E. Interfaz adaptada a dispositivos móviles
Se deberá desarrollar o adaptar una interfaz que permita al paciente realizar las
operaciones solicitadas desde un dispositivo móvil. La interfaz deberá permitir, como
mínimo:
▪ Seleccionar una especialidad o profesional.
▪ Visualizar los turnos disponibles.
▪ Seleccionar un turno para solicitarlo.
▪ Visualizar la confirmación de la solicitud.

Se podrá utilizar una aplicación web responsive, una PWA o una aplicación móvil
desarrollada mediante un framework. No se requiere compilar la aplicación ni generar
archivos APK o IPA.

### F. Integración con servicios REST
La interfaz deberá comunicarse con los servicios REST desarrollados en el Back-End.
Como mínimo:
▪ Consumir el servicio de consulta de turnos disponibles.
▪ Enviar la solicitud de turno mediante el servicio correspondiente.
▪ Procesar las respuestas JSON recibidas desde el servidor.
▪ Actualizar la interfaz de acuerdo con el resultado de cada operación.

### G. Experiencia de usuario y manejo de errores
La interfaz deberá informar claramente el resultado de las operaciones:
▪ Mostrar un mensaje de confirmación cuando se registre correctamente una
solicitud.
▪ Informar cuando no existan turnos disponibles.
▪ Comunicar los errores de validación o procesamiento.
▪ Mantener una navegación sencilla y adecuada para dispositivos móviles.

### H. Buenas prácticas
Se deberá mantener una organización clara del proyecto, diferenciando los
componentes del Front-End, los servicios del Back-End y el acceso a los datos. Se
valorará la reutilización de código y la claridad de la implementación.