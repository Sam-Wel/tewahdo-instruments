import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Mezmur } from "@/lib/constants";

export function MezmurCard({ mezmur }: { mezmur: Mezmur }) {
  return (
    <details className="group rounded-xl border border-border bg-card open:border-primary/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="font-heading text-base font-semibold text-foreground">
          {mezmur.title}
        </span>
        <span className="flex flex-shrink-0 flex-wrap justify-end gap-1">
          {mezmur.topics.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
          <Badge variant="secondary">{mezmur.language}</Badge>
          <Badge variant="secondary">{mezmur.speed}</Badge>
          <Badge variant="secondary">{mezmur.length}</Badge>
        </span>
      </summary>
      <div className="border-t border-border px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {mezmur.lyrics}
        </p>
        {mezmur.media_url && (
          <a
            href={mezmur.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Watch / Listen
          </a>
        )}
      </div>
    </details>
  );
}
