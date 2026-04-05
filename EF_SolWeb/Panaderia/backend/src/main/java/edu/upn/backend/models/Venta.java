package edu.upn.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "VENTAS")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_VENTA")
    private Long idVenta;

    @Column(name = "NOMBRE_CLIENTE", nullable = false, length = 200)
    private String nombreCliente;

    @Column(name = "FECHA_VENTA", nullable = false, updatable = false)
    private LocalDateTime fechaVenta;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_METODO_PAGO", nullable = false)
    private MetodoPago metodoPago;

    @Column(name = "TOTAL_VENTA", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalVenta;

    // ✅ CAMPO CRÍTICO PARA EL VUELTO
    @Column(name = "MONTO_PAGADO", precision = 10, scale = 2)
    private BigDecimal montoPagado;

    // Campos opcionales (si te daban error antes, asegúrate de tenerlos aquí)
    @Column(name = "TIPO_COMPROBANTE", length = 20)
    private String tipoComprobante;
    @Column(name = "DNI", length = 8)
    private String dni;
    @Column(name = "RUC", length = 11)
    private String ruc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    @JsonIgnore
    private UsuarioModel usuario;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DetalleVenta> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaVenta = LocalDateTime.now();
        if (this.montoPagado == null) this.montoPagado = BigDecimal.ZERO;
    }

    public Venta() {}

    // Getters y Setters OBLIGATORIOS para que VentaService no falle
    public Long getIdVenta() { return idVenta; }
    public void setIdVenta(Long idVenta) { this.idVenta = idVenta; }

    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

    public LocalDateTime getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(LocalDateTime fechaVenta) { this.fechaVenta = fechaVenta; }

    public MetodoPago getMetodoPago() { return metodoPago; }
    public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }

    public BigDecimal getTotalVenta() { return totalVenta; }
    public void setTotalVenta(BigDecimal totalVenta) { this.totalVenta = totalVenta; }

    // ✅ ESTOS SON LOS QUE FALTABAN
    public BigDecimal getMontoPagado() { return montoPagado; }
    public void setMontoPagado(BigDecimal montoPagado) { this.montoPagado = montoPagado; }

    public String getTipoComprobante() { return tipoComprobante; }
    public void setTipoComprobante(String tipoComprobante) { this.tipoComprobante = tipoComprobante; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }

    public UsuarioModel getUsuario() { return usuario; }
    public void setUsuario(UsuarioModel usuario) { this.usuario = usuario; }

    public List<DetalleVenta> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVenta> detalles) {
        this.detalles = detalles;
        for (DetalleVenta detalle : detalles) {
            detalle.setVenta(this);
        }
    }
}