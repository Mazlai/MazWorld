import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

function setup(inputs: { title: string; description?: string; icon?: string }): ComponentFixture<EmptyStateComponent> {
  TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
  const fixture = TestBed.createComponent(EmptyStateComponent);
  fixture.componentRef.setInput('title', inputs.title);
  if (inputs.description !== undefined) fixture.componentRef.setInput('description', inputs.description);
  if (inputs.icon !== undefined) fixture.componentRef.setInput('icon', inputs.icon);
  fixture.detectChanges();
  return fixture;
}

describe('EmptyStateComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('se crée sans erreur', () => {
    const fixture = setup({ title: 'Aucun résultat' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche le titre', () => {
    const fixture = setup({ title: 'Inventaire vide' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__title')?.textContent?.trim()).toBe('Inventaire vide');
  });

  it('affiche la description quand fournie', () => {
    const fixture = setup({ title: 'Aucun résultat', description: 'Rien à afficher pour le moment.' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__description')?.textContent?.trim()).toBe('Rien à afficher pour le moment.');
  });

  it('n\'affiche pas la description quand absente (défaut)', () => {
    const fixture = setup({ title: 'Aucun résultat' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__description')).toBeNull();
  });

  it('affiche l\'icône quand fournie', () => {
    const fixture = setup({ title: 'Vide', icon: '📦' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__icon')?.textContent?.trim()).toBe('📦');
  });

  it('n\'affiche pas l\'icône quand absente (défaut)', () => {
    const fixture = setup({ title: 'Vide' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__icon')).toBeNull();
  });

  it('expose aria-live="polite" pour l\'accessibilité', () => {
    const fixture = setup({ title: 'Vide' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[aria-live="polite"]')).toBeTruthy();
  });
});