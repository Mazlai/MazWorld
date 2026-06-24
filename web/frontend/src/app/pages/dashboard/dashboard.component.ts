import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly user = this.auth.user;

  constructor(private readonly auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
