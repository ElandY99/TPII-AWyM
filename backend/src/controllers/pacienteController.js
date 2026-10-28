import { pacienteService } from '../services/pacienteService.js';

export const pacienteController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = pacienteService.list(filters);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron pacientes' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.getById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const data = pacienteService.create(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Paciente registrado exitosamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.update(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Paciente actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.deactivate(id, req.user.id);
      res.json({
        mensaje: 'Paciente desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activate(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = pacienteService.activate(id, req.user.id);
      res.json({
        mensaje: 'Paciente reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
