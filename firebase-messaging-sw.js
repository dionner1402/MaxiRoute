importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDSSuaZdBVydw3TYs7CNoSexKej2A83SaU",
  authDomain: "maxiruta-6867f.firebaseapp.com",
  projectId: "maxiruta-6867f",
  storageBucket: "maxiruta-6867f.firebasestorage.app",
  messagingSenderId: "271733469913",
  appId: "1:271733469913:android:5d9ff1fc4072719d5ec4c8"
};

// Inicializar Firebase dentro del Service Worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

  // Mostrar la notificación
  const notificationTitle = payload.notification.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo_am.png', // Opcional: reemplaza con el ícono de tu app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
