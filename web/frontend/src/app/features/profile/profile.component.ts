import { Component, OnInit, inject, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import type { UserProfile } from '../../core/models/profile.model';
import { SpinnerComponent } from '../../shared/components/ui/spinner/spinner.component';
import { AvatarComponent } from '../../shared/components/ui/avatar/avatar.component';
import { getBadgeSlots, getBackgroundName, formatDateFr } from '../../core/utils/profile.utils';
import { getBackgroundColor, getBadgeEmoji } from '../../core/data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, SpinnerComponent, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.profileService.getMyProfile().subscribe({
      next: p => { this.profile.set(p); this.isLoading.set(false); },
      error: () => { this.hasError.set(true); this.isLoading.set(false); },
    });
  }

  readonly backgroundColor = computed(() => {
    const p = this.profile();
    return p ? getBackgroundColor(p.equipped_background) : '#2f3136';
  });

  readonly backgroundName = computed(() => {
    const p = this.profile();
    return p ? getBackgroundName(p.equipped_background) : 'Défaut';
  });

  readonly memberSince = computed(() => {
    const p = this.profile();
    return p ? formatDateFr(p.created_at) : '';
  });

  readonly badgeSlots = computed(() =>
    getBadgeSlots(this.profile()?.equipped_badges),
  );

  readonly getBadgeEmoji = getBadgeEmoji;
}
