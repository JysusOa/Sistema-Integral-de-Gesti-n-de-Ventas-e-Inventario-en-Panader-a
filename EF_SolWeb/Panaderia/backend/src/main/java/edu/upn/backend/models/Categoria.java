
package edu.upn.backend.models;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "CATEGORIA")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_CATEGORIA")
    private Integer idCategoria;

    @Column(name = "NOMBRE")
    private String nombre;

    /*
    @OneToMany(mappedBy = "categoria", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore // 🔹 Evita bucles infinitos al devolver JSON
    private List<Producto> productos;*/

    public Categoria() {}

    public Categoria(String nombre) {
        this.nombre = nombre;
    }

    // Getters y setters
    public Integer getIdCategoria() {
        return idCategoria;
    }
    

    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria =idCategoria;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }


}
