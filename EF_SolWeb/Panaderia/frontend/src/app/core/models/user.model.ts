export interface User {
  id?: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  correo: string;
  clave?: string;
  rol: 'ADMINISTRADOR' | 'EMPLEADO'| 'JEFE CALIDAD';
}
