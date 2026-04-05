
import { BigDecimal } from './big-decimal';
import { DetalleVenta } from './detalle-venta.model';
import { User } from './user.model';
import { MetodoPago } from './metodo-pago.models'; 


export interface Sale {
  idVenta?: number;
  nombreCliente: string;
  fechaVenta?: string;
  metodoPago?: MetodoPago;
  totalVenta?: BigDecimal;
  usuario?: User;
  detalles: DetalleVenta[];
}
