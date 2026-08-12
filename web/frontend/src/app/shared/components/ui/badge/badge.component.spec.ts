import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

type Variante = 'accent' | 'gold' | 'success' | 'danger' | 'info';

function afficherBadge(variante?: Variante): ComponentFixture<BadgeComponent> {
  TestBed.configureTestingModule({ imports: [BadgeComponent] });
  const fixture = TestBed.createComponent(BadgeComponent);
  if (variante !== undefined) fixture.componentRef.setInput('variant', variante);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

it('applique la classe badge--accent par défaut, sans variant précisé', () => {
  expect(afficherBadge().nativeElement.querySelector('.badge--accent')).toBeTruthy();
});

// Les 5 variantes correspondent aux badges de collection du jeu (fondateur, vérifié,
// événements...) — chacune doit reprendre sa propre classe de couleur, pas un fallback commun.
it.each<Variante>(['gold', 'success', 'danger', 'info'])('applique badge--%s pour la variante correspondante', (variante) => {
  expect(afficherBadge(variante).nativeElement.querySelector(`.badge--${variante}`)).toBeTruthy();
});
