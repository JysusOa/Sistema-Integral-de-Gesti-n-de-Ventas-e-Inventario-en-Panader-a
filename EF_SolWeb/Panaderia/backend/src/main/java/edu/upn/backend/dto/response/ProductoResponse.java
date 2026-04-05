package edu.upn.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ProductoResponse {
    private Long idProducto;
    private String nombre;
    private String descripcion;
    private String marca;
    private String unidadMedida;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    private LocalDateTime fechaCreacion;
    private UsuarioProductoResponse usuarioRegistro;
    private CategoriaResponse categoria;
    private String estado;

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
