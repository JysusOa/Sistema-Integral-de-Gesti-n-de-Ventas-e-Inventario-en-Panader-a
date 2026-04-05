package edu.upn.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class VentaResponse {
    private Long idVenta;
    private String nombreCliente;
    private LocalDateTime fechaVenta;
    private MetodoPagoResponse metodoPago;
    private BigDecimal totalVenta;
    
    // ✅ Campo corregido (Lombok generará el setMontoPagado automáticamente)
    private BigDecimal montoPagado;
    
    private UsuarioVentaResponse usuario;
    private List<DetalleVentaResponse> detalles;
    
    private String estado; 
    
    // Campos opcionales de comprobante
    private String tipoComprobante;
    private String dni;
    private String ruc;
    private String descripcionPago;
}