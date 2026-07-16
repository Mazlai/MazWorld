import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HOME_CITIES, HOME_FEATURES, HOME_ECONOMY_STEPS } from './home.data';

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

  readonly cities       = HOME_CITIES;
  readonly features     = HOME_FEATURES;
  readonly economySteps = HOME_ECONOMY_STEPS;

  login(): void {
    this.auth.loginWithDiscord().subscribe();
  }
}
