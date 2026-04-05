import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { User } from '../../../core/models/user.model';
import { RegistroRequest } from '../../../core/models/registro-request.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, take } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

// --- CONSTANTES PARA MEJORAR LA MANTENIBILIDAD ---
const SNACKBAR_DURATION_SUCCESS = 3000;
const SNACKBAR_DURATION_ERROR = 5000;

const MESSAGES = {
  USER_CREATED_SUCCESS: 'Usuario creado exitosamente.',
  USER_UPDATED_SUCCESS: 'Usuario actualizado exitosamente.',
  LOAD_USER_ERROR: 'No se pudo cargar la información del usuario.',
  CREATE_USER_ERROR: 'Error al crear el usuario.',
  UPDATE_USER_ERROR: 'Error al actualizar el usuario.',
  FORM_INVALID: 'Por favor, corrija los errores en el formulario.',
  UNKNOWN_ERROR: 'Error desconocido.',
  ADMIN_ROLE_PROTECTED: 'No puedes cambiar el rol de un administrador a empleado.'
};
// -------------------------------------------------

// --- VALIDATOR PERSONALIZADO PARA TELÉFONO PERUANO ---
function peruPhoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;
    if (!value) {
      return null; // No validar si está vacío (si no es requerido)
    }
    // Expresión regular para 9 dígitos que empiezan con '9'
    const valid = /^(9\d{8})$/.test(value);
    return valid ? null : { 'peruPhoneNumber': { value: value } };
  };
}

// --- VALIDATOR PERSONALIZADO PARA SOLO LETRAS Y ESPACIOS ---
function lettersOnlyValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    // Permite letras (incluyendo tildes y ñ/Ñ) y espacios
    const valid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value);
    return valid ? null : { 'lettersOnly': { value: value } };
  };
}

@Component({
  selector: 'app-user-form',
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
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  isEditMode: boolean = false;
  userId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  roles: string[] = ['ADMINISTRADOR', 'EMPLEADO', 'JEFE CALIDAD'];
  isLoading: boolean = false;
  isAdminUser: boolean = false; // Nueva variable para saber si el usuario es administrador
  isCurrentUserAdmin: boolean = false; // Nueva variable para saber si el usuario logueado es admin
  rolFieldDisabled: boolean = false; // Controla si el campo rol está deshabilitado

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    public router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService // Agregar AuthService
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(20), lettersOnlyValidator()]],
      apellidos: ['', [Validators.required, Validators.maxLength(20), lettersOnlyValidator()]],
      telefono: ['', [peruPhoneNumberValidator()]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(25)]],
      clave: ['', [Validators.minLength(6), Validators.maxLength(25)]],
      rol: ['', [Validators.required, Validators.pattern('ADMINISTRADOR|EMPLEADO|JEFE CALIDAD')]]
    });
  }

  ngOnInit(): void {
    // Verificar si el usuario actual es administrador
    const currentUser = this.authService.currentUserValue;
    this.isCurrentUserAdmin = currentUser?.rol === 'ADMINISTRADOR';

    this.route.paramMap.pipe(take(1)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.isEditMode = true;
        this.loadUser(this.userId);
      } else {
        this.userForm.get('clave')?.setValidators([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(255)
        ]);
        this.userForm.get('clave')?.updateValueAndValidity();
      }
    });

    // Suscribirse a cambios para formatear nombre y apellidos
    this.userForm.get('nombre')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value && typeof value === 'string') {
        const formattedValue = this._capitalizeFirstLetter(value);
        if (formattedValue !== value) {
          this.userForm.get('nombre')?.setValue(formattedValue, { emitEvent: false });
        }
      }
    });

    this.userForm.get('apellidos')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value && typeof value === 'string') {
        const formattedValue = this._capitalizeFirstLetter(value);
        if (formattedValue !== value) {
          this.userForm.get('apellidos')?.setValue(formattedValue, { emitEvent: false });
        }
      }
    });

    // Suscribirse a cambios en el campo rol para validar
    this.userForm.get('rol')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(newRole => {
      if (this.isEditMode && this.isAdminUser && newRole === 'EMPLEADO') {
        // Revertir el cambio si intentan cambiar de ADMINISTRADOR a EMPLEADO
        this.snackBar.open(MESSAGES.ADMIN_ROLE_PROTECTED, 'Cerrar', {
          duration: SNACKBAR_DURATION_ERROR,
          panelClass: ['snackbar-warn']
        });
        this.userForm.get('rol')?.setValue('ADMINISTRADOR', { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(id: number): void {
    this.userService.getUserById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.isAdminUser = user.rol === 'ADMINISTRADOR';

        // Si el usuario es administrador y no es el usuario actual, bloquear el campo rol
        if (this.isAdminUser && this.isCurrentUserAdmin) {
          this.rolFieldDisabled = true;
        }

        this.userForm.patchValue({
          nombre: user.nombre,
          apellidos: user.apellidos,
          telefono: user.telefono,
          correo: user.correo,
          rol: user.rol
        });
      },
      error: (err) => {
        console.error('Error al cargar usuario:', err);
        this._handleError(err, MESSAGES.LOAD_USER_ERROR);
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    // Validación adicional: No permitir cambiar administrador a empleado
    if (this.isEditMode && this.isAdminUser) {
      const newRole = this.userForm.get('rol')?.value;
      if (newRole === 'EMPLEADO') {
        this.errorMessage = MESSAGES.ADMIN_ROLE_PROTECTED;
        this.snackBar.open(this.errorMessage as string, 'Cerrar', {
          duration: SNACKBAR_DURATION_ERROR,
          panelClass: ['snackbar-error']
        });
        return;
      }
    }

    if (this.userForm.valid) {
      this.isLoading = true;
      if (this.isEditMode) {
        this._updateUser();
      } else {
        this._createUser();
      }
    } else {
      this.errorMessage = MESSAGES.FORM_INVALID;
      this.snackBar.open(this.errorMessage as string, 'Cerrar', {
        duration: SNACKBAR_DURATION_ERROR,
        panelClass: ['snackbar-error']
      });
      this.userForm.markAllAsTouched();
    }
  }

  private _createUser(): void {
    const newUser: RegistroRequest = this.userForm.value;
    this.userService.createUser(newUser).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = MESSAGES.USER_CREATED_SUCCESS;
        this.snackBar.open(this.successMessage, 'Cerrar', {
          duration: SNACKBAR_DURATION_SUCCESS,
          panelClass: ['snackbar-success']
        });
        setTimeout(() => this.router.navigate(['/usuarios']), 2000);
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
        this._handleError(err, MESSAGES.CREATE_USER_ERROR);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private _updateUser(): void {
    const userToUpdate: User = { ...this.userForm.value, id: this.userId };
    if (!userToUpdate.clave) {
      delete userToUpdate.clave;
    }

    this.userService.updateUser(this.userId!, userToUpdate).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.successMessage = MESSAGES.USER_UPDATED_SUCCESS;
        this.snackBar.open(this.successMessage, 'Cerrar', {
          duration: SNACKBAR_DURATION_SUCCESS,
          panelClass: ['snackbar-success']
        });
        setTimeout(() => this.router.navigate(['/usuarios']), 2000);
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        this._handleError(err, MESSAGES.UPDATE_USER_ERROR);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private _handleError(err: any, defaultMessage: string): void {
    this.errorMessage = err.error?.message || err.error || defaultMessage || MESSAGES.UNKNOWN_ERROR;
    this.snackBar.open(this.errorMessage as string, 'Cerrar', {
      duration: SNACKBAR_DURATION_ERROR,
      panelClass: ['snackbar-error']
    });
    this.isLoading = false;
  }

  // --- Función para capitalizar la primera letra y el resto en minúsculas ---
  private _capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    // Convertir todo a minúsculas, luego capitalizar la primera letra
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}
