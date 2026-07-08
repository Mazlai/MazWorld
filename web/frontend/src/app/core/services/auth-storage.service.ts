import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { User } from '../models/user.model';

const USER_KEY = 'mw_user';
const STATE_KEY = 'mw_oauth_state';
const PROCESSED_CODE_KEY = 'mw_processed_code';
const REDIRECT_URL_KEY = 'mw_redirect_url';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _token = signal<string | null>(null);

  private get<T = string>(key: string): T | null {
    if (!this.isBrowser) return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }

  private set(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  private remove(key: string): void {
    if (this.isBrowser) sessionStorage.removeItem(key);
  }

  getToken(): string | null { return this._token(); }
  saveToken(token: string): void { this._token.set(token); }
  clearToken(): void { this._token.set(null); }

  getUser(): User | null { return this.get<User>(USER_KEY); }
  saveUser(user: User): void { this.set(USER_KEY, user); }
  clearUser(): void { this.remove(USER_KEY); }

  getState(): string | null { return this.get(STATE_KEY); }
  saveState(state: string): void { this.set(STATE_KEY, state); }
  clearState(): void { this.remove(STATE_KEY); }

  getProcessedCode(): string | null { return this.get(PROCESSED_CODE_KEY); }
  saveProcessedCode(code: string): void { this.set(PROCESSED_CODE_KEY, code); }
  clearProcessedCode(): void { this.remove(PROCESSED_CODE_KEY); }

  getRedirectUrl(): string | null { return this.get(REDIRECT_URL_KEY); }
  saveRedirectUrl(url: string): void { this.set(REDIRECT_URL_KEY, url); }
  clearRedirectUrl(): void { this.remove(REDIRECT_URL_KEY); }

  clearAll(): void {
    this._token.set(null);
    [USER_KEY, STATE_KEY, PROCESSED_CODE_KEY, REDIRECT_URL_KEY]
      .forEach(k => this.remove(k));
  }
}
