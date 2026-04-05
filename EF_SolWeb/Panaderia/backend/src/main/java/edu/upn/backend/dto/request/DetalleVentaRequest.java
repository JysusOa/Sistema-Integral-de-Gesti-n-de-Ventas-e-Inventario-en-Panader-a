package edu.upn.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DetalleVentaRequest {
    @NotNull(message = "El ID del producto no puede ser nulo")
    private Long idProducto;

    @NotNull(message = "La cantidad no puede ser nula")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;

    @NotNull(message= "El precio no puede ser nulo")
    private BigDecimal precio;
}