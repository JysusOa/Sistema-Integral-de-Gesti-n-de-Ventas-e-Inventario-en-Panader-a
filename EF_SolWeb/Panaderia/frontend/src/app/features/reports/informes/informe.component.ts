import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

// Servicios
import { ReportService, Reporte } from '../../../core/services/report.service';
import { AuthService } from '../../../core/auth/auth.service'; // ⭐ IMPORTANTE
import { ReportDetailComponent } from '../report-detail/report-detail.component';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './informe.component.html',
  styleUrls: ['./informe.component.css']
})
export class InformesComponent implements OnInit {

  reportes: Reporte[] = [];
  isAdmin: boolean = false; // ⭐ Variable para controlar permiso

  constructor(
    private reportService: ReportService,
    private authService: AuthService, // ⭐ Inyectamos AuthService
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // 1. Suscribirse a los datos
    this.reportService.reportes$.subscribe(data => this.reportes = data);

    // 2. ⭐ Verificar si es administrador
    const role = this.authService.getUserRole();
    this.isAdmin = role === 'ADMINISTRADOR';
  }

  verDetalles(reporte: Reporte) {
    this.dialog.open(ReportDetailComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: reporte,
      panelClass: 'custom-modal-container'
    });
  }

  generarReporte() {
    // Esta función podría abrir un formulario manual si lo deseas en el futuro
    alert('Para generar un informe, ve a Inventario -> Selecciona un producto -> Icono de Calidad');
  }

  eliminarInforme(id: string, event: Event) {
    event.stopPropagation();

    // ⭐ Doble verificación de seguridad
    if (!this.isAdmin) {
      this.snackBar.open('No tienes permisos para eliminar informes', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    if (confirm('¿Estás seguro de eliminar este informe permanentemente?')) {
      this.reportService.deleteReport(id);
      this.snackBar.open('Informe eliminado', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-success'] // Ajustado a success si se borra bien
      });
    }
  }
}
