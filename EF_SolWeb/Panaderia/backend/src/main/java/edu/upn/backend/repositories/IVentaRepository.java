package edu.upn.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.upn.backend.models.Venta;

public interface IVentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByUsuario_Id(Long userId);
    //List<Venta> findByMetodoPago_Id(Integer idMetodoPago);
    List<Venta> findByMetodoPago_IdMetodoPago(Integer idMetodoPago);
}
