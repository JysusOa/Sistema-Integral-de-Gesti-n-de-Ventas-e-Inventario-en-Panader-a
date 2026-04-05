package edu.upn.backend.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JWTAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        AuthCredentials authCredentials = new AuthCredentials();

        try {
            authCredentials = new ObjectMapper().readValue(request.getReader(), AuthCredentials.class);
            System.out.println("DEBUG JWTAuthenticationFilter: Intento de login para correo: " + authCredentials.getCorreo());
        } catch (StreamReadException e) {
            System.out.println("DEBUG JWTAuthenticationFilter: StreamReadException al leer credenciales: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            try { response.getWriter().write("Error en el formato de la solicitud (StreamReadException)."); } catch (IOException ioException) { /* ignore */ }
            return null;
        } catch (DatabindException e) {
            System.out.println("DEBUG JWTAuthenticationFilter: DatabindException al leer credenciales: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            try { response.getWriter().write("Error en el formato de los datos (DatabindException)."); } catch (IOException ioException) { /* ignore */ }
            return null;
        } catch (IOException e) {
            System.out.println("DEBUG JWTAuthenticationFilter: IOException al leer credenciales: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            try { response.getWriter().write("Error interno del servidor al procesar la solicitud."); } catch (IOException ioException) { /* ignore */ }
            return null;
        }

        UsernamePasswordAuthenticationToken usernamePAT =
        new UsernamePasswordAuthenticationToken(authCredentials.getCorreo(),
                                                authCredentials.getClave());
        System.out.println("DEBUG JWTAuthenticationFilter: Intentando autenticar con AuthenticationManager.");
        return getAuthenticationManager().authenticate(usernamePAT);
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
            Authentication authResult) throws IOException, ServletException {
        UserDetailsImpl userDetails = (UserDetailsImpl) authResult.getPrincipal();
        System.out.println("DEBUG JWTAuthenticationFilter: Autenticación exitosa para usuario: " + userDetails.getUsername());
        String token = TokenUtils.createToken(userDetails.getNombre(), userDetails.getUsername(), userDetails.getRol());
        System.out.println("DEBUG JWTAuthenticationFilter: Token generado: " + token.substring(0, 30) + "...");
        response.addHeader("Authorization", "Bearer "+token);
        response.getWriter().flush();

    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException failed) throws IOException, ServletException {
        System.out.println("DEBUG JWTAuthenticationFilter: Autenticación fallida: " + failed.getMessage());
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("{\"message\": \"Credenciales inválidas. " + failed.getMessage() + "\"}");
        response.getWriter().flush();
    }
}
