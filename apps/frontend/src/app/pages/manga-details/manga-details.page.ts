import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-manga-details-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './manga-details.page.html',
  styleUrl: './manga-details.page.css',
})
export class MangaDetailsPage {
  constructor(private route: ActivatedRoute) {}

  get mangaId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }
}

