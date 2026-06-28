import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'MazWorld — Voyageur aujourd\'hui, magnat demain',
    canActivate: [guestGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent),
    title: 'Connexion — MazWorld',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profil — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'map',
    loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent),
    title: 'Carte — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'shop',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent),
    title: 'Boutique — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
    title: 'Inventaire — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./features/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
    title: 'Classement — MazWorld',
  },
  {
    path: 'records',
    loadComponent: () => import('./features/records/records.component').then(m => m.RecordsComponent),
    title: 'Records — MazWorld',
    canActivate: [authGuard],
  },
  {
    path: 'stats',
    loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent),
    title: 'Statistiques — MazWorld',
    canActivate: [adminGuard],
  },
  {
    path: 'commands',
    loadComponent: () => import('./features/commands/commands.component').then(m => m.CommandsComponent),
    title: 'Commandes — MazWorld',
  },
  { path: '**', redirectTo: '' },
];
