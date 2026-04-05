import { ApplicationConfig } from '@angular/core'; // importProvidersFrom ya no es necesario aquí
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Importa tus servicios que necesitan ser provistos globalmente
import { UserService } from './features/users/user.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // Solo una vez
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()), // Solo una vez
    provideAnimations(), // Para Angular Material
    provideAnimationsAsync(),

    UserService
  ]
};
