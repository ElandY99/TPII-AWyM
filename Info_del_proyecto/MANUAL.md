# Manual de Instalación, Configuración y Uso del Back-End

## Sistema de Gestión de Turnos Médicos — Salud Turnos (TP3)

**Materia:** Aplicaciones Web y Móvil (2026)  
**Integrantes:** Andrés Elpeza (600213) · José Benitez (600199) · Daniel Susñar (600081)  
**Profesor:** ING. Lucas M. Rodoni  

---

## 1. Requisitos Previos

- **Node.js**: Versión 20.x o superior (probado en Node v20+ con soporte nativo de ESM y `node:test`).
- **Gestor de paquetes**: `pnpm` (recomendado) o `npm`.
- **Sistema Operativo**: Windows, Linux o macOS.

---

## 2. Instalación y Puesta en Marcha

1. **Clonar o descomprimir** el proyecto en un directorio local.
2. Abrir una terminal en la raíz del proyecto y ejecutar la instalación de dependencias:
   ```bash
   pnpm install
   # o en su defecto: npm install
   ```
3. **Crear e inicializar la base de datos** con el esquema y los datos iniciales (seed):
   ```bash
   pnpm db:reset
   ```
   *Esto generará automáticamente el archivo SQLite en `backend/data/salud_turnos.db`.*
4. **Iniciar el servidor de desarrollo / ejecución**:
   ```bash
   pnpm start
   # o para modo recarga en caliente:
   pnpm dev
   ```
   *El servidor quedará escuchando en `http://localhost:3000`.*
5. Acceder a `http://localhost:3000` desde el navegador para visualizar la interfaz web del sistema (servida estáticamente desde el mismo origen para evitar problemas de CORS y cookies).

---

## 3. Credenciales de Demostración Iniciales

Las contraseñas cumplen de forma estricta la política de seguridad (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un carácter especial):

| Rol | Correo Electrónico | Contraseña | Perfil / Uso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@saludturnos.com` | `SaludTurnos#2026` | Superusuario (gestión de usuarios, especialidades, profesionales). |
| **Recepcionista** | `recepcion@saludturnos.com` | `Recepcion#2026` | Operador diario (gestión de pacientes, asignación y cancelación de turnos). |
| **Profesional** | `laura.gomez@saludturnos.com` | `LauraGomez#2026` | Dra. Laura Gómez (Clínica médica, Consultorio 101). |
| **Profesional** | `martin.perez@saludturnos.com` | `MartinPerez#2026` | Dr. Martín Pérez (Pediatría, Consultorio 102). |
| **Profesional** | `carla.nunez@saludturnos.com` | `CarlaNunez#2026` | Dra. Carla Núñez (Cardiología, Consultorio 103). |

---

## 4. Ampliaciones del Modelo de Datos (respecto al TP1)

Conforme a lo acordado y a las consignas del Trabajo Práctico:
1. **Tabla `sesion`**: Almacena el identificador único (hash SHA-256) del token de sesión para autenticación mediante cookie `HttpOnly`. Garantiza la regla de **sesión única por usuario** (cerrando sesiones simultáneas previas en caso de nuevo inicio).
2. **Tabla `auditoria`**: Registra la trazabilidad obligatoria de acciones (`CREAR`, `MODIFICAR`, `DESACTIVAR`, `CAMBIAR_ESTADO`, `LOGIN`, etc.), asociando el usuario interviniente y los estados previos/posteriores en formato JSON sanitizado (sin claves ni datos sensibles).
3. **Atributo `consultorio` en `profesional`**: Se configuró como `NULLABLE` para permitir liberar el consultorio antes de realizar la baja lógica del profesional (garantizando consistencia con la regla de no permitir consultorios ocupados en profesionales inactivos).
4. **Columna `consultorio_clave` con índice parcial único**: Garantiza que dos profesionales activos no compartan el mismo consultorio ignorando mayúsculas, tildes y espacios (`Consultorio 101` ≡ `consultorio 101`).
5. **Índices únicos parciales de Turnos**:
   - `ux_turno_slot_profesional`: Impide a nivel de base de datos que un profesional reciba dos turnos no cancelados en la misma fecha y hora.
   - `ux_turno_slot_paciente`: Impide a nivel de base de datos que un paciente reserve dos turnos en la misma fecha y hora.
6. **Campos adicionales en `turno`**: `creado_por`, `cancelado_por` y `fecha_cancelacion`.

---

## 5. Reglas de Negocio Implementadas

- **Baja Lógica**: Todas las eliminaciones (`DELETE`) corresponden a bajas lógicas (`estado = 0`), preservando la integridad referencial y el historial. Para los turnos, eliminar equivale a cancelar (`estado = 'CANCELADO'`).
- **Desactivación protegida**: Se bloquea la baja de especialidades con profesionales activos, profesionales con turnos futuros o consultorio sin liberar, y pacientes con turnos futuros asignados.
- **Máquina de Estados de Turno**:
  `PENDIENTE` $\rightarrow$ `CONFIRMADO` $\rightarrow$ `EN_CONSULTORIO` $\rightarrow$ `ASISTIDO`
  - Cancelación permitida únicamente desde `PENDIENTE` o `CONFIRMADO` (solo por Recepcionista o Administrador).
  - Llegada del paciente (`EN_CONSULTORIO`): solo aplicable a turnos confirmados del día actual durante la franja horaria del turno.
  - Pase automático a `AUSENTE`: turnos que luego de 30 minutos desde su horario de inicio no registraron cambio de estado son marcados automáticamente como ausentes.
- **Auditoría**: Todas las operaciones críticas quedan registradas en la tabla `auditoria`.

---

## 6. Ejecución de la Suite de Pruebas

Para ejecutar las pruebas automatizadas de integración construidas sobre `node:test`:
```bash
pnpm test
```
Esto correrá las suites de pruebas para:
- Núcleo criptográfico, fechas y normalización de textos.
- Autenticación, cookies y control de sesiones.
- CRUD de Especialidades y control de acceso.
- Gestión integral de Usuarios, Profesionales y Disponibilidad.
- Gestión y búsqueda en tiempo real de Pacientes.
- Solicitud, validación de concurrencia y transiciones de Turnos.
- Consulta de Agenda médica y métricas de Dashboard.

---

## 7. Scripts Disponibles

- `pnpm start`: Inicia el servidor backend en el puerto configurado (3000).
- `pnpm dev`: Inicia el servidor con el flag `--watch` de Node.js para reinicio automático ante cambios.
- `pnpm db:reset`: Restablece la base de datos a su estado original de fábrica.
- `pnpm db:export`: Vuelca la base de datos completa con estructura y datos a `backend/src/db/export.sql`.
- `pnpm test`: Ejecuta los tests unitarios y de integración de punta a punta.
