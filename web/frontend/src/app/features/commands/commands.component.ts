import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-commands',
  standalone: true,
  templateUrl: './commands.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandsComponent {}
