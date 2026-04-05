package edu.upn.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "PRODUCTOS")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_PRODUCTO")
    private Long idProducto;

    @Column(name = "NOMBRE", nullable = false, unique = true, length = 200)
    private String nombre;

    @Column(name = "DESCRIPCION", length = 500)
    private String descripcion;

    @Column(name = "PRECIO", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "STOCK", nullable = false)
    private Integer stock = 0;

    @Column(name = "IMAGEN_URL", length = 500)
    private String imagenUrl;

    @Column(name = "MARCA", length = 100)
    private String marca;

    @Column(name = "UNIDAD_MEDIDA", length = 50)
    private String unidadMedida;


    @Column(name = "FECHA_CREACION", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_USUARIO_REGISTRO", nullable = false)
    private UsuarioModel usuarioRegistro;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "ID_CATEGORIA")  
    private Categoria categoria;

    @Column(name = "estado", length = 20)
    private String estado;
    
    @PrePersist
    protected void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = "ACTIVO";
        }
    }

    // ✅ Propiedad calculada (no persistida)
    @Transient
    public String getEstado() {
        if (stock == null) return "Desconocido";
        if (stock == 0) return "Sin stock";
        if (stock <= 5) return "Bajo stock";
        return "En stock";
    }

    public Producto() {}

    public Producto(String nombre, String descripcion, BigDecimal precio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
    }

    public Producto(String nombre, String descripcion, BigDecimal precio, UsuarioModel usuarioRegistro) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.usuarioRegistro = usuarioRegistro;
    }

    // Getters y Setters
    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {
        this.idProducto = idProducto;
    }

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

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public UsuarioModel getUsuarioRegistro() {
        return usuarioRegistro;
    }

    public void setUsuarioRegistro(UsuarioModel usuarioRegistro) {
        this.usuarioRegistro = usuarioRegistro;
    }

    // Getters y setters
    public Categoria getCategoria() {
        return categoria;
    }
    
    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getMarca() {
         return marca; 
    }

    public void setMarca(String marca) {
         this.marca = marca; 
    }

    public String getUnidadMedida() {
         return unidadMedida; 
    }

    public void setUnidadMedida(String unidadMedida) { 
        this.unidadMedida = unidadMedida;
    }
    

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
