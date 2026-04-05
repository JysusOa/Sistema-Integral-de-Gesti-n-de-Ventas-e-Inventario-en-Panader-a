package edu.upn.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.upn.backend.dto.request.DetalleVentaRequest;
import edu.upn.backend.dto.request.VentaRequest;
import edu.upn.backend.dto.response.DetalleVentaResponse;
import edu.upn.backend.dto.response.MetodoPagoResponse;
import edu.upn.backend.dto.response.UsuarioVentaResponse;
import edu.upn.backend.dto.response.VentaResponse;
import edu.upn.backend.models.DetalleVenta;
import edu.upn.backend.models.MetodoPago;
import edu.upn.backend.models.Producto;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.models.Venta;
import edu.upn.backend.repositories.IDetalleVentaRepository;
import edu.upn.backend.repositories.IMetodoPagoRepository;
import edu.upn.backend.repositories.IProductoRepository;
import edu.upn.backend.repositories.IUsuarioRepository;
import edu.upn.backend.repositories.IVentaRepository;

@Service
public class VentaService {

    @Autowired
    IVentaRepository ventaRepository;

    @Autowired
    IProductoRepository productoRepository;

    @Autowired
    IDetalleVentaRepository detalleVentaRepository;

    @Autowired
    IUsuarioRepository usuarioRepository;

    @Autowired
    IMetodoPagoRepository metodoPagoRepository;

    public VentaResponse convertToVentaResponse(Venta venta) {
        if (venta == null) {
            return null;
        }

        VentaResponse response = new VentaResponse();
        response.setIdVenta(venta.getIdVenta());
        response.setNombreCliente(venta.getNombreCliente());
        response.setFechaVenta(venta.getFechaVenta());
        response.setTotalVenta(venta.getTotalVenta());

        // ✅ LÓGICA DE SEGURIDAD (SAFE MODE)
        // Si el monto es NULL (ventas viejas), ponemos el total para que no falle el Response
        if (venta.getMontoPagado() != null) {
            response.setMontoPagado(venta.getMontoPagado());
        } else {
            response.setMontoPagado(venta.getTotalVenta());
        }
        
        // Mapeo seguro de campos opcionales
        response.setTipoComprobante(venta.getTipoComprobante());
        response.setDni(venta.getDni());
        response.setRuc(venta.getRuc());

        if (venta.getUsuario() != null) {
            UsuarioVentaResponse usuarioResponse = new UsuarioVentaResponse();
            usuarioResponse.setId(venta.getUsuario().getId());
            usuarioResponse.setNombre(venta.getUsuario().getNombre());
            usuarioResponse.setApellidos(venta.getUsuario().getApellidos());
            usuarioResponse.setCorreo(venta.getUsuario().getCorreo());
            response.setUsuario(usuarioResponse);
        }

        if (venta.getDetalles() != null) {
            List<DetalleVentaResponse> detallesResponse = venta.getDetalles().stream()
                .map(detalle -> {
                    DetalleVentaResponse detResponse = new DetalleVentaResponse();
                    detResponse.setIdDetalleVenta(detalle.getIdDetalleVenta());
                    detResponse.setIdProducto(detalle.getProducto().getIdProducto());
                    detResponse.setNombreProducto(detalle.getProducto().getNombre());
                    // Validación null-safe para unidad de medida
                    String unidad = detalle.getProducto().getUnidadMedida();
                    detResponse.setUnidadMedida(unidad != null ? unidad : "Unidad");
                    
                    detResponse.setCantidad(detalle.getCantidad());
                    detResponse.setPrecioUnitarioVenta(detalle.getPrecioUnitarioVenta());
                    detResponse.setSubtotalDetalle(detalle.getSubtotalDetalle());
                    return detResponse;
                })
                .collect(Collectors.toList());
            response.setDetalles(detallesResponse);
        }

        if (venta.getMetodoPago() != null) {
            MetodoPagoResponse metodoDto = new MetodoPagoResponse();
            metodoDto.setIdMetodoPago(venta.getMetodoPago().getIdMetodoPago());
            metodoDto.setNombre(venta.getMetodoPago().getNombre());
            response.setMetodoPago(metodoDto);
            response.setDescripcionPago(venta.getMetodoPago().getNombre());
        } else {
            response.setMetodoPago(null);
        }

        return response;
    }

    // CREATE
    @Transactional
    public Venta registrarVenta(VentaRequest ventaRequest, Long idUsuarioAutenticado) {
        UsuarioModel usuario = usuarioRepository.findById(idUsuarioAutenticado)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado."));

        Venta nuevaVenta = new Venta();
        nuevaVenta.setNombreCliente(ventaRequest.getNombreCliente());
        nuevaVenta.setFechaVenta(LocalDateTime.now());
        nuevaVenta.setUsuario(usuario);
        
        nuevaVenta.setTipoComprobante(ventaRequest.getTipoComprobante());
        nuevaVenta.setDni(ventaRequest.getDni());
        nuevaVenta.setRuc(ventaRequest.getRuc());

        MetodoPago metodoPago = metodoPagoRepository.findById(ventaRequest.getIdMetodoPago())
        .orElseThrow(() -> new RuntimeException("Método de pago no encontrado con ID: " + ventaRequest.getIdMetodoPago()));
        nuevaVenta.setMetodoPago(metodoPago);

        // ✅ GUARDAR EL MONTO (Manejo de nulos)
        if (ventaRequest.getMontoPagado() != null) {
            nuevaVenta.setMontoPagado(ventaRequest.getMontoPagado());
        } else {
            nuevaVenta.setMontoPagado(BigDecimal.ZERO);
        }

        BigDecimal totalVenta = BigDecimal.ZERO;
        List<DetalleVenta> detalles = new java.util.ArrayList<>();

        if (ventaRequest.getDetalles() == null || ventaRequest.getDetalles().isEmpty()) {
            throw new RuntimeException("La venta debe tener al menos un producto.");
        }

        for (DetalleVentaRequest detalleRequest : ventaRequest.getDetalles()) {
            Producto producto = productoRepository.findById(detalleRequest.getIdProducto())
                                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + detalleRequest.getIdProducto()));

            if (detalleRequest.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad del producto debe ser mayor que cero.");
            }

            // VALIDAR STOCK
            if (producto.getStock() < detalleRequest.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + producto.getNombre() + 
                                         ". Disponible: " + producto.getStock() + 
                                         ", Solicitado: " + detalleRequest.getCantidad());
            }

            // ACTUALIZAR STOCK
            producto.setStock(producto.getStock() - detalleRequest.getCantidad());
            productoRepository.save(producto);

            DetalleVenta detalleVenta = new DetalleVenta();
            detalleVenta.setProducto(producto);
            detalleVenta.setCantidad(detalleRequest.getCantidad());
            
            BigDecimal precio = producto.getPrecio();
            if(detalleRequest.getPrecio() != null) precio = detalleRequest.getPrecio();
            
            detalleVenta.setPrecioUnitarioVenta(precio);
            detalleVenta.setSubtotalDetalle(precio.multiply(BigDecimal.valueOf(detalleRequest.getCantidad())));

            detalleVenta.setVenta(nuevaVenta);
            detalles.add(detalleVenta);

            totalVenta = totalVenta.add(detalleVenta.getSubtotalDetalle());
        }

        nuevaVenta.setDetalles(detalles);
        nuevaVenta.setTotalVenta(totalVenta);
        
        // Ajuste opcional para pagos digitales
        if (!metodoPago.getNombre().equalsIgnoreCase("EFECTIVO") || 
           (nuevaVenta.getMontoPagado().compareTo(BigDecimal.ZERO) == 0 && metodoPago.getNombre().equalsIgnoreCase("EFECTIVO"))) {
             // Opcional: Igualar monto al total si el pago es digital
             // nuevaVenta.setMontoPagado(totalVenta);
        }

        return ventaRepository.save(nuevaVenta);
    }

    // READ ALL
    public List<VentaResponse> listarVentas() {
        List<Venta> ventas = ventaRepository.findAll();
        return ventas.stream()
                     .map(this::convertToVentaResponse)
                     .collect(Collectors.toList());
    }

    // Listar ventas por ID de usuario
    public List<VentaResponse> listarVentasPorUsuario(Long userId) {
        List<Venta> ventas = ventaRepository.findByUsuario_Id(userId);
        return ventas.stream()
                     .map(this::convertToVentaResponse)
                     .collect(Collectors.toList());
    }

    // READ BY ID
    public Optional<VentaResponse> obtenerVentaPorId(Long id) {
        Optional<Venta> venta = ventaRepository.findById(id);
        return venta.map(this::convertToVentaResponse);
    }

    // UPDATE
    @Transactional
    public Venta actualizarVenta(Long id, VentaRequest ventaRequest) {
        Venta ventaExistente = ventaRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Venta no encontrada con ID: " + id));

        // RESTAURAR STOCK
        for (DetalleVenta detalleExistente : ventaExistente.getDetalles()) {
            Producto producto = detalleExistente.getProducto();
            producto.setStock(producto.getStock() + detalleExistente.getCantidad());
            productoRepository.save(producto);
        }

        ventaExistente.setNombreCliente(ventaRequest.getNombreCliente());
        // Actualizar comprobantes
        ventaExistente.setTipoComprobante(ventaRequest.getTipoComprobante());
        ventaExistente.setDni(ventaRequest.getDni());
        ventaExistente.setRuc(ventaRequest.getRuc());

        if (ventaRequest.getIdMetodoPago() != null) {
            MetodoPago metodoPago = metodoPagoRepository.findById(ventaRequest.getIdMetodoPago())
                .orElseThrow(() -> new RuntimeException("Método de pago no encontrado"));
            ventaExistente.setMetodoPago(metodoPago);
        }

        detalleVentaRepository.deleteAll(ventaExistente.getDetalles());
        ventaExistente.getDetalles().clear();

        BigDecimal totalVenta = BigDecimal.ZERO;
        List<DetalleVenta> nuevosDetalles = new java.util.ArrayList<>();

        if (ventaRequest.getDetalles() == null || ventaRequest.getDetalles().isEmpty()) {
            throw new RuntimeException("La venta debe tener al menos un producto.");
        }

        for (DetalleVentaRequest detalleRequest : ventaRequest.getDetalles()) {
            Producto producto = productoRepository.findById(detalleRequest.getIdProducto())
                                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + detalleRequest.getIdProducto()));

            if (detalleRequest.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad del producto debe ser mayor que cero.");
            }

            if (producto.getStock() < detalleRequest.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + producto.getNombre());
            }

            producto.setStock(producto.getStock() - detalleRequest.getCantidad());
            productoRepository.save(producto);

            DetalleVenta detalleVenta = new DetalleVenta();
            detalleVenta.setProducto(producto);
            detalleVenta.setCantidad(detalleRequest.getCantidad());
            
            BigDecimal precio = detalleRequest.getPrecio() != null ? detalleRequest.getPrecio() : producto.getPrecio();
            detalleVenta.setPrecioUnitarioVenta(precio);
            
            detalleVenta.setSubtotalDetalle(precio.multiply(BigDecimal.valueOf(detalleRequest.getCantidad())));

            detalleVenta.setVenta(ventaExistente);
            nuevosDetalles.add(detalleVenta);

            totalVenta = totalVenta.add(detalleVenta.getSubtotalDetalle());
        }

        ventaExistente.setDetalles(nuevosDetalles);
        ventaExistente.setTotalVenta(totalVenta);

        return ventaRepository.save(ventaExistente);
    }

    // DELETE
    @Transactional
    public void eliminarVenta(Long id) {
        Venta venta = ventaRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Venta no encontrada con ID: " + id));

        // RESTAURAR STOCK
        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = detalle.getProducto();
            producto.setStock(producto.getStock() + detalle.getCantidad());
            productoRepository.save(producto);
        }

        detalleVentaRepository.deleteAll(venta.getDetalles());
        ventaRepository.delete(venta);
    }

    public long countVentas() {
        return ventaRepository.count();
    }
}