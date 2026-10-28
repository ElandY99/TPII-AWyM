-- =====================================================================
-- Datos Iniciales / Semilla - Sistema Salud Turnos
-- Incluye: datos del Front-End TP2 normalizados, profesionales con consultorio,
-- agendas de 08:00 a 12:00, usuario admin, recepcionista y profesionales vinculados.
-- =====================================================================

-- 1. Usuarios
-- Contraseñas según política (D-08):
-- admin: SaludTurnos#2026
-- recepcion: Recepcion#2026
-- laura: LauraGomez#2026
-- martin: MartinPerez#2026
-- carla: CarlaNunez#2026

INSERT INTO usuario (id_usuario, nombre, apellido, correo, clave_hash, rol, estado) VALUES
  (1, 'Administrador', 'General', 'admin@saludturnos.com', 'scrypt$16384$8$1$57ee8c0debed376a2304352910071d36$0754af89fa3c9651138dc193feaa07e76b42f4c521b1a5b1b62e5e5271514bd471994b7ea0ec07aa95db14aa6b341cd4dc67df9530cbff671ff23498d718b7bd', 'ADMINISTRADOR', 1),
  (2, 'María', 'Recepcionista', 'recepcion@saludturnos.com', 'scrypt$16384$8$1$e54cea18e350330cf62f879e8f1385d2$3cd3d578066f99d7100a7ec9da1e030796d4b2d45a7b4e2a65c5ae3293ea3bf6add7ffd3c6e8bfdf3d51dff43db6073db01777676e80c79f8528ebe408dda361', 'RECEPCIONISTA', 1),
  (3, 'Laura', 'Gómez', 'laura.gomez@saludturnos.com', 'scrypt$16384$8$1$8839b34222dbae7f5cc5e21ec4201b0e$73099685ae2390fbcc913a680ddff39142332a12318f7f8eff6fbb799859f086e129f2903bc8dfbd7dc8019b2ab9568177a3cf61d910e2b6583522aefe4cfe51', 'PROFESIONAL', 1),
  (4, 'Martín', 'Pérez', 'martin.perez@saludturnos.com', 'scrypt$16384$8$1$4297f15e54f0f32c6db56c73fe32dca1$616186c6032b9da9f1c643e7186da808dd1b057110b87d7f7a6b89048b28c2c48c8eaf23f71745653ce9693ef88331ee6b024b4655e7bd1a24561fa701d5c28b', 'PROFESIONAL', 1),
  (5, 'Carla', 'Núñez', 'carla.nunez@saludturnos.com', 'scrypt$16384$8$1$1abd1dd59b7c39901b8b866782bef84d$e932eb0c6c6eb736e345349dcf928eb2ecc63a70d18b5791119032f17f2276a47ceed40d6302f84715e9cf054b464d1b50f015fcd42ce686bbc07d52263bc135', 'PROFESIONAL', 1);

-- 2. Especialidades
INSERT INTO especialidad (id_especialidad, nombre, descripcion, estado) VALUES
  (1, 'Clínica médica', 'Atención integral del adulto y medicina clínica general', 1),
  (2, 'Pediatría', 'Atención médica integral a niños y adolescentes', 1),
  (3, 'Cardiología', 'Diagnóstico y tratamiento de enfermedades del corazón y vasculares', 1);

-- 3. Profesionales
INSERT INTO profesional (id_profesional, id_especialidad, id_usuario, matricula, nombre, apellido, consultorio, consultorio_clave, estado) VALUES
  (1, 1, 3, '10001', 'Laura', 'Gómez', '101', '101', 1),
  (2, 2, 4, '10002', 'Martín', 'Pérez', '102', '102', 1),
  (3, 3, 5, '10003', 'Carla', 'Núñez', '103', '103', 1);

-- 4. Disponibilidad (Lunes a Viernes de 08:00 a 12:00)
-- Profesional 1 (Laura Gómez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (1, 'LUNES', '08:00', '12:00', 30, 1),
  (1, 'MARTES', '08:00', '12:00', 30, 1),
  (1, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (1, 'JUEVES', '08:00', '12:00', 30, 1),
  (1, 'VIERNES', '08:00', '12:00', 30, 1);

-- Profesional 2 (Martín Pérez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (2, 'LUNES', '08:00', '12:00', 30, 1),
  (2, 'MARTES', '08:00', '12:00', 30, 1),
  (2, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (2, 'JUEVES', '08:00', '12:00', 30, 1),
  (2, 'VIERNES', '08:00', '12:00', 30, 1);

-- Profesional 3 (Carla Núñez)
INSERT INTO disponibilidad (id_profesional, dia_semana, hora_inicio, hora_fin, duracion_min, estado) VALUES
  (3, 'LUNES', '08:00', '12:00', 30, 1),
  (3, 'MARTES', '08:00', '12:00', 30, 1),
  (3, 'MIERCOLES', '08:00', '12:00', 30, 1),
  (3, 'JUEVES', '08:00', '12:00', 30, 1),
  (3, 'VIERNES', '08:00', '12:00', 30, 1);

-- 5. Pacientes (conservando datos de TP2, teléfonos normalizados a dígitos numéricos)
INSERT INTO paciente (id_paciente, dni, nombre, apellido, telefono, correo, fecha_nacimiento, obra_social, estado) VALUES
  (1, '30111222', 'Ana', 'López', '3764111111', 'ana@email.com', '1985-04-12', 'OSDE', 1),
  (2, '28777444', 'Luis', 'Díaz', '3765222222', 'luis@email.com', '1981-09-23', 'Swiss Medical', 1);

-- 6. Turnos históricos (2026-10-06)
INSERT INTO turno (id_turno, id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, creado_por) VALUES
  (1, 1, 1, '2026-10-06', '09:00', 'CONFIRMADO', 'Control', 1),
  (2, 2, 2, '2026-10-06', '09:30', 'PENDIENTE', 'Consulta', 1);

-- Turnos activos actuales y futuros para demostración en Panel, Agenda y Turnos
INSERT INTO turno (id_paciente, id_profesional, fecha, hora, estado, motivo_consulta, creado_por) VALUES
  (1, 1, date('now', 'localtime', 'weekday 3'), '10:00', 'CONFIRMADO', 'Seguimiento de tratamiento', 1),
  (2, 2, date('now', 'localtime', 'weekday 3'), '11:00', 'PENDIENTE', 'Control pediátrico semestral', 1),
  (1, 3, date('now', 'localtime', 'weekday 4'), '09:30', 'CONFIRMADO', 'Electrocardiograma de rutina', 1),
  (2, 1, date('now', 'localtime', 'weekday 5'), '10:30', 'PENDIENTE', 'Consulta médica general', 1);

-- 7. Registro de auditoría inicial
INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, datos_despues) VALUES
  (1, 'INICIALIZACION', 'SISTEMA', NULL, '{"mensaje": "Base de datos inicializada con datos semilla"}');
