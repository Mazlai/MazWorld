import { Component, ChangeDetectionStrategy } from '@angular/core';
import { COMMAND_CATEGORIES, BOT_COMMANDS, type BotCommand } from './commands.data';

@Component({
  selector: 'app-commands',
  standalone: true,
  templateUrl: './commands.component.html',
  styleUrl: './commands.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandsComponent {
  readonly categories = COMMAND_CATEGORIES;

  commandsFor(categoryId: string): BotCommand[] {
    return BOT_COMMANDS.filter(c => c.category === categoryId);
  }
}
