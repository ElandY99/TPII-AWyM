import { especialidadRepository } from '../repositories/especialidadRepository.js';
import { NotFoundError, ConflictError } from '../core/errors.js';
import { auditService } from './auditService.js';
import { getDb } from '../db/connection.js';

export const especialidadService = {
  list(filters = {}) {
    return especialidadRepository.findAll(filters);
  },

  getById(id) {
    const especialidad = especialidadRepository.findById(id);
    if (!especialidad) {
      throw new NotFoundError('Especialidad no encontrada');
    }
    return especialidad;
  },

  create(data, userId) {
    const existing = especialidadRepository.findByNombre(data.nombre);
    if (existing) {
      throw new ConflictError('Ya existe una especialidad registrada con ese nombre.', {
        nombre: 'El nombre ya se encuentra registrado'
      });
    }

    const db = getDb();
    let newId;

    const tx = db.transaction(() => {
      newId = especialidadRepository.create(data);
      auditService.log({
        id_usuario: userId,
        accion: 'CREAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: Number(newId),
        despues: { id: newId, ...data }
      });
    });

    tx();
    return this.getById(newId);
  },

  update(id, data, userId) {
    const current = this.getById(id);

    const existing = especialidadRepository.findByNombre(data.nombre, id);
    if (existing) {
      throw new ConflictError('Ya existe otra especialidad registrada con ese nombre.', {
        nombre: 'El nombre ya se encuentra registrado'
      });
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.update(id, data);
      auditService.log({
        id_usuario: userId,
        accion: 'MODIFICAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: id,
        antes: current,
        despues: { ...current, ...data }
      });
    });

    tx();
    return this.getById(id);
  },

  deactivate(id, userId) {
    const current = this.getById(id);
    if (!current.estado) {
      return current; // Ya inactiva
    }

    // Regla D-15: verificar que no tenga dependencias activas (profesionales activos asociados)
    const activeDocs = especialidadRepository.countActiveProfesionales(id);
    if (activeDocs > 0) {
      throw new ConflictError(
        `No es posible desactivar la especialidad porque posee ${activeDocs} profesional(es) activo(s) asociado(s). Desactive primero los profesionales.`
      );
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.setEstado(id, 0);
      auditService.log({
        id_usuario: userId,
        accion: 'DESACTIVAR',
        entidad: 'ESPECIALIDAD',
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
    if (current.estado) {
      return current;
    }

    const db = getDb();
    const tx = db.transaction(() => {
      especialidadRepository.setEstado(id, 1);
      auditService.log({
        id_usuario: userId,
        accion: 'REACTIVAR',
        entidad: 'ESPECIALIDAD',
        id_entidad: id,
        antes: current,
        despues: { ...current, estado: 1 }
      });
    });

    tx();
    return this.getById(id);
  }
};
