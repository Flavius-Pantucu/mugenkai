import React, { Suspense } from "react";
import { EmbedPageClient } from "@/components/player/embed-page-client";

interface PageProps {
  params: Promise<{
    anilistId: string;
    episode: string;
  }>;
}

export default async function AniEmbedDefaultAudioPage({ params }: PageProps) {
  const resolvedParams = await params;
  const anilistId = parseInt(resolvedParams.anilistId, 10);
  const episodeNumber = parseInt(resolvedParams.episode, 10) || 1;

  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <EmbedPageClient
        anilistId={anilistId}
        episodeNumber={episodeNumber}
        audio="sub"
      />
    </Suspense>
  );
}
