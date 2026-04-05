package edu.upn.backend.dto.response;

import lombok.Data;

@Data
public class UsuarioProductoResponse {
    private Long id;
    private String nombre;
    private String apellidos;
    private String correo;
}
