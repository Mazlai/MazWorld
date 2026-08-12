import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';

function afficherPageAccueil() {
  const authMock = {
    loginWithDiscord: vi.fn().mockReturnValue(of(null)),
    isAuthenticated: vi.fn().mockReturnValue(false),
  };

  TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
  });

  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, authMock };
}

describe('Bouton de connexion sur la landing page', () => {
  it('lance le flux OAuth Discord quand login() est appelé', () => {
    const { component, authMock } = afficherPageAccueil();

    component.login();

    expect(authMock.loginWithDiscord).toHaveBeenCalledTimes(1);
  });
});

it('charge le contenu statique de la landing page (villes, features, étapes économie)', () => {
  const { component } = afficherPageAccueil();

  expect(component.cities.length).toBeGreaterThan(0);
  expect(component.features.length).toBeGreaterThan(0);
  expect(component.economySteps.length).toBeGreaterThan(0);
});
