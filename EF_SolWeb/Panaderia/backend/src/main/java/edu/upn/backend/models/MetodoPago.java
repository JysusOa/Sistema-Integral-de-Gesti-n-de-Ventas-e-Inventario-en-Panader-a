
package edu.upn.backend.models;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "METODO_PAGO")
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_METODO_PAGO")
    private Integer idMetodoPago;

    @Column(name = "NOMBRE", nullable = false, unique = true, length = 50)
    private String nombre;

    public MetodoPago() {}

    public MetodoPago(String nombre) {
        this.nombre = nombre;
    }

    // Getters y setters
    public Integer getIdMetodoPago() {
        return idMetodoPago;
    }

    public void setIdMetodoPago(Integer idMetodoPago) {
        this.idMetodoPago = idMetodoPago;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }


}