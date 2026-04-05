package edu.upn.backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VentaRequest {
    @NotBlank(message = "El nombre del cliente no puede estar vacío")
    @Size(max = 200, message = "El nombre del cliente no puede exceder los 200 caracteres")
    private String nombreCliente;

    @NotNull(message = "Debe seleccionar un método de pago")
    private Integer idMetodoPago;

    // ✅ RECIBIR MONTO
    private BigDecimal montoPagado;

    private String tipoComprobante;
    private String dni;
    private String ruc;
    private String cardNumber;
    private String cardExpiry;
    private String cardCVV;

    @NotEmpty(message = "La venta debe tener al menos un producto")
    @Valid
    private List<DetalleVentaRequest> detalles;
}