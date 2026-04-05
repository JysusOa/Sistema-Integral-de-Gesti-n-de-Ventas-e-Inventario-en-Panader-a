import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { SaleService } from '../sale.service';
import { VentaResponse } from '../../../core/models/venta-response.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MetodoPago } from '../../../core/models/metodo-pago.models';
import { MetodoPagoService } from '../../../core/models/metodo-pago.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { BoletaComponent } from '../boleta/boleta.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.css'],
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatDialogModule,
    //BoletaComponent
  ],
   providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }
  ]
})
export class SaleListComponent implements OnInit, AfterViewInit {


  displayedColumns: string[] = [
    'idVenta',
    'nombreCliente',
    'fechaVenta',
    'totalVenta',
    'metodoPagoNombre',
    'usuario',
    'acciones'
  ];

  dataSource = new MatTableDataSource<VentaResponse>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  lstMetodoPago: MetodoPago[] = [];
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;
  ventaSeleccionada: VentaResponse | null = null;

  constructor(
    private saleService: SaleService,
    private metodoPagoService: MetodoPagoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMetodosPago();
    this.loadSales();

    this.dataSource.filterPredicate = (data: VentaResponse, filter: string): boolean => {
      const lowerFilter = filter ? filter.trim().toLowerCase() : '';

      const metodoPagoStr = this.formatMetodoPago(data.metodoPago).toLowerCase();
      const usuarioNombre = data.usuario?.nombre || '';
      const usuarioApellidos = data.usuario?.apellidos || '';
      const usuarioCorreo = data.usuario?.correo || '';

      const dataStr = `
        ${data.idVenta}
        ${data.nombreCliente}
        ${data.fechaVenta}
        ${data.totalVenta}
        ${usuarioNombre}
        ${usuarioApellidos}
        ${usuarioCorreo}
        ${metodoPagoStr}
      `.toLowerCase();

      const textFilterMatch = !lowerFilter || dataStr.includes(lowerFilter);

      const saleDateObj = (data as any).fechaVentaObj;
      if (!saleDateObj || isNaN(saleDateObj.getTime())) return false;

      const saleDate = new Date(saleDateObj);
      saleDate.setHours(0, 0, 0, 0);

      let dateFilterMatch = true;
      if (this.filterStartDate) {
        const start = new Date(this.filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (saleDate < start) dateFilterMatch = false;
      }
      if (this.filterEndDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (saleDate > end) dateFilterMatch = false;
      }

      return textFilterMatch && dateFilterMatch;
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSales(): void {
    this.saleService.getSales().subscribe({
      next: (data: VentaResponse[]) => {
        data.forEach(sale => {
          // ✅ Aseguramos que los campos tengan valores válidos
          sale.nombreCliente = sale.nombreCliente || 'Sin nombre';
          sale.totalVenta = Number(sale.totalVenta) || 0;

          // ✅ Convertir fecha
          const fechaDate = new Date(sale.fechaVenta);
          if (!isNaN(fechaDate.getTime())) {
            (sale as any).fechaVentaObj = fechaDate;
          } else {
            console.warn(`Fecha inválida para venta ${sale.idVenta}: ${sale.fechaVenta}`);
            (sale as any).fechaVentaObj = null;
          }
        });

        // Ordenar por fecha (más reciente primero)
        data.sort((a, b) => {
          const dateA = (a as any).fechaVentaObj?.getTime() || 0;
          const dateB = (b as any).fechaVentaObj?.getTime() || 0;
          return dateB - dateA;
        });

        this.dataSource.data = data;
      },
      error: () => {
        this.snackBar.open('No se pudieron cargar las ventas.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  loadMetodosPago(): void {
    this.metodoPagoService.getMetodosPago().subscribe({
      next: (data: MetodoPago[]) => this.lstMetodoPago = data,
      error: () => {
        this.snackBar.open('Error al cargar los métodos de pago.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase() || ' ';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  applyDateFilter(): void {
    this.dataSource.filter = this.dataSource.filter || ' ';
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearDateFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.applyDateFilter();
  }

  deleteSale(id: number): void {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    this.saleService.deleteSale(id).subscribe({
      next: () => {
        this.snackBar.open('Venta eliminada exitosamente.', 'Cerrar', { duration: 3000 });
        this.loadSales();
      },
      error: () => {
        this.snackBar.open('Error al eliminar la venta.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  formatMetodoPago(metodoPago: any): string {
    if (metodoPago && metodoPago.idMetodoPago) {
      const foundMetodo = this.lstMetodoPago.find(m => m.idMetodoPago === metodoPago.idMetodoPago);
      return foundMetodo ? foundMetodo.nombre : 'Desconocido';
    }
    return 'N/A';
  }

onSeleccionarVenta(venta: any): void {
    if (!venta.idVenta) return;

    this.saleService.getSaleById(venta.idVenta).subscribe({
      next: (ventaCompleta) => {

        // 1. Detectar el PRECIO correcto (puede venir como 'precio', 'precioUnitario', etc.)
        // Esto soluciona que el total salga 0
        const itemsMapeados = ventaCompleta.detalles?.map((detalle: any) => {
          const precioReal = Number(detalle.precio) || Number(detalle.precioUnitario) || Number(detalle.precioUnitarioVenta) || 0;
          const cantidadReal = Number(detalle.cantidad) || 0;

          return {
            nombre: detalle.nombreProducto || detalle.producto?.nombre || 'Sin producto',
            marca: detalle.marca || detalle.producto?.marca || '',
            unidadMedida: detalle.unidadMedida || detalle.producto?.unidadMedida || '',
            cantidad: cantidadReal,
            precio: precioReal, // ⭐⭐ AQUÍ ESTABA EL ERROR (antes era 0)
            total: cantidadReal * precioReal // Calculamos el subtotal por si acaso
          };
        }) || [];

        // 2. Preparar los datos blindados para la boleta
        const ventaData = {
          ...ventaCompleta, // Copia base
          idVenta: ventaCompleta.idVenta, // ID obligatorio
          nombreCliente: ventaCompleta.nombreCliente || 'Cliente General',
          fechaVenta: ventaCompleta.fechaVenta,
          descripcionPago: this.formatMetodoPago(ventaCompleta.metodoPago),
          items: itemsMapeados,
          // ⭐⭐ Aseguramos que el total venta viaje correcto
          totalVenta: ventaCompleta.totalVenta || itemsMapeados.reduce((acc: number, item: any) => acc + (item.cantidad * item.precio), 0)
        };

        console.log('Datos enviados a Boleta (Revísalos):', ventaData);

        const dialogRef = this.dialog.open(BoletaComponent, {
          data: { venta: ventaData },
          width: '482px',
          disableClose: false
        });
      },
      error: (err) => {
        console.error('Error al cargar la venta:', err);
        this.snackBar.open('No se pudo cargar el detalle.', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
