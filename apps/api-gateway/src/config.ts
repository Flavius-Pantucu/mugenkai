import * as dotenv from 'dotenv';
dotenv.config();

export const services = {
  AUTH: process.env.AUTH_SERVICE_URL,
  USER: process.env.USER_SERVICE_URL,
  ANIME: process.env.ANIME_SERVICE_URL,
  MANGA: process.env.MANGA_SERVICE_URL,
};
