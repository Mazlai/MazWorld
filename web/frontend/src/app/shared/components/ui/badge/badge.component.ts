import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'badge--' + variant()">
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly variant = input<'accent' | 'gold' | 'success' | 'danger' | 'info'>('accent');
}
