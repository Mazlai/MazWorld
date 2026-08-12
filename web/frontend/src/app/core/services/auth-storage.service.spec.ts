import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthStorageService } from './auth-storage.service';
import type { User } from '../models/user.model';

const MAZLAI: User = {
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

function monterService(platformId: string = 'browser'): AuthStorageService {
  TestBed.configureTestingModule({
    providers: [AuthStorageService, { provide: PLATFORM_ID, useValue: platformId }],
  });
  return TestBed.inject(AuthStorageService);
}

afterEach(() => {
  sessionStorage.clear();
  TestBed.resetTestingModule();
});

// Choix d'archi volontaire : le token JWT vit dans un signal en mémoire, jamais dans
// sessionStorage (contrairement à user/state/processedCode/redirectUrl ci-dessous) —
// pour réduire la surface d'attaque XSS. C'est ce qui justifie qu'il ait son propre bloc
// de tests plutôt que d'être traité comme les autres accesseurs.
describe('Token JWT — signal en mémoire uniquement', () => {
  it('vaut null tant qu\'aucun token n\'a été sauvegardé', () => {
    expect(monterService().getToken()).toBeNull();
  });

  it('est restitué après saveToken', () => {
    const service = monterService();
    service.saveToken('jwt_abc');

    expect(service.getToken()).toBe('jwt_abc');
  });

  it('redevient null après clearToken', () => {
    const service = monterService();
    service.saveToken('jwt_abc');
    service.clearToken();

    expect(service.getToken()).toBeNull();
  });
});

describe('Profil utilisateur — sessionStorage sérialisé en JSON', () => {
  it('vaut null tant qu\'aucun profil n\'a été sauvegardé', () => {
    expect(monterService().getUser()).toBeNull();
  });

  it('restitue l\'objet complet après saveUser (round-trip JSON)', () => {
    const service = monterService();
    service.saveUser(MAZLAI);

    expect(service.getUser()).toEqual(MAZLAI);
  });

  it('redevient null après clearUser', () => {
    const service = monterService();
    service.saveUser(MAZLAI);
    service.clearUser();

    expect(service.getUser()).toBeNull();
  });

  // Le parsing JSON est protégé par un try/catch avec fallback sur la valeur brute —
  // utile si sessionStorage contient une valeur corrompue ou modifiée manuellement
  // depuis les devtools plutôt qu'écrite par le service lui-même.
  it('ne plante pas si sessionStorage contient du JSON invalide pour la clé utilisateur', () => {
    sessionStorage.setItem('mw_user', '{ceci n\'est pas du JSON valide');
    const service = monterService();

    expect(() => service.getUser()).not.toThrow();
  });
});

// state (anti-CSRF OAuth), processedCode (anti-rejeu du code d'autorisation) et redirectUrl
// (page à rouvrir après connexion) partagent exactement le même contrat get/save/clear —
// un test paramétré évite de tripler la même suite de trois assertions.
describe.each([
  { champ: 'state', save: 'saveState', get: 'getState', clear: 'clearState', valeur: 'oauth_state_xyz' },
  { champ: 'processedCode', save: 'saveProcessedCode', get: 'getProcessedCode', clear: 'clearProcessedCode', valeur: 'auth_code_123' },
  { champ: 'redirectUrl', save: 'saveRedirectUrl', get: 'getRedirectUrl', clear: 'clearRedirectUrl', valeur: '/dashboard' },
] as const)('$champ — cycle save / get / clear', ({ save, get, clear, valeur }) => {
  it(`vaut null avant tout ${save}`, () => {
    const service = monterService();
    expect(service[get]()).toBeNull();
  });

  it(`restitue la valeur après ${save}`, () => {
    const service = monterService();
    service[save](valeur);
    expect(service[get]()).toBe(valeur);
  });

  it(`redevient null après ${clear}`, () => {
    const service = monterService();
    service[save](valeur);
    service[clear]();
    expect(service[get]()).toBeNull();
  });
});

it('clearAll() réinitialise le token et toutes les clés sessionStorage en un seul appel', () => {
  const service = monterService();
  service.saveToken('jwt_abc');
  service.saveUser(MAZLAI);
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

// Côté serveur (SSR Angular Universal), il n'y a pas de sessionStorage du tout :
// le service doit se comporter proprement plutôt que de lever une exception au démarrage.
describe('Rendu serveur (SSR) — pas d\'accès à sessionStorage', () => {
  it('getUser() retourne null sans tenter d\'accéder à sessionStorage', () => {
    expect(monterService('server').getUser()).toBeNull();
  });

  it('saveUser() ne lève pas d\'erreur bien que l\'écriture soit ignorée', () => {
    const service = monterService('server');
    expect(() => service.saveUser(MAZLAI)).not.toThrow();
  });

  it('getState() retourne null en SSR', () => {
    expect(monterService('server').getState()).toBeNull();
  });
});
