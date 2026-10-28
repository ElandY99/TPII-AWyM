import { userRepository } from '../repositories/userRepository.js';
import { profesionalRepository } from '../repositories/profesionalRepository.js';
import { especialidadRepository } from '../repositories/especialidadRepository.js';
import { hashPassword, generatePassword } from '../core/passwords.js';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina, getDiaSemana, horaToMinutos } from '../core/time.js';

export const userService = {
  listUsers(filters = {}) {
    return userRepository.findAll(filters);
  },

  getUserById(id) {
    const user = userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return user;
  },

  /**
   * Creación atómica de usuario y profesional con disponibilidad (Q4).
   * Genera contraseña inicial segura, la imprime por consola y la retorna una sola vez (D-10).
   */
  async createUser(data, adminUserId) {
    // 1. Validar unicidad de correo
    const existingCorreo = userRepository.findByCorreo(data.correo);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    // 2. Si es PROFESIONAL, validar especialidad, matrícula, consultorio y franjas
    if (data.rol === 'PROFESIONAL') {
      const especialidad = especialidadRepository.findById(data.profesional.id_especialidad);
      if (!especialidad || !especialidad.estado) {
        throw new ValidationError('La especialidad seleccionada no existe o está inactiva.', {
          'profesional.id_especialidad': 'Especialidad inexistente o inactiva'
        });
      }

      const existingMatricula = profesionalRepository.findByMatricula(data.profesional.matricula);
      if (existingMatricula) {
        throw new ConflictError('La matrícula ingresada ya se encuentra registrada en el sistema.', {
          'profesional.matricula': 'Matrícula ya registrada'
        });
      }

      const existingConsultorio = profesionalRepository.findByConsultorio(data.profesional.consultorio);
      if (existingConsultorio) {
        throw new ConflictError('El consultorio ingresado ya se encuentra asignado a otro profesional.', {
          'profesional.consultorio': 'Consultorio ya asignado'
        });
      }

      // Validar solapamiento de franjas horarias dentro del mismo día (D-22 / Q5)
      this.validateFranjasOverlap(data.disponibilidad);
    }

    // 3. Generar contraseña aleatoria que cumple la política
    const generatedPassword = generatePassword();
    const clave_hash = await hashPassword(generatedPassword);

    console.log(`[Seguridad] Contraseña generada para ${data.correo}: ${generatedPassword}`);

    const db = getDb();
    let newUserId;
    let newProfesionalId = null;

    const tx = db.transaction(() => {
      // Crear usuario
      newUserId = userRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave_hash,
        rol: data.rol
      });

      auditService.log({
        id_usuario: adminUserId,
        accion: 'CREAR',
        entidad: 'USUARIO',
        id_entidad: Number(newUserId),
        despues: { id: newUserId, nombre: data.nombre, apellido: data.apellido, correo: data.correo, rol: data.rol }
      });

      // Si es profesional, crear entidad y disponibilidad en la misma transacción
      if (data.rol === 'PROFESIONAL') {
        newProfesionalId = profesionalRepository.create({
          id_especialidad: data.profesional.id_especialidad,
          id_usuario: Number(newUserId),
          matricula: data.profesional.matricula,
          nombre: data.nombre,
          apellido: data.apellido,
          consultorio: data.profesional.consultorio
        });

        profesionalRepository.setDisponibilidad(Number(newProfesionalId), data.disponibilidad);

        auditService.log({
          id_usuario: adminUserId,
          accion: 'CREAR',
          entidad: 'PROFESIONAL',
          id_entidad: Number(newProfesionalId),
          despues: {
            id: newProfesionalId,
            id_usuario: newUserId,
            matricula: data.profesional.matricula,
            consultorio: data.profesional.consultorio,
            disponibilidad: data.disponibilidad
          }
        });
      }
    });

    tx();

    const createdUser = this.getUserById(newUserId);
    return {
      usuario: createdUser,
      clave_generada: generatedPassword
    };
  },

  updateUser(id, data, adminUserId) {
    const current = this.getUserById(id);

    // D-13: Un Administrador no puede modificar a otro administrador por API
    if (current.rol === 'ADMINISTRADOR' && current.id_usuario !== adminUserId) {
      throw new ForbiddenError('Los usuarios administradores solo pueden ser administrados directamente en la base de datos.');
    }

    const existing = userRepository.findByCorreo(data.correo, id);
    if (existing) {
      throw new ConflictError('El correo electrónico ya pertenece a otro usuario.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.update(id, data);

      // Si tiene profesional vinculado, mantener nombre y apellido sincronizados
      if (current.id_profesional) {
        db.prepare(`
          UPDATE profesional
          SET nombre = ?, apellido = ?
          WHERE id_profesional = ?
        `).run(data.nombre, data.apellido, current.id_profesional);
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getUserById(id);
  },

  deactivateUser(id, adminUserId) {
    const current = this.getUserById(id);

    // D-13: No autodesactivarse ni desactivar a otros administradores
    if (id === adminUserId) {
      throw new ForbiddenError('Un administrador no puede desactivar su propia cuenta.');
    }
    if (current.rol === 'ADMINISTRADOR') {
      throw new ForbiddenError('Los usuarios administradores no pueden ser desactivados mediante la aplicación.');
    }

    // Regla acordada: si está vinculado a un profesional, debe desactivarse primero el profesional
    if (current.id_profesional) {
      const prof = profesionalRepository.findById(current.id_profesional);
      if (prof && prof.estado) {
        throw new ConflictError('Desactive primero el profesional asociado antes de desactivar este usuario.');
      }
    }

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.setEstado(id, 0);
      userRepository.deleteSessions(id);

      auditService.log({
        id_usuario: adminUserId,
        accion: 'DESACTIVAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getUserById(id);
  },

  activateUser(id, adminUserId) {
    const current = this.getUserById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.setEstado(id, 1);

      auditService.log({
        id_usuario: adminUserId,
        accion: 'REACTIVAR',
        entidad: 'USUARIO',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getUserById(id);
  },

  async resetPassword(id, adminUserId) {
    const current = this.getUserById(id);
    if (current.rol === 'ADMINISTRADOR' && current.id_usuario !== adminUserId) {
      throw new ForbiddenError('No se puede restablecer la contraseña de otro usuario Administrador.');
    }

    const newPassword = generatePassword();
    const clave_hash = await hashPassword(newPassword);

    console.log(`[Seguridad] Contraseña restablecida para ${current.correo}: ${newPassword}`);

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.updateClave(id, clave_hash);
      userRepository.deleteSessions(id); // Cierra sesiones activas para exigir login con nueva clave

      auditService.log({
        id_usuario: adminUserId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'USUARIO',
        id_entidad: id
      });
    });

    tx();

    return { clave_generada: newPassword };
  },

  // ---------------------------------------------------------------------------
  // GESTIÓN DE PROFESIONALES
  // ---------------------------------------------------------------------------
  listProfesionales(filters = {}, user) {
    // Si es PROFESIONAL, solo ve sus propios datos (D-02, D-07)
    if (user.rol === 'PROFESIONAL') {
      const p = profesionalRepository.findById(user.id_profesional);
      return p ? [p] : [];
    }
    return profesionalRepository.findAll(filters);
  },

  getProfesionalById(id, user) {
    // Si es PROFESIONAL, solo puede consultar su propio ID
    if (user.rol === 'PROFESIONAL' && user.id_profesional !== id) {
      throw new NotFoundError('Profesional no encontrado');
    }

    const p = profesionalRepository.findById(id);
    if (!p) {
      throw new NotFoundError('Profesional no encontrado');
    }
    return p;
  },

  updateProfesional(id, data, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');

    const especialidad = especialidadRepository.findById(data.id_especialidad);
    if (!especialidad || !especialidad.estado) {
      throw new ValidationError('La especialidad seleccionada no existe o está inactiva.', {
        id_especialidad: 'Especialidad inválida'
      });
    }

    const existingMat = profesionalRepository.findByMatricula(data.matricula, id);
    if (existingMat) {
      throw new ConflictError('La matrícula ya pertenece a otro profesional registrado.', {
        matricula: 'Matrícula duplicada'
      });
    }

    if (data.consultorio) {
      const existingCons = profesionalRepository.findByConsultorio(data.consultorio, id);
      if (existingCons) {
        throw new ConflictError('El consultorio ingresado ya se encuentra asignado a otro profesional.', {
          consultorio: 'Consultorio ya asignado'
        });
      }
    }

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.update(id, data);
      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  /**
   * Desactivar profesional (Q10, D-15, D-16).
   * Requiere que no tenga turnos futuros activos, que el consultorio haya sido liberado (puesto en null)
   * y que no tenga franjas de disponibilidad configuradas.
   * Al completarse con éxito, desactiva también el usuario vinculado y cierra sus sesiones.
   */
  deactivateProfesional(id, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');
    if (!current.estado) return current;

    const { fecha } = getNowInArgentina();
    const activeTurnos = profesionalRepository.countActiveFutureTurnos(id, fecha);
    const blockers = [];

    if (activeTurnos > 0) {
      blockers.push(`Posee ${activeTurnos} turno(s) futuro(s) activo(s). Debe cancelarlos o reprogramarlos.`);
    }
    if (current.consultorio !== null && current.consultorio !== '') {
      blockers.push('El consultorio debe ser liberado (actualizado a null/vacío) antes de desactivar.');
    }
    const disp = profesionalRepository.getDisponibilidad(id);
    if (disp.length > 0) {
      blockers.push('Debe eliminar la configuración de disponibilidad (agenda) antes de desactivar.');
    }

    if (blockers.length > 0) {
      throw new ConflictError(`No es posible desactivar el profesional: ${blockers.join(' ')}`);
    }

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.setEstado(id, 0);

      // Desactivar también usuario vinculado y cerrar sesiones (Q10)
      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 0);
        userRepository.deleteSessions(current.id_usuario);
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'DESACTIVAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  activateProfesional(id, adminUserId) {
    const current = profesionalRepository.findById(id);
    if (!current) throw new NotFoundError('Profesional no encontrado');
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      profesionalRepository.setEstado(id, 1);
      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 1);
      }

      auditService.log({
        id_usuario: adminUserId,
        accion: 'REACTIVAR',
        entidad: 'PROFESIONAL',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getProfesionalById(id, { rol: 'ADMINISTRADOR' });
  },

  // ---------------------------------------------------------------------------
  // GESTIÓN DE DISPONIBILIDAD
  // ---------------------------------------------------------------------------
  getDisponibilidad(id_profesional, user) {
    this.getProfesionalById(id_profesional, user);
    return profesionalRepository.getDisponibilidad(id_profesional);
  },

  /**
   * Modifica la disponibilidad de un profesional (RFB-26, RFB-30, D-23).
   * Si existen turnos futuros activos que quedan fuera del nuevo horario, se bloquea (409).
   */
  updateDisponibilidad(id_profesional, franjas, adminUserId) {
    const prof = profesionalRepository.findById(id_profesional);
    if (!prof) throw new NotFoundError('Profesional no encontrado');
    if (!prof.estado) {
      throw new ValidationError('No se puede configurar disponibilidad para un profesional inactivo.');
    }

    this.validateFranjasOverlap(franjas);

    // Verificar si existen turnos futuros activos que quedan fuera del nuevo cronograma (D-23)
    const { fecha, hora } = getNowInArgentina();
    const db = getDb();
    const turnosFuturos = db.prepare(`
      SELECT id_turno, fecha, hora, estado
      FROM turno
      WHERE id_profesional = ?
        AND (fecha > ? OR (fecha = ? AND hora >= ?))
        AND estado IN ('PENDIENTE', 'CONFIRMADO')
    `).all(id_profesional, fecha, fecha, hora);

    const turnosConflicto = [];
    for (const t of turnosFuturos) {
      const diaSemanaTurno = getDiaSemana(t.fecha);
      const turnoMin = horaToMinutos(t.hora);

      // Buscar si el turno cae en alguna de las nuevas franjas
      const cubre = franjas.some((f) => {
        if (f.dia_semana !== diaSemanaTurno) return false;
        const ini = horaToMinutos(f.hora_inicio);
        const fin = horaToMinutos(f.hora_fin);
        return turnoMin >= ini && turnoMin + 30 <= fin;
      });

      if (!cubre) {
        turnosConflicto.push(`Turno #${t.id_turno} (${t.fecha} ${t.hora})`);
      }
    }

    if (turnosConflicto.length > 0) {
      throw new ConflictError(
        `No es posible actualizar la agenda porque existen turnos futuros que quedarían fuera del nuevo horario: ${turnosConflicto.join(', ')}. Cancele o reprograme dichos turnos primero.`
      );
    }

    const tx = db.transaction(() => {
      profesionalRepository.setDisponibilidad(id_profesional, franjas);
      auditService.log({
        id_usuario: adminUserId,
        accion: 'MODIFICAR_DISPONIBILIDAD',
        entidad: 'DISPONIBILIDAD',
        id_entidad: id_profesional,
        despues: { franjas }
      });
    });

    tx();
    return profesionalRepository.getDisponibilidad(id_profesional);
  },

  // Validador de solapamiento de franjas por día
  validateFranjasOverlap(franjas) {
    if (!franjas || franjas.length === 0) return;

    const porDia = {};
    for (const f of franjas) {
      porDia[f.dia_semana] = porDia[f.dia_semana] || [];
      porDia[f.dia_semana].push(f);
    }

    for (const [dia, lista] of Object.entries(porDia)) {
      // Ordenar por inicio
      lista.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      for (let i = 0; i < lista.length - 1; i++) {
        const actual = lista[i];
        const siguiente = lista[i + 1];
        if (actual.hora_fin > siguiente.hora_inicio) {
          throw new ValidationError(
            `Existe solapamiento en las franjas horarias del día ${dia}: ${actual.hora_inicio}-${actual.hora_fin} se superpone con ${siguiente.hora_inicio}-${siguiente.hora_fin}.`
          );
        }
      }
    }
  }
};
