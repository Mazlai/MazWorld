import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

function afficherEtatVide(inputs: { title: string; description?: string; icon?: string }): ComponentFixture<EmptyStateComponent> {
  TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
  const fixture = TestBed.createComponent(EmptyStateComponent);
  fixture.componentRef.setInput('title', inputs.title);
  if (inputs.description !== undefined) fixture.componentRef.setInput('description', inputs.description);
  if (inputs.icon !== undefined) fixture.componentRef.setInput('icon', inputs.icon);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

it('affiche toujours le titre (ex. "Inventaire vide")', () => {
  const fixture = afficherEtatVide({ title: 'Inventaire vide' });

  expect(fixture.nativeElement.querySelector('.empty-state__title')?.textContent?.trim()).toBe('Inventaire vide');
});

describe('Description — optionnelle', () => {
  it('l\'affiche quand elle est fournie', () => {
    const fixture = afficherEtatVide({ title: 'Aucun résultat', description: 'Rien à afficher pour le moment.' });

    expect(fixture.nativeElement.querySelector('.empty-state__description')?.textContent?.trim()).toBe('Rien à afficher pour le moment.');
  });

  it('ne laisse pas d\'élément vide dans le DOM quand elle est absente', () => {
    expect(afficherEtatVide({ title: 'Aucun résultat' }).nativeElement.querySelector('.empty-state__description')).toBeNull();
  });
});

describe('Icône — optionnelle', () => {
  it('l\'affiche quand elle est fournie', () => {
    const fixture = afficherEtatVide({ title: 'Vide', icon: '📦' });

    expect(fixture.nativeElement.querySelector('.empty-state__icon')?.textContent?.trim()).toBe('📦');
  });

  it('ne laisse pas d\'élément vide dans le DOM quand elle est absente', () => {
    expect(afficherEtatVide({ title: 'Vide' }).nativeElement.querySelector('.empty-state__icon')).toBeNull();
  });
});

it('expose aria-live="polite" pour que les lecteurs d\'écran annoncent l\'état vide', () => {
  expect(afficherEtatVide({ title: 'Vide' }).nativeElement.querySelector('[aria-live="polite"]')).toBeTruthy();
});
