import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms'; // Importar AbstractControl y ValidatorFn
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { RegistroRequest } from '../../../core/models/registro-request.model'; // Ruta corregida
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Para el spinner de carga

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule // Añadido
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  roles: string[] = ['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE']; // Añadir 'CLIENTE' si es un rol común
  isLoading: boolean = false; // Nuevo: para el estado de carga del botón

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      dni: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{8}$/) // 8 dígitos numéricos
        ]
      ],
      nombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(50), // Aumentar maxLength para nombres más largos
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) // Solo letras y espacios
        ]
      ],
      apellidos: [
        '',
        [
          Validators.required,
          Validators.maxLength(50), // Aumentar maxLength
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/) // Solo letras y espacios
        ]
      ],
      telefono: [
        '',
        [
          Validators.pattern(/^\d{9}$/) // Exactamente 9 dígitos numéricos
        ]
      ],
      correo: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(100), // Aumentar maxLength para correos
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/) // Patrón de correo más genérico
        ]
      ],
      clave: [
        '',
        [
          Validators.required,
          Validators.minLength(8), // Aumentar minLength para mayor seguridad
          Validators.maxLength(255), // Aumentar maxLength para mayor flexibilidad
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/) // Al menos una mayúscula, una minúscula, un número y un carácter especial
        ]
      ],
      confirmarClave: ['', Validators.required], // Nuevo campo para confirmar contraseña
      rol: [
        'CLIENTE', // Valor por defecto para el rol
        [
          Validators.required,
          Validators.pattern('^(ADMINISTRADOR|EMPLEADO|CLIENTE)$') // Actualizar patrón si se añade 'CLIENTE'
        ]
      ]
    }, { validators: this.passwordMatchValidator }); // Añadir validador de confirmación de contraseña
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const userRole = this.authService.getUserRole();
      if (userRole === 'ADMINISTRADOR') {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/productos']);
      }
    }
  }

  // Validador personalizado para que las contraseñas coincidan
  private passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: boolean } | null => {
    const clave = control.get('clave');
    const confirmarClave = control.get('confirmarClave');

    if (!clave || !confirmarClave) {
      return null; // No se puede validar si los controles no existen
    }

    if (confirmarClave.errors && !confirmarClave.errors['mismatch']) {
      return null; // Ya hay otro error en confirmarClave, no sobrescribir
    }

    if (clave.value !== confirmarClave.value) {
      confirmarClave.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      confirmarClave.setErrors(null); // Limpiar el error si coinciden
      return null;
    }
  };

  // Función para capitalizar la primera letra de cada palabra
  private capitalizeWords(text: string): string {
    if (!text) return '';
    return text.split(' ').map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  // Método para aplicar el formateo al campo de nombre
  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.capitalizeWords(input.value);
    this.registerForm.get('nombre')?.setValue(formattedValue, { emitEvent: false }); // emitEvent: false para evitar bucles
  }

  // Método para aplicar el formateo al campo de apellidos
  onApellidosInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.capitalizeWords(input.value);
    this.registerForm.get('apellidos')?.setValue(formattedValue, { emitEvent: false });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true; // Activar estado de carga

    if (this.registerForm.valid) {
      const registroRequest: RegistroRequest = {
        dni: this.registerForm.get('dni')?.value,
        nombre: this.registerForm.get('nombre')?.value,
        apellidos: this.registerForm.get('apellidos')?.value,
        telefono: this.registerForm.get('telefono')?.value,
        correo: this.registerForm.get('correo')?.value,
        clave: this.registerForm.get('clave')?.value,
        rol: this.registerForm.get('rol')?.value
      };

      this.authService.registerUser(registroRequest).subscribe({
        next: (response) => {
          this.isLoading = false; // Desactivar estado de carga
          this.successMessage = 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.';
          this.snackBar.open(this.successMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false; // Desactivar estado de carga
          console.error('Error al registrar usuario:', err);
          // Mejorar el manejo de errores específicos del backend
          if (err.status === 409) { // Conflict, ej. correo o DNI ya registrado
            this.errorMessage = 'El correo electrónico o DNI ya están registrados.';
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else if (err.error?.detail) {
            this.errorMessage = err.error.detail;
          } else {
            this.errorMessage = 'Ocurrió un error al intentar registrar el usuario. Intente más tarde.';
          }
          this.snackBar.open(this.errorMessage ?? 'Ocurrió un error desconocido.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      this.isLoading = false; // Desactivar estado de carga
      this.errorMessage = 'Por favor, corrija los errores en el formulario.';
      this.snackBar.open(this.errorMessage , 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      this.registerForm.markAllAsTouched(); // Marcar todos los campos como tocados para mostrar errores
    }
  }
}
