import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'anime/:id',
    loadComponent: () =>
      import('./pages/anime-details/anime-details.page').then(
        (m) => m.AnimeDetailsPage,
      ),
  },
  {
    path: 'manga/:id',
    loadComponent: () =>
      import('./pages/manga-details/manga-details.page').then(
        (m) => m.MangaDetailsPage,
      ),
  },
  {
    path: 'watch/:animeId/episode/:episodeNumber',
    loadComponent: () =>
      import('./pages/watch/watch.page').then((m) => m.WatchPage),
  },
  {
    path: 'read/:mangaId/chapter/:chapterNumber',
    loadComponent: () =>
      import('./pages/read/read.page').then((m) => m.ReadPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-dashboard.page').then(
        (m) => m.AdminDashboardPage,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
