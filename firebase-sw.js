importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAprBG6TO2upzPA1Ypf8obR3bu5FOBjsBk",
  authDomain: "hsyt-esports-ce2ef.firebaseapp.com",
  projectId: "hsyt-esports-ce2ef",
  storageBucket: "hsyt-esports-ce2ef.firebasestorage.app",
  messagingSenderId: "528987068136",
  appId: "1:528987068136:web:d40cef4115bdc2b6491b5d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png",
      data: { url: payload.data?.url || "/" }
    }
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
