import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';  // Para cargar múltiples observables en paralelo
import { CategoriaService } from '../../core/models/categoria.service';
import { Categoria } from '../../core/models/categoria.model';
import { ProductResponse } from '../../core/models/product-response.model';
import { ProductService } from '../products/product.service';

// Interfaz para extender Categoria con productos (para tipado)
interface CategoriaConProductos extends Categoria {
  productos: ProductResponse[];  // Agrega array de productos a cada categoría
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.css'],
  imports: [CommonModule, HttpClientModule],  // Standalone, importa módulos necesarios
})
export class CatalogoComponent implements OnInit {
  // Propiedades para almacenar datos
  lstCategoria: Categoria[] = [];  // Lista de categorías del backend
  productos: ProductResponse[] = [];  // Lista de productos del backend
  categoriasConSusProductos: CategoriaConProductos[] = [];  // Array organizado: categorías con sus productos
  isLoading = true;  // Flag para mostrar "Cargando..."
  errorMessage = '';  // Mensaje de error si falla la carga

  constructor(
    private categoriaService: CategoriaService,  // Servicio para categorías
    private productService: ProductService  // Servicio para productos
  ) {}

  ngOnInit(): void {
    this.loadData();  // Llama al método de carga al inicializar
  }

  // Método para cargar categorías y productos en paralelo
  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({  // Combina dos llamadas HTTP para que se ejecuten juntas
      categorias: this.categoriaService.listarCategorias(),  // Llama al endpoint de categorías
      productos: this.productService.getProducts()  // Llama al endpoint de productos
    }).subscribe({
      next: ({ categorias, productos }) => {  // Cuando ambas llamadas terminen
        this.lstCategoria = categorias;  // Asigna categorías
        this.productos = productos;  // Asigna productos
        console.log('Datos cargados - Categorías:', categorias);  // Log para depurar
        console.log('Datos cargados - Productos:', productos);
        this.organizarProductosPorCategoria();  // Agrupa productos por categoría
        this.isLoading = false;  // Oculta "Cargando..."
      },
      error: (err) => {  // Si alguna llamada falla
        console.error('Error al cargar datos:', err);
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar las categorías o productos.';  // Muestra error en UI
      },
    });
  }

  // Método para organizar productos por categoría
  private organizarProductosPorCategoria(): void {
    console.log('Iniciando organización...');  // Log de inicio
    console.log('Categorías disponibles:', this.lstCategoria);
    console.log('Productos disponibles:', this.productos);

    // Agrega este console.log para ver la estructura real de los productos
  console.log('Estructura de primer producto:', this.productos[0]);
  console.log('Categoría del primer producto:', this.productos[0]?.categoria);
  console.log('Categoría del primer producto (minúscula):', this.productos[0]?.categoria);

    this.categoriasConSusProductos = this.lstCategoria.map(categoria => {  // Para cada categoría
      const productosFiltrados = this.productos.filter(producto => {  // Filtra productos que coincidan
        const productoCategoriaId = producto.categoria?.idCategoria;  // Accede a idCategoria (mayúscula, según modelo TS)
        const categoriaId = categoria.idCategoria;
        const match = productoCategoriaId !== undefined && productoCategoriaId === categoriaId;  // Compara IDs
        console.log(`Producto "${producto.nombre}": ... match=${match}`);  // Log detallado por producto
        return match;
      });
      console.log(`Categoría "${categoria.nombre}": productos asignados:`, productosFiltrados.length);  // Log por categoría
      return {
        ...categoria,  // Copia la categoría
        productos: productosFiltrados  // Agrega productos filtrados
      };
    });

    // Maneja productos sin categoría asignada
    const productosSinCategoria = this.productos.filter(p => !p.categoria || !p.categoria.idCategoria);
    if (productosSinCategoria.length > 0) {
      this.categoriasConSusProductos.push({  // Agrega una categoría "Sin Categoría"
        idCategoria: 0,
        nombre: 'Sin Categoría',
        productos: productosSinCategoria
      });
      console.log('Productos sin categoría agregados:', productosSinCategoria);
    }

    console.log('categoriasConSusProductos final:', this.categoriasConSusProductos);  // Log final
  }
}
