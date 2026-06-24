import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img
        class="avatar"
        [class]="'avatar--' + size()"
        [src]="src()!"
        [alt]="alt()"
        (error)="onError($event)"
      />
    } @else {
      <span class="avatar avatar--fallback" [class]="'avatar--' + size()" aria-hidden="true">
        {{ initials() }}
      </span>
    }
  `,
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly src = input<string | null>(null);
  readonly alt = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() =>
    this.alt()
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  );

  onError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
