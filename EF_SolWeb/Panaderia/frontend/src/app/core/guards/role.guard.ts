import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(allowedRoles: string[]): boolean | UrlTree | Observable<boolean | UrlTree> {
    // Obtenemos el rol actual
    const userRole = this.authService.getUserRole();

    // DEBUG: Ver qué está pasando
    console.log(`RoleGuard: Usuario con rol [${userRole}] intentando entrar. Permitidos: [${allowedRoles.join(', ')}]`);

    // 1. Si el rol del usuario está en la lista de permitidos, ADELANTE.
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // 2. Si no tiene permiso, mostramos mensaje y redirigimos
    else {
      console.warn(`RoleGuard: Acceso denegado.`);
      this.snackBar.open('No tienes permisos para acceder a esta sección.', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });

      // Lógica de redirección inteligente
      if (userRole === 'EMPLEADO') {
        return this.router.createUrlTree(['/productos']);
      }
      else if (userRole === 'ADMINISTRADOR') {
        return this.router.createUrlTree(['/dashboard']);
      }
      // ⭐ NUEVO: Si es Jefe de Calidad, lo mandamos a Inventario
      else if (userRole === 'JEFE CALIDAD') {
        return this.router.createUrlTree(['/productos']);
      }
      // Si no hay rol o es desconocido
      else {
        return this.router.createUrlTree(['/login']);
      }
    }
  }
}
