package edu.upn.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.upn.backend.models.Producto;

public interface IProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByNombre(String nombre);

    List<Producto> findByCategoria_IdCategoria(Integer idCategoria);
}