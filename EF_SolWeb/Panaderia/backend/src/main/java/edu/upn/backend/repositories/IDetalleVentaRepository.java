package edu.upn.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import edu.upn.backend.models.DetalleVenta;
import java.util.List;

public interface IDetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {
    List<DetalleVenta> findByProducto_IdProducto(Long idProducto);
}
