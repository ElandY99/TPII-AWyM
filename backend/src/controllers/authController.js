import { authService } from '../services/authService.js';
import { serializeCookie, parseCookies } from '../core/cookies.js';
import { config } from '../config/index.js';

export const authController = {
  async login(req, res, next) {
    try {
      const { correo, clave } = req.valid.body;
      const { token, usuario } = await authService.login(correo, clave);

      const cookieStr = serializeCookie(config.cookieName, token, {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/'
      });
      res.setHeader('Set-Cookie', cookieStr);

      res.json({
        mensaje: 'Inicio de sesión exitoso',
        usuario
      });
    } catch (err) {
      next(err);
    }
  },

  logout(req, res, next) {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[config.cookieName];

      authService.logout(token, req.user?.id);

      const cookieStr = serializeCookie(config.cookieName, '', {
        httpOnly: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 0
      });
      res.setHeader('Set-Cookie', cookieStr);

      res.json({ mensaje: 'Sesión cerrada correctamente' });
    } catch (err) {
      next(err);
    }
  },

  me(req, res) {
    res.json({ usuario: req.user });
  },

  async changePassword(req, res, next) {
    try {
      const { clave_actual, clave_nueva } = req.valid.body;
      await authService.changePassword(req.user.id, clave_actual, clave_nueva);
      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  }
};
