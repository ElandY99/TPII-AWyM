Arquitectura (la que pide la consigna)
backend/
├── server.js                 # arranque
├── src/
│   ├── core/                 # router, http helpers, cookies, errores
│   ├── config/               # puerto, secreto, ruta de la BD
│   ├── db/                   # conexión, schema.sql, seed.sql
│   ├── middleware/           # auth, roles, validate
│   ├── routes/               # PRESENTACIÓN: URL -> controller
│   ├── controllers/          # lee request, llama al service, arma respuesta
│   ├── services/             # LÓGICA DE NEGOCIO (solapamientos, estados)
│   ├── repositories/         # ACCESO A DATOS: solo SQL parametrizado
│   └── schemas/              # Zod por entidad
└── public/                   # el front del TP2, servido por el mismo server

Servir el front desde el mismo servidor evita problemas de CORS y cookies.

Decisiones técnicas clave
Sesiones: cookie HttpOnly + SameSite=Lax con un Session ID aleatorio guardado en una tabla sesion en SQLite. Es lo que describe tu CU-01 (paso 6) y encaja con “gestión de sesiones”. Evitá JWT: es más complejo y no aporta nada acá.
Contraseñas: crypto.scrypt con salt, que ya viene con Node. No hace falta bcrypt, y cumple el RNF-06.
Doble reserva: el control de solapamiento va en el service dentro de una transacción. Como better-sqlite3 es síncrono, no hay carrera posible. Además, un índice único parcial como red de seguridad:
sql
  CREATE UNIQUE INDEX ux_turno_slot
    ON turno(id_profesional, fecha, hora) WHERE estado <> 'CANCELADO';

Sin el WHERE, un turno cancelado bloquearía ese horario para siempre.

DELETE: para pacientes, profesionales, especialidades y usuarios, hacelo como baja lógica (estado = 0), coherente con tu TP1. Para turnos, la cancelación es un cambio de estado. Aclaralo en el manual, porque la consigna dice “eliminación”.
Errores: un formato único, por ejemplo { "error": "mensaje", "campos": { "dni": "ya existe" } }, con códigos 400, 401, 403, 404 y 409.
Tabla extra: agregá sesion al modelo del TP1 y avisá que es una ampliación.
Endpoints mínimos
Módulo	Rutas	Roles
Auth	POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me	todos
Pacientes	GET/POST /api/pacientes, GET/PUT/DELETE /api/pacientes/:id	admin, recepción
Profesionales	ídem /api/profesionales	admin (lectura: todos)
Especialidades	ídem /api/especialidades	admin (lectura: todos)
Usuarios	ídem /api/usuarios	admin
Disponibilidad	GET/PUT /api/profesionales/:id/disponibilidad	admin
Turnos	GET/POST /api/turnos, PUT /api/turnos/:id, PATCH /api/turnos/:id/estado, DELETE /api/turnos/:id	admin, recepción; el profesional solo ve los suyos
Agenda	GET /api/agenda?profesional=&fecha= (horarios libres/ocupados)	según rol
Dashboard	GET /api/dashboard	autenticados
Orden de trabajo sugerido
BD: schema.sql + seed.sql con el admin y datos de prueba.
Núcleo: router, conexión, manejo de errores y el flujo completo de login + sesión + roles.
Un CRUD completo de punta a punta (especialidades). Es el molde que copian los demás.
Pacientes, profesionales y usuarios, copiando ese molde.
Turnos y agenda, que es la parte difícil: generar los slots a partir de la disponibilidad, validar solapamiento y manejar las transiciones de estado.
Integración: reemplazar AppData del front por un api.js con fetch. Conviene hacerlo módulo por módulo, no todo al final.