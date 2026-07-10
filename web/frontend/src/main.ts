import { bootstrapApplication } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .then(async appRef => {
    if (!environment.production) {
      const { default: axe } = await import('axe-core');
      const router = appRef.injector.get(Router);

      let axeTimer: ReturnType<typeof setTimeout> | null = null;
      const runAxe = () => {
        if (axeTimer) clearTimeout(axeTimer);
        axeTimer = setTimeout(() => {
          axeTimer = null;
          axe.run().then(({ violations }) => {
            if (!violations.length) return;
            console.group(`%c♿ axe — ${violations.length} violation(s)`, 'color:#f87171;font-weight:bold');
            violations.forEach(v => {
              console.warn(`[${v.impact?.toUpperCase()}] ${v.description}`);
              v.nodes.forEach(n => console.warn('  ↳', n.html));
            });
            console.groupEnd();
          });
        }, 500);
      };

      router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(runAxe);
      runAxe();
    }
  })
  .catch(err => console.error(err));