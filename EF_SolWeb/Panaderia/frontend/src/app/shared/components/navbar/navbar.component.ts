import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { User } from '../../../core/models/user.model';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../features/products/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin: boolean = false;
  isJefeCalidad = false;
  currentUser: User | null = null;
  subscription: Subscription = new Subscription();

  // Variables para las alertas
  hasNoStock: boolean = false;
  hasLowStock: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    // 1. Suscripción al Usuario
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.rol === 'ADMINISTRADOR';

      // Detectar rol de Jefe de Calidad (Backend debe enviar JEFE CALIDAD)
      this.isJefeCalidad = user?.rol === 'JEFE CALIDAD';

      // Verificamos stock solo una vez si está logueado
      if (this.isLoggedIn) {
        this.checkStockStatus();
      }
    });

    // 2. Suscripción a cambios en productos (Tiempo real)
    this.subscription = this.productService.refresh$.subscribe(() => {
      this.checkStockStatus();
    });
  }

  checkStockStatus(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.hasNoStock = false;
        this.hasLowStock = false;

        const outOfStockItem = products.find(p => p.stock === 0);
        const lowStockItem = products.find(p => p.stock !== undefined && p.stock > 0 && p.stock <= 10);

        if (outOfStockItem) {
          this.hasNoStock = true;
        }

        if (lowStockItem) {
          this.hasLowStock = true;
        }
      },
      error: (err) => console.error('Error verificando stock en navbar', err)
    });
  }

  // ⭐ NUEVO MÉTODO: Determina qué imagen mostrar según el rol
  getUserAvatar(): string {
    if (this.isAdmin) {
      return 'assets/imagen/admin.png';
    } else if (this.isJefeCalidad) {
      return 'assets/imagen/jefe_calidad.png'; // Imagen solicitada
    } else {
      return 'assets/imagen/empleado.png';
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
