import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { UserRoleGuard } from './guards/user-role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'menu',
    loadChildren: () => import('./menu/menu.module').then(m => m.MenuPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'index',
    loadChildren: () => import('./index/index.module').then(m => m.IndexPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'puntosdonacion',
    loadChildren: () => import('./puntosdonacion/puntosdonacion.module').then(m => m.PuntosdonacionPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notificacion',
    loadChildren: () => import('./notificacion/notificacion.module').then(m => m.NotificacionPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    loadChildren: () => import('./perfil/perfil.module').then(m => m.PerfilPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'detalles/:id',
    loadChildren: () => import('./detalles/detalles.module').then(m => m.DetallesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'editarperfil',
    loadChildren: () => import('./editarperfil/editarperfil.module').then(m => m.EditarperfilPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'historialdonacion',
    loadChildren: () => import('./historialdonacion/historialdonacion.module').then(m => m.HistorialdonacionPageModule)
  },
  {
    path: 'detallesh',
    loadChildren: () => import('./detallesh/detallesh.module').then(m => m.DetalleshPageModule)
  },
  {
    path: 'logros',
    loadChildren: () => import('./logros/logros.module').then(m => m.LogrosPageModule)
  },
  {
    path: 'solicitardonacion',
    loadChildren: () => import('./solicitardonacion/solicitardonacion.module').then(m => m.SolicitardonacionPageModule)
  },
  {
    path: 'chatbot',
    loadComponent: () => import('./chatbot/chatbot.page').then(m => m.ChatbotPage),
    canActivate: [AuthGuard]  // si deseas protegerlo
  },
  {
    path: 'ayudabp',
    loadChildren: () => import('./ayudabp/ayudabp.module').then(m => m.AyudabpPageModule)
  },
  {
    path: 'registrarse',
    loadChildren: () => import('./registrarse/registrarse.module').then(m => m.RegistrarsePageModule),
    canActivate: [NoAuthGuard]
  },  {
    path: 'seleccionarlugardonacion',
    loadChildren: () => import('./seleccionarlugardonacion/seleccionarlugardonacion.module').then( m => m.SeleccionarlugardonacionPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
