"use client";

import React from "react";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
}

export function ContentRow({ title, subtitle, href, children }: ContentRowProps) {
  return (
    <Carousel opts={{ align: "start", slidesToScroll: "auto" }} className="mx-auto w-[90%]" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span
            className="text-white"
            style={{ fontFamily: "var(--font-family-heading)", fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)", fontWeight: 700 }}
          >
            {title}
          </span>
          {subtitle && <span className="text-[13px] font-normal text-muted-foreground">{subtitle}</span>}
        </h2>

        <div className="flex shrink-0 items-center gap-1">
          {href && (
            <Link
              href={href}
              className="mr-2 text-[13px] font-medium text-lagoon-300 underline-offset-4 transition-colors hover:text-lagoon-200 hover:underline"
            >
              See all
            </Link>
          )}
          <div className="hidden items-center gap-1 sm:flex">
            <CarouselPrevious variant="ghost" className="static size-8 translate-y-0 disabled:opacity-30" />
            <CarouselNext variant="ghost" className="static size-8 translate-y-0 disabled:opacity-30" />
          </div>
        </div>
      </div>

      <CarouselContent className="-ml-3 pb-1 sm:-ml-4">
        {React.Children.map(children, (child) => (
          <CarouselItem className="basis-auto pl-3 sm:pl-4">{child}</CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
