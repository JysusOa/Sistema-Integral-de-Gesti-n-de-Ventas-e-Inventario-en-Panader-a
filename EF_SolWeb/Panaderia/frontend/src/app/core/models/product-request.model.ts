import { BigDecimal } from './big-decimal';
import { Categoria } from './categoria.model';

export interface ProductRequest {
  nombre: string;
  descripcion: string;
  precio: BigDecimal;
  stock: number;
  imagenUrl: string;
  marca?: string;
  //Categoria?: Categoria;
  idCategoria: number;
  unidadMedida?: string;
}
