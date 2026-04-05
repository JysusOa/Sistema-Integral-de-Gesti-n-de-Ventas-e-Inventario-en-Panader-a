package edu.upn.backend.services;
import java.util.List;

import edu.upn.backend.dto.request.CategoriaRequest;
import edu.upn.backend.dto.response.CategoriaResponse;
import edu.upn.backend.models.Categoria;
 

public interface CategoriaService {


	public abstract List<Categoria> listarCategorias();
	public abstract Categoria crearCategoria(Categoria categoria);
	void deleteCategoria(Integer id);

	//List<Categoria> listarCategorias();
	//public abstract List<Categoria> listaTodos();
	//List<CategoriaResponse> getAllCategorias();
	CategoriaResponse getCategoriaById(Long id);
	//CategoriaResponse createCategoria(CategoriaRequest request);
	CategoriaResponse updateCategoria(Long id, CategoriaRequest request);	
	
	/*
	
    
    
    
    */
}