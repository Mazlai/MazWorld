import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import type { User, AuthResponse, LoginUrlResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(AuthStorageService);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  readonly userAvatar = computed(() => {
    const user = this._currentUser();
    if (!user) return null;
    return user.discord_avatar
      ? `https://cdn.discordapp.com/avatars/${user.user_id}/${user.discord_avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(user.user_id) % 5}.png`;
  });

  readonly displayName = computed(() => this._currentUser()?.username ?? null);

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.storage.getToken();
    const storedUser = this.storage.getUser();

    if (token && storedUser) {
      this._currentUser.set(storedUser);
      this._isLoading.set(false);

      this.verifyToken().subscribe({
        next: res => {
          if (res.valid && res.user) {
            this.setUser(res.user);
          } else if (res.valid === false) {
            this.clearAuth();
          }
        },
        error: err => {
          if (err.status === 401) this.clearAuth();
        },
      });
    } else {
      this.clearAuth();
      this._isLoading.set(false);
    }
  }

  loginWithDiscord(): Observable<LoginUrlResponse> {
    return this.http.get<LoginUrlResponse>(`${environment.apiUrl}/api/auth/discord/login`).pipe(
      tap(res => {
        if (res.state) this.storage.saveState(res.state);
        window.location.href = res.authorization_url;
      }),
    );
  }

  handleDiscordCallback(code: string, state: string): Observable<AuthResponse> {
    if (this.storage.getProcessedCode() === code) {
      return throwError(() => new Error('Code already processed'));
    }

    const savedState = this.storage.getState();
    if (savedState && state !== savedState) {
      return throwError(() => new Error('Invalid state parameter'));
    }

    this.storage.saveProcessedCode(code);
    this.storage.clearState();

    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/discord/callback`, { code, state }).pipe(
      tap(res => {
        this.storage.saveToken(res.token);
        this.setUser(res.user);
        this.storage.clearProcessedCode();
      }),
      catchError(err => {
        this.storage.clearProcessedCode();
        return throwError(() => err);
      }),
    );
  }

  refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/api/auth/refresh`, {}).pipe(
      tap(res => this.storage.saveToken(res.token)),
      catchError(err => {
        this.clearAuth();
        return throwError(() => err);
      }),
    );
  }

  verifyToken(): Observable<{ valid: boolean; user?: User }> {
    return this.http.get<{ valid: boolean; user?: User }>(`${environment.apiUrl}/api/auth/verify`);
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/api/auth/logout`, {}).pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.clearAuth();
      this.router.navigate(['/']);
    });
  }

  getToken(): string | null {
    return this.storage.getToken();
  }

  private setUser(user: User): void {
    this._currentUser.set(user);
    this.storage.saveUser(user);
  }

  private clearAuth(): void {
    this._currentUser.set(null);
    this.storage.clearAll();
  }
}
