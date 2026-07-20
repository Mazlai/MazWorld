import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

function afficherAvatar(inputs: { alt: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }): ComponentFixture<AvatarComponent> {
  TestBed.configureTestingModule({ imports: [AvatarComponent] });
  const fixture = TestBed.createComponent(AvatarComponent);
  fixture.componentRef.setInput('alt', inputs.alt);
  if (inputs.src !== undefined) fixture.componentRef.setInput('src', inputs.src);
  if (inputs.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => TestBed.resetTestingModule());

describe('Avatar Discord réel (src défini)', () => {
  it('affiche une balise <img> plutôt que le fallback initiales', () => {
    const fixture = afficherAvatar({ alt: 'Mazlai', src: 'https://cdn.discordapp.com/avatars/123/hash.png' });

    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('reporte le texte alternatif sur l\'image pour les lecteurs d\'écran', () => {
    const fixture = afficherAvatar({ alt: 'Avatar de Mazlai', src: 'https://example.com/avatar.png' });

    expect(fixture.nativeElement.querySelector('img')?.getAttribute('alt')).toBe('Avatar de Mazlai');
  });

  it('applique la classe de taille demandée sur l\'image', () => {
    const fixture = afficherAvatar({ alt: 'Mazlai', src: 'https://example.com/avatar.png', size: 'lg' });

    expect(fixture.nativeElement.querySelector('img.avatar--lg')).toBeTruthy();
  });
});

describe('Fallback en initiales (pas d\'avatar Discord, src null)', () => {
  it('affiche les initiales plutôt qu\'une image cassée', () => {
    const fixture = afficherAvatar({ alt: 'Mazlai', src: null });

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.avatar--fallback')).toBeTruthy();
  });

  it('extrait une seule initiale pour un pseudo à un seul mot', () => {
    expect(afficherAvatar({ alt: 'Mazlai', src: null }).componentInstance.initials()).toBe('M');
  });

  it('extrait deux initiales pour un pseudo prénom + nom', () => {
    expect(afficherAvatar({ alt: 'John Doe', src: null }).componentInstance.initials()).toBe('JD');
  });

  it('tronque à 2 initiales même avec un pseudo à 3 mots', () => {
    expect(afficherAvatar({ alt: 'John Marie Dupont', src: null }).componentInstance.initials()).toBe('JM');
  });

  it('applique aussi la classe de taille sur le fallback, pas seulement sur l\'image', () => {
    const fixture = afficherAvatar({ alt: 'Mazlai', src: null, size: 'sm' });

    expect(fixture.nativeElement.querySelector('.avatar--sm')).toBeTruthy();
  });
});

it('utilise "md" comme taille par défaut quand aucune n\'est précisée', () => {
  expect(afficherAvatar({ alt: 'Mazlai', src: null }).componentInstance.size()).toBe('md');
});
