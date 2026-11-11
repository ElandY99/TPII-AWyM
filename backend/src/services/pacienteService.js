import { pacienteRepository } from '../repositories/pacienteRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, generatePassword } from '../core/passwords.js';
import { NotFoundError, ConflictError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';
import { getNowInArgentina } from '../core/time.js';

export const pacienteService = {
  list(filters = {}) {
    return pacienteRepository.findAll(filters);
  },

  getById(id) {
    const paciente = pacienteRepository.findById(id);
    if (!paciente) {
      throw new NotFoundError('Paciente no encontrado');
    }
    return paciente;
  },

  /**
   * Alta atómica de ficha de paciente y cuenta de usuario rol PACIENTE (RFM-03, RN-14, RN-17).
   * Genera contraseña inicial que cumple la política, la muestra por consola y la retorna una sola vez.
   */
  async create(data, userId) {
    // 1. Validar DNI único (CU-02 5b)
    const existingDni = pacienteRepository.findByDni(data.dni);
    if (existingDni) {
      throw new ConflictError('El DNI ingresado ya se encuentra registrado en el sistema.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    // 2. Validar correo único entre todos los usuarios (DM-29, RN-20, CA-M03.3)
    const existingCorreo = userRepository.findByCorreo(data.correo);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    // 3. Generar contraseña aleatoria según política
    const generatedPassword = generatePassword();
    const clave_hash = await hashPassword(generatedPassword);

    console.log(`[Seguridad] Contraseña generada para paciente ${data.correo}: ${generatedPassword}`);

    const db = getDb();
    let newUserId;
    let newPacienteId;

    const tx = db.transaction(() => {
      // 4. Crear cuenta de usuario con rol PACIENTE
      newUserId = userRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave_hash,
        rol: 'PACIENTE'
      });

      // 5. Crear ficha de paciente vinculada
      newPacienteId = pacienteRepository.create({
        ...data,
        id_usuario: newUserId
      });

      // 6. Auditoría de creación de ambas entidades
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'USUARIO',
        id_entidad: Number(newUserId),
        despues: { id: newUserId, correo: data.correo, rol: 'PACIENTE' }
      });

      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'PACIENTE',
        id_entidad: Number(newPacienteId),
        despues: { id: newPacienteId, ...data, id_usuario: newUserId }
      });
    });

    tx();

    return {
      paciente: this.getById(newPacienteId),
      clave_generada: generatedPassword
    };
  },

  /**
   * Modificación de ficha de paciente con sincronización de cuenta de usuario (RFM-28, RN-18).
   */
  update(id, data, userId) {
    const current = this.getById(id);

    const existingDni = pacienteRepository.findByDni(data.dni, id);
    if (existingDni) {
      throw new ConflictError('El DNI ingresado ya pertenece a otro paciente.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    // Validar correo único excluyendo la cuenta actual
    const existingCorreo = userRepository.findByCorreo(data.correo, current.id_usuario);
    if (existingCorreo) {
      throw new ConflictError('El correo electrónico ya se encuentra registrado por otro usuario.', {
        correo: 'El correo electrónico ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.update(id, data);

      if (current.id_usuario) {
        userRepository.update(current.id_usuario, {
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo
        });

        auditService.log({
          id_usuario: userId,
          accion: 'MODIFICAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { nombre: data.nombre, apellido: data.apellido, correo: data.correo }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'MODIFICAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Desactivar paciente (D-15, D-16: solo Administrador).
   * Desactiva también la cuenta de usuario y cierra sus sesiones (RFM-06, RN-19).
   */
  deactivate(id, userId) {
    const current = this.getById(id);
    if (!current.estado) return current;

    const { fecha } = getNowInArgentina();
    const activeTurnos = pacienteRepository.countActiveFutureTurnos(id, fecha);
    if (activeTurnos > 0) {
      throw new ConflictError(
        `No es posible desactivar al paciente porque posee ${activeTurnos} turno(s) futuro(s) activo(s). Cancele o reprograme dichos turnos primero.`
      );
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 0);

      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 0);
        userRepository.deleteSessions(current.id_usuario);

        auditService.log({
          id_usuario: userId,
          accion: 'DESACTIVAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { estado: 0 }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'DESACTIVAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 0 }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Reactivar paciente y su cuenta vinculada (RFM-06, RN-19).
   */
  activate(id, userId) {
    const current = this.getById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 1);

      if (current.id_usuario) {
        userRepository.setEstado(current.id_usuario, 1);

        auditService.log({
          id_usuario: userId,
          accion: 'REACTIVAR',
          entidad: 'USUARIO',
          id_entidad: current.id_usuario,
          despues: { estado: 1 }
        });
      }

      auditService.log({
        id_usuario: userId,
        accion: 'REACTIVAR',
        entidad: 'PACIENTE',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getById(id);
  },

  /**
   * Restablecer contraseña de un paciente (RFM-23, CA-M14.1).
   * Disponible para Administrador y Recepcionista.
   */
  async resetPassword(id, userId) {
    const current = this.getById(id);
    if (!current.id_usuario) {
      throw new NotFoundError('El paciente no posee cuenta de usuario vinculada');
    }

    const newPassword = generatePassword();
    const clave_hash = await hashPassword(newPassword);

    console.log(`[Seguridad] Contraseña restablecida para paciente ${current.correo}: ${newPassword}`);

    const db = getDb();
    const tx = db.transaction(() => {
      userRepository.updateClave(current.id_usuario, clave_hash);
      userRepository.deleteSessions(current.id_usuario);

      auditService.log({
        id_usuario: userId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'USUARIO',
        id_entidad: current.id_usuario
      });

      auditService.log({
        id_usuario: userId,
        accion: 'RESTABLECER_CLAVE',
        entidad: 'PACIENTE',
        id_entidad: id
      });
    });

    tx();

    return { clave_generada: newPassword };
  }
};
