package edu.upn.backend.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

import edu.upn.backend.dto.response.CategoriaResponse;
import edu.upn.backend.models.Categoria;
import edu.upn.backend.repositories.ICategoriaRepository;
import edu.upn.backend.dto.request.CategoriaRequest;

@Service
public class CategoriaServiceImp implements CategoriaService {

    @Autowired
    private ICategoriaRepository categoriaRepository;

    @Override
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

	@Override
	public Categoria crearCategoria(Categoria obj) {
		return categoriaRepository.save(obj);
	}

	@Override
    public void deleteCategoria(Integer id) {
        // ✅ IMPLEMENTAR la lógica de eliminación
        if (categoriaRepository.existsById(id)) {
            categoriaRepository.deleteById(id);
        } else {
            throw new RuntimeException("Categoría no encontrada con ID: " + id);
        }
    }
/*
	@Override
	public List<CategoriaResponse> getAllCategorias() {
		
		throw new UnsupportedOperationException("Unimplemented method 'getAllCategorias'");
	}*/

	@Override
	public CategoriaResponse getCategoriaById(Long id) {
		
		throw new UnsupportedOperationException("Unimplemented method 'getCategoriaById'");
	}

/*
	@Override
	public CategoriaResponse createCategoria(CategoriaRequest request) {
		
		throw new UnsupportedOperationException("Unimplemented method 'createCategoria'");
	}*/

	@Override
	public CategoriaResponse updateCategoria(Long id, CategoriaRequest request) {
		
		throw new UnsupportedOperationException("Unimplemented method 'updateCategoria'");
	}

	


	

	
}