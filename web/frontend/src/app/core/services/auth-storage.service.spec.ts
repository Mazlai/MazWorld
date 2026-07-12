import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthStorageService } from './auth-storage.service';
import type { User } from '../models/user.model';

const MOCK_USER: User = {
  id: 1,
  user_id: '123456789',
  username: 'Mazlai',
  discord_avatar: 'avatar_hash',
  discord_email: null,
  current_city: 'willowbrook',
  coins: 500,
  equipped_background: null,
  roles: ['ROLE_USER'],
};

function setup(platformId: string = 'browser'): AuthStorageService {
  TestBed.configureTestingModule({
    providers: [
      AuthStorageService,
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });
  return TestBed.inject(AuthStorageService);
}

describe('AuthStorageService', () => {

  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  // ===== Token (Signal, pas sessionStorage) =====

  describe('token', () => {
    it('retourne null avant tout saveToken', () => {
      const service = setup();
      expect(service.getToken()).toBeNull();
    });

    it('retourne le token après saveToken', () => {
      const service = setup();
      service.saveToken('jwt_abc');
      expect(service.getToken()).toBe('jwt_abc');
    });

    it('retourne null après clearToken', () => {
      const service = setup();
      service.saveToken('jwt_abc');
      service.clearToken();
      expect(service.getToken()).toBeNull();
    });
  });

  // ===== User =====

  describe('user', () => {
    it('retourne null avant tout saveUser', () => {
      const service = setup();
      expect(service.getUser()).toBeNull();
    });

    it('retourne l\'utilisateur après saveUser', () => {
      const service = setup();
      service.saveUser(MOCK_USER);
      expect(service.getUser()).toEqual(MOCK_USER);
    });

    it('retourne null après clearUser', () => {
      const service = setup();
      service.saveUser(MOCK_USER);
      service.clearUser();
      expect(service.getUser()).toBeNull();
    });
  });

  // ===== State OAuth =====

  describe('state', () => {
    it('retourne null avant tout saveState', () => {
      const service = setup();
      expect(service.getState()).toBeNull();
    });

    it('retourne le state après saveState', () => {
      const service = setup();
      service.saveState('oauth_state_xyz');
      expect(service.getState()).toBe('oauth_state_xyz');
    });

    it('retourne null après clearState', () => {
      const service = setup();
      service.saveState('oauth_state_xyz');
      service.clearState();
      expect(service.getState()).toBeNull();
    });
  });

  // ===== Processed Code =====

  describe('processedCode', () => {
    it('retourne null avant tout saveProcessedCode', () => {
      const service = setup();
      expect(service.getProcessedCode()).toBeNull();
    });

    it('retourne le code après saveProcessedCode', () => {
      const service = setup();
      service.saveProcessedCode('auth_code_123');
      expect(service.getProcessedCode()).toBe('auth_code_123');
    });

    it('retourne null après clearProcessedCode', () => {
      const service = setup();
      service.saveProcessedCode('auth_code_123');
      service.clearProcessedCode();
      expect(service.getProcessedCode()).toBeNull();
    });
  });

  // ===== Redirect URL =====

  describe('redirectUrl', () => {
    it('retourne null avant tout saveRedirectUrl', () => {
      const service = setup();
      expect(service.getRedirectUrl()).toBeNull();
    });

    it('retourne l\'URL après saveRedirectUrl', () => {
      const service = setup();
      service.saveRedirectUrl('/dashboard');
      expect(service.getRedirectUrl()).toBe('/dashboard');
    });

    it('retourne null après clearRedirectUrl', () => {
      const service = setup();
      service.saveRedirectUrl('/dashboard');
      service.clearRedirectUrl();
      expect(service.getRedirectUrl()).toBeNull();
    });
  });

  // ===== clearAll() =====

  describe('clearAll()', () => {
    it('réinitialise token, user, state, code et redirectUrl', () => {
      const service = setup();
      service.saveToken('jwt_abc');
      service.saveUser(MOCK_USER);
      service.saveState('state_xyz');
      service.saveProcessedCode('code_123');
      service.saveRedirectUrl('/profile');

      service.clearAll();

      expect(service.getToken()).toBeNull();
      expect(service.getUser()).toBeNull();
      expect(service.getState()).toBeNull();
      expect(service.getProcessedCode()).toBeNull();
      expect(service.getRedirectUrl()).toBeNull();
    });
  });

  // ===== Contexte SSR =====

  describe('en contexte SSR (PLATFORM_ID = server)', () => {
    it('getUser retourne null sans accéder à sessionStorage', () => {
      const service = setup('server');
      expect(service.getUser()).toBeNull();
    });

    it('saveUser ne lève pas d\'erreur en SSR', () => {
      const service = setup('server');
      expect(() => service.saveUser(MOCK_USER)).not.toThrow();
    });

    it('getState retourne null en SSR', () => {
      const service = setup('server');
      expect(service.getState()).toBeNull();
    });
  });
});