package edu.upn.backend.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MetodoPagoResponse {
    private Integer idMetodoPago;
    private String nombre;

    public MetodoPagoResponse(Integer idMetodoPago, String nombre) {
        this.idMetodoPago = idMetodoPago;
        this.nombre = nombre;
    }



}
