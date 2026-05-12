> [!IMPORTANT]
> Implementación propia del proyecto de título **BloodPoint**, desarrollado en equipo en DuocUC.
> Ver repositorio original: [Camilink/BloodPoint](https://github.com/Camilink/BloodPoint)

# BloodPoint App

App móvil de gestión y promoción de donaciones de sangre.

## Stack

| Categoría | Tecnología |
|-----------|-----------|
| Framework | Angular 19 + Ionic 8 |
| Móvil | Capacitor 7 (Android) |
| Mapas | Mapbox GL |
| Notificaciones | Firebase Cloud Messaging |
| Escaneo | MLKit Barcode Scanner |
| QR | angularx-qrcode |
| Lenguaje | TypeScript + RxJS |

## Mis contribuciones

- **Auth:** conexión de formularios de login y registro al backend
- **Chatbot:** integración del módulo chatbot con validador en Docker
- **QR nativo:** escáner QR vía Capacitor MLKit (no web)
- **Notificaciones push:** implementación de Firebase Cloud Messaging (`firebase.service.ts`, página de notificaciones)
- **Logros:** página y lógica de logros del donante
- **Selección de lugar de donación:** página con integración a API de centros
- **Fixes globales:** rutas, solicitar donación, API service

## Instalación

```bash
npm install
npm start          # web (desarrollo)
```

**Android:**
```bash
npm run build
npx cap sync android
npx cap open android
```

## Backend

API REST correspondiente: [clon-bloodpoint-core2](https://github.com/saulandresv/clon-bloodpoint-core2)