import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de la instancia de axios
const api = axios.create({
  baseURL: 'http://192.168.40.5:5000/api', // URL base del backend
  timeout: 10000, // Tiempo máximo de espera para las solicitudes
});

// Interceptor para agregar el token de autenticación a las solicitudes
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Manejar error de autenticación (e.g., redirigir al login)
      console.error('No autorizado, redirigiendo al login...');
      // Aquí podrías disparar una acción para cerrar sesión o redirigir
    }
    return Promise.reject(error);
  }
);

export default api;