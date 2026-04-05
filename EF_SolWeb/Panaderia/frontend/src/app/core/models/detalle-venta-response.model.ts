import { BigDecimal } from './big-decimal';

export interface DetalleVentaResponse {
  idDetalleVenta: number;
  idProducto: number;
  idCategoria: number;  // ← EXPANDIDO: Nuevo campo para categoría
  precio : string; // ← EXPANDIDO: Precio como string
  nombreProducto: string;
  cantidad: number;
  precioUnitarioVenta: BigDecimal;
  subtotalDetalle: BigDecimal;
  unidadMedida: string;
  marca: string; // ← EXPANDIDO: Nuevo campo para marca
}
