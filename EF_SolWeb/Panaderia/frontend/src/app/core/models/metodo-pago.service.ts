import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MetodoPago } from '../models/metodo-pago.models'; // Esta es la ruta correcta
@Injectable({
  providedIn: 'root'
})
export class MetodoPagoService {

  // Simulación de datos de métodos de pago
  private metodosPago: MetodoPago[] = [
    { idMetodoPago: 1, nombre: 'Efectivo' },
    { idMetodoPago: 2, nombre: 'Tarjeta' },
    { idMetodoPago: 3, nombre: 'Yape' },
    { idMetodoPago: 4, nombre: 'Plin' }
  ];

  constructor() { }

  getMetodosPago(): Observable<MetodoPago[]> {
    return of(this.metodosPago); // Retorna los datos simulados como un Observable
  }
}
