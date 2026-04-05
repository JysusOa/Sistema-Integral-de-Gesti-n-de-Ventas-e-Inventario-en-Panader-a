package edu.upn.backend.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import edu.upn.backend.models.MetodoPago;
import edu.upn.backend.repositories.IMetodoPagoRepository;

@Service
public class MetodoPagoServiceImp implements MetodoPagoService {

    @Autowired
    private IMetodoPagoRepository repository;

    @Override
    public List<MetodoPago> listaTodos() {
        return repository.findAll();
    }
}