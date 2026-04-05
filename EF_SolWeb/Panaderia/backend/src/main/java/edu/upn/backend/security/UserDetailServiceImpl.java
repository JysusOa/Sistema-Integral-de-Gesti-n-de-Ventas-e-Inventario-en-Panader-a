package edu.upn.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import edu.upn.backend.models.UsuarioModel;
import edu.upn.backend.repositories.IUsuarioRepository;

@Service
public class UserDetailServiceImpl implements UserDetailsService {

    @Autowired
    IUsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("DEBUG UserDetailServiceImpl: Intentando cargar usuario por correo: " + username);
        UsuarioModel usuario = usuarioRepository.findByCorreo(username)
                                .orElseThrow(() -> {
                                    System.out.println("DEBUG UserDetailServiceImpl: Usuario NO encontrado para correo: " + username);
                                    return new UsernameNotFoundException("Usuario no encontrado con correo: " + username);
                                });

        System.out.println("DEBUG UserDetailServiceImpl: Usuario encontrado: " + usuario.getCorreo() + " con rol: " + usuario.getRol());
        UserDetails ud = new UserDetailsImpl(usuario);
        return ud;
    }
}
