package edu.upn.backend.dto.response;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DetalleVentaResponse {
    private Long idDetalleVenta;
    private Long idProducto;
    private String nombreProducto;
    private Integer cantidad;
    private BigDecimal precioUnitarioVenta;
    private BigDecimal subtotalDetalle;
    private String marca;
    private String unidadMedida;
}