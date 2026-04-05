package edu.upn.backend.dto.response;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CategoriaResponse {

    private Integer idCategoria;
    private String nombre;

    public CategoriaResponse(Integer idCategoria, String nombre) {
        this.idCategoria = idCategoria;
        this.nombre = nombre;
    }
    

    
    // getters y setters
    public Integer getIdCategoria() {
        return idCategoria;
    }
    
    public void setIdCategoria(Integer idCategoria) {
        this.idCategoria = idCategoria;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}