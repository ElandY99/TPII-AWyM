import { pacienteRepository } from '../repositories/pacienteRepository.js';
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

  create(data, userId) {
    // Validar DNI único (CU-02 5b)
    const existing = pacienteRepository.findByDni(data.dni);
    if (existing) {
      throw new ConflictError('El DNI ingresado ya se encuentra registrado en el sistema.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = pacienteRepository.create(data);
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'PACIENTE',
        id_entidad: Number(newId),
        despues: { id: newId, ...data }
      });
    });

    tx();
    return this.getById(newId);
  },

  update(id, data, userId) {
    const current = this.getById(id);

    const existing = pacienteRepository.findByDni(data.dni, id);
    if (existing) {
      throw new ConflictError('El DNI ingresado ya pertenece a otro paciente.', {
        dni: 'El DNI ingresado ya se encuentra registrado en el sistema'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.update(id, data);
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
   * Requiere verificar que no tenga turnos futuros activos.
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

  activate(id, userId) {
    const current = this.getById(id);
    if (current.estado) return current;

    const db = getDb();
    const tx = db.transaction(() => {
      pacienteRepository.setEstado(id, 1);
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
  }
};
