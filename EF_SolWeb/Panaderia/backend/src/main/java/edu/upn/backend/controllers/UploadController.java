package edu.upn.backend.controllers;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200") // habilita CORS para Angular
public class UploadController {

    @PostMapping("/upload")
    @SuppressWarnings("UseSpecificCatch")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            // 📁 Ruta donde guardarás las imágenes
            String uploadDir = "uploads/";
            File directory = new File(uploadDir);
            if (!directory.exists()) directory.mkdirs();

            // 📸 Guardar el archivo
            String filePath = uploadDir + file.getOriginalFilename();
            file.transferTo(new File(filePath));

            // 🌐 URL pública de acceso (ajústala según tu configuración)
            String fileUrl = "http://localhost:8080/" + filePath;

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Map.of("error", "Error al subir la imagen"));
        }
    }
}