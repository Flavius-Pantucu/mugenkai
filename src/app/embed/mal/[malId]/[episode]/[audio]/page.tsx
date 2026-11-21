import React, { Suspense } from "react";
import { EmbedPageClient } from "@/components/player/embed-page-client";

interface PageProps {
  params: Promise<{
    malId: string;
    episode: string;
    audio: string;
  }>;
}

export default async function MalEmbedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const malId = parseInt(resolvedParams.malId, 10);
  const episodeNumber = parseInt(resolvedParams.episode, 10) || 1;
  const audio = resolvedParams.audio?.toLowerCase() === "dub" ? "dub" : "sub";

  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <EmbedPageClient
        malId={malId}
        episodeNumber={episodeNumber}
        audio={audio}
      />
    </Suspense>
  );
}
