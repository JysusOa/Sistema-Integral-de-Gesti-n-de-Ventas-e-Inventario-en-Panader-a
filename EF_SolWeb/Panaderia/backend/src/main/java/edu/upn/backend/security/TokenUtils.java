package edu.upn.backend.security;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class TokenUtils {
    private final static String ACCESS_TOKEN_SECRET="4qhq8LrEBfYcaRHxhdb9zURb2rf8e7Ud_your_strong_secret_key";
    private final static Long ACCESS_TOKEN_VALIDITY_SECONDS=3600L; // 1 hora

    public static String createToken(String nombre, String correo, String rol){
        long expirationTime=ACCESS_TOKEN_VALIDITY_SECONDS*1000;
        Date expirationDate = new Date(System.currentTimeMillis()+expirationTime);

        Map<String, Object> extra = new HashMap<>();
        extra.put("nombre", nombre);
        extra.put("rol", rol);

        return Jwts.builder()
                .setSubject(correo)
                .setExpiration(expirationDate)
                .addClaims(extra)
                .signWith(Keys.hmacShaKeyFor(ACCESS_TOKEN_SECRET.getBytes()))
                .compact();
    }

    public static String getSubjectFromToken(String token){
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(ACCESS_TOKEN_SECRET.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception ex) {
            System.out.println("Error al obtener sujeto del token: " + ex.getMessage());
            return null;
        }
    }

    public static UsernamePasswordAuthenticationToken getAuthentication(String token){
        try{
            Claims claims = Jwts.parserBuilder()
                            .setSigningKey(ACCESS_TOKEN_SECRET.getBytes())
                            .build()
                            .parseClaimsJws(token)
                            .getBody();

            String correo = claims.getSubject();
            return new UsernamePasswordAuthenticationToken(correo, null, Collections.emptyList());
        } catch(Exception ex){
            System.out.println("Error al validar token: " + ex.getMessage());
            return null;
        }
    }
}
