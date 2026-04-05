import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core'; // Añadir OnDestroy
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../../../core/models/user.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs'; // Importar Subject y takeUntil

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy { // Implementar OnDestroy
  displayedColumns: string[] = ['id', 'nombre', 'apellidos', 'telefono', 'correo', 'rol', 'acciones'];
  dataSource!: MatTableDataSource<User>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>(); // Subject para desuscripción

  constructor(private userService: UserService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void { // Implementar ngOnDestroy
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.userService.getUsers().pipe(takeUntil(this.destroy$)).subscribe({ // Usar takeUntil
      next: (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage = 'No se pudieron cargar los usuarios. Por favor, intente de nuevo más tarde.';
        this.snackBar.open(this.errorMessage ?? 'Error desconocido al cargar usuarios.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  deleteUser(id: number | undefined): void {
    if (id === undefined) {
      this.errorMessage = 'ID de usuario no válido para eliminar.';
      this.snackBar.open(this.errorMessage ?? 'Error desconocido.', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.userService.deleteUser(id).pipe(takeUntil(this.destroy$)).subscribe({ // Usar takeUntil
        next: (response) => {
          this.successMessage = response || 'Usuario eliminado exitosamente.';
          this.errorMessage = null;
          this.snackBar.open(this.successMessage ?? 'Operación exitosa.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          this.errorMessage = err.error || 'Ocurrió un error al eliminar el usuario.';
          this.successMessage = null;
          this.snackBar.open(this.errorMessage ?? 'Error desconocido al eliminar.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }
}
