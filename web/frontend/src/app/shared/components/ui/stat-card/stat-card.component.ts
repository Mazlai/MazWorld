import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="stat-card" [class]="'stat-card--' + variant()" role="group" [attr.aria-label]="value() + ' ' + label()">
      @if (icon()) {
        <span class="stat-card__icon" aria-hidden="true">{{ icon() }}</span>
      }
      <div class="stat-card__body" aria-hidden="true">
        <span class="stat-card__value">{{ value() }}</span>
        <span class="stat-card__label">{{ label() }}</span>
      </div>
    </div>
  `,
  styleUrl: './stat-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('');
  readonly variant = input<'default' | 'accent' | 'gold'>('default');
}
