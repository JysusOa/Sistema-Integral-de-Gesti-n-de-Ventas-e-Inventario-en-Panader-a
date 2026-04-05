import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthCredentials } from '../models/auth-credentials.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { RegistroRequest } from '../models/registro-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private tokenKey = 'jwt_token';
  private userKey = 'current_user';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // Inyección del ID de plataforma
  ) {
    let initialUser: User | null = null;

    // ✅ CORRECCIÓN SSR: Solo accede a localStorage si es el navegador
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem(this.userKey);
      initialUser = storedUser ? JSON.parse(storedUser) : null;
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: AuthCredentials): Observable<any> {
    console.log('DEBUG Frontend AuthService: Intentando login...');
    return this.http.post(`${this.apiUrl}/login`, credentials, { observe: 'response' }).pipe(
      tap(response => {
        const token = response.headers.get('Authorization')?.replace('Bearer ', '');
        if (token) {
          this.setToken(token);
          const decodedToken = this.decodeToken(token);
          if (decodedToken) {
            const user: User = {
              id: decodedToken.id,
              nombre: decodedToken.nombre,
              apellidos: decodedToken.apellidos,
              correo: decodedToken.sub,
              telefono: decodedToken.telefono,
              rol: decodedToken.rol
            };
            this.setCurrentUser(user);
          }
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        throw error;
      })
    );
  }

  registerUser(registroRequest: RegistroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar`, registroRequest).pipe(
      tap(response => console.log('Registro exitoso:', response)),
      catchError(error => { throw error; })
    );
  }

  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) return of(null);

    return this.http.post(`${this.apiUrl}/refresh`, {}, { observe: 'response' }).pipe(
      tap(response => {
        const newToken = response.headers.get('Authorization')?.replace('Bearer ', '');
        if (newToken) {
          this.setToken(newToken);
          const decoded = this.decodeToken(newToken);
          if (decoded) {
            const user: User = {
              id: decoded.id,
              nombre: decoded.nombre,
              apellidos: decoded.apellidos,
              correo: decoded.sub,
              telefono: decoded.telefono,
              rol: decoded.rol
            };
            this.setCurrentUser(user);
          }
        }
      }),
      catchError(error => {
        this.logout();
        throw error;
      })
    );
  }

  logout(): void {
    // ✅ CORRECCIÓN SSR
    if (isPlatformBrowser(this.platformId)) {
      this.removeToken();
      this.removeCurrentUser();
    }
    this.currentUserSubject.next(null); // Asegurar que el estado en memoria se limpie
    this.router.navigate(['/login']);
  }

  private setToken(token: string): void {
    // ✅ CORRECCIÓN SSR
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    // ✅ CORRECCIÓN SSR: Si es servidor, retorna null inmediatamente
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  private removeToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  private setCurrentUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  private removeCurrentUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.userKey);
    }
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    // ✅ CORRECCIÓN SSR: El servidor siempre está "no autenticado" para evitar conflictos
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded) return false;

    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decoded.exp);
    return expirationDate.valueOf() > new Date().valueOf();
  }

  private decodeToken(token: string): any | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error al decodificar token:', e);
      return null;
    }
  }

  getUserRole(): string | null {
    const user = this.currentUserValue;
    return user ? user.rol : null;
  }

  getUserId(): number | null {
    const user = this.currentUserValue;
    return user?.id ?? null;
  }
}
