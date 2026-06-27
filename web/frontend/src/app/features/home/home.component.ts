import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly auth = inject(AuthService);

  readonly cities = [
    { id: 'willowbrook',  emoji: '🌿', name: 'Willowbrook',  theme: 'Nature'      },
    { id: 'ironhaven',    emoji: '⚒️', name: 'Ironhaven',    theme: 'Industriel'  },
    { id: 'crystalport',  emoji: '⚓', name: 'Crystalport',  theme: 'Maritime'    },
    { id: 'shadowpeak',   emoji: '🏔️', name: 'Shadowpeak',   theme: 'Montagne'    },
    { id: 'goldenfields', emoji: '🌾', name: 'Goldenfields', theme: 'Plaines'     },
    { id: 'neonhub',      emoji: '🌆', name: 'NeonHub',      theme: 'High-tech'   },
  ];

  readonly economySteps = [
    { emoji: '💬', title: 'Interagissez',  desc: 'Chattez sur Discord et gagnez des MazCoins automatiquement.' },
    { emoji: '🪙', title: 'Accumulez',     desc: 'Votre solde grandit à chaque message et commande.' },
    { emoji: '🗺️', title: 'Voyagez',       desc: 'Dépensez vos coins pour voyager vers de nouvelles villes.' },
    { emoji: '🛒', title: 'Personnalisez', desc: 'Achetez des backgrounds et badges dans la boutique.' },
  ];

  login(): void {
    this.auth.loginWithDiscord().subscribe();
  }
}
