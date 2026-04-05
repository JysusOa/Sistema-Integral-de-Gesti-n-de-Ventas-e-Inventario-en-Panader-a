import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Categoria } from '../models/categoria.model';
import { AppSettings } from '../../app.settings';


const baseUrlUtil = AppSettings.API_ENDPOINT + "/util"

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {

  constructor(private http: HttpClient) { }
  private apiUrl = 'http://localhost:8080';

  listarCategorias(): Observable<Categoria[]>{
    return this.http.get<Categoria[]>(baseUrlUtil + '/listaCategoria');
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}`);
  } 

  createCategoria(categoria: { nombre: string }): Observable<Categoria> {
    //return this.http.post<Categoria>(this.apiUrl, categoria);
    return this.http.post<Categoria>(`${this.apiUrl}/categorias`, categoria);
  }

  deleteCategoria(idCategoria: number): Observable<void> {
    //return this.http.delete<void>(`${this.apiUrl}/${idCategoria}`);
    return this.http.delete<void>(`${this.apiUrl}/categorias/${idCategoria}`);
  }
/*
  getCategoriaById(idCategoria: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${idCategoria}`);
  } */

  /*
  getCatalogoCompleto(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/catalogo`);
  }*/
  
  /*
  // 🟢 MÉTODO PRINCIPAL: Obtener categorías (SOLO MOCK POR AHORA)
  getCategorias(): Observable<Categoria[]> {
    console.log('📦 Usando datos MOCK de categorías');
    return of([...this.categoriasMock]); // Retorna copia del array
    
    // ⚠️ Temporalmente comentado hasta que el backend funcione
    // return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
  } 

  // 🟢 Crear categoría (MOCK)
  createCategoria(categoria: { nombre: string }): Observable<Categoria> {
    console.log('📦 Creando categoría MOCK:', categoria);
    
    const nuevaCategoria: Categoria = {
      idCategoria: Math.max(...this.categoriasMock.map(c => c.idCategoria)) + 1,
      nombre: categoria.nombre.trim(),
      descripcion: '',
      activo: true,
      fechaCreacion: new Date()
    };
    
    this.categoriasMock.push(nuevaCategoria);
    return of({...nuevaCategoria}); // Retorna copia
  }

  // 🟢 Eliminar categoría (MOCK)
  deleteCategoria(id: number): Observable<void> {
    console.log('📦 Eliminando categoría MOCK id:', id);
    
    const index = this.categoriasMock.findIndex(c => c.idCategoria === id);
    if (index !== -1) {
      this.categoriasMock.splice(index, 1);
      return of(void 0);
    }
    return throwError(() => new Error('Categoría no encontrada'));
  }

  // 🟢 Obtener categoría por ID (MOCK)
  getCategoriaById(id: number): Observable<Categoria> {
    const categoria = this.categoriasMock.find(c => c.idCategoria === id);
    if (categoria) {
      return of({...categoria});
    }
    return throwError(() => new Error('Categoría no encontrada'));
  }

  */
}