import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

function afficherCarte(inputs: { label: string; value: string | number; icon?: string; variant?: 'default' | 'accent' | 'gold' }): ComponentFixture<StatCardComponent> {
  TestBed.configureTestingModule({ imports: [StatCardComponent] });
  const fixture = TestBed.createComponent(StatCardComponent);
  fixture.componentRef.setInput('label', inputs.label);
  fixture.componentRef.setInput('value', inputs.value);
  if (inputs.icon !== undefined) fixture.componentRef.setInput('icon', inputs.icon);
  if (inputs.variant !== undefined) fixture.componentRef.setInput('variant', inputs.variant);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

it('affiche la valeur et le label reçus (ex. solde de MazCoins sur le dashboard)', () => {
  const fixture = afficherCarte({ label: 'Pièces', value: 1500 });

  expect(fixture.nativeElement.querySelector('.stat-card__value')?.textContent?.trim()).toBe('1500');
  expect(fixture.nativeElement.querySelector('.stat-card__label')?.textContent?.trim()).toBe('Pièces');
});

describe('Variante de couleur', () => {
  it('applique "default" quand aucune variante n\'est précisée', () => {
    expect(afficherCarte({ label: 'Score', value: 10 }).nativeElement.querySelector('.stat-card--default')).toBeTruthy();
  });

  it('applique la variante demandée sur le conteneur', () => {
    expect(afficherCarte({ label: 'Score', value: 10, variant: 'accent' }).nativeElement.querySelector('.stat-card--accent')).toBeTruthy();
  });
});

describe('Icône — optionnelle', () => {
  it('l\'affiche quand elle est fournie', () => {
    expect(afficherCarte({ label: 'Score', value: 10, icon: '⭐' }).nativeElement.querySelector('.stat-card__icon')?.textContent?.trim()).toBe('⭐');
  });

  it('ne laisse pas d\'élément vide dans le DOM quand elle est absente', () => {
    expect(afficherCarte({ label: 'Score', value: 10 }).nativeElement.querySelector('.stat-card__icon')).toBeNull();
  });
});

it('combine valeur et label dans un seul aria-label pour les lecteurs d\'écran', () => {
  const fixture = afficherCarte({ label: 'Pièces', value: 500 });

  expect(fixture.nativeElement.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('500 Pièces');
});
