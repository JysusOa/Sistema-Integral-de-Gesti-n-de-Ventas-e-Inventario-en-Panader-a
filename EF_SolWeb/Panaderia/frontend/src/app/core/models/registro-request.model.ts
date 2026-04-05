export interface RegistroRequest {
  nombre: string;
  apellidos: string;
  telefono: string;
  dni: string;
  correo: string;
  clave: string;
  rol: 'ADMINISTRADOR' | 'EMPLEADO';
}
