import { userService } from '../services/userService.js';

export const userController = {
  listUsers(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = userService.listUsers(filters);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron usuarios' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getUserById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getUserById(id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const { usuario, clave_generada } = await userService.createUser(req.valid.body, req.user.id);
      res.status(201).json({
        mensaje: 'Usuario creado exitosamente',
        data: usuario,
        clave_generada // Se expone una sola vez (D-10)
      });
    } catch (err) {
      next(err);
    }
  },

  updateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.updateUser(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Usuario actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.deactivateUser(id, req.user.id);
      res.json({
        mensaje: 'Usuario desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activateUser(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.activateUser(id, req.user.id);
      res.json({
        mensaje: 'Usuario reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { id } = req.valid.params;
      const result = await userService.resetPassword(id, req.user.id);
      res.json({
        mensaje: 'Contraseña restablecida exitosamente',
        clave_generada: result.clave_generada
      });
    } catch (err) {
      next(err);
    }
  },

  // Profesionales
  listProfesionales(req, res, next) {
    try {
      const filters = req.valid.query || {};
      const data = userService.listProfesionales(filters, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se encontraron profesionales' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  getProfesionalById(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getProfesionalById(id, req.user);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  updateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.updateProfesional(id, req.valid.body, req.user.id);
      res.json({
        mensaje: 'Profesional actualizado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  deactivateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.deactivateProfesional(id, req.user.id);
      res.json({
        mensaje: 'Profesional desactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  activateProfesional(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.activateProfesional(id, req.user.id);
      res.json({
        mensaje: 'Profesional reactivado correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // Disponibilidad
  getDisponibilidad(req, res, next) {
    try {
      const { id } = req.valid.params;
      const data = userService.getDisponibilidad(id, req.user);
      res.json({
        data,
        mensaje: data.length === 0 ? 'No se registran horarios de atención para el profesional' : undefined
      });
    } catch (err) {
      next(err);
    }
  },

  updateDisponibilidad(req, res, next) {
    try {
      const { id } = req.valid.params;
      const { franjas } = req.valid.body;
      const data = userService.updateDisponibilidad(id, franjas, req.user.id);
      res.json({
        mensaje: 'Disponibilidad horaria actualizada correctamente',
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
