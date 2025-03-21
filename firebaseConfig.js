import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDSSuaZdBVydw3TYs7CNoSexKej2A83SaU", // current_key
  authDomain: "maxiruta-6867f.firebaseapp.com", // Se construye con project_id + "firebaseapp.com"
  projectId: "maxiruta-6867f", // project_id
  storageBucket: "maxiruta-6867f.firebasestorage.app", // storage_bucket
  messagingSenderId: "271733469913", // project_number
  appId: "1:271733469913:android:5d9ff1fc4072719d5ec4c8" // mobilesdk_app_id
};

// Inicializa Firebase solo si no está ya inicializado
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

// Configura el servicio de mensajes de Firebase
const messaging = getMessaging();

// Escucha mensajes en primer plano (opcional)
onMessage(messaging, (payload) => {
  console.log('Mensaje recibido en primer plano:', payload);
});

export default messaging;
