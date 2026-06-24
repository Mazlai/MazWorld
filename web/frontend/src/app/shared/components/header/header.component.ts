import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerComponent } from '../ui/spinner/spinner.component';
import { AvatarComponent } from '../ui/avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SpinnerComponent, AvatarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly auth = inject(AuthService);

  login(): void {
    this.auth.loginWithDiscord().subscribe();
  }

  logout(): void {
    this.auth.logout();
  }
}
