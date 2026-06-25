import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { User } from '../models/user.model';

const TOKEN_KEY = 'mw_token';
const USER_KEY = 'mw_user';
const STATE_KEY = 'mw_oauth_state';
const PROCESSED_CODE_KEY = 'mw_processed_code';
const REDIRECT_URL_KEY = 'mw_redirect_url';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private local<T = string>(key: string): T | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }

  private setLocal(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  private removeLocal(key: string): void {
    if (this.isBrowser) localStorage.removeItem(key);
  }

  private session<T = string>(key: string): T | null {
    if (!this.isBrowser) return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }

  private setSession(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  private removeSession(key: string): void {
    if (this.isBrowser) sessionStorage.removeItem(key);
  }

  getToken(): string | null { return this.local(TOKEN_KEY); }
  saveToken(token: string): void { this.setLocal(TOKEN_KEY, token); }
  clearToken(): void { this.removeLocal(TOKEN_KEY); }

  getUser(): User | null { return this.local<User>(USER_KEY); }
  saveUser(user: User): void { this.setLocal(USER_KEY, user); }
  clearUser(): void { this.removeLocal(USER_KEY); }

  getState(): string | null { return this.session(STATE_KEY); }
  saveState(state: string): void { this.setSession(STATE_KEY, state); }
  clearState(): void { this.removeSession(STATE_KEY); }

  getProcessedCode(): string | null { return this.session(PROCESSED_CODE_KEY); }
  saveProcessedCode(code: string): void { this.setSession(PROCESSED_CODE_KEY, code); }
  clearProcessedCode(): void { this.removeSession(PROCESSED_CODE_KEY); }

  getRedirectUrl(): string | null { return this.session(REDIRECT_URL_KEY); }
  saveRedirectUrl(url: string): void { this.setSession(REDIRECT_URL_KEY, url); }
  clearRedirectUrl(): void { this.removeSession(REDIRECT_URL_KEY); }

  clearAll(): void {
    [TOKEN_KEY, USER_KEY].forEach(k => this.removeLocal(k));
    [STATE_KEY, PROCESSED_CODE_KEY, REDIRECT_URL_KEY].forEach(k => this.removeSession(k));
  }
}
