import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuPage } from './menu.page';


const routes: Routes = [
  {
    path: '',
    component: MenuPage,
    children: [
      {
        path: 'index',
        loadChildren: () => import('../index/index.module').then(m => m.IndexPageModule)
      },
      {
        path: 'puntosdonacion',
        loadChildren: () => import('../puntosdonacion/puntosdonacion.module').then(m => m.PuntosdonacionPageModule)
      },
      {
        path: 'notificacion',
        loadChildren: () => import('../notificacion/notificacion.module').then(m => m.NotificacionPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('../perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: 'detalles',
        loadChildren: () => import('../detalles/detalles.module').then(m => m.DetallesPageModule)
      }, 
      {
        path: 'editarperfil',
        loadChildren: () => import('../editarperfil/editarperfil.module').then(m => m.EditarperfilPageModule)
      },
      {
        path: 'historialdonacion',
        loadChildren: () => import('../historialdonacion/historialdonacion.module').then(m => m.HistorialdonacionPageModule)
      },
      {
        path: 'detallesh',
        loadChildren: () => import('../detallesh/detallesh.module').then(m => m.DetalleshPageModule)
      },
      {
        path: 'logros',
        loadChildren: () => import('../logros/logros.module').then( m => m.LogrosPageModule)
      },
      {
        path: 'solicitardonacion',
        loadChildren: () => import('../solicitardonacion/solicitardonacion.module').then( m => m.SolicitardonacionPageModule)
      },
      {
        path: 'ayudabp',
        loadChildren: () => import('../ayudabp/ayudabp.module').then( m => m.AyudabpPageModule)
      },
      {
        path: 'chatbot',
        loadComponent: () => import('../chatbot/chatbot.page').then( m => m.ChatbotPage)
      },
      {
        path: 'seleccionarlugardonacion',
        loadChildren: () => import('../seleccionarlugardonacion/seleccionarlugardonacion.module').then(m => m.SeleccionarlugardonacionPageModule)
      },
    ]
  },
  {
    path: '',
    redirectTo: '/menu/index',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenuPageRoutingModule {}
