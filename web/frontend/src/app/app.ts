import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App implements OnInit {
  constructor(private readonly auth: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.auth.init();
  }
}
