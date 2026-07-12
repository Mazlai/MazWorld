import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

function setup(inputs: { label: string; value: string | number; icon?: string; variant?: 'default' | 'accent' | 'gold' }): ComponentFixture<StatCardComponent> {
  TestBed.configureTestingModule({ imports: [StatCardComponent] });
  const fixture = TestBed.createComponent(StatCardComponent);
  fixture.componentRef.setInput('label', inputs.label);
  fixture.componentRef.setInput('value', inputs.value);
  if (inputs.icon !== undefined) fixture.componentRef.setInput('icon', inputs.icon);
  if (inputs.variant !== undefined) fixture.componentRef.setInput('variant', inputs.variant);
  fixture.detectChanges();
  return fixture;
}

describe('StatCardComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('se crée sans erreur', () => {
    const fixture = setup({ label: 'Score', value: 42 });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('affiche la valeur dans le DOM', () => {
    const fixture = setup({ label: 'Score', value: 1500 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card__value')?.textContent?.trim()).toBe('1500');
  });

  it('affiche le label dans le DOM', () => {
    const fixture = setup({ label: 'Pièces', value: 0 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card__label')?.textContent?.trim()).toBe('Pièces');
  });

  it('applique la classe de variante sur le conteneur', () => {
    const fixture = setup({ label: 'Score', value: 10, variant: 'accent' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card--accent')).toBeTruthy();
  });

  it('applique la variante "default" par défaut', () => {
    const fixture = setup({ label: 'Score', value: 10 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card--default')).toBeTruthy();
  });

  it('affiche l\'icône quand fournie', () => {
    const fixture = setup({ label: 'Score', value: 10, icon: '⭐' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card__icon')?.textContent?.trim()).toBe('⭐');
  });

  it('n\'affiche pas l\'icône quand vide (défaut)', () => {
    const fixture = setup({ label: 'Score', value: 10 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.stat-card__icon')).toBeNull();
  });

  it('définit un aria-label combinant value et label', () => {
    const fixture = setup({ label: 'Pièces', value: 500 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('500 Pièces');
  });
});