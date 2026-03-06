import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { AnimePage } from "./pages/AnimePage";
import { MangaPage } from "./pages/MangaPage";
import { AnimeDetailsPage } from "./pages/AnimeDetailsPage";
import { MangaDetailsPage } from "./pages/MangaDetailsPage";
import { WatchPage } from "./pages/WatchPage";
import { ReadPage } from "./pages/ReadPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "home", Component: HomePage },
      { path: "anime", Component: AnimePage },
      { path: "manga", Component: MangaPage },
      { path: "anime/:id", Component: AnimeDetailsPage },
      { path: "manga/:id", Component: MangaDetailsPage },
      { path: "watch/:animeId/:episodeId", Component: WatchPage },
      { path: "read/:mangaId/:chapterId", Component: ReadPage },
      { path: "profile", Component: ProfilePage },
      { path: "admin", Component: AdminPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);