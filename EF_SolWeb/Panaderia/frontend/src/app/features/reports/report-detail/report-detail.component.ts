import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.css']
})
export class ReportDetailComponent {

  constructor(
    public dialogRef: MatDialogRef<ReportDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Recibimos el reporte completo
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  imprimir(): void {
    window.print(); // Funcionalidad nativa para imprimir navegador
  }

  // Helper para obtener color según estado
  getStatusColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'aprobado': return '#2E7D32'; // Verde
      case 'rechazado': return '#C62828'; // Rojo
      case 'observado': return '#EF6C00'; // Naranja
      default: return '#757575';
    }
  }
}
