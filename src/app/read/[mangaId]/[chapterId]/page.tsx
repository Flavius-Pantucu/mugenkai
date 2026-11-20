import { notFound } from "next/navigation";
import { getChapterPages, getManga } from "@/server/catalog";
import { ReadPage } from "@/views/ReadPage";

export default async function Page({ params }: { params: Promise<{ mangaId: string; chapterId: string }> }) {
  const { mangaId, chapterId } = await params;
  const manga = await getManga(mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  if (!manga || !chapter) notFound();
  return <ReadPage manga={manga} chapter={chapter} pages={await getChapterPages(manga, chapter)} />;
}
