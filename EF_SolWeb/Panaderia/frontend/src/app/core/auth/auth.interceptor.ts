    import { HttpInterceptorFn } from '@angular/common/http';
    import { inject } from '@angular/core';
    import { AuthService } from '../auth/auth.service';
    import { HttpErrorResponse } from '@angular/common/http';
    import { throwError } from 'rxjs';
    import { catchError, switchMap } from 'rxjs/operators';

    export const authInterceptor: HttpInterceptorFn = (req, next) => {
      const authService = inject(AuthService);
      const token = authService.getToken();

      if (token) {
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(cloned).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return authService.refreshToken().pipe(
                switchMap(() => {
                  const newToken = authService.getToken();
                  const newReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                  });
                  return next(newReq);
                }),
                catchError(() => throwError(error))
              );
            }
            return throwError(error);
          })
        );
      }
      return next(req);
    };