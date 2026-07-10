import { Component, inject, ChangeDetectionStrategy, signal, viewChild, ElementRef } from '@angular/core';
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

  readonly isMobileMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  private readonly triggerRef = viewChild<ElementRef<HTMLElement>>('userMenuTrigger');
  private readonly dropdownRef = viewChild<ElementRef<HTMLElement>>('userMenuDropdown');

  login(): void { this.auth.loginWithDiscord().subscribe(); }
  logout(): void { this.closeUserMenu(); this.auth.logout(); }

  toggleMobileMenu(): void { this.isMobileMenuOpen.update(v => !v); }
  closeMobileMenu(): void { this.isMobileMenuOpen.set(false); }

  toggleUserMenu(): void { this.isUserMenuOpen.update(v => !v); }
  closeUserMenu(): void { this.isUserMenuOpen.set(false); }

  onUserMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeUserMenu();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isUserMenuOpen.set(true);
      setTimeout(() => this.getMenuItems()[0]?.focus());
    }
  }

  onMenuKeydown(event: KeyboardEvent): void {
    const items = this.getMenuItems();
    const current = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeUserMenu();
        this.triggerRef()?.nativeElement.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        items[(current + 1) % items.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
        break;
      case 'Tab':
        this.closeUserMenu();
        break;
    }
  }

  private getMenuItems(): HTMLElement[] {
    const menu = this.dropdownRef()?.nativeElement;
    if (!menu) return [];
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }
}
