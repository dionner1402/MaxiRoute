import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Definir las traducciones
const resources = {
  es: {
    translation: {
      // Pantalla de Configuración
      settings: {
        title: 'Configuración',
        appearance: 'Apariencia',
        darkMode: 'Modo Oscuro',
        notifications: 'Notificaciones',
        enableNotifications: 'Activar Notificaciones',
        customizeNotifications: 'Personalizar Notificaciones',
        language: 'Idioma',
        security: 'Seguridad',
        changePassword: 'Cambiar Contraseña',
        account: 'Cuenta',
        editPersonalInfo: 'Editar Información Personal',
        managePrivacy: 'Gestionar Privacidad',
        saveSettings: 'Guardar Configuraciones',
      },
      // Pantalla de Inicio de Sesión
      login: {
        title: 'Iniciar Sesión',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        forgotPassword: '¿Olvidaste tu Contraseña?',
        signIn: 'Iniciar Sesión',
        signUp: 'Registrarse',
      },
      // Pantalla de Registro
      register: {
        title: 'Registrarse',
        name: 'Nombre',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        registerButton: 'Registrarse',
      },
      // Pantalla de Olvidé mi Contraseña
      forgotPassword: {
        title: 'Recuperar Contraseña',
        email: 'Correo electrónico',
        send: 'Enviar',
        back: 'Volver',
      },
      // Pantalla de Verificar Código
      verifyCode: {
        title: 'Ingresa el Código de Recuperación',
        code: 'Código',
        verify: 'Verificar Código',
      },
      // Pantalla de Restablecer Contraseña
      resetPassword: {
        title: 'Restablecer Contraseña',
        newPassword: 'Nueva contraseña',
        confirmNewPassword: 'Confirmar nueva contraseña',
        resetButton: 'Restablecer Contraseña',
      },
      // Pantalla de Perfil
      profile: {
        title: 'Perfil',
        editProfile: 'Editar Perfil',
        viewStats: 'Ver Estadísticas',
        bio: 'Biografía',
        updateBio: 'Actualizar Biografía',
      },
      // Mensajes generales y alertas
      alerts: {
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        saveSuccess: 'Guardado exitosamente',
        loginError: 'Error al iniciar sesión',
      },
      // Textos comunes
      common: {
        welcome: 'Bienvenido',
        logout: 'Cerrar Sesión',
        loading: 'Cargando...',
        back: 'Volver',
        next: 'Siguiente',
        submit: 'Enviar',
      },
    },
  },
  en: {
    translation: {
      // Pantalla de Configuración
      settings: {
        title: 'Settings',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        notifications: 'Notifications',
        enableNotifications: 'Enable Notifications',
        customizeNotifications: 'Customize Notifications',
        language: 'Language',
        security: 'Security',
        changePassword: 'Change Password',
        account: 'Account',
        editPersonalInfo: 'Edit Personal Information',
        managePrivacy: 'Manage Privacy',
        saveSettings: 'Save Settings',
      },
      // Pantalla de Inicio de Sesión
      login: {
        title: 'Login',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        signIn: 'Sign In',
        signUp: 'Sign Up',
      },
      // Pantalla de Registro
      register: {
        title: 'Register',
        name: 'Name',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        registerButton: 'Register',
      },
      // Pantalla de Olvidé mi Contraseña
      forgotPassword: {
        title: 'Recover Password',
        email: 'Email',
        send: 'Send',
        back: 'Back',
      },
      // Pantalla de Verificar Código
      verifyCode: {
        title: 'Enter Recovery Code',
        code: 'Code',
        verify: 'Verify Code',
      },
      // Pantalla de Restablecer Contraseña
      resetPassword: {
        title: 'Reset Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        resetButton: 'Reset Password',
      },
      // Pantalla de Perfil
      profile: {
        title: 'Profile',
        editProfile: 'Edit Profile',
        viewStats: 'View Stats',
        bio: 'Biography',
        updateBio: 'Update Biography',
      },
      // Mensajes generales y alertas
      alerts: {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        confirm: 'Confirm',
        cancel: 'Cancel',
        saveSuccess: 'Saved successfully',
        loginError: 'Login error',
      },
      // Textos comunes
      common: {
        welcome: 'Welcome',
        logout: 'Logout',
        loading: 'Loading...',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
      },
    },
  },
};

// Inicializar i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Idioma por defecto
    fallbackLng: 'en', // Idioma de respaldo
    interpolation: {
      escapeValue: false, // React ya escapa los valores por seguridad
    },
  });

export default i18n;