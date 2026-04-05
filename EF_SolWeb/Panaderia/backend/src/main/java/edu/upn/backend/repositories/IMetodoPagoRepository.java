package edu.upn.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.upn.backend.models.MetodoPago;

public interface IMetodoPagoRepository extends JpaRepository<MetodoPago, Integer> {
    //Optional<MetodoPago> findByNombre(String nombre);
    public abstract List<MetodoPago> findByOrderByNombreAsc();
}
