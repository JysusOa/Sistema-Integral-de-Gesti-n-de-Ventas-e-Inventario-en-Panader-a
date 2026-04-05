import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

// Servicios
import { ProductService } from '../product.service';
import { CategoriaService } from '../../../core/models/categoria.service';
import { Categoria } from '../../../core/models/categoria.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    //RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './product-form.component.html', // ⭐ Apunta a su propio HTML
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit { // ⭐ Nombre correcto de la clase

  productForm: FormGroup;
  isEditMode: boolean = false;
  productId: number | null = null;
  categorias: Categoria[] = [];
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoriaService: CategoriaService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      marca: ['', Validators.maxLength(50)],
      descripcion: ['', Validators.maxLength(255)],
      precio: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      unidadMedida: ['UNIDAD', Validators.required],
      idCategoria: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // 1. Cargar Categorías
    this.cargarCategorias();

    // 2. Verificar si es edición (buscando ID en la URL)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = +id;
        this.cargarProductoParaEditar(this.productId);
      }
    });
  }

  cargarCategorias(): void {
    this.categoriaService.listarCategorias().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  cargarProductoParaEditar(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        // Llenar el formulario con los datos
        this.productForm.patchValue({
          nombre: product.nombre,
          marca: product.marca,
          descripcion: product.descripcion,
          precio: product.precio,
          stock: product.stock,
          unidadMedida: product.unidadMedida,
          idCategoria: product.categoria?.idCategoria // Asumiendo que el objeto categoria viene anidado
        });

        // Si hay imagen, mostrar preview (lógica básica)
        if (product.imagenUrl) {
          this.imagePreview = product.imagenUrl;
        }
      },
      error: (err) => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/productos']);
      }
    });
  }

  // Manejo de selección de archivo (Imagen)
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productData = this.productForm.value;

    if (this.isEditMode && this.productId) {
      // ⭐ ERROR 1: Asegúrate de que actualizarProducto retorna un observable en el servicio
      this.productService.actualizarProducto(this.productId, productData).subscribe({
        next: () => {
          this.snackBar.open('Producto actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/productos']);
        },
        // ⭐ ERROR 2: Agrega ": any" al error
        error: (err: any) => {
          console.error(err);
          this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        }
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: () => {
          this.snackBar.open('Producto creado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.router.navigate(['/productos']);
        },
        // ⭐ ERROR 2: Agrega ": any" al error
        error: (err: any) => {
          console.error(err);
          this.snackBar.open('Error al crear', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/productos']);
  }
}
