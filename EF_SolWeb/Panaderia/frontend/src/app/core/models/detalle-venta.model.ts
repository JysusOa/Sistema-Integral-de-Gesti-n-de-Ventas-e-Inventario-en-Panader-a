
import { BigDecimal } from './big-decimal';
//import { Product } from './product-response.model';

export interface DetalleVenta {
  idDetalleVenta?: number;
  idCategoria?: number;
  idProducto?: number;
  nombreProducto?: string;
  cantidad: number;
  precio?: BigDecimal;
  subtotalDetalle?: BigDecimal;
  searchTerm?: string;
}
