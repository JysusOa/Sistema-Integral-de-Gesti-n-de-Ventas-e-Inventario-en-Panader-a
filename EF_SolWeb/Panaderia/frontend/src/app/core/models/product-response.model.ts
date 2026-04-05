import { BigDecimal } from './big-decimal';
import { UserProductResponse } from './user-product-response.model';
import { Categoria } from './categoria.model';

export interface ProductResponse {
  estado: string;
  idCategoria: any;
  idProducto?: number; //modificado se le quito el ? el 12/10
  nombre?: string;
  marca?: string;
  unidadMedida?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagenUrl?: string;
  fechaCreacion?: string;
  usuarioRegistro?: UserProductResponse;
  categoria: {
    idCategoria: number;
    nombre?: string;
  };
}
