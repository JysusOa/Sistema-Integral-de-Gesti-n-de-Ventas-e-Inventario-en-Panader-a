import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { SaleService } from '../sale.service';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-boleta',
  templateUrl: './boleta.component.html',
  styleUrls: ['./boleta.component.css'],
  standalone: true,
  imports: [MatDialogModule, CommonModule],
  providers: [SaleService]
})
export class BoletaComponent implements OnInit, OnDestroy {

  venta: any;
  items: any[] = [];
  nombreCajero: string = 'Cargando...';
  private userSubscription: Subscription = new Subscription();

  constructor(
    public dialogRef: MatDialogRef<BoletaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializamos venta asegurando que no sea null
    this.venta = data.venta || {};

    // DEBUG: Ver qué llega realmente al abrir la boleta
    console.log('Datos iniciales en Boleta:', this.venta);

    this.cargarItemsLocales();
  }

  private cargarItemsLocales() {
    if (this.venta?.items && Array.isArray(this.venta.items)) {
      this.items = this.venta.items;
    } else if (this.venta?.detalles && Array.isArray(this.venta.detalles)) {
      this.items = this.venta.detalles;
    }
    if (!this.items) this.items = [];
  }

ngOnInit() {
    // 1. Obtener Cajero (Usuario actual)
    this.userSubscription = this.authService.currentUser.pipe(
      startWith(this.authService.currentUserValue)
    ).subscribe(user => {
      if (user) {
        const nombre = user.nombre || '';
        const apellidos = user.apellidos || '';
        this.nombreCajero = (nombre + ' ' + apellidos).trim() || 'Cajero no identificado';
      } else {
        this.nombreCajero = 'Usuario no autenticado';
      }
      this.cdr.detectChanges();
    });

    // 2. Lógica para VENTAS HISTÓRICAS
    if (this.venta.idVenta) {
      console.log('Consultando detalles completos de la venta histórica ID:', this.venta.idVenta);

      this.saleService.getSaleById(this.venta.idVenta).subscribe({
        next: (fullData: any) => {
          console.log('📦 Data histórica recibida del backend:', fullData);

          // FUSIONAR: Actualizamos la venta con lo que llegó del backend
          this.venta = { ...this.venta, ...fullData };

          // Recuperar monto pagado (lógica que ya teníamos)
          let montoDetectado = fullData.montoPagado || fullData.monto_pagado || fullData.amountPaid || fullData.pagoCon;
          if (montoDetectado !== undefined && montoDetectado !== null) {
            this.venta.montoPagado = parseFloat(montoDetectado);
          }

          // ⭐⭐ PASO 3: NORMALIZAR LOS ITEMS (LA SOLUCIÓN CLAVE) ⭐⭐
          // Aquí aseguramos que el 'precio' se lea correctamente sin importar cómo lo mande el backend
          let detallesCrudos = fullData.detalles || fullData.items || [];

          if (Array.isArray(detallesCrudos)) {
            this.items = detallesCrudos.map((detalle: any) => {
              // Buscamos el precio en todas las variables posibles
              const precioReal = Number(detalle.precio) || Number(detalle.precioUnitario) || Number(detalle.precioUnitarioVenta) || 0;
              const cantidadReal = Number(detalle.cantidad) || 0;

              return {
                ...detalle, // Mantenemos resto de propiedades
                nombre: detalle.nombreProducto || detalle.producto?.nombre || detalle.nombre || 'Producto',
                unidadMedida: detalle.unidadMedida || detalle.producto?.unidadMedida || '',
                cantidad: cantidadReal,
                precio: precioReal // <--- ESTO ASEGURA QUE EL TOTAL NO SEA 0
              };
            });
          }

          // Forzar al Angular a repintar la boleta con los nuevos datos
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error recuperando venta histórica:', err);
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // --- LÓGICA DE CÁLCULO DE VUELTO ---

  getMontoPagado(): number {
    // Intentar leer todas las posibles variantes de la propiedad
    let monto = parseFloat(this.venta?.montoPagado);

    if (isNaN(monto)) {
      monto = parseFloat(this.venta?.monto_pagado);
    }

    // Si viene como string en otra propiedad común
    if (isNaN(monto) && this.venta?.pagoCon) {
        monto = parseFloat(this.venta.pagoCon);
    }

    // Si encontramos un monto válido, lo retornamos
    if (!isNaN(monto) && monto > 0) {
      return monto;
    }

        return this.getTotal();
  }

  getVuelto(): number {
    const total = this.getTotal();
    // Obtenemos el monto pagado crudo (sin fallback al total para la comprobación)
    let pagado = 0;

    if (this.venta?.montoPagado) pagado = parseFloat(this.venta.montoPagado);
    else if (this.venta?.monto_pagado) pagado = parseFloat(this.venta.monto_pagado);

    // Si realmente no hay dato de pagado, asumimos pago exacto -> vuelto 0
    if (isNaN(pagado) || pagado === 0) {
        // Intentamos usar el getter, pero sabiendo que puede devolver el total
        const getterValue = this.getMontoPagado();
        if (getterValue === total) return 0;
        pagado = getterValue;
    }

    const vuelto = pagado - total;
    // Evitar decimales extraños tipo 0.000000001
    return vuelto > 0.001 ? vuelto : 0;
  }

  // --- MÉTODOS DE FORMATO (Sin cambios mayores) ---

  formatearNombreProducto(item: any): string {
    if (!item) return 'Producto no disponible';
    const nombre = item.nombre || item.producto?.nombre || item.nombreProducto || item.Producto?.nombre || '';
    const unidadMedida = item.unidadMedida || item.unidad_medida || item.producto?.unidadMedida || item.Producto?.unidadMedida || '';
    if (!nombre.trim()) return 'Producto sin nombre';
    if (unidadMedida && unidadMedida.trim() !== '' && unidadMedida.toLowerCase() !== 'unidad') {
      return `${nombre} (${unidadMedida})`;
    }
    return nombre;
  }

  getTotal(): number {
    if (!this.items) return 0;
    return this.items.reduce((total, item) => {
      // Manejar estructura anidada o plana
      let cantidad = Number(item?.cantidad);
      let precio = Number(item?.precio);

      // A veces viene anidado en 'producto'
      if (isNaN(precio) && item.producto) {
          precio = Number(item.producto.precio);
      }

      return total + ((cantidad || 0) * (precio || 0));
    }, 0);
  }

  formatoPrecio(valor: number): string {
    return 'S/.' + (Number(valor) || 0).toFixed(2);
  }

  formatoFecha(fecha: any): string {
    if (!fecha) return new Date().toLocaleDateString(); // Fallback a fecha actual si falla
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Fecha inválida';
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const año = d.getFullYear();
      const horas = d.getHours().toString().padStart(2, '0');
      const minutos = d.getMinutes().toString().padStart(2, '0');
      return `${dia}/${mes}/${año} ${horas}:${minutos}`;
    } catch (error) {
      return 'Error en fecha';
    }
  }

  cerrarBoleta() {
    this.dialogRef.close();
  }
}
