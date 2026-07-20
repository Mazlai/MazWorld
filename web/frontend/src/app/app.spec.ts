import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('Composant racine — squelette de page et accessibilité', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('se compile et s\'instancie sans erreur avec le routeur et le client HTTP réels', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  // Le lien d'évitement (skip-link) et l'ancre #main-content vont de pair : le premier
  // sans le second serait un lien mort au clavier — on vérifie donc les deux ensemble.
  it('expose un lien d\'évitement "Aller au contenu principal"', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.skip-link')?.textContent?.trim()).toBe('Aller au contenu principal');
  });

  it('fournit bien la cible #main-content visée par le lien d\'évitement', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('main#main-content')).toBeTruthy();
  });
});
