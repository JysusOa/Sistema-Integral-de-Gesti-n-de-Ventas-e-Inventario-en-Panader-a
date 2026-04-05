import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(3),  // Reintenta hasta 3 veces en errores (e.g., conexión fallida)
      catchError((error: HttpErrorResponse) => {
        console.error('Error en HTTP:', error);  // Log para debugging
        return throwError(error);
      })
    );
  }
}
