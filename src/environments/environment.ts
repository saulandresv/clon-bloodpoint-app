// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://bloodpoint-core-qa-35c4ecec4a30.herokuapp.com',
  mapbox: {
    accessToken: 'pk.eyJ1IjoiemljeXVhbiIsImEiOiJjbWEybHV6ZDkwZmp0MmtwcnRpZWdkOTV2In0.H-szkKo7J7lXsTQhSF4sRQ'
  },
  firebase: {
    apiKey: 'AIzaSyCinpCQxW_hpX_oyEnsBJ2coR49DMib8no',
    authDomain: 'bloodpoint-notificacion.firebaseapp.com',
    projectId: 'bloodpoint-notificacion',
    storageBucket: 'bloodpoint-notificacion.firebasestorage.app',
    messagingSenderId: '887736007151',
    appId: '1:887736007151:android:88794d9839baed082f1e1a'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
