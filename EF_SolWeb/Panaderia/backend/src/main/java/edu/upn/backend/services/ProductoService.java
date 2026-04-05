package edu.upn.backend.services;

//import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import edu.upn.backend.dto.response.CategoriaResponse;
import edu.upn.backend.dto.response.ProductoResponse;
import edu.upn.backend.dto.response.UsuarioProductoResponse;
import edu.upn.backend.models.DetalleVenta;
import edu.upn.backend.models.Producto;
import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.repositories.IDetalleVentaRepository;
import edu.upn.backend.repositories.IProductoRepository;

@Service
public class ProductoService {
    @Autowired
    IProductoRepository productoRepository;

    @Autowired
    IDetalleVentaRepository detalleVentaRepository;

/*
    @Autowired
    ICategoriaRepository categoriaRepository;*/

    public ProductoResponse convertToProductoResponse(Producto producto) {
        if (producto == null) {
            return null;
        }

        ProductoResponse response = new ProductoResponse();
        response.setIdProducto(producto.getIdProducto());
        response.setNombre(producto.getNombre());
        response.setMarca(producto.getMarca());  // Nuevo campo
        response.setUnidadMedida(producto.getUnidadMedida());  // Nuevo campo
        response.setDescripcion(producto.getDescripcion());
        response.setPrecio(producto.getPrecio());
        response.setStock(producto.getStock());
        response.setImagenUrl(producto.getImagenUrl());
        response.setFechaCreacion(producto.getFechaCreacion());

        if (producto.getUsuarioRegistro() != null) {
            UsuarioProductoResponse usuarioResponse = new UsuarioProductoResponse();
            usuarioResponse.setId(producto.getUsuarioRegistro().getId());
            usuarioResponse.setNombre(producto.getUsuarioRegistro().getNombre());
            usuarioResponse.setApellidos(producto.getUsuarioRegistro().getApellidos());
            usuarioResponse.setCorreo(producto.getUsuarioRegistro().getCorreo());
            response.setUsuarioRegistro(usuarioResponse);
        }
        
        if (producto.getCategoria() != null) {
            CategoriaResponse categoriaDto = new CategoriaResponse();
            categoriaDto.setIdCategoria(producto.getCategoria().getIdCategoria());
            categoriaDto.setNombre(producto.getCategoria().getNombre());
            response.setCategoria(categoriaDto);
        } else {
            response.setCategoria(null);
        }
        return response;
    }

    // CREATE
    public Producto guardarProducto(Producto producto, UsuarioModel usuarioCreador) {
        if (productoRepository.findByNombre(producto.getNombre()).isPresent()) {
            throw new RuntimeException("Ya existe un producto con el nombre: " + producto.getNombre());
        }
        producto.setUsuarioRegistro(usuarioCreador);
        return productoRepository.save(producto);
    }

    // READ ALL
    public List<ProductoResponse> listarProductos() {
        List<Producto> productos = (List<Producto>) productoRepository.findAll();
        return productos.stream()
                        .map(this::convertToProductoResponse)
                        .collect(Collectors.toList());
    }

    // READ BY ID
    public Optional<ProductoResponse> obtenerProductoPorId(Long id) {
        Optional<Producto> producto = productoRepository.findById(id);
        return producto.map(this::convertToProductoResponse);
    }

    // UPDATE
    public Producto actualizarProducto(Long id, Producto productoActualizado) {
        Optional<Producto> productoExistenteOpt = productoRepository.findById(id);
        if (productoExistenteOpt.isEmpty()) {
            throw new RuntimeException("Producto no encontrado con ID: " + id);
        }
        Producto productoExistente = productoExistenteOpt.get();
        productoExistente.setNombre(productoActualizado.getNombre());
        productoExistente.setMarca(productoActualizado.getMarca());  // Nuevo campo
        productoExistente.setUnidadMedida(productoActualizado.getUnidadMedida());  // Nuevo campo
        productoExistente.setDescripcion(productoActualizado.getDescripcion());
        productoExistente.setPrecio(productoActualizado.getPrecio());
        productoExistente.setStock(productoActualizado.getStock());
        productoExistente.setImagenUrl(productoActualizado.getImagenUrl());
        return productoRepository.save(productoExistente);
    }

    // DELETE
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado con ID: " + id);
        }
        List<DetalleVenta> detallesAsociados = detalleVentaRepository.findByProducto_IdProducto(id);
        if (!detallesAsociados.isEmpty()) {
            throw new RuntimeException("No se puede eliminar el producto porque está asociado a una o más ventas.");
        }
        productoRepository.deleteById(id);
    }

    // NUEVO MÉTODO: Contar productos
    public long countProductos() {
        return productoRepository.count();
    }
}
