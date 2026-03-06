import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, ChevronLeft, List
} from "lucide-react";
import { animeList } from "../data/mock-data";

export function WatchPage() {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();
  const anime = animeList.find((a) => a.id === animeId);
  const episode = anime?.episodes.find((e) => e.id === episodeId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    hideControlsAfterDelay();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, hideControlsAfterDelay]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return p + 0.05;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!anime || !episode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400">Episode not found</p>
      </div>
    );
  }

  const currentEpIndex = anime.episodes.findIndex((e) => e.id === episode.id);
  const prevEp = currentEpIndex > 0 ? anime.episodes[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex < anime.episodes.length - 1 ? anime.episodes[currentEpIndex + 1] : null;

  const formatTime = (pct: number, total: number) => {
    const seconds = Math.floor((pct / 100) * total * 60);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div
        ref={playerRef}
        className="relative flex-1 flex items-center justify-center bg-black cursor-pointer select-none"
        onMouseMove={hideControlsAfterDelay}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        <img
          src={anime.bannerImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: isPlaying ? "brightness(0.6)" : "brightness(0.4)" }}
        />

        {!isPlaying && (
          <div className="relative z-10 p-6 bg-purple-600/80 backdrop-blur-sm rounded-full shadow-2xl shadow-purple-500/40">
            <Play size={48} fill="white" className="text-white ml-1" />
          </div>
        )}

        <div
          className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none transition-opacity duration-300"
          style={{ opacity: showControls ? 1 : 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-auto bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/anime/${anime.id}`); }}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white truncate" style={{ fontSize: "16px", fontWeight: 600 }}>
                {anime.title}
              </p>
              <p className="text-zinc-400" style={{ fontSize: "13px" }}>
                Episode {episode.episodeNumber} - {episode.title}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEpisodeList(!showEpisodeList); }}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <List size={22} />
            </button>
          </div>

          <div className="pointer-events-auto bg-gradient-to-t from-black/80 to-transparent p-4 space-y-3">
            <div className="relative group/bar">
              <div
                className="w-full h-1 group-hover/bar:h-2 bg-white/20 rounded-full cursor-pointer transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((e.clientX - rect.left) / rect.width) * 100;
                  setProgress(Math.max(0, Math.min(100, pct)));
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {prevEp && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/watch/${anime.id}/${prevEp.id}`); setProgress(0); }}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <SkipBack size={20} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                  className="p-2 text-white hover:scale-110 transition-transform"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" className="ml-0.5" />}
                </button>
                {nextEp && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/watch/${anime.id}/${nextEp.id}`); setProgress(0); }}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <SkipForward size={20} />
                  </button>
                )}

                <div className="flex items-center gap-2 group/vol">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={muted ? 0 : volume}
                      onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 h-1 accent-purple-500"
                    />
                  </div>
                </div>

                <span className="text-white/50 hidden sm:block" style={{ fontSize: "13px" }}>
                  {formatTime(progress, episode.duration)} / {episode.duration}:00
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showEpisodeList && (
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-[#0f0f14]/95 backdrop-blur-xl z-30 overflow-y-auto border-l border-purple-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between sticky top-0 bg-[#0f0f14]/95 backdrop-blur-xl">
              <h3 className="text-white" style={{ fontSize: "15px", fontWeight: 600 }}>Episodes</h3>
              <button onClick={() => setShowEpisodeList(false)} className="text-zinc-500 hover:text-white">
                &times;
              </button>
            </div>
            <div className="p-2">
              {anime.episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    navigate(`/watch/${anime.id}/${ep.id}`);
                    setProgress(0);
                    setShowEpisodeList(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    ep.id === episode.id
                      ? "bg-purple-500/20 border border-purple-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                      ep.id === episode.id ? "bg-purple-500 text-white" : "bg-white/5 text-zinc-400"
                    }`}
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    {ep.episodeNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate ${ep.id === episode.id ? "text-purple-300" : "text-zinc-300"}`}
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      {ep.title}
                    </p>
                    <p className="text-zinc-600" style={{ fontSize: "11px" }}>{ep.duration}m</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {nextEp && (
        <div className="bg-[#0f0f14] border-t border-purple-500/10 p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-500" style={{ fontSize: "12px" }}>UP NEXT</p>
            <p className="text-white" style={{ fontSize: "14px", fontWeight: 500 }}>
              Episode {nextEp.episodeNumber} - {nextEp.title}
            </p>
          </div>
          <button
            onClick={() => { navigate(`/watch/${anime.id}/${nextEp.id}`); setProgress(0); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <Play size={14} fill="white" /> Play Next
          </button>
        </div>
      )}
    </div>
  );
}
