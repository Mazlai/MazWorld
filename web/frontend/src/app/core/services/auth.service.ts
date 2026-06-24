import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthResponse, User } from '../models/user.model';

const TOKEN_KEY = 'mw_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async init(): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      const res = await firstValueFrom(
        this.http.get<{ valid: boolean; user: User | null }>(`${environment.apiUrl}/api/auth/verify`),
      );
      if (res.valid && res.user) {
        this._user.set(res.user);
      } else {
        this.clearSession();
      }
    } catch {
      this.clearSession();
    }
  }

  async login(): Promise<void> {
    const res = await firstValueFrom(
      this.http.get<{ authorization_url: string }>(`${environment.apiUrl}/api/auth/discord/login`),
    );
    window.location.href = res.authorization_url;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/discord/callback`, { code, state }),
    );
    localStorage.setItem(TOKEN_KEY, res.token);
    this._user.set(res.user);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/api/auth/logout`, {}));
    } finally {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  async refreshToken(): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ token: string }>(`${environment.apiUrl}/api/auth/refresh`, {}),
    );
    localStorage.setItem(TOKEN_KEY, res.token);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
  }
}
