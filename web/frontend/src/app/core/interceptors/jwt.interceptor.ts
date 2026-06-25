import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthStorageService } from '../services/auth-storage.service';

const PUBLIC_URLS = ['/api/auth/discord/login', '/api/auth/discord/callback'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);

  if (PUBLIC_URLS.some(url => req.url.includes(url))) return next(req);

  const token = inject(AuthStorageService).getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => throwError(() => err)),
  );
};
