package edu.upn.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import edu.upn.backend.models.UsuarioModel;
import java.util.Optional;

public interface IUsuarioRepository extends JpaRepository<UsuarioModel, Long> {
    Optional<UsuarioModel> findByCorreo(String correo);
}