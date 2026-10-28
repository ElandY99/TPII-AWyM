-- =====================================================================
-- Esquema de Base de Datos - Sistema Salud Turnos (TP1 + Ampliaciones TP3)
-- Motor: SQLite (better-sqlite3)
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla de Usuarios (Administración y control de acceso)
CREATE TABLE IF NOT EXISTS usuario (
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

-- 2. Tabla de Sesiones (Ampliación TP3: gestión de sesiones sin JWT, una sola sesión activa)
CREATE TABLE IF NOT EXISTS sesion (
  id_sesion TEXT PRIMARY KEY, -- SHA-256 del token aleatorio en cookie
  id_usuario INTEGER NOT NULL,
  fecha_creacion TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  ultima_actividad TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT uq_sesion_usuario UNIQUE (id_usuario) -- Previene sesiones simultáneas por usuario
);

-- 3. Tabla de Especialidades Médicas
CREATE TABLE IF NOT EXISTS especialidad (
  id_especialidad INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL COLLATE NOCASE,
  descripcion TEXT,
  estado INTEGER NOT NULL DEFAULT 1 CHECK(estado IN (0, 1)),
  CONSTRAINT uq_especialidad_nombre UNIQUE (nombre)
);

-- 4. Tabla de Profesionales Médicos
-- Nota TP3: consultorio pasa a ser NULLABLE para poder liberarlo antes de la baja lógica (Q10).
-- consultorio_clave almacena el consultorio sin espacios ni tildes en minúsculas para unicidad exacta.
CREATE TABLE IF NOT EXISTS profesional (
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

-- Índice único parcial para consultorio: dos profesionales no pueden tener el mismo consultorio
CREATE UNIQUE INDEX IF NOT EXISTS ux_profesional_consultorio_clave
  ON profesional(consultorio_clave) WHERE consultorio_clave IS NOT NULL AND estado = 1;

-- 5. Tabla de Disponibilidad (Agenda semanal por profesional)
CREATE TABLE IF NOT EXISTS disponibilidad (
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

-- 6. Tabla de Pacientes
CREATE TABLE IF NOT EXISTS paciente (
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

-- 7. Tabla de Turnos
CREATE TABLE IF NOT EXISTS turno (
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

-- Índices de seguridad para concurrencia e integridad (RNF-04 y D-27)
CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_slot_profesional
  ON turno(id_profesional, fecha, hora) WHERE estado <> 'CANCELADO';

CREATE UNIQUE INDEX IF NOT EXISTS ux_turno_slot_paciente
  ON turno(id_paciente, fecha, hora) WHERE estado <> 'CANCELADO';

-- 8. Tabla de Auditoría (Ampliación TP3: trazabilidad obligatoria según D-41)
CREATE TABLE IF NOT EXISTS auditoria (
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

CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, id_entidad);
