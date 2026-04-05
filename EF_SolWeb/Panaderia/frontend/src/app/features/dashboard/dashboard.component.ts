import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { RouterLink } from '@angular/router';
import { UserService } from '../users/user.service';
import { ProductService } from '../products/product.service';
import { SaleService } from '../sales/sale.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

declare var google: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  userRole: string | null = null;

  userCount: number = 0;
  productCount: number = 0;
  saleCount: number = 0;

  topProducts: { name: string; sales: number }[] = [];
  topProductsLastWeek: { name: string; sales: number }[] = [];

  isLoadingUsers: boolean = false;
  isLoadingProducts: boolean = false;
  isLoadingSales: boolean = false;
  isLoadingTopProducts: boolean = false;

  private destroy$ = new Subject<void>();
  selectedChart: string = 'topProduct';

  // Cambié los tipos para ser más flexibles
  salesByDay: { label: string; total: number }[] = [];
  salesByWeek: { label: string; total: number }[] = [];
  salesByMonth: { label: string; total: number }[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private productService: ProductService,
    private saleService: SaleService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.nombre + ' ' + currentUser.apellidos;
      this.userRole = currentUser.rol;
    }

    // Cargar Google Charts
    this.loadGoogleCharts();
  }

  loadGoogleCharts(): void {
    if (typeof google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        google.charts.load('current', { packages: ['corechart'] });
        google.charts.setOnLoadCallback(() => {
          this.loadAllCounts();
        });
      };
      document.head.appendChild(script);
    } else {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => {
        this.loadAllCounts();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllCounts(): void {
    this.isLoadingUsers = true;
    this.isLoadingProducts = true;
    this.isLoadingSales = true;
    this.isLoadingTopProducts = true;

    // Obtener conteo de usuarios
    const users$ = this.userService.countUsers ? this.userService.countUsers().pipe(
      catchError(err => {
        console.error('Error al cargar conteo de usuarios:', err);
        this.snackBar.open('Error al cargar usuarios.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        return of(0);
      })
    ) : of(0);

    // Obtener conteo de productos
    const products$ = this.productService.countProducts ? this.productService.countProducts().pipe(
      catchError(err => {
        console.error('Error al cargar conteo de productos:', err);
        this.snackBar.open('Error al cargar productos.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        return of(0);
      })
    ) : of(0);

    // Obtener todas las ventas para conteo
    const sales$ = this.saleService.getSales().pipe(
      catchError(err => {
        console.error('Error al cargar ventas:', err);
        this.snackBar.open('Error al cargar ventas.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        return of([]);
      })
    );

    // Productos más vendidos (general)
    const topProducts$ = this.saleService.getTopSellingProducts().pipe(
      catchError(err => {
        console.error('Error al cargar productos más vendidos:', err);
        this.snackBar.open('Error al cargar productos más vendidos.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        return of([]);
      })
    );

    // Productos más vendidos última semana
    const topProductsLastWeek$ = this.saleService.getTopProductsLastWeek().pipe(
      catchError(err => {
        console.error('Error al cargar productos de la última semana:', err);
        return of([]);
      })
    );

    forkJoin({
      users: users$,
      products: products$,
      sales: sales$,
      topProducts: topProducts$,
      topProductsLastWeek: topProductsLastWeek$
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // Asignar conteos
          this.userCount = results.users || 0;
          this.productCount = results.products || 0;
          this.saleCount = results.sales.length || 0;

          // Asignar productos
          this.topProducts = results.topProducts || [];
          this.topProductsLastWeek = results.topProductsLastWeek || [];

          // Generar datos de gráficos desde ventas reales
          if (results.sales.length > 0) {
            this.generateChartDataFromSales(results.sales);
          }

          console.log('✅ Dashboard cargado:', {
            usuarios: this.userCount,
            productos: this.productCount,
            ventas: this.saleCount,
            topProducts: this.topProducts.length,
            topProductsLastWeek: this.topProductsLastWeek.length
          });

          // Dibujar gráfico
          setTimeout(() => this.drawChart(), 100);

          this.isLoadingUsers = false;
          this.isLoadingProducts = false;
          this.isLoadingSales = false;
          this.isLoadingTopProducts = false;
        },
        error: (err) => {
          console.error('Error inesperado en forkJoin del dashboard:', err);
          this.snackBar.open('Error inesperado al cargar datos del dashboard.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
          this.isLoadingUsers = false;
          this.isLoadingProducts = false;
          this.isLoadingSales = false;
          this.isLoadingTopProducts = false;
        }
      });
  }

  private generateChartDataFromSales(sales: any[]): void {
    // Procesar ventas por día (ayer y hoy)
    this.processSalesByDay(sales);

    // Procesar ventas por semana (semana anterior completa)
    this.processSalesByWeek(sales);

    // Procesar ventas por mes (últimos 6 meses)
    this.processSalesByMonth(sales);
  }

  private processSalesByDay(sales: any[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let todayTotal = 0;
    let yesterdayTotal = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.fechaVenta || sale.createdAt || sale.fecha);
      const saleDateStart = new Date(saleDate);
      saleDateStart.setHours(0, 0, 0, 0);

      const total = sale.total || sale.montoTotal || sale.totalVenta || 0;

      if (saleDateStart.getTime() === today.getTime()) {
        todayTotal += total;
      } else if (saleDateStart.getTime() === yesterday.getTime()) {
        yesterdayTotal += total;
      }
    });

    this.salesByDay = [
      { label: 'Ayer', total: yesterdayTotal },
      { label: 'Hoy', total: todayTotal }
    ];
  }

  private processSalesByWeek(sales: any[]): void {
    // Calcular semana anterior completa (de lunes a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    // Calcular el lunes de la semana anterior
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - dayOfWeek - 6);
    lastMonday.setHours(0, 0, 0, 0);

    // Calcular el domingo de la semana anterior
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    let weekTotal = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.fechaVenta || sale.createdAt || sale.fecha);

      if (saleDate >= lastMonday && saleDate <= lastSunday) {
        const total = sale.total || sale.montoTotal || sale.totalVenta || 0;
        weekTotal += total;
      }
    });

    // Formatear el rango de fechas
    const weekStartStr = this.formatDate(lastMonday);
    const weekEndStr = this.formatDate(lastSunday);

    this.salesByWeek = [
      { label: `Semana ${weekStartStr} - ${weekEndStr}`, total: weekTotal }
    ];
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  private processSalesByMonth(sales: any[]): void {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthTotals = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    sales.forEach(sale => {
      const saleDate = new Date(sale.fechaVenta || sale.createdAt || sale.fecha);

      // Solo ventas del año actual
      if (saleDate.getFullYear() === currentYear) {
        const monthIndex = saleDate.getMonth();
        const total = sale.total || sale.montoTotal || sale.totalVenta || 0;
        monthTotals[monthIndex] += total;
      }
    });

    // Obtener últimos 6 meses con datos
    const currentMonth = new Date().getMonth();
    const result: { label: string; total: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      result.push({
        label: monthNames[monthIndex],
        total: monthTotals[monthIndex]
      });
    }

    this.salesByMonth = result;
  }

  hasRole(role: string): boolean {
    return this.userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.userRole || '');
  }

  calculateBarWidth(value: number | null): number {
    if (!value || value <= 0) return 5;

    if (this.topProducts.length > 0) {
      const maxSales = Math.max(...this.topProducts.map(p => p.sales));
      return maxSales > 0 ? Math.min((value / maxSales) * 100, 100) : 5;
    }

    return Math.min((value / 100) * 100, 100);
  }

  onChartChange(): void {
    this.drawChart();
  }

  drawChart() {
    if (!google || !google.visualization) {
      console.warn('Google Charts no está cargado, reintentando...');
      setTimeout(() => this.drawChart(), 100);
      return;
    }

    let data: any;
    let options: any = {
      title: '',
      legend: { position: 'none' },
      bars: 'vertical',
      height: 400,
      colors: ['#42A5F5'],
      chartArea: {
        width: '80%',
        height: '70%',
        left: 80,
        top: 60
      },
      hAxis: {
        textStyle: {
          fontSize: 11
        }
      },
      vAxis: {
        format: '#,###'
      }
    };

    switch (this.selectedChart) {
      case 'salesDay':
        // Mostrar ayer y hoy
        if (this.salesByDay.length === 0 || (this.salesByDay[0].total === 0 && this.salesByDay[1].total === 0)) {
          this.showNoDataMessage('No hay datos de ventas para ayer y hoy', 'calendar_today');
          return;
        }

        const salesDayData: (string | number)[][] = [['Día', 'Ganancias']];
        this.salesByDay.forEach(item => salesDayData.push([item.label, item.total]));
        data = google.visualization.arrayToDataTable(salesDayData);
        options.title = 'Ventas: Ayer vs Hoy';
        break;

      case 'salesWeek':
        // Mostrar semana anterior completa
        if (this.salesByWeek.length === 0 || this.salesByWeek[0].total === 0) {
          this.showNoDataMessage('No hay datos de ventas de la semana anterior', 'trending_up');
          return;
        }

        const salesWeekData: (string | number)[][] = [['Período', 'Ganancias']];
        this.salesByWeek.forEach(item => salesWeekData.push([item.label, item.total]));
        data = google.visualization.arrayToDataTable(salesWeekData);
        break;

      case 'salesMonth':
        if (this.salesByMonth.length === 0 || this.salesByMonth.every(m => m.total === 0)) {
          this.showNoDataMessage('No hay datos de ventas por mes', 'date_range');
          return;
        }

        const salesMonthData: (string | number)[][] = [['Mes', 'Ganacias']];
        this.salesByMonth.forEach(item => salesMonthData.push([item.label, item.total]));
        data = google.visualization.arrayToDataTable(salesMonthData);
        break;

      case 'topProduct':
        if (this.topProducts.length === 0) {
          this.showNoDataMessage('No hay datos de productos vendidos', 'inventory_2');
          return;
        }

        const topProdData: (string | number)[][] = [['Producto', 'Unidades vendidos']];
        this.topProducts.slice(0, 10).forEach(p => {
          const shortName = p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name;
          topProdData.push([shortName, p.sales]);
        });

        data = google.visualization.arrayToDataTable(topProdData);
        options.title = 'Top 10 Productos Más Vendidos (General)';
        break;

      case 'topProductWeek':
        if (this.topProductsLastWeek.length === 0) {
          this.showNoDataMessage('No hay datos de productos vendidos en la última semana', 'calendar_today');
          return;
        }

        const lastWeekData: (string | number)[][] = [['Producto', 'Unidades Vendidas']];
        this.topProductsLastWeek.forEach(p => {
          const shortName = p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name;
          lastWeekData.push([shortName, p.sales]);
        });

        data = google.visualization.arrayToDataTable(lastWeekData);
        options.title = 'Productos Más Vendidos - Última Semana';
        options.colors = ['#34A853'];
        break;

      default:
        return;
    }

    const chartDiv = document.getElementById('chart_div');
    if (chartDiv) {
      chartDiv.innerHTML = '';

      if (data) {
        try {
          const chart = new google.visualization.ColumnChart(chartDiv);
          chart.draw(data, options);
        } catch (error) {
          console.error('Error al dibujar el gráfico:', error);
          this.showNoDataMessage('Error al mostrar el gráfico', 'error');
        }
      }
    }
  }

  private showNoDataMessage(message: string, icon: string): void {
    const chartDiv = document.getElementById('chart_div');
    if (chartDiv) {
      chartDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 400px; flex-direction: column; color: #666; text-align: center; padding: 20px;">
          <span class="material-icons" style="font-size: 64px; margin-bottom: 16px; color: #9e9e9e;">${icon}</span>
          <p style="font-size: 16px; margin-bottom: 8px; font-weight: 500;">${message}</p>
          <p style="font-size: 14px; color: #9e9e9e;">Los datos se mostrarán cuando haya ventas registradas</p>
        </div>
      `;
    }
  }

  // Método para formatear números
  formatNumber(num: number): string {
    return num.toLocaleString('es-ES');
  }
}
