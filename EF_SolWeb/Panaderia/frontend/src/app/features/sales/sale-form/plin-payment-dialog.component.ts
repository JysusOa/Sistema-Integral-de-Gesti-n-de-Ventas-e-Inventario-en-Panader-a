import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-plin-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="plin-dialog-container">
      <!-- Imagen en la parte superior -->
      <div class="image-container">
        <img src="assets/imagen/plin.png" alt="Plin Logo" class="plin-image" />
      </div>

      <!-- Título del diálogo -->
      <h2 class="dialog-title">Pago con Plin 💙</h2>
      <p class="dialog-subtitle">Ingrese el código de operación de 6 dígitos</p>

      <!-- Campos debajo de la imagen -->
      <form [formGroup]="plinForm" class="fields-container">
        <!-- Código de Operación (SOLO ESTE CAMPO) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código de Operación 🔢</mat-label>
          <mat-icon matPrefix>lock</mat-icon>
          <input matInput formControlName="operationCode"
                 type="tel"
                 maxlength="6"
                 placeholder="Ej: 654321"
                 (keypress)="blockNonNumericInput($event)" />
          <mat-error *ngIf="plinForm.get('operationCode')?.hasError('required') && plinForm.get('operationCode')?.touched">
            El código es obligatorio
          </mat-error>
          <mat-error *ngIf="plinForm.get('operationCode')?.hasError('pattern')">
            6 dígitos numéricos requeridos
          </mat-error>
        </mat-form-field>

        <!-- Nota informativa -->
        <div class="info-note">
          <mat-icon class="info-icon">info</mat-icon>
          <span>El código de operación se genera automáticamente en la app de Plin después de realizar el pago</span>
        </div>
      </form>

      <!-- Botones de acción -->
      <div class="buttons-container">
        <button mat-button (click)="onCancel()" class="cancel-btn">Cancelar</button>
        <button mat-raised-button
                color="primary"
                (click)="onConfirm()"
                [disabled]="!plinForm.valid"
                class="confirm-btn">
          Confirmar Pago
        </button>
      </div>
    </div>
  `,
  styles: [`
    .plin-dialog-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      min-width: 350px;
    }
    .image-container {
      margin-bottom: 16px;
    }
    .plin-image {
      width: 150px;
      height: auto;
    }
    .dialog-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 8px 0 4px;
      text-align: center;
    }
    .dialog-subtitle {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
      text-align: center;
    }
    .fields-container {
      width: 100%;
      margin-bottom: 24px;
    }
    .full-width {
      width: 100%;
    }
    .info-note {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background-color: #E3F2FD;
      border-radius: 8px;
      color: #1565C0;
      font-size: 13px;
      line-height: 1.4;
    }
    .info-icon {
      color: #2196F3;
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .buttons-container {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      width: 100%;
    }
    .cancel-btn {
      min-width: 100px;
    }
    .confirm-btn {
      min-width: 140px;
    }
  `]
})
export class PlinPaymentDialogComponent {
  plinForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PlinPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { operationCode: string } // Cambiado: solo operationCode
  ) {
    this.plinForm = this.fb.group({
      operationCode: [data.operationCode || '', [
        Validators.required,
        Validators.pattern(/^\d{6}$/)
      ]]
    });
  }

  onConfirm(): void {
    if (this.plinForm.valid) {
      // Solo devuelve el código de operación
      this.dialogRef.close({
        operationCode: this.plinForm.value.operationCode
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  blockNonNumericInput(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
}
