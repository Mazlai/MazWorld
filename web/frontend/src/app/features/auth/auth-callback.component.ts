import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthStorageService } from '../../core/services/auth-storage.service';

const DISCORD_ERRORS: Record<string, string> = {
  access_denied: 'Vous avez refusé l\'autorisation. Veuillez réessayer.',
  invalid_request: 'La requête est invalide. Veuillez réessayer.',
  unauthorized_client: 'Application non autorisée.',
  server_error: 'Erreur serveur Discord. Veuillez réessayer plus tard.',
  temporarily_unavailable: 'Discord est temporairement indisponible.',
};

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(AuthStorageService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly successUsername = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const errorParam: string | undefined = params['error'];
    const code: string | undefined = params['code'];
    const state: string | undefined = params['state'];

    if (errorParam) {
      this.isLoading.set(false);
      this.error.set(DISCORD_ERRORS[errorParam] ?? `Erreur Discord : ${errorParam}`);
      return;
    }

    if (!code) {
      this.isLoading.set(false);
      this.error.set('Code d\'autorisation manquant. Veuillez réessayer.');
      return;
    }

    this.auth.handleDiscordCallback(code, state ?? '').subscribe({
      next: res => {
        this.isLoading.set(false);
        this.successUsername.set(res.user.username);
        const redirectUrl = this.storage.getRedirectUrl() || '/dashboard';
        this.storage.clearRedirectUrl();
        setTimeout(() => this.router.navigateByUrl(redirectUrl), 1500);
      },
      error: err => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message ?? 'Une erreur est survenue lors de la connexion.');
      },
    });
  }

  retry(): void {
    this.auth.loginWithDiscord().subscribe();
  }
}
