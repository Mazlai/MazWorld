import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { StatCardComponent } from '../../shared/components/ui/stat-card/stat-card.component';
import { BadgeComponent } from '../../shared/components/ui/badge/badge.component';
import { AvatarComponent } from '../../shared/components/ui/avatar/avatar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent, BadgeComponent, AvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
}
