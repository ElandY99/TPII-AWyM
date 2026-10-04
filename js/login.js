/* =============================================================
   login.js
   -------------------------------------------------------------
   Se encarga de:
   - Capturar el envío del formulario de Login.
   - Validar que correo y contraseña estén completos.
   - Comparar las credenciales con el usuario simulado.
   - Crear una sesión temporal con sessionStorage.
   ============================================================= */

// Se obtienen referencias a elementos del DOM que se usarán varias veces.
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

/* -------------------------------------------------------------
   FUNCIÓN clearErrors()
   -------------------------------------------------------------
   Limpia los mensajes anteriores antes de realizar una nueva
   validación del formulario.
------------------------------------------------------------- */
function clearErrors() {
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';

  loginMessage.textContent = '';
  loginMessage.className = 'form-message';
}

/* -------------------------------------------------------------
   EVENTO submit DEL FORMULARIO
------------------------------------------------------------- */
loginForm.addEventListener('submit', function (event) {

  /*
    preventDefault evita el comportamiento normal del formulario,
    es decir, evita que la página se recargue automáticamente.
  */
  event.preventDefault();

  clearErrors();

  // Se leen y limpian los valores escritos por el usuario.
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Esta variable indica si todas las validaciones son correctas.
  let valid = true;

  // Validación: el correo es obligatorio.
  if (!email) {
    document.getElementById('emailError').textContent = 'Debe ingresar el correo.';
    valid = false;
  }

  // Validación: la contraseña es obligatoria.
  if (!password) {
    document.getElementById('passwordError').textContent = 'Debe ingresar la contraseña.';
    valid = false;
  }

  // Si algún campo es inválido, se detiene el proceso.
  if (!valid) {
    return;
  }

  /*
    find recorre el arreglo de usuarios y devuelve el primero que
    coincida con correo y contraseña.

    Para este TP los usuarios son datos simulados.
  */
  const user = AppData.defaults.users.find(function (item) {
    return item.email === email && item.password === password;
  });

  // Si no se encuentra el usuario, se muestra un mensaje genérico.
  if (!user) {
    loginMessage.textContent = 'Usuario o contraseña incorrectos.';
    loginMessage.classList.add('bad');

    // Se limpia solamente la contraseña para permitir un nuevo intento.
    document.getElementById('password').value = '';
    return;
  }

  /*
    Login correcto:
    se guarda una sesión mínima con el correo y el rol del usuario.
    No se guarda la contraseña.
  */
  sessionStorage.setItem(
    'saludturnos_user',
    JSON.stringify({
      email: user.email,
      role: user.role
    })
  );

  // Se navega al Dashboard.
  window.location.href = 'dashboard.html';
});
