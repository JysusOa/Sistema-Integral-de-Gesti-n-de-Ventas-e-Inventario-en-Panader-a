import { DetalleVentaRequest } from "./detalle-venta-request.model";
import { MetodoPago } from "./metodo-pago.models";

export interface VentaRequest {
    nombreCliente: string;
    idMetodoPago: number;
    tipoComprobante: string;
    dni: string;
    ruc: string;
    cardNumber: string;
    cardExpiry: string;
    cardCVV: string;
    montoPagado: number;
    detalles: DetalleVentaRequest[];
}
