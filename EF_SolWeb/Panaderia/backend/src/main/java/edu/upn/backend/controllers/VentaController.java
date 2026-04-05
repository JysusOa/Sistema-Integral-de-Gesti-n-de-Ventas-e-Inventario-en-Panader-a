package edu.upn.backend.controllers;

import java.util.ArrayList;
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

import edu.upn.backend.dto.request.VentaRequest;
import edu.upn.backend.dto.response.VentaResponse;
import edu.upn.backend.models.Venta;
import edu.upn.backend.security.UserDetailsImpl;
import edu.upn.backend.services.VentaService;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/ventas")
public class VentaController {

    @Autowired
    VentaService ventaService;

    // CREATE
    @PostMapping
    public ResponseEntity<VentaResponse> registrarVenta(@Valid @RequestBody VentaRequest ventaRequest) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long idUsuarioAutenticado = userDetails.getUsuario().getId();

            Venta nuevaVentaEntity = ventaService.registrarVenta(ventaRequest, idUsuarioAutenticado);
            VentaResponse nuevaVentaResponse = ventaService.convertToVentaResponse(nuevaVentaEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaVentaResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // READ ALL / FILTER BY USER
    @GetMapping
    public ResponseEntity<List<VentaResponse>> getVentas() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userRole = userDetails.getRol();
        Long userId = userDetails.getUsuario().getId();

        List<VentaResponse> ventas;

        if ("ADMINISTRADOR".equalsIgnoreCase(userRole)) {
            ventas = ventaService.listarVentas();
            System.out.println("DEBUG VentaController: Administrador listando TODAS las ventas.");
        } else if ("EMPLEADO".equalsIgnoreCase(userRole)) {
            ventas = ventaService.listarVentasPorUsuario(userId);
            System.out.println("DEBUG VentaController: Empleado (" + userId + ") listando SUS ventas.");
        } else {
            ventas = new ArrayList<>();
            System.out.println("DEBUG VentaController: Rol no reconocido o no autorizado para listar ventas.");
        }
        return ResponseEntity.ok(ventas);
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<VentaResponse> getVentaById(@PathVariable Long id) {
        Optional<VentaResponse> venta = ventaService.obtenerVentaPorId(id);
        return venta.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    @SuppressWarnings("CallToPrintStackTrace")
     public ResponseEntity<VentaResponse> actualizarVenta(@PathVariable Long id, @Valid @RequestBody VentaRequest ventaRequest) {
         System.out.println("DEBUG: Recibido VentaRequest: " + ventaRequest);
         try {
             Venta ventaActualizadaEntity = ventaService.actualizarVenta(id, ventaRequest);
             VentaResponse ventaActualizadaResponse = ventaService.convertToVentaResponse(ventaActualizadaEntity);
             System.out.println("DEBUG: Venta actualizada exitosamente");
             return ResponseEntity.ok(ventaActualizadaResponse);
         } catch (RuntimeException e) {
             System.out.println("DEBUG: Error en actualizarVenta: " + e.getMessage());
             e.printStackTrace();  // ← AGREGAR: Imprime el stack trace completo
             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
         } catch (Exception e) {  // ← AGREGAR: Captura otras excepciones (e.g., JSON parse)
             System.out.println("DEBUG: Excepción general en actualizarVenta: " + e.getMessage());
             e.printStackTrace();  // ← AGREGAR: Stack trace
             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
         }
     }     

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarVenta(@PathVariable Long id) {
        try {
            ventaService.eliminarVenta(id);
            return ResponseEntity.ok("Venta eliminada exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al eliminar venta: " + e.getMessage());
        }
    }

    // NUEVO ENDPOINT: Contar ventas
    @GetMapping("/count")
    public ResponseEntity<Long> countVentas() {
        return ResponseEntity.ok(ventaService.countVentas());
    }
}