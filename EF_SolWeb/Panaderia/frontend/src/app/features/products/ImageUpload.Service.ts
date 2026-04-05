import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private apiUrl = 'http://localhost:8080/upload'; // <--- tu backend aquí

  constructor(private http: HttpClient) {}

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await firstValueFrom(
        this.http.post<{ url: string }>(this.apiUrl, formData)
      );
      return response.url;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      return '';
    }
  }
}
