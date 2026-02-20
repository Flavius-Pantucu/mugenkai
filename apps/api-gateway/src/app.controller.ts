import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { services } from './config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHello(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    await Promise.all(
      Object.entries(services).map(async ([name, url]) => {
        try {
          const res = await axios.get(url ? url : '');
          results[name] = {
            status: res.status,
            message: res.data || 'OK',
          };
        } catch (err) {
          results[name] = {
            status: err.response?.status || 500,
            error: err.message,
          };
        }
      }),
    );

    return results;
  }

  @Get('home')
  async getHome() {
    return {
      hero: {
        id: 'demo-hero',
        title: 'Hero show title',
        description:
          'Placeholder hero content. This will be populated from anime and manga services.',
      },
      trending: [],
      popular: [],
      continueWatching: [],
    };
  }

  @Get('profile')
  async getProfile() {
    return {
      user: {
        id: 'demo-user',
        username: 'demo',
        avatarUrl: null,
      },
      preferences: {
        preferredGenres: [],
        language: 'en',
        matureContentEnabled: false,
      },
      watchHistory: [],
      readingHistory: [],
    };
  }

  @Get('anime/:id/details')
  async getAnimeDetails() {
    return {
      anime: {
        id: 'demo-anime',
        title: 'Demo anime',
        description:
          'Placeholder anime details. This will be aggregated from the anime service.',
      },
      episodes: [],
    };
  }
}
