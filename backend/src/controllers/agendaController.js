import { agendaService } from '../services/agendaService.js';

export const agendaController = {
  getAgenda(req, res, next) {
    try {
      const query = req.valid.query;
      const data = agendaService.getAgenda(query, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  getDashboard(req, res, next) {
    try {
      const data = agendaService.getDashboard(req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
};
