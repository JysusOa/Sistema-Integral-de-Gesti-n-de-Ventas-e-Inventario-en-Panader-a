import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProductRequest } from '../../../core/models/product-request.model'
import { CategoriaService } from '../../../core/models/categoria.service';
import { ProductService } from '../product.service';
import { ImageUploadService } from '../ImageUpload.Service';
import { ProductResponse } from '../../../core/models/product-response.model';
import { Categoria } from '../../../core/models/categoria.model';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ProductEditComponent implements OnInit {
  productForm: FormGroup;
  productId: number | null = null;
  lstCategoria: Categoria[] = [];
  unidadesPosibles: string[] = ['Kg', 'ml', 'L', 'gr', 'porciones', 'molde', 'paquete (12 uni)', 'unidad'];
  unidadesDisponibles: string[] = [...this.unidadesPosibles];
  isUnidadMedidaRequired: boolean = true;
  mostrarUnidadMedida: boolean = true;
  mostrarMarca: boolean = true;
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoriaService: CategoriaService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private imageUploadService: ImageUploadService
  ) {
    this.productForm = this.fb.group({
      idCategoria: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(200)]],
      marca: [''],
      unidadMedida: [''],
      descripcion: ['', Validators.maxLength(500)],
      precio: ['', [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      stock: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      imagenUrl: ['']
    });

    this.categoriaService.listarCategorias().subscribe(x => {
      this.lstCategoria = x;
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.productId = +idParam;
        this.loadProduct(this.productId);
      }
    });
  }

  onCategoriaChange(): void {
    const categoriaSeleccionada = this.lstCategoria.find(c => c.idCategoria === this.productForm.value.idCategoria);
    if (!categoriaSeleccionada) return;

    const nombreCategoria = categoriaSeleccionada?.nombre?.toLowerCase();
    const unidadActual = this.productForm.value.unidadMedida;

    if (nombreCategoria === 'panes artesanales') {
      this.mostrarMarca = false;
      this.mostrarUnidadMedida = true;
      this.unidadesDisponibles = ['unidad'];
      this.isUnidadMedidaRequired = true;

      this.productForm.patchValue({
        marca: '',
        unidadMedida: 'unidad'
      });
      this.productForm.get('marca')?.clearValidators();

    } else if (nombreCategoria === 'panes industriales') {
      this.mostrarMarca = true;
      this.mostrarUnidadMedida = true;
      this.unidadesDisponibles = ['molde', 'paquete (12 uni)', 'unidad'];
      this.productForm.get('marca')?.setValidators([Validators.required, Validators.maxLength(100)]);
      this.productForm.patchValue({
        unidadMedida: this.unidadesDisponibles.includes(unidadActual) ? unidadActual : ''
      });

    } else if (nombreCategoria === 'bebidas') {
      this.mostrarMarca = true;
      this.mostrarUnidadMedida = true;
      this.unidadesDisponibles = ['L', 'ml'];
      this.productForm.get('marca')?.setValidators([Validators.required, Validators.maxLength(100)]);
      this.productForm.patchValue({
        unidadMedida: this.unidadesDisponibles.includes(unidadActual) ? unidadActual : ''
      });

    } else if (nombreCategoria === 'tortas') {
      this.mostrarMarca = true;
      this.mostrarUnidadMedida = true;
      this.unidadesDisponibles = ['Unid', 'porciones'];
      this.productForm.get('marca')?.setValidators([Validators.required, Validators.maxLength(100)]);
      this.productForm.patchValue({
        unidadMedida: this.unidadesDisponibles.includes(unidadActual) ? unidadActual : ''
      });

    } else {
      this.mostrarMarca = true;
      this.mostrarUnidadMedida = true;
      this.unidadesDisponibles = [...this.unidadesPosibles];
      this.productForm.get('marca')?.setValidators([Validators.required, Validators.maxLength(100)]);
      this.productForm.patchValue({
        unidadMedida: this.unidadesPosibles.includes(unidadActual) ? unidadActual : ''
      });
    }

    this.productForm.get('marca')?.updateValueAndValidity();
  }

  async actualizarProducto(): Promise<void> {
    if (!this.productForm.valid || !this.productId) {
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
        duration: 4000,
        panelClass: ['snackbar-error']
      });
      this.productForm.markAllAsTouched();
      return;
    }

    let finalImageUrl = this.productForm.value.imagenUrl;
    if (this.selectedFile) {
      finalImageUrl = await this.uploadImage(this.selectedFile);
    }

    const categoriaSeleccionada = this.lstCategoria.find(c => c.idCategoria === this.productForm.value.idCategoria);
    const nombreCategoria = categoriaSeleccionada?.nombre?.toLowerCase();

    const productToSend: ProductRequest = {
      idCategoria: this.productForm.value.idCategoria,
      nombre: this.productForm.value.nombre.trim(),
      marca: nombreCategoria === 'panes artesanales' ? '' : this.productForm.value.marca.trim(),
      unidadMedida: this.productForm.value.unidadMedida,
      descripcion: this.productForm.value.descripcion.trim(),
      precio: this.productForm.value.precio,
      stock: this.productForm.value.stock,
      imagenUrl: finalImageUrl
    };

    this.productService.updateProduct(this.productId, productToSend).subscribe({
      next: () => {
        this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        setTimeout(() => this.router.navigate(['/productos']), 1500);
      },
      error: () => {
        this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product: ProductResponse) => {
        this.productForm.patchValue({
          idCategoria: product.categoria, // ← CORREGIDO
          nombre: product.nombre,
          marca: product.marca || '',
          unidadMedida: product.unidadMedida || '',
          descripcion: product.descripcion,
          precio: product.precio,
          stock: product.stock,
          imagenUrl: product.imagenUrl
        });

        this.imagePreview = product.imagenUrl || null;
        this.onCategoriaChange();
      },
      error: () => {
        this.snackBar.open('Error al cargar el producto', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await firstValueFrom(
        this.http.post<{ url: string }>('http://localhost:8080/api/upload', formData)
      );
      return response.url;
    } catch {
      return '';
    }
  }

  goToProductos(): void {
    this.router.navigate(['/productos']);
  }

  openFileInput(): void {
    (document.getElementById('imageInput') as HTMLInputElement).click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.productForm.patchValue({ imagenUrl: this.imagePreview });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}

