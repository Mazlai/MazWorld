import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

function setup(inputs?: { size?: 'sm' | 'md' | 'lg'; label?: string }): ComponentFixture<SpinnerComponent> {
  TestBed.configureTestingModule({ imports: [SpinnerComponent] });
  const fixture = TestBed.createComponent(SpinnerComponent);
  if (inputs?.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
  if (inputs?.label !== undefined) fixture.componentRef.setInput('label', inputs.label);
  fixture.detectChanges();
  return fixture;
}

describe('SpinnerComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('se crée sans erreur', () => {
    const fixture = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('expose role="status" pour l\'accessibilité', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[role="status"]')).toBeTruthy();
  });

  it('utilise "md" comme taille par défaut', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.spinner--md')).toBeTruthy();
  });

  it('applique spinner--sm quand size="sm"', () => {
    const fixture = setup({ size: 'sm' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.spinner--sm')).toBeTruthy();
  });

  it('applique spinner--lg quand size="lg"', () => {
    const fixture = setup({ size: 'lg' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.spinner--lg')).toBeTruthy();
  });

  it('utilise "Chargement…" comme label par défaut', () => {
    const fixture = setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Chargement…');
  });

  it('utilise le label personnalisé quand fourni', () => {
    const fixture = setup({ label: 'Connexion en cours…' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Connexion en cours…');
  });
});