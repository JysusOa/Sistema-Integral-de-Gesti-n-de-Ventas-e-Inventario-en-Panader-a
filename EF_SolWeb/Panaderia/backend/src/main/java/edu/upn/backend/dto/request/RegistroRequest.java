package edu.upn.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistroRequest {
    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no puede exceder los 100 caracteres")
    private String nombre;

    @NotBlank(message = "Los apellidos no pueden estar vacíos")
    @Size(max = 100, message = "Los apellidos no pueden exceder los 100 caracteres")
    private String apellidos;

    @Size(max = 20, message = "El teléfono no puede exceder los 20 caracteres")
    private String telefono;

    @NotBlank(message = "El correo no puede estar vacío")
    @Email(message = "El correo debe tener un formato válido")
    @Size(max = 100, message = "El correo no puede exceder los 100 caracteres")
    private String correo;

    @NotBlank(message = "La clave no puede estar vacía")
    @Size(min = 6, message = "La clave debe tener al menos 6 caracteres")
    @Size(max = 255, message = "La clave no puede exceder los 255 caracteres")
    private String clave;

    @NotBlank(message = "El rol no puede estar vacío")
    // Validar que el rol sea "ADMINISTRADOR" o "EMPLEADO"
    @Pattern(regexp = "ADMINISTRADOR|EMPLEADO|JEFE CALIDAD", message = "El rol debe ser 'ADMINISTRADOR', 'EMPLEADO' o 'JEFE CALIDAD'")    private String rol;
}