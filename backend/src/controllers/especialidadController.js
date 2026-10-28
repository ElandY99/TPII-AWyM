import { especialidadService } from '../services/especialidadService.js';

export const especialidadController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = especialidadService.list(filters);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron especialidades' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.getById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const data = especialidadService.create(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Especialidad creada exitosamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.update(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Especialidad actualizada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.deactivate(id, req.user.id);
      res.json({
        mensaje: 'Especialidad desactivada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = especialidadService.activate(id, req.user.id);
      res.json({
        mensaje: 'Especialidad reactivada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
