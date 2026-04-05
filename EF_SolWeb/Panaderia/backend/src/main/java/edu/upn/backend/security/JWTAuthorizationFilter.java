package edu.upn.backend.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JWTAuthorizationFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String btoken = request.getHeader("Authorization");
        System.out.println("DEBUG JWTAuthorizationFilter: Interceptando Request URI: " + request.getRequestURI());

        if(btoken != null && btoken.startsWith("Bearer ")) {
            String token = btoken.replace("Bearer ", "");
            System.out.println("DEBUG JWTAuthorizationFilter: Token recibido para validación: " + token.substring(0, 30) + "...");
            String correo = TokenUtils.getSubjectFromToken(token);

            if (correo != null) {
                System.out.println("DEBUG JWTAuthorizationFilter: Correo extraído del token: " + correo);
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(correo);

                    if (userDetails != null) {
                        UsernamePasswordAuthenticationToken usernamePAT =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(usernamePAT);
                        System.out.println("DEBUG JWTAuthorizationFilter: Token validado exitosamente. Usuario: " + userDetails.getUsername());
                    } else {
                        System.out.println("DEBUG JWTAuthorizationFilter: Usuario no encontrado por UserDetailsService para correo: " + correo);
                    }
                } catch (UsernameNotFoundException e) {
                    System.out.println("DEBUG JWTAuthorizationFilter: Error al cargar UserDetails para correo " + correo + ": " + e.getMessage());
                }
            } else {
                System.out.println("DEBUG JWTAuthorizationFilter: No se pudo extraer el correo del token.");
            }
        } else {
            System.out.println("DEBUG JWTAuthorizationFilter: No se encontró encabezado Authorization o no empieza con Bearer para URI: " + request.getRequestURI());
        }
        filterChain.doFilter(request, response);
    }
}
