import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // 1. Preguntamos al servicio (Memoria RAM)
    let isAuthenticated = this.authService.isAuthenticated();

    // 2. SALVAVIDAS (Anti-Parpadeo):
    // Si el servicio dice "falso" (quizás por recargar página), verificamos manualmente el localStorage.
    // NOTA: Asegúrate de que 'token' es el nombre exacto con el que guardas la sesión.
    if (!isAuthenticated && localStorage.getItem('token')) {
      isAuthenticated = true;
    }

    const requiredRoles = route.data['roles'] as Array<string>;
    const userRole = this.authService.getUserRole();

    if (!isAuthenticated) {
      // Solo si fallaron ambas verificaciones (Servicio y LocalStorage), redirigimos.
      return this.router.createUrlTree(['/login']);
    }

    if (requiredRoles && requiredRoles.length > 0) {
      // Si hay roles requeridos, verifica si el usuario tiene alguno de ellos
      // Nota: Aquí también podríamos necesitar leer el rol del localStorage si userRole viene vacío al recargar
      if (userRole && requiredRoles.includes(userRole)) {
        return true;
      } else {
        // Opción B: Si userRole es nulo por la recarga, intentamos recuperarlo del storage
        // (Esto es opcional, depende de cómo guardes el rol)
        const storedRole = localStorage.getItem('userRole'); // Asumiendo que guardas el rol
        if (storedRole && requiredRoles.includes(storedRole)) {
             return true;
        }

        console.warn('Acceso denegado: El usuario no tiene el rol necesario para esta ruta.');
        return this.router.createUrlTree(['/productos']);
      }
    }
    return true;
  }
}
