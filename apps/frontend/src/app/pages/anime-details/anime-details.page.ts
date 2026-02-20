import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-anime-details-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './anime-details.page.html',
  styleUrl: './anime-details.page.css',
})
export class AnimeDetailsPage {
  constructor(private route: ActivatedRoute) {}

  get animeId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }
}

