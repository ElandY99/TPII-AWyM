import { turnoService } from '../services/turnoService.js';

export const turnoController = {
  list(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = turnoService.list(filters, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron turnos registrados' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.getById(id, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  create(req, res, next) {
    try {
      const data = turnoService.create(req.valid.body, req.user);
      res.status(201).json({
        mensaje: 'Turno registrado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.update(id, req.valid.body, req.user);
      res.json({
        mensaje: 'Turno actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  cambiarEstado(req, res, next) {
    try {
      const { id } = req.valid.params;
      const { estado } = req.valid.body;
      const data = turnoService.cambiarEstado(id, estado, req.user);
      res.json({
        mensaje: `Estado de turno actualizado a ${estado}`,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  cancelar(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = turnoService.cancelar(id, req.user);
      res.json({
        mensaje: 'Turno cancelado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  getDisponibles(req, res, next) {
    try {
      const query = req.valid.query;
      const data = turnoService.getHorariosLibres(query);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se registran horarios libres para el criterio seleccionado' : undefined
      });
    } catch (err) {
      next(err);
    }
  }
};
