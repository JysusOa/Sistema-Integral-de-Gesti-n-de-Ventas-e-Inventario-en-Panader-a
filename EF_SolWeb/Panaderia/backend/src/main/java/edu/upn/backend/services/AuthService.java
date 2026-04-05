package edu.upn.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import edu.upn.backend.dto.request.RegistroRequest;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.repositories.IUsuarioRepository;


@Service
public class AuthService {

    @Autowired
    private IUsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UsuarioModel registrarUsuario(RegistroRequest registroRequest) {
        // Verificar si el correo ya existe
        if (usuarioRepository.findByCorreo(registroRequest.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo ya está registrado.");
        }

        UsuarioModel nuevoUsuario = new UsuarioModel();
        nuevoUsuario.setNombre(registroRequest.getNombre());
        nuevoUsuario.setApellidos(registroRequest.getApellidos());
        nuevoUsuario.setTelefono(registroRequest.getTelefono());
        nuevoUsuario.setCorreo(registroRequest.getCorreo());
        nuevoUsuario.setClave(passwordEncoder.encode(registroRequest.getClave()));

        nuevoUsuario.setRol(registroRequest.getRol());

        return usuarioRepository.save(nuevoUsuario);
    }

}