# **Trabajo Práctico II**

## *Sistema de Gestión de Turnos Médicos*

**Lic. En Gestión de Recursos Tecnológicos \- 2026**

**Materia: Aplicaciones Web y Móvil**

**Profesor: ING. Lucas M. Rodoni**

| Integrantes | Andrés Elpeza (600213) José Benitez (600199) Daniel Susñar (600081) |
| :---- | :---- |
| **Tecnologías** | HTML5, CSS3 y JavaScript |
| **Etapa** | Implementación del Front-End |

El presente documento resume la solución implementada, la organización del código fuente y la participación de los integrantes del grupo. El desarrollo continúa el diseño definido en el Trabajo Práctico 1 y se limita a la implementación del Front-End solicitada para esta etapa.

*Para correr el proyecto es necesario un servidor local, como la extensión live-server de VS Code, o ejecutar el comando npx hhtp-server en la carpeta del proyecto.*

# **1\. Descripción general de la solución desarrollada**

La solución desarrollada corresponde al Front-End de un Sistema de Gestión de Turnos Médicos orientado a facilitar el registro de pacientes, la consulta de agendas y la solicitud y administración de turnos. La aplicación fue construida con HTML5, CSS3 y JavaScript, manteniendo una estructura simple sin incorporar frameworks, backend ni una base de datos real.

La interfaz se organiza en seis pantallas principales: Página Principal (Home), Inicio de Sesión (Login), Registro y Gestión de Pacientes, Agenda de Turnos, Formulario de Solicitud de Turno y Panel Principal (Dashboard). La navegación permite recorrer estas pantallas de manera funcional y mantiene separada el área pública de las vistas privadas del sistema.

Para representar el comportamiento de una aplicación real, JavaScript se utiliza para validar formularios, reaccionar a eventos del usuario, actualizar dinámicamente elementos del DOM, buscar y filtrar información, mostrar horarios disponibles y evitar la superposición de turnos. Los datos se gestionan de forma simulada mediante estructuras en JavaScript y localStorage; sessionStorage se utiliza para representar una sesión iniciada durante la demostración.

El diseño visual se concentra en una única hoja de estilos y aplica Flexbox, CSS Grid y Media Queries para adaptar la interfaz a computadoras, tablets y teléfonos móviles. De este modo, la implementación busca cumplir con los criterios de usabilidad, organización, accesibilidad básica y diseño responsive establecidos para la actividad.

**Principales funcionalidades implementadas:**

* Inicio de sesión simulado con validación de credenciales.  
* Registro, validación, búsqueda y visualización de pacientes.  
* Selección de paciente, especialidad, profesional, fecha y horario para solicitar un turno.  
* Control de disponibilidad para impedir la asignación de un mismo horario ocupado.  
* Visualización de turnos y posibilidad de cancelarlos.  
* Agenda con diferenciación de horarios libres y ocupados.  
* Dashboard con indicadores y próximos turnos calculados a partir de los datos simulados.  
* Diseño responsive para diferentes tamaños de pantalla.

# **2\. Estructura del proyecto**

El proyecto se organizó separando la estructura HTML, la presentación CSS, la lógica JavaScript y los datos simulados. Esta distribución facilita la lectura del código, su mantenimiento y la identificación de responsabilidades de cada archivo.

TurnoMed\_TP2/  
├── index.html  
├── login.html  
├── dashboard.html  
├── pacientes.html  
├── turno.html  
├── agenda.html  
├── css/  
│   └── styles.css  
├── js/  
│   ├── data.js  
│   ├── common.js  
│   ├── login.js  
│   ├── dashboard.js  
│   ├── pacientes.js  
│   ├── turnos.js  
│   └── agenda.js  
├── data/  
     └── datos.json

# **3\. Archivos del proyecto**

| Archivo / carpeta | Función dentro del proyecto |
| :---- | :---- |
| **index.html** | Página principal y acceso inicial al sistema. |
| **login.html** | Formulario de autenticación del usuario. |
| **dashboard.html** | Panel principal con indicadores y próximos turnos. |
| **pacientes.html** | Registro, búsqueda y listado de pacientes. |
| **turno.html** | Solicitud, visualización y administración de turnos. |
| **agenda.html** | Consulta de la agenda médica y disponibilidad horaria. |
| **css/styles.css** | Estilos generales, Flexbox, CSS Grid, formularios, tablas, estados y diseño responsive. |
| **js/data.js** | Datos simulados y funciones de lectura/escritura mediante localStorage. |
| **js/common.js** | Funciones compartidas, control de acceso y cierre de sesión. |
| **js/login.js** | Validación del login y creación de la sesión simulada. |
| **js/dashboard.js** | Cálculo dinámico de indicadores y próximos turnos. |
| **js/pacientes.js** | Alta, validación, búsqueda y renderizado de pacientes. |
| **js/turnos.js** | Lógica de turnos: selección, disponibilidad, validación, alta y cancelación. |
| **js/agenda.js** | Generación de la agenda con horarios libres y ocupados. |
| **data/datos.json** | Archivo de ejemplo con datos de prueba simulados. |

# **4. Distribución de tareas realizadas por cada integrante**

El desarrollo se realizó de manera colaborativa. Las áreas indicadas a continuación representan la participación predominante de cada integrante y no responsabilidades exclusivas, ya que las decisiones de diseño, integración, revisión y prueba del proyecto fueron compartidas por el grupo.

| Integrante | Área de mayor participación | Tareas principales |
| :---- | :---- | :---- |
| **Andrés Elpeza** | Programación Front-End (HTML, CSS y JavaScript) | Tuvo mayor participación en la implementación funcional del proyecto. Al ser el programador más experimentado del grupo trabajó principalmente en la programación de las interfaces HTML, los estilos CSS y la lógica JavaScript, incluyendo navegación, validaciones, interacción con el DOM, gestión de datos simulados y comportamiento dinámico de las pantallas. |
| **José Benitez** | Estructura y diseño de interfaces (HTML y CSS) | Participó principalmente en la construcción y organización de las pantallas HTML y en la definición y ajuste de los estilos CSS. Colaboró en la presentación visual interfaces y adaptación responsive del diseño. |
| **Daniel Susñar** | Estructura de páginas (HTML) | Participó principalmente en el desarrollo y revisión de la estructura HTML de las distintas pantallas. |

Además de las tareas predominantes señaladas, los tres integrantes participaron en la revisión general de las pantallas, las pruebas de navegación y la verificación del cumplimiento de la consigna.

# **5\. Conclusión**

El resultado obtenido es un prototipo Front-End funcional del Sistema de Gestión de Turnos Médicos, desarrollado con tecnologías web fundamentales y con una organización modular que facilita su comprensión. 