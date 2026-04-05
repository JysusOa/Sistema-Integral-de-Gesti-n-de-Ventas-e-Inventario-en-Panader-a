package edu.upn.backend.dto.request;

import java.math.BigDecimal;

import edu.upn.backend.models.Categoria;
import lombok.Data;


@Data
public class ProductoRequest {
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Integer stock;
    private String imagenUrl;
    //private LocalDateTime fechaCreacion;
    //private Integer usuarioRegistro;
    //private Integer idCategoria;
    private Categoria categoria;
    private String estado;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public Categoria getCategoria() {
    return categoria;
    }

    public void setCategoria(Categoria Categoria) {
        this.categoria = Categoria;
    }

    public String getEstado() { return estado; }
    
    public void setEstado(String estado) { this.estado = estado; }
}
