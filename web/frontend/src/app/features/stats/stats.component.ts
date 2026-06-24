import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-stats',
  standalone: true,
  templateUrl: './stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent {}
