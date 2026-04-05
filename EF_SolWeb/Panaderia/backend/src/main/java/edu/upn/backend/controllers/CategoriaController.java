package edu.upn.backend.controllers;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.upn.backend.dto.request.CategoriaRequest;
import edu.upn.backend.dto.response.CategoriaResponse;
import edu.upn.backend.models.Categoria;
import edu.upn.backend.services.CategoriaService;

@RestController
@RequestMapping("/categorias")
@CrossOrigin(origins = "http://localhost:4200") // Para permitir Angular
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

   

    @GetMapping
    public List<Categoria> listarCategorias() {
        List<Categoria> lstSalida = categoriaService.listarCategorias();
        return lstSalida;
    }
     // GET todas las categorías
    /*
    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> getAllCategorias() {
        List<CategoriaResponse> categorias = categoriaService.getAllCategorias();
        return ResponseEntity.ok(categorias);
    }*/

    @PostMapping
    public ResponseEntity<?> crearCategoria(@RequestBody Categoria obj){
        List<String> lstSalida = new ArrayList<>();
        Categoria objSalida = categoriaService.crearCategoria(obj);
        if(objSalida==null){
            lstSalida.add("Error al crear la categoría");
        }else{
            lstSalida.add("Categoría creada correctamente"+ objSalida.getIdCategoria());
        }
        return ResponseEntity.ok(lstSalida);
    }

    // GET categoría por ID
    @GetMapping("/{id}")
    public ResponseEntity<CategoriaResponse> getCategoriaById(@PathVariable Long id) {
        CategoriaResponse categoria = categoriaService.getCategoriaById(id);
        return ResponseEntity.ok(categoria);
    }

    // POST crear categoría
    /*
    @PostMapping
    public ResponseEntity<CategoriaResponse> createCategoria(@RequestBody CategoriaRequest request) {
        CategoriaResponse nuevaCategoria = categoriaService.createCategoria(request);
        return ResponseEntity.ok(nuevaCategoria);
    }*/
   

    // PUT actualizar categoría
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> updateCategoria(
            @PathVariable Long id, 
            @RequestBody CategoriaRequest request) {
        CategoriaResponse categoriaActualizada = categoriaService.updateCategoria(id, request);
        return ResponseEntity.ok(categoriaActualizada);
    }

    /*DELETE categoría
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategoria(@PathVariable Long id) {
        categoriaService.deleteCategoria(id);
        return ResponseEntity.ok().build();
    }*/

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategoria(@PathVariable Integer id) {  // ← Cambiar a Integer
    categoriaService.deleteCategoria(id);
    return ResponseEntity.ok().build();
}
}