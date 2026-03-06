export interface Anime {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  trailerUrl: string;
  releaseDate: string;
  status: "ONGOING" | "COMPLETED";
  rating: number;
  genres: string[];
  episodes: Episode[];
  studio: string;
}

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration: number;
  thumbnail: string;
}

export interface Manga {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string;
  status: "ONGOING" | "COMPLETED";
  rating: number;
  genres: string[];
  chapters: Chapter[];
  author: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string;
  pages: MangaPage[];
}

export interface MangaPage {
  id: string;
  chapterId: string;
  imageUrl: string;
  pageNumber: number;
}

export interface WatchHistory {
  id: string;
  animeId: string;
  episodeId: string;
  progress: number;
  anime: Anime;
  episode: Episode;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: "USER" | "ADMIN";
  preferredGenres: string[];
  watchHistory: WatchHistory[];
  favorites: (Anime | Manga)[];
}

const IMG = {
  anime1:
    "https://images.unsplash.com/photo-1770116119330-2c80bc762d0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMGFydCUyMGNvbG9yZnVsJTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3MTU4OTA3OHww&ixlib=rb-4.1.0&q=80&w=1080",
  manga1:
    "https://images.unsplash.com/photo-1763732397715-ed72258ccb49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMGFuaW1hdGlvbiUyMG1hbmdhJTIwYXJ0d29ya3xlbnwxfHx8fDE3NzE1ODkwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  cyberpunk:
    "https://images.unsplash.com/photo-1594886801340-88d2d9c028e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY3liZXJwdW5rJTIwY2l0eSUyMG5pZ2h0JTIwbmVvbnxlbnwxfHx8fDE3NzE1ODkwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  warrior:
    "https://images.unsplash.com/photo-1770820986346-a3258a594c74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwd2FycmlvciUyMHN3b3JkJTIwYmF0dGxlfGVufDF8fHx8MTc3MTQ5NTMyMXww&ixlib=rb-4.1.0&q=80&w=1080",
  temple:
    "https://images.unsplash.com/photo-1760954255245-dd2524c5af16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHRlbXBsZSUyMGNoZXJyeSUyMGJsb3Nzb20lMjBuaWdodHxlbnwxfHx8fDE3NzE0OTA4MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  dragon:
    "https://images.unsplash.com/photo-1748838602679-32d82ccf188e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmFnb24lMjBkYXJrJTIwZmFudGFzeSUyMGFydHxlbnwxfHx8fDE3NzE1ODkwNzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  forest:
    "https://images.unsplash.com/photo-1763321402439-41eb2a0c7e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWdpY2FsJTIwZm9yZXN0JTIwbXlzdGljYWwlMjBnbG93fGVufDF8fHx8MTc3MTU4OTA4MHww&ixlib=rb-4.1.0&q=80&w=1080",
  ocean:
    "https://images.unsplash.com/photo-1771505909615-584d6f686f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHdhdmVzJTIwc3Vuc2V0JTIwZHJhbWF0aWN8ZW58MXx8fHwxNzcxNTg5MDgwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  galaxy:
    "https://images.unsplash.com/photo-1504812333783-63b845853c20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFjZSUyMGdhbGF4eSUyMG5lYnVsYSUyMHN0YXJzfGVufDF8fHx8MTc3MTU4OTA4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  samurai:
    "https://images.unsplash.com/photo-1687865547203-f592769b9221?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW11cmFpJTIwd2FycmlvciUyMGphcGFuZXNlJTIwYXJ0fGVufDF8fHx8MTc3MTU4OTA4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  cityscape:
    "https://images.unsplash.com/photo-1759864731065-b0626a2a4e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY2l0eXNjYXBlJTIwbmlnaHQlMjBsaWdodHMlMjB1cmJhbnxlbnwxfHx8fDE3NzE1ODkwODF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  mountain:
    "https://images.unsplash.com/photo-1626515405452-9728f8d67d39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMGVwaWMlMjBkcmFtYXRpYyUyMHNreXxlbnwxfHx8fDE3NzE1ODkwODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

function generateEpisodes(animeId: string, count: number): Episode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${animeId}-ep-${i + 1}`,
    animeId,
    episodeNumber: i + 1,
    title: `Episode ${i + 1}`,
    videoUrl: "",
    duration: 23 + Math.floor(Math.random() * 5),
    thumbnail: Object.values(IMG)[i % Object.values(IMG).length],
  }));
}

function generateChapters(mangaId: string, count: number): Chapter[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${mangaId}-ch-${i + 1}`,
    mangaId,
    chapterNumber: i + 1,
    title: `Chapter ${i + 1}`,
    pages: Array.from({ length: 8 }, (_, j) => ({
      id: `${mangaId}-ch-${i + 1}-pg-${j + 1}`,
      chapterId: `${mangaId}-ch-${i + 1}`,
      imageUrl: Object.values(IMG)[(i + j) % Object.values(IMG).length],
      pageNumber: j + 1,
    })),
  }));
}

export const animeList: Anime[] = [
  {
    id: "a1",
    title: "Phantom Edge",
    description:
      "In a world where shadows hold power, a young warrior discovers she can wield darkness itself. As ancient forces awaken, she must choose between the light she was raised in and the shadow that calls to her soul. An epic tale of destiny, sacrifice, and the blurred line between good and evil.",
    coverImage: IMG.warrior,
    bannerImage: IMG.warrior,
    trailerUrl: "",
    releaseDate: "2025-01-15",
    status: "ONGOING",
    rating: 9.2,
    genres: ["Action", "Fantasy", "Drama"],
    episodes: generateEpisodes("a1", 24),
    studio: "Studio Mugen",
  },
  {
    id: "a2",
    title: "Neon Genesis: Rebirth",
    description:
      "Mega Tokyo, 2089. The city never sleeps, and neither do the cyborg enforcers who patrol its neon-lit streets. When a rogue AI begins rewriting reality, one detective must unplug from the system to save humanity from digital extinction.",
    coverImage: IMG.cyberpunk,
    bannerImage: IMG.cyberpunk,
    trailerUrl: "",
    releaseDate: "2024-10-01",
    status: "ONGOING",
    rating: 8.9,
    genres: ["Sci-Fi", "Cyberpunk", "Thriller"],
    episodes: generateEpisodes("a2", 12),
    studio: "Cyber Works",
  },
  {
    id: "a3",
    title: "Dragon's Requiem",
    description:
      "The last dragon rider returns from exile to find his homeland consumed by war. With his ancient bond to the dragon Veyra, he must unite fractured kingdoms against an enemy that threatens to unravel the fabric of existence itself.",
    coverImage: IMG.dragon,
    bannerImage: IMG.dragon,
    trailerUrl: "",
    releaseDate: "2025-04-01",
    status: "ONGOING",
    rating: 9.5,
    genres: ["Fantasy", "Adventure", "Epic"],
    episodes: generateEpisodes("a3", 25),
    studio: "Mythic Animation",
  },
  {
    id: "a4",
    title: "Sakura Chronicles",
    description:
      "Beneath the cherry blossoms of ancient Kyoto, a shrine maiden discovers she is the reincarnation of a legendary priestess. With yokai stirring and the spirit world bleeding into reality, she must master forgotten arts to restore balance.",
    coverImage: IMG.temple,
    bannerImage: IMG.temple,
    trailerUrl: "",
    releaseDate: "2024-04-15",
    status: "COMPLETED",
    rating: 8.7,
    genres: ["Supernatural", "Romance", "Historical"],
    episodes: generateEpisodes("a4", 13),
    studio: "Sakura Productions",
  },
  {
    id: "a5",
    title: "Stellar Odyssey",
    description:
      "The crew of the starship Aether embarks on humanity's greatest journey: to reach the center of the galaxy. But what they find there challenges everything they know about the universe, consciousness, and the meaning of existence.",
    coverImage: IMG.galaxy,
    bannerImage: IMG.galaxy,
    trailerUrl: "",
    releaseDate: "2025-07-01",
    status: "ONGOING",
    rating: 9.0,
    genres: ["Sci-Fi", "Space", "Philosophy"],
    episodes: generateEpisodes("a5", 26),
    studio: "Cosmos Studio",
  },
  {
    id: "a6",
    title: "Blade of the Ronin",
    description:
      "A masterless samurai wanders through feudal Japan, carrying the weight of a blood oath. Each duel brings him closer to the truth about his master's death, and to the shadowy organization that threatens to plunge the nation into chaos.",
    coverImage: IMG.samurai,
    bannerImage: IMG.samurai,
    trailerUrl: "",
    releaseDate: "2024-09-15",
    status: "COMPLETED",
    rating: 9.3,
    genres: ["Action", "Historical", "Samurai"],
    episodes: generateEpisodes("a6", 24),
    studio: "Bushido Films",
  },
  {
    id: "a7",
    title: "Enchanted Wilds",
    description:
      "Deep within an ancient forest lies a world unseen by human eyes. When a lost traveler stumbles through the veil, she discovers a realm of magic, wonder, and terrifying beauty. But the forest has chosen her for a reason.",
    coverImage: IMG.forest,
    bannerImage: IMG.forest,
    trailerUrl: "",
    releaseDate: "2025-03-01",
    status: "ONGOING",
    rating: 8.4,
    genres: ["Fantasy", "Adventure", "Mystery"],
    episodes: generateEpisodes("a7", 12),
    studio: "Enchant Works",
  },
  {
    id: "a8",
    title: "Tidal Force",
    description:
      "The ocean holds secrets older than civilization. When a marine biologist discovers an underwater civilization, she becomes embroiled in a conflict between surface dwellers and the ancient beings below who are preparing to reclaim the world above.",
    coverImage: IMG.ocean,
    bannerImage: IMG.ocean,
    trailerUrl: "",
    releaseDate: "2024-06-01",
    status: "COMPLETED",
    rating: 8.1,
    genres: ["Adventure", "Fantasy", "Sci-Fi"],
    episodes: generateEpisodes("a8", 13),
    studio: "Deep Blue Studios",
  },
  {
    id: "a9",
    title: "Urban Phantom",
    description:
      "Beneath the glittering skyline of a modern metropolis lurks a network of supernatural enforcers. A rookie detective with latent psychic abilities is drawn into their world when she begins seeing the ghosts that haunt the city.",
    coverImage: IMG.cityscape,
    bannerImage: IMG.cityscape,
    trailerUrl: "",
    releaseDate: "2025-02-15",
    status: "ONGOING",
    rating: 8.6,
    genres: ["Supernatural", "Thriller", "Urban"],
    episodes: generateEpisodes("a9", 24),
    studio: "Phantom Animation",
  },
  {
    id: "a10",
    title: "Summit of Legends",
    description:
      "At the peak of Mount Tenzan, the gods once walked. Now, a tournament of the world's strongest fighters converges there to claim divine power. But the mountain has its own agenda, testing not strength, but the worthiness of the soul.",
    coverImage: IMG.mountain,
    bannerImage: IMG.mountain,
    trailerUrl: "",
    releaseDate: "2024-11-01",
    status: "COMPLETED",
    rating: 8.8,
    genres: ["Action", "Tournament", "Fantasy"],
    episodes: generateEpisodes("a10", 26),
    studio: "Peak Studios",
  },
];

export const mangaList: Manga[] = [
  {
    id: "m1",
    title: "Crimson Canvas",
    description:
      "An art student discovers that her paintings come alive at night. Each brushstroke creates a world, and each world demands a sacrifice. A hauntingly beautiful manga about creation, obsession, and the price of genius.",
    coverImage: IMG.anime1,
    bannerImage: IMG.anime1,
    status: "ONGOING",
    rating: 9.1,
    genres: ["Horror", "Art", "Psychological"],
    chapters: generateChapters("m1", 45),
    author: "Yuki Tanaka",
  },
  {
    id: "m2",
    title: "Echo Protocol",
    description:
      "In a world where memories can be digitized and traded, a black-market memory dealer stumbles upon a memory that contains the key to humanity's salvation — or its destruction.",
    coverImage: IMG.cyberpunk,
    bannerImage: IMG.cyberpunk,
    status: "ONGOING",
    rating: 8.8,
    genres: ["Sci-Fi", "Cyberpunk", "Thriller"],
    chapters: generateChapters("m2", 78),
    author: "Kenji Watanabe",
  },
  {
    id: "m3",
    title: "Spirit Warden",
    description:
      "A young shrine keeper inherits the ability to see and communicate with spirits. Tasked with maintaining the balance between the living and dead, she navigates a world of ancient grudges and forgotten promises.",
    coverImage: IMG.temple,
    bannerImage: IMG.temple,
    status: "COMPLETED",
    rating: 9.4,
    genres: ["Supernatural", "Slice of Life", "Drama"],
    chapters: generateChapters("m3", 120),
    author: "Aoi Miyazaki",
  },
  {
    id: "m4",
    title: "Iron Dynasty",
    description:
      "The tale of a blacksmith's daughter who forges a legendary blade and rises to become the greatest warrior of her generation. Set against the backdrop of a crumbling empire and ruthless power struggles.",
    coverImage: IMG.warrior,
    bannerImage: IMG.warrior,
    status: "ONGOING",
    rating: 9.0,
    genres: ["Action", "Historical", "Drama"],
    chapters: generateChapters("m4", 200),
    author: "Ryu Hashimoto",
  },
  {
    id: "m5",
    title: "Void Drifter",
    description:
      "A lone pilot drifts through the void between galaxies, carrying cargo and secrets. Each delivery takes her to strange new worlds, each encounter challenges her understanding of what it means to be human.",
    coverImage: IMG.galaxy,
    bannerImage: IMG.galaxy,
    status: "ONGOING",
    rating: 8.5,
    genres: ["Sci-Fi", "Space", "Adventure"],
    chapters: generateChapters("m5", 55),
    author: "Sora Nakamura",
  },
  {
    id: "m6",
    title: "Moonlit Blade",
    description:
      "Under the pale moonlight, a wandering swordsman seeks redemption. Each chapter is a standalone story of encounters on the road, weaving a larger tapestry of honor, loss, and the pursuit of inner peace.",
    coverImage: IMG.samurai,
    bannerImage: IMG.samurai,
    status: "COMPLETED",
    rating: 9.2,
    genres: ["Samurai", "Drama", "Philosophical"],
    chapters: generateChapters("m6", 90),
    author: "Takeshi Mori",
  },
  {
    id: "m7",
    title: "Verdant Heart",
    description:
      "A botanist discovers plants that respond to human emotions, leading her into a hidden world where nature fights back against humanity's encroachment. A green revolution begins with a single seed.",
    coverImage: IMG.forest,
    bannerImage: IMG.forest,
    status: "ONGOING",
    rating: 8.3,
    genres: ["Fantasy", "Eco", "Adventure"],
    chapters: generateChapters("m7", 35),
    author: "Hana Sakamoto",
  },
  {
    id: "m8",
    title: "Abyssal Tide",
    description:
      "The deep sea holds civilizations unknown. When tectonic shifts reveal an ancient underwater city, a team of explorers descends into darkness where the pressure could crush steel — and the inhabitants are not welcoming.",
    coverImage: IMG.ocean,
    bannerImage: IMG.ocean,
    status: "ONGOING",
    rating: 8.7,
    genres: ["Horror", "Sci-Fi", "Adventure"],
    chapters: generateChapters("m8", 42),
    author: "Kai Shimizu",
  },
];

export const trendingAnime = animeList.slice(0, 5);
export const popularAnime = animeList.slice(3, 10);
export const newReleases = [...animeList]
  .sort(() => Math.random() - 0.5)
  .slice(0, 6);
export const trendingManga = mangaList.slice(0, 5);
export const popularManga = mangaList.slice(2, 8);

export const continueWatching: WatchHistory[] = [
  {
    id: "wh1",
    animeId: "a1",
    episodeId: "a1-ep-5",
    progress: 67,
    anime: animeList[0],
    episode: animeList[0].episodes[4],
  },
  {
    id: "wh2",
    animeId: "a3",
    episodeId: "a3-ep-12",
    progress: 34,
    anime: animeList[2],
    episode: animeList[2].episodes[11],
  },
  {
    id: "wh3",
    animeId: "a5",
    episodeId: "a5-ep-3",
    progress: 89,
    anime: animeList[4],
    episode: animeList[4].episodes[2],
  },
  {
    id: "wh4",
    animeId: "a9",
    episodeId: "a9-ep-8",
    progress: 45,
    anime: animeList[8],
    episode: animeList[8].episodes[7],
  },
];

export const mockUser: UserProfile = {
  id: "u1",
  username: "ShadowBlade99",
  email: "shadow@mugenkai.dev",
  avatarUrl: IMG.samurai,
  bio: "Just a wanderer seeking the next great story.",
  role: "ADMIN",
  preferredGenres: ["Action", "Fantasy", "Sci-Fi"],
  watchHistory: continueWatching,
  favorites: [animeList[0], animeList[2], mangaList[0], mangaList[3]],
};

export const allGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
  "Historical",
  "Mecha",
  "Psychological",
  "Cyberpunk",
  "Samurai",
  "Space",
  "Tournament",
  "Philosophical",
  "Urban",
  "Epic",
  "Eco",
  "Art",
];
