CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "SearchEntry" (
    "id" INTEGER NOT NULL,
    "kind" "SeriesKind" NOT NULL,
    "title" TEXT NOT NULL,
    "altTitle" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "format" TEXT,
    "year" INTEGER,
    "count" INTEGER,
    "rating" DOUBLE PRECISION NOT NULL,
    "popularity" INTEGER NOT NULL,

    CONSTRAINT "SearchEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SearchEntry_kind_popularity_idx" ON "SearchEntry"("kind", "popularity" DESC);
CREATE INDEX "SearchEntry_terms_trgm_idx" ON "SearchEntry" USING GIN ("terms" gin_trgm_ops);
