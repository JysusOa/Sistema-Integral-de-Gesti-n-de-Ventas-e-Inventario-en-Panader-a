package edu.upn.backend.controllers; // Paquete actualizado

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import edu.upn.backend.security.UserDetailsImpl;
import edu.upn.backend.dto.request.RegistroRequest;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.services.AuthService;
import edu.upn.backend.security.TokenUtils;  // Agregado
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserDetailsService userDetailsService;  // Agregado

    // Endpoint para el registro de nuevos usuarios (incluyendo el primer administrador)
    @PostMapping("/registrar")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody RegistroRequest registroRequest) {
        try {
            UsuarioModel nuevoUsuario = authService.registrarUsuario(registroRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // Nuevo endpoint para refrescar tokens
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String token) {
    if (token == null || !token.startsWith("Bearer ")) {
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body("Token inválido");
    }
    String accessToken = token.replace("Bearer ", "");
    String correo = TokenUtils.getSubjectFromToken(accessToken);
    if (correo == null) {
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body("Token expirado o inválido");
    }
    try {
        UserDetails userDetails = userDetailsService.loadUserByUsername(correo);
        UserDetailsImpl userDetailsImpl = (UserDetailsImpl) userDetails;  // Casteo agregado
        String newToken = TokenUtils.createToken(userDetailsImpl.getNombre(), userDetailsImpl.getUsername(), userDetailsImpl.getRol());
        return ResponseEntity.ok().header("Authorization", "Bearer " + newToken).build();
    } catch (Exception e) {
        return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body("Error al refrescar token");
        }
    }
}