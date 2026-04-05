package edu.upn.backend.dto.response;

import lombok.Data;

@Data
public class UsuarioVentaResponse {
    private Long id;
    private String nombre;
    private String apellidos;
    private String correo;
}