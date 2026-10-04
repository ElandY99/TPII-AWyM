TRABAJO PRÁCTICO 2 - SALUD TURNOS
=================================

Materia: Aplicaciones Web y Móvil
Proyecto: Sistema de Gestión de Turnos Médicos


TECNOLOGÍAS
-----------
- HTML5
- CSS3
- JavaScript
- localStorage para datos simulados
- sessionStorage para simular una sesión iniciada

No utiliza frameworks, backend ni base de datos real.

PANTALLAS INCLUIDAS
-------------------
1. index.html       -> Página principal (Home)
2. login.html       -> Inicio de sesión
3. dashboard.html   -> Panel principal
4. pacientes.html   -> Registro y consulta de pacientes
5. turno.html       -> Solicitud y listado de turnos
6. agenda.html      -> Agenda médica

ARCHIVOS JAVASCRIPT
-------------------
js/data.js
  Contiene datos simulados y las funciones para leer/escribir localStorage.

js/common.js
  Controla el acceso a las pantallas privadas, el cierre de sesión y funciones
  auxiliares compartidas.

js/login.js
  Valida correo y contraseña y genera la sesión simulada.

js/dashboard.js
  Calcula indicadores y genera la tabla de próximos turnos.

js/pacientes.js
  Realiza alta, validación, búsqueda y visualización de pacientes.

js/turnos.js
  Gestiona selección de paciente, especialidad, profesional, disponibilidad,
  validación, alta y cancelación de turnos.

js/agenda.js
  Muestra horarios libres y ocupados según fecha y profesional.

HOJA DE ESTILOS
---------------
css/styles.css
  Contiene todo el diseño visual, Flexbox, CSS Grid, formularios, tablas,
  estados y Media Queries para el diseño responsive.

DATOS DE PRUEBA
---------------
Usuario: admin@saludturnos.com
Contraseña: 1234

EJECUCIÓN
---------
1. Descomprimir la carpeta.
2. Abrir index.html en un navegador moderno.
3. Presionar "Iniciar sesión".
4. Ingresar las credenciales de prueba.


