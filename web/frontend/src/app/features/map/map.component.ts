import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, viewChild, ElementRef } from '@angular/core';
import { forkJoin, interval, Subscription } from 'rxjs';
import { TravelService } from '../../core/services/travel.service';
import type { City, RouteData, TravelRoute, TravelMapData, TravelStatus, VisualRoute } from '../../core/models/travel.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, OnDestroy {
  private readonly travelService = inject(TravelService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isTraveling = signal(false);
  readonly selectedCity = signal<City | null>(null);
  readonly remainingSeconds = signal(0);
  readonly travelingToName = signal('');
  readonly travelingToEmoji = signal('');
  readonly coins = signal(0);

  readonly cities = signal<City[]>([]);
  readonly allRoutes = signal<RouteData[]>([]);
  private travelMapData: TravelMapData | null = null;
  private travelStatus: TravelStatus | null = null;

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('detailsPanel');
  private lastFocusedCity: HTMLElement | null = null;

  readonly visualRoutes = computed<VisualRoute[]>(() => {
    return this.allRoutes()
      .map(r => {
        const from = this.cities().find(c => c.city_id === r.city_from);
        const to = this.cities().find(c => c.city_id === r.city_to);
        if (!from || !to) return null;
        let x1 = from.position_x, y1 = from.position_y;
        let x2 = to.position_x, y2 = to.position_y;
        if (x1 === x2) x2 += 0.001;
        if (y1 === y2) y2 += 0.001;
        return { x1, y1, x2, y2 };
      })
      .filter((r): r is VisualRoute => r !== null);
  });

  private countdownSub?: Subscription;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    forkJoin({
      cities: this.travelService.getAllCities(),
      routes: this.travelService.getAllRoutes(),
      map: this.travelService.getMap(),
      status: this.travelService.getStatus(),
    }).subscribe({
      next: ({ cities, routes, map, status }) => {
        this.cities.set(cities);
        this.allRoutes.set(routes);
        this.travelMapData = map;
        this.travelStatus = status;
        this.coins.set(map.coins);
        this.isTraveling.set(status.traveling);
        this.travelingToName.set(status.destination_name ?? '');
        this.travelingToEmoji.set(status.destination_emoji ?? '');
        this.isLoading.set(false);

        if (status.traveling && status.arrival_time) {
          this.startCountdown(status.arrival_time);
        } else {
          this.countdownSub?.unsubscribe();
        }
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private startCountdown(arrivalTime: number): void {
    this.countdownSub?.unsubscribe();
    const update = () => {
      const remaining = Math.max(0, arrivalTime - Math.floor(Date.now() / 1000));
      this.remainingSeconds.set(remaining);
      if (remaining === 0) {
        this.countdownSub?.unsubscribe();
        this.load();
      }
    };
    update();
    this.countdownSub = interval(1000).subscribe(update);
  }

  getCityPosition(city: City): { x: number; y: number } {
    return {
      x: (city.position_x / 1000) * 100,
      y: (city.position_y / 600) * 100,
    };
  }

  isCurrentCity(cityId: string): boolean {
    return this.travelMapData?.current_city.city_id === cityId;
  }

  isDestination(cityId: string): boolean {
    return this.travelStatus?.destination === cityId;
  }

  getRouteToCity(cityId: string): TravelRoute | null {
    return this.travelMapData?.routes.find(r => r.city_to === cityId) ?? null;
  }

  getCurrentCityJobs() {
    return this.travelMapData?.jobs ?? [];
  }

  getThemeColor(theme?: string): string {
    const colors: Record<string, string> = {
      nature: 'rgba(139, 195, 74, 0.4)',
      industrial: 'rgba(255, 152, 0, 0.4)',
      maritime: 'rgba(3, 169, 244, 0.4)',
      mountain: 'rgba(158, 158, 158, 0.4)',
      plains: 'rgba(255, 235, 59, 0.4)',
      cyber: 'rgba(156, 39, 176, 0.4)',
    };
    return colors[theme ?? ''] ?? 'rgba(255, 107, 53, 0.4)';
  }

  selectCity(city: City, event?: Event): void {
    this.lastFocusedCity = (event?.target as HTMLElement) ?? null;
    this.selectedCity.set(city);
    setTimeout(() => {
      const closeBtn = this.panelRef()?.nativeElement.querySelector<HTMLElement>('.close-btn');
      closeBtn?.focus();
    });
  }

  closePanel(): void {
    this.selectedCity.set(null);
    setTimeout(() => this.lastFocusedCity?.focus());
  }

  startTravel(cityId: string): void {
    this.travelService.startTravel(cityId).subscribe({
      next: (res) => {
        if (res.success) {
          this.closePanel();
          this.load();
        }
      },
    });
  }

  canAffordTravel(cityId: string): boolean {
    const route = this.getRouteToCity(cityId);
    if (!route) return false;
    return route.effective_cost === 0 || this.coins() >= route.effective_cost;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
