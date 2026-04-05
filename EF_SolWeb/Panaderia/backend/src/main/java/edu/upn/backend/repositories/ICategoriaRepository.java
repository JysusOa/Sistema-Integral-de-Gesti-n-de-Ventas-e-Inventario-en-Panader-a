package edu.upn.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import edu.upn.backend.models.Categoria;
import java.util.Optional;
import java.util.List;

public interface ICategoriaRepository extends JpaRepository<Categoria, Integer> {
    //Optional<Categoria> findByNombre(String nombre);
    public abstract List<Categoria> findByOrderByNombreAsc();
    Optional<Categoria> findByNombre(String nombre);


}
