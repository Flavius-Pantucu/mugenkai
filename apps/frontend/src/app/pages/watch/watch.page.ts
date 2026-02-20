import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-watch-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './watch.page.html',
  styleUrl: './watch.page.css',
})
export class WatchPage {
  constructor(private route: ActivatedRoute) {}

  get episodeLabel(): string {
    const animeId = this.route.snapshot.paramMap.get('animeId');
    const episode = this.route.snapshot.paramMap.get('episodeNumber');
    return `${animeId} · Episode ${episode}`;
  }
}

