import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../sale.service';
import { ProductService } from '../../products/product.service';
import { VentaRequest } from '../../../core/models/venta-request.model';
import { VentaResponse } from '../../../core/models/venta-response.model';
import { ProductResponse } from '../../../core/models/product-response.model';
import { BigDecimal } from '../../../core/models/big-decimal';
import { BoletaComponent } from '../boleta/boleta.component';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MetodoPago } from '../../../core/models/metodo-pago.models';
import { MetodoPagoService } from '../../../core/models/metodo-pago.service';
import { Categoria } from '../../../core/models/categoria.model';
import { takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { DetalleVentaResponse } from '../../../core/models/detalle-venta-response.model';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { YapePaymentDialogComponent } from './yape-payment-dialog.component';
import { PlinPaymentDialogComponent } from './plin-payment-dialog.component';
import { ChangeDetectorRef } from '@angular/core';

// Interfaz para detalle de venta (para array simple heredado)
interface DetalleVenta {
  searchTerm?: string;
  idCategoria?: number;
  idProducto: number;
  cantidad: number;
  precio: number;
}

// Validador personalizado para la fecha de expiración de la tarjeta
function cardExpiryValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const expiryDate = control.value; // Formato MM/AA
  if (!expiryDate) {
    return null; // No validar si está vacío, el Validators.required ya lo maneja
  }
  const parts = expiryDate.split('/');
  if (parts.length !== 2) {
    return { 'invalidExpiryFormat': true }; // Formato incorrecto, aunque el pattern ya lo valida
  }
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) {
    return { 'invalidExpiryDate': true }; // Si no son números válidos
  }
  // **NUEVA VALIDACIÓN ESPECÍFICA PARA EL MES**
  if (month < 1 || month > 12) {
    return { 'invalidMonth': true }; // Error específico para mes inválido
  }
  const currentYear = new Date().getFullYear() % 100; // Obtener los últimos dos dígitos del año actual
  const currentMonth = new Date().getMonth() + 1; // getMonth() es 0-indexado
  // Convertir el año de la tarjeta a formato de 4 dígitos (ej. 25 -> 2025)
  const fullCardYear = 2000 + year;
  const fullCurrentYear = 2000 + currentYear;
  // 1. Validar que la tarjeta no esté caducada
  if (fullCardYear < fullCurrentYear || (fullCardYear === fullCurrentYear && month < currentMonth)) {
    return { 'cardExpired': true };
  }
  // 2. Validar que la tarjeta no exceda un máximo de 5 años en el futuro
  const maxFutureYear = fullCurrentYear + 5;
  if (fullCardYear > maxFutureYear || (fullCardYear === maxFutureYear && month > currentMonth)) {
    return { 'cardTooFarInFuture': true };
  }
  return null; // La validación es exitosa
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule
  ],
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.css'],
  providers: [
    SaleService,
    ProductService,
    MetodoPagoService,
  ]
})
export class SaleFormComponent implements OnInit, OnDestroy {
  [x: string]: any;

  saleForm: FormGroup;
  isEditMode: boolean = false;
  saleId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  lstMetodoPago: MetodoPago[] = [];
  availableProducts: ProductResponse[] = [];
  showCardPaymentPanel: boolean = false;
  showCashPaymentPanel: boolean = false;
  showYapePaymentPanel: boolean = false;
  showPlinPaymentPanel: boolean = false;
  filteredProductsByCategory: ProductResponse[] = [];
  filteredProducts: Observable<ProductResponse[]> = of([]);
  detalles: DetalleVenta[] = [];
  productSearchCtrl: FormControl = new FormControl();
  isLoading: boolean = true;

  private _onDestroy = new Subject<void>();
  private isYapeDialogOpen: boolean = false;
  private isPlinDialogOpen: boolean = false;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private metodoPagoService: MetodoPagoService,
    private route: ActivatedRoute,
    public router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.saleForm = this.fb.group({
      nombreCliente: ['', [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'.]*$/)]],
      metodoPago: this.fb.group({
        idMetodoPago: [null, Validators.required]
      }),
      tipoComprobante: ['', Validators.required],
      dni: ['', [Validators.pattern(/^\d{8}$/)]],
      ruc: [''],
      cardNumber: [''],
      cardExpiry: [''],
      cardCVV: [''],
      montoPagado: [0, [Validators.min(0)]],
      vuelto: this.fb.control({ value: 0, disabled: true }),
      // Solo código de operación, sin número telefónico
      yapeOperationCode: [''],
      plinOperationCode: [''],
    });

    // LÓGICA PARA MANEJAR LAS VALIDACIONES CONDICIONALES Y VISIBILIDAD DE PANELES
    this.saleForm.get('metodoPago.idMetodoPago')?.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe((metodoId: number) => {
        this.updatePaymentPanels(metodoId);
      });
  }

  // ========== MÉTODOS DE STOCK ==========

  // Método para verificar stock disponible (corregido)
  getStockDisponible(productId: number): number {
    const product = this.availableProducts.find(p => p.idProducto === productId);
    return product?.stock ?? 0; // Usa el operador de coalescencia nula
  }

  // Método para verificar si hay stock suficiente (corregido)
  hasSufficientStock(productId: number, cantidad: number): boolean {
    const stockDisponible = this.getStockDisponible(productId);
    return stockDisponible >= cantidad;
  }

  // Método para actualizar el stock localmente (corregido)
  updateLocalStock(productId: number, cantidadVendida: number): void {
    const product = this.availableProducts.find(p => p.idProducto === productId);
    if (product && product.stock !== undefined) {
      product.stock = Math.max(0, product.stock - cantidadVendida);
    }
  }

  // Método para obtener la cantidad máxima permitida (considerando stock)
  getMaxCantidad(index: number): number {
    const detalle = this.detalles[index];
    if (detalle.idProducto <= 0) return 50;

    const stockDisponible = this.getStockDisponible(detalle.idProducto);
    return Math.min(50, stockDisponible);
  }

  // Método para validar stock antes de enviar la venta
  private validateStock(): string[] {
    const errors: string[] = [];

    this.detalles.forEach((detalle, index) => {
      if (detalle.idProducto > 0 && detalle.cantidad > 0) {
        const stockDisponible = this.getStockDisponible(detalle.idProducto);
        const product = this.availableProducts.find(p => p.idProducto === detalle.idProducto);

        if (stockDisponible < detalle.cantidad) {
          errors.push(`Stock insuficiente para ${product?.nombre}. Disponible: ${stockDisponible}, Solicitado: ${detalle.cantidad}`);
        }
      }
    });

    return errors;
  }

  // Método para actualizar stock después de venta exitosa
  private updateStockAfterSale(): void {
    this.detalles.forEach(detalle => {
      if (detalle.idProducto > 0 && detalle.cantidad > 0) {
        this.updateLocalStock(detalle.idProducto, detalle.cantidad);
      }
    });
  }

  // ========== MÉTODOS EXISTENTES ACTUALIZADOS ==========

  // ✅ CORREGIDO: Ahora muestra TODOS los productos sin límite de 10
  getFilteredProducts(searchTerm: string): ProductResponse[] {
    if (!this.availableProducts || this.availableProducts.length === 0) {
      return [];
    }

    // Si no hay término de búsqueda, mostrar todos ordenados alfabéticamente
    if (!searchTerm || searchTerm.trim() === '') {
      return [...this.availableProducts].sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '')
      );
    }

    const filterValue = searchTerm.toLowerCase();

    // Filtrar por nombre, marca o combinación
    const filteredProducts = this.availableProducts.filter(product => {
      const nombreMatch = product.nombre?.toLowerCase().includes(filterValue);
      const marcaMatch = product.marca?.toLowerCase().includes(filterValue);
      const nombreCompleto = `${product.nombre || ''} ${product.marca || ''}`.toLowerCase();
      const nombreCompletoMatch = nombreCompleto.includes(filterValue);

      return nombreMatch || marcaMatch || nombreCompletoMatch;
    });

    // Ordenar: productos con stock primero, luego sin stock
    return filteredProducts.sort((a, b) => {
      const stockA = a.stock ?? 0;
      const stockB = b.stock ?? 0;

      if (stockA <= 0 && stockB > 0) return 1; // a sin stock, b con stock -> b primero
      if (stockA > 0 && stockB <= 0) return -1; // a con stock, b sin stock -> a primero

      // Si ambos tienen o no tienen stock, ordenar alfabéticamente
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    // ✅ ELIMINADO: .slice(0, 10) para mostrar TODOS los productos
  }

  onMetodoPagoChange(metodoId: any): void {
    console.log('onMetodoPagoChange llamado con:', metodoId);
    if (metodoId) {
      this.saleForm.get('metodoPago.idMetodoPago')?.setValue(metodoId, { emitEvent: false });
      this.updatePaymentPanels(metodoId);
    }
  }

  private updatePaymentPanels(metodoId: any): void {
    const selectedMetodoPago = this.lstMetodoPago.find(m => m.idMetodoPago === metodoId);
    const nombreMetodoPago = selectedMetodoPago ? selectedMetodoPago.nombre.toUpperCase() : '';

    // Resetear visibilidad de todos los paneles de pago
    this.showCardPaymentPanel = false;
    this.showCashPaymentPanel = false;
    this.showYapePaymentPanel = false;
    this.showPlinPaymentPanel = false;

    // Controles de Tarjeta
    const cardNumberControl = this.saleForm.get('cardNumber');
    const cardExpiryControl = this.saleForm.get('cardExpiry');
    const cardCVVControl = this.saleForm.get('cardCVV');

    // CONTROLES PARA EFECTIVO
    const montoPagadoControl = this.saleForm.get('montoPagado');
    const vueltoControl = this.saleForm.get('vuelto');

    // Controles de Yape (solo código de operación)
    const yapeOperationCodeControl = this.saleForm.get('yapeOperationCode');

    // Controles de Plin (solo código de operación)
    const plinOperationCodeControl = this.saleForm.get('plinOperationCode');

    // ================== LÓGICA PARA TARJETA ==================
    if (nombreMetodoPago === 'TARJETA') {
      this.showCardPaymentPanel = true;
      cardNumberControl?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      cardExpiryControl?.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/),
        cardExpiryValidator
      ]);
      cardCVVControl?.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
    } else {
      cardNumberControl?.clearValidators();
      cardExpiryControl?.clearValidators();
      cardCVVControl?.clearValidators();
      cardNumberControl?.setValue('');
      cardExpiryControl?.setValue('');
      cardCVVControl?.setValue('');
    }
    cardNumberControl?.updateValueAndValidity();
    cardExpiryControl?.updateValueAndValidity();
    cardCVVControl?.updateValueAndValidity();
    this.checkDocumentPanelVisibility();

    // ================== LÓGICA PARA EFECTIVO ==================
    if (nombreMetodoPago === 'EFECTIVO') {
      this.showCashPaymentPanel = true;
      montoPagadoControl?.setValidators([
        Validators.required,
        Validators.min(this.getTotalVenta()),
      ]);
      vueltoControl?.disable();
    } else {
      montoPagadoControl?.clearValidators();
      montoPagadoControl?.setValue(0);
      vueltoControl?.setValue(0);
      vueltoControl?.enable();
    }
    montoPagadoControl?.updateValueAndValidity();
    vueltoControl?.updateValueAndValidity();

    // ================== LÓGICA PARA YAPE ==================
    if (nombreMetodoPago === 'YAPE') {
      // Solo validamos el código de operación
      yapeOperationCodeControl?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
      yapeOperationCodeControl?.updateValueAndValidity();

      if (!this.isYapeDialogOpen) {
        this.showYapePaymentPanel = false;
        this.isYapeDialogOpen = true;

        const dialogRef = this.dialog.open(YapePaymentDialogComponent, {
          width: '400px',
          data: {
            // Solo pasamos el código de operación
            operationCode: this.saleForm.get('yapeOperationCode')?.value || ''
          },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
          this.isYapeDialogOpen = false;
          if (result) {
            // Solo guardamos el código de operación
            this.saleForm.get('yapeOperationCode')?.setValue(result.operationCode);
          } else {
            // Si el usuario cancela, limpiamos el código
            this.saleForm.get('yapeOperationCode')?.setValue('');
            this.saleForm.get('metodoPago.idMetodoPago')?.setValue(null);
            this.snackBar.open('Pago con Yape cancelado.', 'Cerrar', { duration: 2000 });
          }
        });
      }
    } else {
      // Si no es YAPE, limpiamos validadores y valores
      yapeOperationCodeControl?.clearValidators();
      yapeOperationCodeControl?.setValue('');
      yapeOperationCodeControl?.updateValueAndValidity();
    }

    // ================== LÓGICA PARA PLIN ==================
    if (nombreMetodoPago === 'PLIN') {
      // Solo validamos el código de operación
      plinOperationCodeControl?.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
      plinOperationCodeControl?.updateValueAndValidity();

      if (!this.isPlinDialogOpen) {
        this.showPlinPaymentPanel = false;
        this.isPlinDialogOpen = true;

        const dialogRef = this.dialog.open(PlinPaymentDialogComponent, {
          width: '400px',
          data: {
            // Solo pasamos el código de operación
            operationCode: this.saleForm.get('plinOperationCode')?.value || ''
          },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
          this.isPlinDialogOpen = false;
          if (result) {
            // Solo guardamos el código de operación
            this.saleForm.get('plinOperationCode')?.setValue(result.operationCode);
          } else {
            // Si cancela, limpiamos el código
            this.saleForm.get('plinOperationCode')?.setValue('');
            this.saleForm.get('metodoPago.idMetodoPago')?.setValue(null);
            this.snackBar.open('Pago con Plin cancelado.', 'Cerrar', { duration: 2000 });
          }
        });
      }
    } else {
      // Si no es PLIN, limpiamos validadores y valores
      plinOperationCodeControl?.clearValidators();
      plinOperationCodeControl?.setValue('');
      plinOperationCodeControl?.updateValueAndValidity();
    }
  }

  onProductChange(productId: number | null, isQuick: boolean = true, index: number): void {
    if (!productId) {
      if (isQuick) {
        this.saleForm.get('quickPrecio')?.setValue(0);
        this.productSearchCtrl.setValue('');
      }
      return;
    }

    // Valida duplicados antes de setear
    if (this.isProductDisabled(productId, index)) {
      this.snackBar.open('Este producto ya está en la venta. No se puede duplicar.', 'Cerrar', {
        duration: 3000, panelClass: ['snackbar-warn']
      });
      this.detalles[index].idProducto = 0;
      this.detalles[index].precio = 0;
      this.detalles[index].searchTerm = '';
      this.updateTotales();
      return;
    }

    // Si llega aquí, es válido – setea
    const product = this.availableProducts.find(p => p.idProducto === productId);
    const precio = product ? parseFloat(product.precio?.toString() ?? '0') : 0;
;
    this.detalles[index].idProducto = productId;
    this.detalles[index].precio = precio;
    this.updateTotales();
    this.checkDocumentPanelVisibility();
  }

  onProductSelected(event: any, isQuick: boolean = false, index?: number): void {
    const selectedOption = event.option;
    if (!selectedOption || !selectedOption.value) {
      const actualIndex = index !== undefined ? index : 0;
      this.detalles[actualIndex].idProducto = 0;
      this.detalles[actualIndex].searchTerm = '';
      this.detalles[actualIndex].precio = 0;
      this.cdr.detectChanges();
      return;
    }

    const productId = selectedOption.value;
    const selectedProduct = this.availableProducts.find(p => p.idProducto === productId);
    if (!selectedProduct) return;

    const actualIndex = index !== undefined ? index : 0;

    // Verificar stock antes de asignar
    const stock = selectedProduct.stock ?? 0;
    if (stock <= 0) {
      this.snackBar.open('Producto sin stock disponible', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-warn']
      });
      return;
    }

    this.detalles[actualIndex].idProducto = productId;
    this.detalles[actualIndex].precio = parseFloat(selectedProduct.precio?.toString() ?? '0');
    if (isNaN(this.detalles[actualIndex].precio)) this.detalles[actualIndex].precio = 0;
    this.detalles[actualIndex].cantidad = 1; // Cantidad por defecto

    // CORRECCIÓN: Setear searchTerm directamente con el display formateado
    this.detalles[actualIndex].searchTerm = this.formatProductDisplay(selectedProduct);

    if (typeof this.onProductChange === 'function') {
      this.onProductChange(productId, false, actualIndex);
    }
  }

  // MODIFICADO: Ahora valida stock máximo disponible
  onQuickCantidadInput(event: any, index?: number): void {
    const value = parseInt(event.target.value, 10);

    if (index !== undefined) {
      const detalle = this.detalles[index];

      // Validar stock máximo disponible
      const stockDisponible = this.getStockDisponible(detalle.idProducto);
      const cantidadMaxima = Math.min(50, stockDisponible);

      if (value > cantidadMaxima) {
        event.target.value = cantidadMaxima;
        detalle.cantidad = cantidadMaxima;
        this.snackBar.open(`Stock máximo disponible: ${cantidadMaxima} unidades`, 'OK', {
          duration: 3000,
          panelClass: ['snackbar-warn']
        });
      } else if (value < 1) {
        event.target.value = 1;
        detalle.cantidad = 1;
        this.snackBar.open('Cantidad mínima: 1 unidad', 'OK', { duration: 3000 });
      } else {
        detalle.cantidad = value;
      }

      this.updateTotales();
      this.checkDocumentPanelVisibility();
    }
  }

  clearQuickAdd(): void {
    if (this.detalles.length > 0) {
      this.detalles[0] = { idProducto: 0, searchTerm: '', cantidad: 1, precio: 0 };
    }
    this.snackBar.open('Primera fila limpiada.', 'Cerrar', { duration: 2000, panelClass: ['snackbar-info'] });
  }

  trackByDetalle(index: number, detalle: DetalleVenta): any {
    return detalle ? detalle.idProducto || index : index;
  }

  // MODIFICADO: Ahora incluye marca y unidad de medida
  displayFn(value: ProductResponse | number): string {
    if (!this.availableProducts) return '';
    if (typeof value === 'number') {
      const product = this.availableProducts.find(p => p.idProducto === value);
      return product ? this.formatProductDisplay(product) : '';
    }
    if (!value) return '';
    return this.formatProductDisplay(value);
  }

  // MEJORADO: Método para formatear la visualización del producto con indicador de stock
  private formatProductDisplay(product: ProductResponse): string {
    let displayName = product.nombre || '';

    // Agregar marca si existe
    if (product.marca) {
      displayName += ` ${product.marca}`;
    }

    // Agregar unidad de medida si existe y es diferente de "Unidad"
    if (product.unidadMedida && product.unidadMedida !== 'Unidad') {
      displayName += ` ${product.unidadMedida}`;
    }

    // ✅ NUEVO: Agregar indicador de stock
    const stock = product.stock ?? 0;
    if (stock === 0) {
      displayName += ' - ❌ Sin stock';
    } else if (stock < 10) {
      displayName += ` - ⚠️ ${stock} disp.`;
    } else {
      displayName += ` - ✅ ${stock} disp.`;
    }

    return displayName;
  }

  addDetalle(): void {
    const newDetalle: DetalleVenta = {
      idCategoria: 0,
      idProducto: 0,
      cantidad: 1,
      precio: 0,
      searchTerm: ''
    };

    this.detalles.push(newDetalle);
    this.snackBar.open('Nueva fila agregada – complete los detalles.', 'Cerrar', {
      duration: 2000, panelClass: ['snackbar-info']
    });
    this.updateTotales();
    this.checkDocumentPanelVisibility();
  }

  clearDetalle(i: number): void {
    if (i >= 0 && i < this.detalles.length) {
      this.detalles.splice(i, 1);
      this.updateTotales();
      this.checkDocumentPanelVisibility();
      this.snackBar.open('Producto eliminado de la venta.', 'Cerrar', { duration: 2000, panelClass: ['snackbar-warn'] });
    }
  }

  clearDetalleRow(index: number): void {
    if (index >= 0 && index < this.detalles.length) {
      this.detalles[index] = { idProducto: 0, searchTerm: '', cantidad: 1, precio: 0 };
      this.updateTotales();
      this.checkDocumentPanelVisibility();
      this.snackBar.open('Fila limpiada.', 'Cerrar', { duration: 2000, panelClass: ['snackbar-info'] });
    }
  }

  onTipoComprobanteChange(value: string) {
    const rucControl = this.saleForm.get('ruc');
    const dniControl = this.saleForm.get('dni');

    if (value === 'factura') {
      rucControl?.setValidators([
        Validators.required,
        Validators.pattern(/^(10|20)\d{9}$/)
      ]);
      dniControl?.clearValidators();
      dniControl?.setValue('');
    } else if (value === 'boleta') {
      dniControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/)
      ]);
      rucControl?.clearValidators();
      rucControl?.setValue('');
    }
    rucControl?.updateValueAndValidity();
    dniControl?.updateValueAndValidity();
  }

ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      productos: this.productService.getProducts()
    }).subscribe({
      next: ({ productos }) => {
        // ⭐ CAMBIO: Filtrar productos inactivos
        this.availableProducts = productos.filter(p => p.estado !== 'INACTIVO');

        console.log(`✅ Cargados ${this.availableProducts.length} productos activos.`);
        this.isLoading = false;
        this.detalles = [{ idProducto: 0, searchTerm: '', cantidad: 1, precio: 0 }];
      },

      error: (err) => {
        console.error('Error al cargar datos iniciales:', err);
        this.errorMessage = 'Error al cargar productos.';
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });

    // Carga métodos de pago
    this.loadMetodosPago();
    // Default tipoComprobante
    this.saleForm.patchValue({ tipoComprobante: 'boleta' });
    this.onTipoComprobanteChange('boleta');
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.saleId = +idParam;
        this.isEditMode = true;
        this.loadSale(this.saleId);
      } else {
        this.isEditMode = false;
      }
    });

    // Suscripción para calcular vuelto
    const montoPagadoControl = this.saleForm.get('montoPagado');
    if (montoPagadoControl) {
      montoPagadoControl.valueChanges.pipe(
        takeUntil(this._onDestroy)
      ).subscribe(monto => {
        this.calcularVuelto(monto);
      });
    }
    this.saleForm.get('tipoComprobante')?.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.checkDocumentPanelVisibility();
    });
    this.checkDocumentPanelVisibility();

    // Suscripción a actualizaciones en tiempo real (adaptada)
    this.saleService.ventas$.pipe(takeUntil(this._onDestroy)).subscribe((ventas: any[]) => {
      if (this.saleId) {
        const ventaActual = ventas.find((v: { idVenta: number | null; }) => v.idVenta === this.saleId);
        if (ventaActual && ventaActual.estado === 'procesado') {
          this.snackBar.open('Pago procesado automáticamente. No recargues la página.', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  // MODIFICADO: Ahora incluye validación de stock Y recarga productos
  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.saleForm.valid) {
      // Validar stock antes de proceder
      const stockErrors = this.validateStock();
      if (stockErrors.length > 0) {
        this.errorMessage = stockErrors.join('\n');
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        return;
      }

      const hasValidDetalle = this.detalles.some(d =>
        d.idProducto > 0 && d.cantidad >= 1 && d.precio > 0
      );

      if (!hasValidDetalle) {
        this.errorMessage = 'La venta debe tener al menos un producto válido.';
        this.snackBar.open(this.errorMessage ?? 'Formulario inválido.', 'Cerrar', {
          duration: 5000, panelClass: ['snackbar-error']
        });
        return;
      }

      const invalidDetalles = this.detalles.some(d =>
        !d.idProducto || d.idProducto <= 0 || d.cantidad < 1 || d.precio <= 0
      );

      if (invalidDetalles) {
        this.errorMessage = 'Todos los productos deben tener producto, cantidad y precio válidos.';
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        return;
      }

      // Validación adicional para efectivo
      const selectedMetodoPagoId = this.saleForm.get('metodoPago.idMetodoPago')?.value;
      const selectedMetodoPago = this.lstMetodoPago.find(m => m.idMetodoPago === selectedMetodoPagoId);
      const nombreMetodoPago = selectedMetodoPago ? selectedMetodoPago.nombre.toUpperCase() : '';

      if (nombreMetodoPago === 'EFECTIVO') {
        const montoPagado = parseFloat(this.saleForm.get('montoPagado')?.value || '0');
        const totalVenta = this.getTotalVenta();

        if (isNaN(montoPagado) || montoPagado < totalVenta) {
          this.errorMessage = 'El monto pagado debe ser igual o mayor al total de la venta.';
          this.snackBar.open(this.errorMessage ?? 'Formulario inválido.', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          return;
        }
      }

      const formValue = this.saleForm.value;
      const saleRequest = {
        nombreCliente: formValue.nombreCliente,
        idMetodoPago: formValue.metodoPago.idMetodoPago,
        tipoComprobante: formValue.tipoComprobante,
        dni: formValue.dni || null,
        ruc: formValue.ruc || null,
        cardNumber: formValue.cardNumber,
        cardExpiry: formValue.cardExpiry,
        cardCVV: formValue.cardCVV,
        montoPagado: formValue.montoPagado.toString(),
        // Solo código de operación, sin teléfono
        yapeOperationCode: formValue.yapeOperationCode || null,
        plinOperationCode: formValue.plinOperationCode || null,
        detalles: this.detalles.map((d: DetalleVenta) => ({
          idProducto: d.idProducto,
          cantidad: d.cantidad,
          precio: d.precio.toString()
        }))
      } as VentaRequest;

      console.log('Payload enviado al backend:', JSON.stringify(saleRequest));

      if (this.isEditMode) {
        this.saleService.updateSale(this.saleId!, saleRequest).subscribe({
          next: () => {
            this.successMessage = 'Venta actualizada exitosamente.';
            this.snackBar.open(this.successMessage ?? 'Operación exitosa.', 'Cerrar', {
              duration: 3000,
              panelClass: ['snackbar-success']
            });

            this.updateStockAfterSale();
            this.loadProducts();

            // ⭐ PASO 3: AVISAR AL NAVBAR (Tiempo Real)
            // Esto fuerza al Navbar a revisar el stock inmediatamente
            this.productService.refresh$.next();

            setTimeout(() => this.router.navigate(['/ventas']), 2000);
          },
          // ... (error handler)
        });
      } else {
        this.saleService.createSale(saleRequest).subscribe({
          next: (response: any) => {
            console.log('✅ Venta registrada:', response);

            // ... (lógica de boleta igual que antes) ...

            // Lógica de Boleta (resumida para visualización)
            const montoEfectivoIngresado = this.saleForm.get('montoPagado')?.value;
            const datosParaBoleta = {
              ...response,
              montoPagado: montoEfectivoIngresado,
              detalles: this.detalles
            };
            this.dialog.open(BoletaComponent, {
              width: '475px',
              disableClose: false,
              data: { venta: datosParaBoleta }
            });

            // Actualizaciones locales
            this.updateStockAfterSale();
            this.loadProducts();

            // ⭐ PASO 3: AVISAR AL NAVBAR (Tiempo Real)
            // Al ejecutarse esto, el icono rojo/amarillo aparecerá al instante si el stock bajó
            this.productService.refresh$.next();

            this.snackBar.open('Venta registrada con éxito.', 'Cerrar', {
              duration: 4000,
              panelClass: ['snackbar-success']
            });

            setTimeout(() => {
              this.clearSaleForm();
            }, 500);
          },
          error: (err) => {
            // ... (tu manejo de errores actual)
            console.error('❌ Error al registrar venta:', err);
             this.snackBar.open(
              `Error: ${err.error?.message || JSON.stringify(err.error)}`,
              'Cerrar',
              { duration: 6000, panelClass: ['snackbar-error'] }
            );
          }
        });
      }
    } else {
      this.errorMessage = 'Por favor, corrija los errores en el formulario.';
      this.snackBar.open(this.errorMessage ?? 'Formulario inválido.', 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      this.saleForm.markAllAsTouched();
    }
  }

  // ✅ NUEVO: Método para recargar productos desde el backend
  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (productos) => {
        this.availableProducts = productos;
        console.log(`✅ Productos recargados: ${productos.length} productos con stock actualizado`);
      },
      error: (err) => {
        console.error('Error al recargar productos:', err);
      }
    });
  }

// MÉTODO CORREGIDO PARA LIMPIEZA TOTAL
  private clearSaleForm(): void {
    // 1. Reiniciar la tabla de productos
    this.detalles = [{ idProducto: 0, searchTerm: '', cantidad: 1, precio: 0 }];

    // 2. Limpiar TODOS los campos
    this.saleForm.patchValue({
      nombreCliente: '',
      dni: '',
      ruc: '',
      montoPagado: 0,
      vuelto: 0,
      // Solo código de operación, sin teléfono
      yapeOperationCode: '',
      plinOperationCode: '',
      cardNumber: '',
      cardExpiry: '',
      cardCVV: ''
    });

    // 3. Resetear el Método de Pago a "EFECTIVO" (Default)
    // Esto oculta los paneles de Yape/Plin y quita sus validaciones obligatorias
    const efectivoMetodo = this.lstMetodoPago.find(m => m.nombre.toUpperCase() === 'EFECTIVO');

    // Si existe Efectivo, lo seleccionamos. Si no, dejamos en blanco.
    const defaultId = efectivoMetodo ? efectivoMetodo.idMetodoPago : null;

    this.saleForm.get('metodoPago.idMetodoPago')?.setValue(defaultId);

    // 4. IMPORTANTE: Llamar a la lógica visual para que oculte los paneles de Yape/Plin
    this.updatePaymentPanels(defaultId);

    // 5. Resetear estados de "Touched" (para que no salgan errores rojos apenas se limpia)
    this.saleForm.markAsUntouched();
    this.saleForm.markAsPristine();

    // 6. Actualizar totales a 0
    this.updateTotales();
  }

  // Resto de métodos existentes...
  private checkDocumentPanelVisibility(): void {
    const totalVenta = this.getTotalVenta();
    const nombreClienteControl = this.saleForm.get('nombreCliente');
    let tipoComprobante = this.saleForm.get('tipoComprobante')?.value;
    if (!tipoComprobante) tipoComprobante = 'boleta';
    const dniControl = this.saleForm.get('dni');
    const rucControl = this.saleForm.get('ruc');

    if (totalVenta >= 700) {
      nombreClienteControl?.setValidators([
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'.]*$/),
        Validators.maxLength(200)
      ]);
      if (tipoComprobante === 'boleta') {
        dniControl?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
        rucControl?.clearValidators();
        rucControl?.setValue('');
      } else if (tipoComprobante === 'factura') {
        rucControl?.setValidators([Validators.required, Validators.pattern(/^(10|20)\d{9}$/)]);
        dniControl?.clearValidators();
        dniControl?.setValue('');
      }
    } else {
      nombreClienteControl?.setValidators([
        Validators.required,
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'.]*$/),
        Validators.maxLength(200)
      ]);
      dniControl?.clearValidators();
      rucControl?.clearValidators();
      dniControl?.setValue('');
      rucControl?.setValue('');
      if (!nombreClienteControl?.value || nombreClienteControl.value.trim() === '') {
        nombreClienteControl?.setValue('Cliente General');
      }
    }
    nombreClienteControl?.updateValueAndValidity();
    dniControl?.updateValueAndValidity();
    rucControl?.updateValueAndValidity();
  }

  // ✅ ELIMINADO: El método _filterProducts ya no es necesario ya que getFilteredProducts lo reemplaza

  calcularVuelto(montoPagado: string | number): void {
    const totalStr = this.getTotalVenta()?.toString().replace(/[^\d.]/g, '') || '0';
    const totalVenta = parseFloat(totalStr);
    const monto = parseFloat(montoPagado?.toString().replace(/[^\d.]/g, '') || '0');

    if (!isNaN(monto) && !isNaN(totalVenta) && monto >= totalVenta) {
      const vuelto = monto - totalVenta;
      const roundedVuelto = parseFloat(vuelto.toFixed(2));
      this.saleForm.get('vuelto')?.setValue(isNaN(roundedVuelto) ? 0 : roundedVuelto);
    } else {
      this.saleForm.get('vuelto')?.setValue(0);
    }
  }

  isProductDisabled(productId: number, currentIndex: number): boolean {
    return this.detalles.some(
      (detalle, idx) => idx !== currentIndex && detalle.idProducto === productId && detalle.idProducto > 0
    );
  }

  loadMetodosPago(): void {
    this.metodoPagoService.getMetodosPago().subscribe({
      next: (data) => {
        this.lstMetodoPago = data;
        const efectivoMetodo = this.lstMetodoPago.find(m => m.nombre.toUpperCase() === 'EFECTIVO');
        const defaultMetodo = efectivoMetodo || this.lstMetodoPago[0];
        if (defaultMetodo) {
          this.saleForm.get('metodoPago.idMetodoPago')?.setValue(defaultMetodo.idMetodoPago, { emitEvent: false });
          this.onMetodoPagoChange(defaultMetodo.idMetodoPago);
        } else {
          console.error('No se encontraron métodos de pago.');
        }
      },
      error: (err) => {
        console.error('Error al cargar métodos de pago:', err);
        this.errorMessage = 'No se pudieron cargar los métodos de pago.';
        this.snackBar.open(this.errorMessage ?? 'Error desconocido al cargar métodos de pago.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  private updateTotales(): void {
    this.getTotalVenta();
  }

  loadSale(id: number): void {
    this.saleService.getSaleById(id).subscribe({
      next: (sale: VentaResponse) => {
        this.saleForm.patchValue({
          nombreCliente: sale.nombreCliente,
        });

        this.detalles = [];
        if (sale.detalles && Array.isArray(sale.detalles)) {
          (sale.detalles as DetalleVentaResponse[]).forEach(detalle => {
            const product = this.availableProducts.find(p => p.idProducto === detalle.idProducto);
            const loadedDetalle: DetalleVenta = {
              idCategoria: detalle.idCategoria || undefined,
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              precio: (() => {
                const precio = Number(detalle.precio) || (product ? Number(product.precio) : 0);
                return isNaN(precio) ? 0 : precio;
              })(),
              searchTerm: this.formatProductDisplay(product!)
            };
            this.detalles.push(loadedDetalle);
          });
        }
        this.updateTotales();
        this.checkDocumentPanelVisibility();
      },
      error: (err) => {
        console.error('Error al cargar venta:', err);
        this.errorMessage = 'No se pudo cargar la información de la venta.';
        this.snackBar.open(this.errorMessage ?? 'Error desconocido al cargar venta.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  onSearchInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    this.detalles[index].searchTerm = input.value;
  }

  getDetallePrice(i: number): string {
    if (i < 0 || i >= this.detalles.length) return 'S/ 0.00';
    const detalle = this.detalles[i];
    const productId = detalle.idProducto;
    if (productId <= 0) return 'S/ 0.00';
    const product = this.availableProducts.find(p => p.idProducto === productId);
    const precio = product ? parseFloat(product.precio?.toString() ?? '0') : 0;
    return `S/ ${precio.toFixed(2)}`;
  }

  checkSubtotalValidation() {
    const total = Number(this.getTotalVenta());

    if (total >= 700) {
      this.saleForm.get('dni')?.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
      this.saleForm.get('ruc')?.setValidators([Validators.required, Validators.pattern(/^(10|20)\d{9}$/)]);
      this.saleForm.get('nombreCliente')?.setValidators([Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/), Validators.maxLength(200)]);
    } else {
      this.saleForm.get('dni')?.clearValidators();
      this.saleForm.get('ruc')?.clearValidators();
      this.saleForm.get('nombreCliente')?.clearValidators();
    }

    this.saleForm.get('dni')?.updateValueAndValidity({ onlySelf: true });
    this.saleForm.get('ruc')?.updateValueAndValidity({ onlySelf: true });
    this.saleForm.get('nombreCliente')?.updateValueAndValidity({ onlySelf: true });
  }

  getProductPrice(isQuick: boolean = false, index?: number): string {
    if (!isQuick && index !== undefined && this.detalles[index]) {
      const precio = parseFloat(this.detalles[index].precio?.toString() ?? '0');
      return `S/ ${precio.toFixed(2)}`;
    }
    return 'S/ 0.00';
  }

  getProductNameById(id: number): string {
    const product = this.availableProducts.find(p => p.idProducto === id);
    return product ? this.formatProductDisplay(product) : 'Producto no encontrado';
  }

  getDetalleTotal(detalle: DetalleVenta): number {
    const idProducto = detalle.idProducto;
    const cantidad = detalle.cantidad || 1;
    let precio: number = detalle.precio;

    if (isNaN(precio) || precio <= 0 && idProducto > 0) {
      const product = this.availableProducts.find(p => p.idProducto === idProducto);
      const productPrecio = product?.precio;
      precio = productPrecio ? parseFloat(productPrecio.toString()) : 0;
      if (isNaN(precio)) precio = 0;
    }

    if (cantidad > 0 && precio > 0) {
      const result = precio * cantidad;
      return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
    }

    return 0;
  }

  getProductDisplayValue(i: number): string {
    const d = this.detalles && this.detalles[i];

    return this.detalles[i]?.searchTerm || '';
  }

  getTotalVenta(): number {
    let total = 0;
    this.detalles.forEach(detalle => {
      const detalleTotal = this.getDetalleTotal(detalle);
      total += isNaN(detalleTotal) ? 0 : detalleTotal;
    });
    const roundedTotal = Number(total.toFixed(2));
    return isNaN(roundedTotal) ? 0 : roundedTotal;
  }

  getSubtotal(): number {
    const total = this.getTotalVenta();
    return Number((total / 1.18).toFixed(2));
  }

  getIGV(): number {
    const total = this.getTotalVenta();
    const subtotal = this.getSubtotal();
    return Number((total - subtotal).toFixed(2));
  }

  allowOnlyNumbersAndSlash(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 47) {
      event.preventDefault();
    }
  }

  formatCardExpiry(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    if (value.length > 5) {
      value = value.substring(0, 5);
    }
    this.saleForm.get('cardExpiry')?.setValue(value, { emitEvent: false });
    input.value = value;
  }

  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value.replace(/\D/g, '');
    let formattedValue = '';
    if (rawValue.length > 0) {
      formattedValue = rawValue.match(/.{1,4}/g)?.join(' ') || '';
    }
    if (formattedValue.length > 19) {
      formattedValue = formattedValue.substring(0, 19);
    }
    this.saleForm.get('cardNumber')?.setValue(rawValue, { emitEvent: false });
    input.value = formattedValue;
  }

  preventNumberInput(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if ([8, 9, 13, 27, 46, 37, 38, 39, 40].includes(charCode)) {
      return;
    }
    const allowedPattern = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\'.]/;
    const key = String.fromCharCode(charCode);
    if (!allowedPattern.test(key)) {
      event.preventDefault();
    }
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  blockNonNumericInput(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  blockNonStartingWithNine(event: KeyboardEvent, inputValue: string): void {
    const charCode = event.which ? event.which : event.keyCode;
    const key = String.fromCharCode(charCode);
    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
      return;
    }
    if (inputValue.length === 0 && key !== '9') {
      event.preventDefault();
    }
  }

  isTotalVentaOver700(): boolean {
    return this.getTotalVenta() >= 700;
  }
}
