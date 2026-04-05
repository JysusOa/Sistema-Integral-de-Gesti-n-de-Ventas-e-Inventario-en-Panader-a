import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

// Interfaz para los items del checklist
interface CheckItem {
  criterio: string;
  cumple: boolean;
}

@Component({
  selector: 'app-quality-checklist',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './quality-checklist.component.html',
  styleUrls: ['./quality-checklist.component.css']
})
export class QualityChecklistComponent {

  // Lista de verificación estándar para panadería
  checklist: CheckItem[] = [
    { criterio: 'Integridad del empaque (sin roturas)', cumple: false },
    { criterio: 'Etiquetado correcto (Fecha vcto. visible)', cumple: false },
    { criterio: 'Olor característico (fresco)', cumple: false },
    { criterio: 'Textura adecuada (según producto)', cumple: false },
    { criterio: 'Ausencia de moho o agentes extraños', cumple: false }
  ];

  observaciones: string = '';
  estadoFinal: string = 'Pendiente';

  constructor(
    public dialogRef: MatDialogRef<QualityChecklistComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí recibimos el producto
  ) {}

  guardarInforme(): void {
    // Aquí iría la lógica para enviar al backend
    const reporte = {
      productoId: this.data.idProducto,
      checklist: this.checklist,
      observaciones: this.observaciones,
      estado: this.estadoFinal,
      fecha: new Date()
    };

    console.log('Informe Generado:', reporte);
    this.dialogRef.close(reporte); // Cerramos y devolvemos el reporte
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
