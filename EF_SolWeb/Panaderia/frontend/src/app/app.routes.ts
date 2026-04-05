import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UserListComponent } from './features/users/user-list/user-list.component';
import { UserFormComponent } from './features/users/user-form/user-form.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductFormComponent } from './features/products/product-form/product-form.component';
import { SaleListComponent } from './features/sales/sale-list/sale-list.component';
import { SaleFormComponent } from './features/sales/sale-form/sale-form.component';
import { AuthGuard } from './core/auth/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { ProductEditComponent } from './features/products/product-edit/product-edit.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registrar', component: RegisterComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR'])]
  },
  {
    path: 'usuarios',
    component: UserListComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR'])]
  },
  {
    path: 'usuarios/crear',
    component: UserFormComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR'])]
  },
  {
    path: 'usuarios/editar/:id',
    component: UserFormComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR'])]
  },
  {
    path: 'productos',
    component: ProductListComponent,
    // Se incluye JEFE CALIDAD (con espacio)
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO', 'JEFE CALIDAD'])]
  },
  {
    path: 'productos/crear',
    component: ProductFormComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },
  {
    path: 'productos/editar/:id',
    component: ProductEditComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },
  {
    path: 'ventas',
    component: SaleListComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },
  {
    path: 'ventas/crear',
    component: SaleFormComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },
  {
    path: 'ventas/editar/:id',
    component: SaleFormComponent,
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },

  // Ruta de catálogo
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/catalogo/catalogo.component').then(m => m.CatalogoComponent),
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['ADMINISTRADOR', 'EMPLEADO'])]
  },

  // ⭐ RUTA DE INFORMES CORREGIDA ⭐
  {
    path: 'informes',
    // Asegúrate de que esta ruta de importación sea REALMENTE donde guardaste el archivo
    loadComponent: () => import('./features/reports/informes/informe.component').then(m => m.InformesComponent),
    // CORRECCIÓN: Usar la misma sintaxis 'inject' que en 'usuarios' y 'productos'
    canActivate: [AuthGuard, () => inject(RoleGuard).canActivate(['JEFE CALIDAD','ADMINISTRADOR'])]
  },

  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: '**', redirectTo: 'productos' }
];
