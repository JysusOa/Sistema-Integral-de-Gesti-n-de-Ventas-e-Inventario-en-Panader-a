import { BigDecimal } from './big-decimal';
import { UsuarioVentaResponse } from './user-sale-response.model';
import { DetalleVentaResponse } from './detalle-venta-response.model';
import { MetodoPago } from './metodo-pago.models';
import { ItemBoleta } from './ItemBoleta';


export interface VentaResponse {
  estado: string;
  idVenta?: number;
  nombreCliente: string;
  fechaVenta: string;
  metodoPago?: MetodoPago;
  totalVenta?: number;
  usuario?: UsuarioVentaResponse;
  detalles?: DetalleVentaResponse[];
  descripcionPago: string;
  items: ItemBoleta[];
}

