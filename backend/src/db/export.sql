-- =====================================================================
-- EXPORTACIÓN COMPLETA DE BASE DE DATOS - SISTEMA SALUD TURNOS (TP3)
-- Generado automáticamente: 2026-10-27T17:54:15.869Z
-- =====================================================================

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
  id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL COLLATE NOCASE,
  clave_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'RECEPCIONISTA', 'PROFESIONAL')),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT uq_usuario_correo UNIQUE (correo)
);

DROP TABLE IF EXISTS sesion;
CREATE TABLE sesion (
  id_sesion TEXT PRIMARY KEY, -- SHA-256 del token aleatorio en cookie
  id_usuario INTEGER NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  ultima_actividad TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT uq_sesion_usuario UNIQUE (id_usuario) -- Previene sesiones simultáneas por usuario
);

DROP TABLE IF EXISTS especialidad;
CREATE TABLE especialidad (
  id_especialidad INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL COLLATE NOCASE,
  descripcion TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_especialidad_nombre UNIQUE (nombre)
);

DROP TABLE IF EXISTS profesional;
CREATE TABLE profesional (
  id_profesional INTEGER PRIMARY KEY AUTOINCREMENT,
  id_especialidad INTEGER NOT NULL,
  id_usuario INTEGER UNIQUE,
  matricula TEXT NOT NULL CHECK(length(matricula) = 5 AND matricula GLOB '[0-9][0-9][0-9][0-9][0-9]'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  consultorio TEXT,
  consultorio_clave TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_profesional_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad),
  CONSTRAINT fk_profesional_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT uq_profesional_matricula UNIQUE (matricula)
);

DROP TABLE IF EXISTS disponibilidad;
CREATE TABLE disponibilidad (
  id_disponibilidad INTEGER PRIMARY KEY AUTOINCREMENT,
  id_profesional INTEGER NOT NULL,
  dia_semana TEXT NOT NULL CHECK(dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
  hora_inicio TEXT NOT NULL CHECK(hora_inicio GLOB '[0-2][0-9]:[0-5][0-9]'),
  hora_fin TEXT NOT NULL CHECK(hora_fin GLOB '[0-2][0-9]:[0-5][0-9]'),
  duracion_min INTEGER NOT NULL DEFAULT 30 CHECK(duracion_min = 30),
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT fk_disponibilidad_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional) ON DELETE CASCADE,
  CONSTRAINT ck_disponibilidad_horario CHECK(hora_inicio < hora_fin)
);

DROP TABLE IF EXISTS paciente;
CREATE TABLE paciente (
  id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
  dni TEXT NOT NULL CHECK(length(dni) BETWEEN 7 AND 8 AND dni GLOB '[0-9]*'),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT CHECK(telefono IS NULL OR (length(telefono) <= 12 AND telefono GLOB '[0-9]*')),
  correo TEXT NOT NULL COLLATE NOCASE,
  fecha_nacimiento TEXT CHECK(fecha_nacimiento IS NULL OR (fecha_nacimiento GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]' AND fecha_nacimiento >= '1900-01-01')),
  obra_social TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_paciente_dni UNIQUE (dni)
);

DROP TABLE IF EXISTS turno;
CREATE TABLE turno (
  id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
  id_paciente INTEGER NOT NULL,
  id_profesional INTEGER NOT NULL,
  fecha TEXT NOT NULL CHECK(fecha GLOB '[1-2][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  hora TEXT NOT NULL CHECK(hora GLOB '[0-2][0-9]:[0-5][0-9]' AND (hora LIKE '%:00' OR hora LIKE '%:30')),
  estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_CONSULTORIO', 'ASISTIDO', 'AUSENTE', 'CANCELADO')),
  motivo_consulta TEXT,
  observaciones TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  fecha_hora_llegada TEXT,
  creado_por INTEGER,
  cancelado_por INTEGER,
  fecha_cancelacion TEXT,
  CONSTRAINT fk_turno_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
  CONSTRAINT fk_turno_profesional FOREIGN KEY (id_profesional) REFERENCES profesional(id_profesional),
  CONSTRAINT fk_turno_creador FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_turno_cancelador FOREIGN KEY (cancelado_por) REFERENCES usuario(id_usuario)
);

DROP TABLE IF EXISTS auditoria;
CREATE TABLE auditoria (
  id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER, -- NULL representa acciones del SISTEMA (ej: pase automático a AUSENTE)
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  id_entidad INTEGER,
  datos_antes TEXT, -- JSON
  datos_despues TEXT, -- JSON
  fecha TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE UNIQUE INDEX ux_profesional_consultorio_clave
  ON profesional(consultorio_clave) WHERE consultorio_clave IS NOT NULL AND estado = 1;
CREATE UNIQUE INDEX ux_turno_slot_profesional
  ON turno(id_profesional, fecha, hora) WHERE estado <> 'CANCELADO';
CREATE UNIQUE INDEX ux_turno_slot_paciente
  ON turno(id_paciente, fecha, hora) WHERE estado <> 'CANCELADO';
CREATE INDEX idx_auditoria_entidad ON auditoria(entidad, id_entidad);

-- Datos de usuario
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1, '2026-10-27 14:54:15');
INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado, fecha_creacion) VALUES (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1, '2026-10-27 14:54:15');

-- Datos de especialidad
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (1, 'Clínica médica', 'Atención integral del adulto y medicina clínica general', 1);
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (2, 'Pediatría', 'Atención médica integral a niños y adolescentes', 1);
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES (3, 'Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón y vasculares', 1);

-- Datos de profesional
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (1, 1, 3, '10001', 'Laura', 'Gómez', '101', '101', 1);
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (2, 2, 4, '10002', 'Martín', 'Pérez', '102', '102', 1);
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES (3, 3, 5, '10003', 'Carla', 'Núñez', '103', '103', 1);

-- Datos de disponibilidad
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (1, 1, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (2, 1, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (3, 1, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (4, 1, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (5, 1, 'VIERNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (6, 2, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (7, 2, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (8, 2, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (9, 2, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (10, 2, 'VIERNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (11, 3, 'LUNES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (12, 3, 'MARTES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (13, 3, 'MIERCOLES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (14, 3, 'JUEVES', '08:00', '12:00', 30, 1);
INSERT INTO disponibilidad (id_disponibilidad, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES (15, 3, 'VIERNES', '08:00', '12:00', 30, 1);

-- Datos de paciente
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (1, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1);
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES (2, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- Datos de turno
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', NULL, '2026-10-27 14:54:15', NULL, 1, NULL, NULL);
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, observaciones, fecha_creacion, fecha_hora_llegada, creado_por, cancelado_por, fecha_cancelacion) VALUES (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', NULL, '2026-10-27 14:54:15', NULL, 1, NULL, NULL);

-- Datos de auditoria
INSERT INTO auditoria (id_auditoria, id_usuario, accion, entidad, id_entidad, datos_antes, datos_despues, fecha) VALUES (1, 1, 'INICIALIZACION', 'SISTEMA', NULL, NULL, '{"mensaje": "Base de datos inicializada con datos semilla"}', '2026-10-27 14:54:15');

PRAGMA foreign_keys = ON;
