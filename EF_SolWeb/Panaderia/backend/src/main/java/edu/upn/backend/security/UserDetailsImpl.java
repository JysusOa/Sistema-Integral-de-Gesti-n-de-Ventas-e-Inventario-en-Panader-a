package edu.upn.backend.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import edu.upn.backend.models.UsuarioModel;

public class UserDetailsImpl implements UserDetails {

    private final UsuarioModel usuario;

    public UserDetailsImpl(UsuarioModel usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (usuario != null && usuario.getRol() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().toUpperCase()));
            System.out.println("Cargando rol para usuario " + usuario.getCorreo() + ": ROLE_" + usuario.getRol().toUpperCase());
        } else {
            System.out.println("Usuario o rol es nulo para UserDetailsImpl. No se cargaron autoridades.");
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return usuario.getClave();
    }

    @Override
    public String getUsername() {
        return usuario.getCorreo();
    }

    public UsuarioModel getUsuario() {
        return usuario;
    }

    public String getNombre() {
        return usuario.getNombre();
    }

    public String getApellidos() {
        return usuario.getApellidos();
    }

    public String getRol() {
        return usuario.getRol();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}