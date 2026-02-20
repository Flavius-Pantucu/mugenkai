import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-read-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './read.page.html',
  styleUrl: './read.page.css',
})
export class ReadPage {
  constructor(private route: ActivatedRoute) {}

  get chapterLabel(): string {
    const mangaId = this.route.snapshot.paramMap.get('mangaId');
    const chapter = this.route.snapshot.paramMap.get('chapterNumber');
    return `${mangaId} · Chapter ${chapter}`;
  }
}

