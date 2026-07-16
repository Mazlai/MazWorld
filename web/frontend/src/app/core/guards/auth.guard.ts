import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthStorageService } from '../services/auth-storage.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  inject(AuthStorageService).saveRedirectUrl(state.url);
  return inject(Router).createUrlTree(['/']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/dashboard']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/']);
  const roles = auth.currentUser()?.roles ?? [];
  if (roles.includes('ROLE_ADMIN')) return true;
  return inject(Router).createUrlTree(['/dashboard']);
};
