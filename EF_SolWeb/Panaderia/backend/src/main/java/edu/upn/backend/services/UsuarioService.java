package edu.upn.backend.services;

import java.util.ArrayList;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import edu.upn.backend.dto.request.RegistroRequest;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.repositories.IUsuarioRepository;

@Service
public class UsuarioService {
    @Autowired
    IUsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // READ ALL
    public ArrayList<UsuarioModel> listarUsuarios() {
        return (ArrayList<UsuarioModel>) usuarioRepository.findAll();
    }

    // READ BY ID
    public Optional<UsuarioModel> obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    // CREATE (PARA EL ADMINISTRADOR AÑADIR EMPLEADOS)
    public UsuarioModel guardarUsuario(RegistroRequest usuarioRequest) {
        if (usuarioRepository.findByCorreo(usuarioRequest.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo ya está registrado.");
        }
        UsuarioModel nuevoUsuario = new UsuarioModel();
        nuevoUsuario.setNombre(usuarioRequest.getNombre());
        nuevoUsuario.setApellidos(usuarioRequest.getApellidos());
        nuevoUsuario.setTelefono(usuarioRequest.getTelefono());
        nuevoUsuario.setCorreo(usuarioRequest.getCorreo());
        nuevoUsuario.setClave(passwordEncoder.encode(usuarioRequest.getClave()));
        nuevoUsuario.setRol(usuarioRequest.getRol());
        return usuarioRepository.save(nuevoUsuario);
    }

    // UPDATE
    public UsuarioModel actualizarUsuario(Long id, UsuarioModel usuarioActualizado) {
        Optional<UsuarioModel> usuarioExistenteOpt = usuarioRepository.findById(id);
        if (usuarioExistenteOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado con ID: " + id);
        }
        UsuarioModel usuarioExistente = usuarioExistenteOpt.get();
        usuarioExistente.setNombre(usuarioActualizado.getNombre());
        usuarioExistente.setApellidos(usuarioActualizado.getApellidos());
        usuarioExistente.setTelefono(usuarioActualizado.getTelefono());
        usuarioExistente.setRol(usuarioActualizado.getRol());

        if (!usuarioActualizado.getCorreo().equals(usuarioExistente.getCorreo())) {
            if (usuarioRepository.findByCorreo(usuarioActualizado.getCorreo()).isPresent()) {
                throw new RuntimeException("El nuevo correo ya está en uso.");
            }
            usuarioExistente.setCorreo(usuarioActualizado.getCorreo());
        }
        if (usuarioActualizado.getClave() != null && !usuarioActualizado.getClave().isEmpty()) {
            usuarioExistente.setClave(passwordEncoder.encode(usuarioActualizado.getClave()));
        }

        return usuarioRepository.save(usuarioExistente);
    }

    // DELETE
    public void eliminarUsuario(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado con ID: " + id);
        }
        usuarioRepository.deleteById(id);
    }

    // NUEVO MÉTODO: Contar usuarios
    public long countUsuarios() {
        return usuarioRepository.count();
    }
}
