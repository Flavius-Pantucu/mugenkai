import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { services } from './config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
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
}
