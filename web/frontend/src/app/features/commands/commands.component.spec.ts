import { TestBed } from '@angular/core/testing';
import { CommandsComponent } from './commands.component';

function afficherListeCommandes() {
  TestBed.configureTestingModule({ imports: [CommandsComponent] });

  const fixture = TestBed.createComponent(CommandsComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

it('charge les catégories de commandes du bot (profil, récompenses, jeux, exploration...)', () => {
  const { component } = afficherListeCommandes();

  expect(component.categories.length).toBeGreaterThan(0);
});

describe('Filtrage des commandes par catégorie', () => {
  it('ne retourne que les commandes de la catégorie "profil"', () => {
    const { component } = afficherListeCommandes();

    const commandesProfil = component.commandsFor('profil');

    expect(commandesProfil.length).toBeGreaterThan(0);
    expect(commandesProfil.every(c => c.category === 'profil')).toBe(true);
  });

  it('renvoie un tableau vide pour une catégorie qui n\'existe pas', () => {
    const { component } = afficherListeCommandes();

    expect(component.commandsFor('categorie-fantome')).toEqual([]);
  });
});
