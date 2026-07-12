import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

function setup(inputs: { alt: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }): ComponentFixture<AvatarComponent> {
  TestBed.configureTestingModule({ imports: [AvatarComponent] });
  const fixture = TestBed.createComponent(AvatarComponent);
  fixture.componentRef.setInput('alt', inputs.alt);
  if (inputs.src !== undefined) fixture.componentRef.setInput('src', inputs.src);
  if (inputs.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
  fixture.detectChanges();
  return fixture;
}

describe('AvatarComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('se crée sans erreur', () => {
    const fixture = setup({ alt: 'Mazlai' });
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ===== Affichage image =====

  it('affiche une balise <img> quand src est défini', () => {
    const fixture = setup({ alt: 'Mazlai', src: 'https://cdn.discordapp.com/avatars/123/hash.png' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img')).toBeTruthy();
  });

  it('définit l\'attribut alt sur l\'image', () => {
    const fixture = setup({ alt: 'Avatar de Mazlai', src: 'https://example.com/avatar.png' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('Avatar de Mazlai');
  });

  it('applique la classe de taille sur l\'image', () => {
    const fixture = setup({ alt: 'Mazlai', src: 'https://example.com/avatar.png', size: 'lg' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img.avatar--lg')).toBeTruthy();
  });

  // ===== Fallback avec initiales =====

  it('affiche le fallback avec initiales quand src est null', () => {
    const fixture = setup({ alt: 'Mazlai', src: null });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.avatar--fallback')).toBeTruthy();
  });

  it('calcule les initiales à partir d\'un seul mot', () => {
    const fixture = setup({ alt: 'Mazlai', src: null });
    expect(fixture.componentInstance.initials()).toBe('M');
  });

  it('calcule les initiales à partir de deux mots', () => {
    const fixture = setup({ alt: 'John Doe', src: null });
    expect(fixture.componentInstance.initials()).toBe('JD');
  });

  it('tronque les initiales à 2 caractères pour 3 mots', () => {
    const fixture = setup({ alt: 'John Marie Dupont', src: null });
    expect(fixture.componentInstance.initials()).toBe('JM');
  });

  it('applique la classe de taille sur le fallback', () => {
    const fixture = setup({ alt: 'Mazlai', src: null, size: 'sm' });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.avatar--sm')).toBeTruthy();
  });

  // ===== Taille par défaut =====

  it('utilise "md" comme taille par défaut', () => {
    const fixture = setup({ alt: 'Mazlai', src: null });
    expect(fixture.componentInstance.size()).toBe('md');
  });
});