import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; // Importar AbstractControl
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegistroRequest } from '../../../core/models/registro-request.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isRegisterMode: boolean = false;
  isLoading: boolean = false;
  isCheckingSession: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      clave: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]], // Solo letras y espacios
      apellidos: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]], // Solo letras y espacios
      correo: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      confirmarClave: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]], // 9 dígitos, solo números
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]], // 8 dígitos, solo números
      rol: ['CLIENTE'] // Rol por defecto, no editable por el usuario en el formulario
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  // 1. Verificación rápida inicial
  if (this.authService.isAuthenticated()) {
    this.redirectByRole();
    return;
  }

  // 2. EL TRUCO: Esperar un poco antes de mostrar el formulario
  // Esto da tiempo al sistema para leer el token si hubo un retraso al recargar
  setTimeout(() => {
    // Volvemos a preguntar después de 300ms
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    } else {
      // Solo si después de esperar seguimos sin usuario, mostramos el login
      this.isCheckingSession = false;
    }
  }, 300); // 300 milisegundos de espera (casi imperceptible para el humano)
}

  private passwordMatchValidator(form: FormGroup) {
    const clave = form.get('clave')?.value;
    const confirmarClave = form.get('confirmarClave')?.value;
    if (clave && confirmarClave && clave !== confirmarClave) {
      return { 'mismatch': true };
    }
    return null;
  }

  private redirectByRole(): void {
    const userRole = this.authService.getUserRole();
    if (userRole === 'ADMINISTRADOR') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/productos']);
    }
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = null;
    this.loginForm.reset();
    this.registerForm.reset();
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsUntouched();
      this.loginForm.get(key)?.markAsPristine();
    });
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsUntouched();
      this.registerForm.get(key)?.markAsPristine();
    });
  }

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

  onLoginSubmit(): void {
    this.errorMessage = null;
    this.isLoading = true;

    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading = false;
          if (this.authService.isAuthenticated()) {
            this.snackBar.open('¡Inicio de sesión exitoso!', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });
            this.redirectByRole();
          } else {
            this.errorHandler('Credenciales inválidas o error de autenticación. Por favor, intente de nuevo.');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('DEBUG Frontend LoginComponent: Error en el login:', error);
          if (error.status === 401 || error.status === 400) {
            this.errorHandler('Correo o clave incorrectos. Verifique sus credenciales.');
          } else {
            this.errorHandler('Ocurrió un error al intentar iniciar sesión. Intente más tarde.');
          }
        }
      });
    } else {
      this.isLoading = false;
      this.errorHandler('Por favor, complete todos los campos requeridos para iniciar sesión.');
      this.loginForm.markAllAsTouched();
    }
  }

  onRegisterSubmit(): void {
    this.errorMessage = null;
    this.isLoading = true;

    if (this.registerForm.valid) {
      const registroData: RegistroRequest = {
        nombre: this.registerForm.get('nombre')?.value,
        apellidos: this.registerForm.get('apellidos')?.value, // Asegúrate de que este campo exista en RegistroRequest
        correo: this.registerForm.get('correo')?.value,
        clave: this.registerForm.get('clave')?.value,
        telefono: this.registerForm.get('telefono')?.value, // Asegúrate de que este campo exista en RegistroRequest
        dni: this.registerForm.get('dni')?.value,           // Asegúrate de que este campo exista en RegistroRequest
        rol: this.registerForm.get('rol')?.value            // Asegúrate de que este campo exista en RegistroRequest
      };

      this.authService.registerUser(registroData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('¡Registro exitoso! Ahora puedes iniciar sesión.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-success']
          });
          this.toggleMode();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('DEBUG Frontend LoginComponent: Error en el registro:', error);
          if (error.status === 409) {
            this.errorHandler('El correo electrónico ya está registrado.');
          } else {
            this.errorHandler('Ocurrió un error al intentar registrarse. Intente más tarde.');
          }
        }
      });
    } else {
      this.isLoading = false;
      this.errorHandler('Por favor, complete todos los campos requeridos para registrarse.');
      this.registerForm.markAllAsTouched();
    }
  }

  private errorHandler(message: string): void {
    this.errorMessage = message;
    this.snackBar.open(this.errorMessage, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }
}
