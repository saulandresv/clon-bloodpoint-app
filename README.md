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
| Escaneo | MLKit Barcode Scanner (@capacitor-mlkit) |
| QR | angularx-qrcode |
| Lenguaje | TypeScript + RxJS |

## Funcionalidades

- Mapa interactivo de puntos de donación con Mapbox
- Escáner de código QR y barras para validación de donantes
- Notificaciones push de campañas de donación vía Firebase
- Generación de QR por donante
- Haptics, share nativo y acceso a device info vía Capacitor

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