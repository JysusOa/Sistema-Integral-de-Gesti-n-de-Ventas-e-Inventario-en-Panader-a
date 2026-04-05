import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router'; // 1. IMPORTANTE: Importar Router
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    //RouterLink
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Sistema de Gestión de Ventas ';

  // 2. IMPORTANTE: Inyectar 'private router: Router' en el constructor
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void { }

  // 3. IMPORTANTE: Crear la función que usa el HTML
  shouldShowNavbar(): boolean {
    // Si la ruta es '/login', devuelve FALSE (oculta la barra)
    // Para cualquier otra ruta, devuelve TRUE (muestra la barra)
    return this.router.url !== '/login';
  }
}
