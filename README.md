> [!IMPORTANT]
> Implementación propia del proyecto de título **BloodPoint**, desarrollado en equipo en DuocUC.
> Ver repositorio original: [Camilink/BloodPoint](https://github.com/Camilink/BloodPoint)

# BloodPoint App

App móvil de gestión y promoción de donaciones de sangre, desarrollada como parte del proyecto de título **BloodPoint**.

## Stack

- **Framework:** Angular 19 + Ionic 8 + Capacitor 7
- **Plataforma:** Android (APK vía Capacitor)
- **Notificaciones:** Firebase Cloud Messaging
- **Escaneo:** Barcode scanning vía MLKit

## Funcionalidades

- Registro y login de donantes
- Escáner de código QR/barras para validación
- Notificaciones push de campañas de donación
- Historial de donaciones del usuario

## Instalación

```bash
npm install
npm start          # web (desarrollo)
```

**Android:**
```bash
npm run build
npx cap sync android
npx cap open android   # abre en Android Studio
```

## Backend

API REST correspondiente: [clon-bloodpoint-core2](https://github.com/saulandresv/clon-bloodpoint-core2)