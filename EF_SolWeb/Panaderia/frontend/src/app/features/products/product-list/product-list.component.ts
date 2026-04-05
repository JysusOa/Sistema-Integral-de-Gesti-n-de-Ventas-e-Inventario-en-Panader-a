import { Component, OnInit, ViewChild, OnDestroy, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip'; // Agregado por si acaso
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { ProductService } from '../product.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductResponse } from '../../../core/models/product-response.model';
import { CategoriaService } from '../../../core/models/categoria.service';
import { Categoria } from '../../../core/models/categoria.model';
import { ReportService } from '../../../core/services/report.service';
import { ConfirmDeleteDialogComponent } from '../../../shared/confirm-delete-dialog/confirm-delete-dialog.component';
import { QualityChecklistComponent } from '../quality-checklist/quality-checklist.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatPaginatorModule, MatSortModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatListModule, MatTooltipModule,
    ReactiveFormsModule, FormsModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProductListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<ProductResponse>([]); // Inicializado vacío

  // ⭐ VARIABLES PARA EL FILTRO DE ESTADO
  allProducts: ProductResponse[] = [];
  filterStatus: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';

  selectedView: string = 'productos';
  categoryForm: FormGroup;
  lstCategoria: Categoria[] = [];

  // Stock
  stockToUpdate: number = 0;
  selectedProductForStock: any = null;
  @ViewChild('restockDialog') restockDialog!: TemplateRef<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isAdmin: boolean = false;
  isJefeCalidad: boolean = false;
  isEmpleado: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private dialog: MatDialog,
    private reportService: ReportService
  ) {
    this.categoryForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadProducts();
    this.updateDisplayedColumns();
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  checkUserRole(): void {
    const userRole = this.authService.getUserRole();
    this.isAdmin = userRole === 'ADMINISTRADOR';
    this.isJefeCalidad = userRole === 'JEFE CALIDAD';
    this.isEmpleado = userRole === 'EMPLEADO';
  }

  // --- LÓGICA DE PRODUCTOS CON FILTRO ---

  loadProducts(): void {
    const productsSub = this.productService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data; // 1. Guardamos todo
        this.applyStatusFilter(); // 2. Filtramos según lo que el usuario quiera ver
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.snackBar.open('Error cargando productos', 'Cerrar', { duration: 3000 });
      }
    });
    this.subscriptions.add(productsSub);
  }

  // Cambiar entre ver Activos o Descontinuados
  setFilterStatus(status: 'ACTIVO' | 'INACTIVO'): void {
    this.filterStatus = status;
    this.applyStatusFilter();
  }

  // Aplicar el filtro a la tabla visual
  applyStatusFilter(): void {
    if (this.filterStatus === 'ACTIVO') {
      // Muestra todo lo que NO sea 'INACTIVO'
      this.dataSource.data = this.allProducts.filter(p => p.estado !== 'INACTIVO');
    } else {
      // Muestra SOLO lo 'INACTIVO'
      this.dataSource.data = this.allProducts.filter(p => p.estado === 'INACTIVO');
    }

    if (this.paginator) this.paginator.firstPage();
  }

  setupTable(): void {
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  updateDisplayedColumns(): void {
    const baseColumns = ['idProducto', 'marca', 'categoria', 'precio', 'stock', 'estado'];
    if (this.isAdmin || this.isJefeCalidad || this.isEmpleado) {
      this.displayedColumns = [...baseColumns, 'acciones'];
    } else {
      this.displayedColumns = baseColumns;
    }
  }

  // --- LÓGICA DE EDICIÓN / STOCK ---

  getEditRoute(product: any): string[] {
    if (this.isEmpleado) return ['/productos/editar-stock', product.idProducto];
    if (this.isAdmin) return ['/productos/editar', product.idProducto];
    return ['#'];
  }

  getEditTooltip(): string {
    if (this.isEmpleado) return 'Editar Stock (solo empleados)';
    if (this.isAdmin) return 'Editar Producto (administrador)';
    return 'Edición no permitida';
  }

  openRestockDialog(product: any): void {
    this.selectedProductForStock = product;
    this.stockToUpdate = product.stock;
    this.dialog.open(this.restockDialog, { width: '300px', disableClose: true });
  }

  saveNewStock(): void {
    if (this.stockToUpdate < 0) {
      this.snackBar.open('Stock inválido', 'Cerrar');
      return;
    }
    const updatedProduct = { ...this.selectedProductForStock, stock: this.stockToUpdate };

    this.productService.actualizarProducto(updatedProduct.idProducto, updatedProduct).subscribe({
      next: () => {
        this.snackBar.open('Stock actualizado 🍞', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.loadProducts();
        this.dialog.closeAll();
      },
      error: (err: any) => console.error(err)
    });
  }

  cancelRestock(): void {
    this.dialog.closeAll();
    this.selectedProductForStock = null;
    this.stockToUpdate = 0;
  }

  // --- ⭐ SOFT DELETE (DESACTIVAR Y REACTIVAR) ---

  confirmDelete(product: any): void {
    if (!this.isAdmin) return;

    if (product.estado === 'INACTIVO') {
        this.snackBar.open('Este producto ya está desactivado.', 'Cerrar', { duration: 3000 });
        return;
    }

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        titulo: 'Desactivar Producto',
        mensaje: `¿Estás seguro de desactivar "${product.nombre}"? No se podrá vender, pero se mantendrá en el historial.`
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.desactivarProducto(product);
      }
    });
  }

  desactivarProducto(product: any): void {
    const productoActualizado = { ...product, estado: 'INACTIVO' };

    this.productService.actualizarProducto(product.idProducto, productoActualizado).subscribe({
      next: () => {
        this.snackBar.open('Producto desactivado. Ver pestaña "Descontinuados"', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadProducts(); // Recarga y quita de la lista de Activos
      },
      error: (err: any) => {
        console.error('Error al desactivar:', err);
        this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Función para RESTAURAR un producto
  reactivarProducto(product: any): void {
    const productoActualizado = { ...product, estado: 'ACTIVO' };

    this.productService.actualizarProducto(product.idProducto, productoActualizado).subscribe({
      next: () => {
        this.snackBar.open('Producto HABILITADO nuevamente para venta 🍞', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadProducts(); // Recarga y vuelve a la lista de Activos
      },
      error: (err: any) => this.snackBar.open('Error al reactivar', 'Cerrar')
    });
  }

  // --- CATEGORÍAS ---

  cargarCategorias(): void {
    this.categoriaService.listarCategorias().subscribe({
      next: (data) => this.lstCategoria = data,
      error: (err) => console.error(err)
    });
  }

  onViewChange(view: string): void {
    this.selectedView = view;
    if (view === 'categorias' && this.lstCategoria.length === 0) this.cargarCategorias();
    if (view === 'productos') setTimeout(() => this.setupTable(), 100);
  }

  createCategory(): void {
    if (!this.isAdmin && !this.isJefeCalidad) return;

    if (this.categoryForm.valid) {
      const nombre = this.categoryForm.value.nombre.trim();
      const existe = this.lstCategoria.some(c => (c.nombre || '').toLowerCase() === nombre.toLowerCase());

      if (existe) {
        this.snackBar.open('⚠️ Esta categoría ya existe.', 'Cerrar', { duration: 3000 });
        return;
      }

      this.categoriaService.createCategoria({ nombre }).subscribe({
        next: () => {
          this.cargarCategorias();
          this.categoryForm.reset();
          this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        },
        error: () => this.snackBar.open('Error al crear categoría', 'Cerrar')
      });
    }
  }

  deleteCategory(id: number): void {
    if (!this.isAdmin) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { nombre: `la categoría`, tipo: 'categoría' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.categoriaService.deleteCategoria(id).subscribe({
          next: () => {
            this.cargarCategorias();
            this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          },
          error: () => this.snackBar.open('No se puede eliminar (tiene productos)', 'Cerrar')
        });
      }
    });
  }

  // --- INFORMES ---

  openProductReport(product: any): void {
    if (!this.isJefeCalidad) {
      this.snackBar.open('Sin permisos', 'Cerrar');
      return;
    }

    const dialogRef = this.dialog.open(QualityChecklistComponent, {
      width: '500px',
      data: product,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let iconName = 'verified';
        if (result.estado === 'Rechazado') iconName = 'report_problem';
        if (result.estado === 'Observado') iconName = 'warning';

        const nuevoReporte = {
          titulo: `Calidad: ${product.nombre}`,
          fecha: new Date().toLocaleDateString(),
          estado: result.estado,
          icon: iconName,
          detalles: result
        };

        this.reportService.addReport(nuevoReporte);
        this.snackBar.open(`Informe registrado para: ${product.nombre}`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
      }
    });
  }
}
