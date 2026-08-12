import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

function afficherSpinner(inputs?: { size?: 'sm' | 'md' | 'lg'; label?: string }): ComponentFixture<SpinnerComponent> {
  TestBed.configureTestingModule({ imports: [SpinnerComponent] });
  const fixture = TestBed.createComponent(SpinnerComponent);
  if (inputs?.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
  if (inputs?.label !== undefined) fixture.componentRef.setInput('label', inputs.label);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

it('expose role="status" pour que les lecteurs d\'écran annoncent le chargement', () => {
  expect(afficherSpinner().nativeElement.querySelector('[role="status"]')).toBeTruthy();
});

describe('Taille du spinner', () => {
  it('utilise "md" par défaut', () => {
    expect(afficherSpinner().nativeElement.querySelector('.spinner--md')).toBeTruthy();
  });

  it('applique spinner--sm quand demandé', () => {
    expect(afficherSpinner({ size: 'sm' }).nativeElement.querySelector('.spinner--sm')).toBeTruthy();
  });

  it('applique spinner--lg quand demandé', () => {
    expect(afficherSpinner({ size: 'lg' }).nativeElement.querySelector('.spinner--lg')).toBeTruthy();
  });
});

describe('Libellé accessible', () => {
  it('utilise "Chargement…" par défaut', () => {
    expect(afficherSpinner().nativeElement.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Chargement…');
  });

  it('reprend le libellé personnalisé quand un contexte plus précis est fourni', () => {
    const fixture = afficherSpinner({ label: 'Connexion en cours…' });

    expect(fixture.nativeElement.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Connexion en cours…');
  });
});
