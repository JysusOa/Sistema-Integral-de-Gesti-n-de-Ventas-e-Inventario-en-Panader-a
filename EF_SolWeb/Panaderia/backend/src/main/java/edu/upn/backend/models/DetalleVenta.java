package edu.upn.backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;

import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "DETALLE_VENTAS")
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_DETALLE_VENTA")
    private Long idDetalleVenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_VENTA", nullable = false)
    @JsonIgnore
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PRODUCTO", nullable = false)
    private Producto producto;

    @Column(name = "CANTIDAD", nullable = false)
    private Integer cantidad;

    @Column(name = "PRECIO_UNITARIO_VENTA", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitarioVenta;

    @Column(name = "SUBTOTAL_DETALLE", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotalDetalle;

    public DetalleVenta() {}

    public DetalleVenta(Venta venta, Producto producto, Integer cantidad, BigDecimal precioUnitarioVenta, BigDecimal subtotalDetalle) {
        this.venta = venta;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitarioVenta = precioUnitarioVenta;
        this.subtotalDetalle = subtotalDetalle;
    }

    // Getters y Setters
    public Long getIdDetalleVenta() {
        return idDetalleVenta;
    }

    public void setIdDetalleVenta(Long idDetalleVenta) {
        this.idDetalleVenta = idDetalleVenta;
    }

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitarioVenta() {
        return precioUnitarioVenta;
    }

    public void setPrecioUnitarioVenta(BigDecimal precioUnitarioVenta) {
        this.precioUnitarioVenta = precioUnitarioVenta;
    }

    public BigDecimal getSubtotalDetalle() {
        return subtotalDetalle;
    }

    public void setSubtotalDetalle(BigDecimal subtotalDetalle) {
        this.subtotalDetalle = subtotalDetalle;
    }
}