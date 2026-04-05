import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductRequest } from '../../core/models/product-request.model';
import { ProductResponse } from '../../core/models/product-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${environment.apiUrl}/productos`;
  private _refresh$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  get refresh$() {
    return this._refresh$;
  }

  // ⭐ CORRECCIÓN PRINCIPAL: Implementación real de actualizarProducto
  actualizarProducto(idProducto: any, updatedProduct: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idProducto}`, updatedProduct).pipe(
      tap(() => this._refresh$.next())
    );
  }

  // Implementación de registraProducto (redirige a createProduct o lo hace directo)
  registraProducto(productToSend: ProductResponse): Observable<any> {
    return this.http.post(this.apiUrl, productToSend).pipe(
      tap(() => this._refresh$.next())
    );
  }

  // Implementación de listar (redirige a getProducts)
  listar(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl);
  }

  // --- MÉTODOS EN INGLÉS (YA EXISTENTES) ---

  createProduct(product: ProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, product).pipe(
      tap(() => this._refresh$.next())
    );
  }

  getProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  updateProduct(id: number, product: ProductRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, product).pipe(
      tap(() => this._refresh$.next())
    );
  }

  updateProductStock(id: number, stockData: { stock: number }): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/stock`, stockData).pipe(
      tap(() => this._refresh$.next())
    );
  }

  deleteProduct(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' }).pipe(
      tap(() => this._refresh$.next())
    );
  }

  countProducts(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  getAllProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.apiUrl);
  }
}
