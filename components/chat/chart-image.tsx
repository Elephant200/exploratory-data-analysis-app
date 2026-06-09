"use client";

/* eslint-disable @next/next/no-img-element -- charts are dynamic data URLs */
export function ChartImage({ src, alt }: { src: string; alt?: string }) {
  return (
    <figure className="animate-rise my-4 overflow-hidden rounded-lg border border-ink-border bg-white/[0.97] p-2">
      <img
        src={src}
        alt={alt ?? "Generated chart"}
        className="mx-auto h-auto max-w-full rounded"
      />
    </figure>
  );
}
