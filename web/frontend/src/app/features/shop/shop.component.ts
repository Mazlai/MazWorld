import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-shop',
  standalone: true,
  templateUrl: './shop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent {}
