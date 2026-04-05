package edu.upn.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import edu.upn.backend.models.Categoria;
import edu.upn.backend.models.MetodoPago;
import edu.upn.backend.services.CategoriaService;
import edu.upn.backend.services.MetodoPagoService;
import edu.upn.backend.util.AppSettings;

//No modificar nada de este controlador
//No modificar nada de este controlador
//No modificar nada de este controlador

@RestController
@RequestMapping("/util")
@CrossOrigin(origins = AppSettings.URL_CROSS_ORIGIN)
public class UtilController {

    @Autowired
	private MetodoPagoService metodoPagoService;

    @Autowired
	private CategoriaService categoriaService;

    @GetMapping("/listaCategoria")
    @ResponseBody
    public ResponseEntity<List<Categoria>> listarCategorias() {
        List<Categoria> lista = categoriaService.listarCategorias();
       return ResponseEntity.ok(lista);
    }

    @GetMapping("/listaMetodoPago")
    @ResponseBody
    public List<MetodoPago> listaMetodoPago() {
       return metodoPagoService.listaTodos();
    }

    
        
}