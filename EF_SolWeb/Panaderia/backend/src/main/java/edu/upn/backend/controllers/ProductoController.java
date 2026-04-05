package edu.upn.backend.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.upn.backend.dto.response.ProductoResponse;
import edu.upn.backend.models.Producto;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.security.UserDetailsImpl;
import edu.upn.backend.services.ProductoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    @Autowired
    ProductoService productoService;

    // CREATE
    @PostMapping
    public ResponseEntity<ProductoResponse> crearProducto(@Valid @RequestBody Producto producto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            UsuarioModel usuarioCreador = userDetails.getUsuario();

            Producto nuevoProducto = productoService.guardarProducto(producto, usuarioCreador);
            return ResponseEntity.status(HttpStatus.CREATED).body(productoService.convertToProductoResponse(nuevoProducto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // READ ALL
    @GetMapping
    public ResponseEntity<List<ProductoResponse>> getProductos() {
        return ResponseEntity.ok(productoService.listarProductos());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> getProductoById(@PathVariable Long id) {
        Optional<ProductoResponse> producto = productoService.obtenerProductoPorId(id);
        return producto.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizarProducto(@PathVariable Long id, @Valid @RequestBody Producto producto) {
        try {
            Producto productoActualizado = productoService.actualizarProducto(id, producto);
            return ResponseEntity.ok(productoService.convertToProductoResponse(productoActualizado));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarProducto(@PathVariable Long id) {
        try {
            productoService.eliminarProducto(id);
            return ResponseEntity.ok("Producto eliminado exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al eliminar producto: " + e.getMessage());
        }
    }

    // NUEVO ENDPOINT: Contar productos
    @GetMapping("/count")
    public ResponseEntity<Long> countProductos() {
        return ResponseEntity.ok(productoService.countProductos());
    }
}
