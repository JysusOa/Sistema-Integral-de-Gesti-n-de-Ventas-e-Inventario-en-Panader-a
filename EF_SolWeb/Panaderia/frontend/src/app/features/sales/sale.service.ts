// SaleService cleaned version without pending sales functionality
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { VentaRequest } from '../../core/models/venta-request.model';
import { VentaResponse } from '../../core/models/venta-response.model';
import { MetodoPago } from '../../core/models/metodo-pago.models';
import { AppSettings } from '../../app.settings';

const baseUrlUtil = AppSettings.API_ENDPOINT + '/util';

@Injectable({ providedIn: 'root' })
export class SaleService {
  getSalesCount() {
    throw new Error('Method not implemented.');
  }
  getSalesByDay() {
    throw new Error('Method not implemented.');
  }
  getSalesByWeek() {
    throw new Error('Method not implemented.');
  }
  getSalesByMonth() {
    throw new Error('Method not implemented.');
  }

  private apiUrl = `${environment.apiUrl}/ventas`;

  // ✅ Inicializar ventas$ como BehaviorSubject
  private ventasSubject = new BehaviorSubject<VentaResponse[]>([]);
  ventas$: Observable<VentaResponse[]> = this.ventasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // MÉTODOS PRINCIPALES
  createSale(sale: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, sale);
  }

  getSales(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }

  listaMetodoPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(baseUrlUtil + '/listaMetodoPago');
  }

  getSaleById(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/${id}`);
  }

  updateSale(id: number, sale: VentaRequest): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}`, sale);
  }

  deleteSale(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  // ✅ Método para cargar y actualizar ventas en el observable
  loadAndUpdateVentas(): void {
    this.getSales().subscribe({
      next: (ventas) => {
        this.ventasSubject.next(ventas);
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
      }
    });
  }

  // ✅ Método para añadir una nueva venta al observable
  addVentaToObservable(nuevaVenta: VentaResponse): void {
    const currentVentas = this.ventasSubject.value;
    this.ventasSubject.next([...currentVentas, nuevaVenta]);
  }

  // MÉTODOS ESTADÍSTICOS Y PROCESAMIENTO LOCAL
  getTopSellingProducts(): Observable<{ name: string; sales: number }[]> {
    return this.getSales().pipe(
      map((sales: VentaResponse[]) => {
        const productSales = new Map<string, number>();

        sales.forEach(venta => {
          const items = this.buscarItemsEnVenta(venta);
          items.forEach(item => {
            const info = this.extraerInformacionProducto(item);
            const current = productSales.get(info.name) || 0;
            productSales.set(info.name, current + info.quantity);
          });
        });

        return Array.from(productSales.entries())
          .map(([name, sales]) => ({ name, sales }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10);
      }),
      catchError(() => of([]))
    );
  }

  getTopProductsLastWeek(): Observable<{ name: string; sales: number }[]> {
    return this.getSales().pipe(
      map((sales: VentaResponse[]) => {
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const mapSales = new Map<string, number>();

        sales.forEach(venta => {
          const fecha = new Date(venta.fechaVenta);
          if (fecha >= lastWeekStart) {
            const items = this.buscarItemsEnVenta(venta);
            items.forEach(item => {
              const info = this.extraerInformacionProducto(item);
              const current = mapSales.get(info.name) || 0;
              mapSales.set(info.name, current + info.quantity);
            });
          }
        });

        return Array.from(mapSales.entries())
          .map(([name, sales]) => ({ name, sales }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10);
      }),
      catchError(() => of([]))
    );
  }

  // MÉTODOS DE AYUDA
  private buscarItemsEnVenta(venta: any): any[] {
    const props = [
      'items', 'detalleVenta', 'detalle', 'ventaItems', 'itemsVenta',
      'productos', 'detalles', 'lineItems', 'cartItems', 'productosVendidos'
    ];

    for (const p of props) {
      if (venta[p] && Array.isArray(venta[p]) && venta[p].length > 0) {
        return venta[p];
      }
    }

    if (venta['detalleVenta'] && typeof venta['detalleVenta'] === 'object') {
      return [venta['detalleVenta']];
    }

    return [];
  }

  private extraerInformacionProducto(item: any): { name: string; quantity: number } {
    const posiblesNombres = [
      item.nombre,
      item.producto?.nombre,
      item.descripcion,
      item.nombreProducto,
      item.productName
    ];

    const posiblesCantidades = [
      item.cantidad,
      item.quantity,
      item.cantidadVendida,
      item.qty
    ];

    const name = posiblesNombres.find(n => typeof n === 'string' && n.trim() !== '') || 'Producto desconocido';
    const quantity = Number(posiblesCantidades.find(c => c > 0)) || 1;

    return { name, quantity };
  }
}
