package edu.upn.backend.controllers;

import java.util.ArrayList;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.upn.backend.dto.request.RegistroRequest;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.services.UsuarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    UsuarioService usuarioService;

    // READ ALL
    @GetMapping
    public ResponseEntity<ArrayList<UsuarioModel>> getUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioModel> getUsuarioById(@PathVariable Long id) {
        Optional<UsuarioModel> usuario = usuarioService.obtenerUsuarioPorId(id);
        return usuario.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // CREATE (PARA EL ADMINISTRADOR AÑADIR EMPLEADOS)
    @PostMapping
    public ResponseEntity<UsuarioModel> crearUsuario(@Valid @RequestBody RegistroRequest usuarioRequest) {
        try {
            UsuarioModel nuevoUsuario = usuarioService.guardarUsuario(usuarioRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoUsuario);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioModel> actualizarUsuario(@PathVariable Long id, @Valid @RequestBody UsuarioModel usuario) {
        try {
            UsuarioModel usuarioActualizado = usuarioService.actualizarUsuario(id, usuario);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarUsuario(@PathVariable Long id) {
        try {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.ok("Usuario eliminado exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al eliminar usuario: " + e.getMessage());
        }
    }

    // NUEVO ENDPOINT: Contar usuarios
    @GetMapping("/count")
    public ResponseEntity<Long> countUsuarios() {
        return ResponseEntity.ok(usuarioService.countUsuarios());
    }
}
