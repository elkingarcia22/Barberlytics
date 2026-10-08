import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Text } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ThemaIcon } from "@/icons";
import { cn } from "@/lib/utils";

interface GalleryViewerProps {
  photos: readonly string[];
  /** Con qué foto se abre; `null` lo mantiene cerrado. */
  index: number | null;
  /** A quién pertenece la galería: titula y describe cada foto. */
  title: string;
  onClose: () => void;
}

/**
 * La galería a pantalla completa: la foto ocupa el dispositivo, se pasa con
 * el dedo (o con las flechas y el teclado), muestra en cuál va y deja saltar
 * a otra con las miniaturas. Se abre dentro de la reserva, no de la ventana.
 */
export function GalleryViewer({ photos, index, title, onClose }: GalleryViewerProps) {
  const t = useAppT();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const isOpen = index !== null;

  React.useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  // Al abrir, directo a la foto que se tocó.
  React.useEffect(() => {
    if (api && index !== null) api.scrollTo(index, true);
  }, [api, index]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") api?.scrollPrev();
    if (event.key === "ArrowRight") api?.scrollNext();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        className="left-0 top-0 flex h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-black p-0 text-white ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{t("booking.gallery.hint")}</DialogDescription>

        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <Text size="sm" tabular className="text-white/80">
            {t("booking.gallery.count", { current: current + 1, total: photos.length })}
          </Text>
          <Button type="button" variant="ghost" size="icon-sm" className="text-white hover:bg-white/15" onClick={onClose} aria-label={t("booking.gallery.close")}>
            <ThemaIcon name="close" />
          </Button>
        </div>

        <Carousel setApi={setApi} opts={{ startIndex: index ?? 0, loop: photos.length > 2 }} className="min-h-0 flex-1" aria-label={title}>
          <CarouselContent className="ml-0 h-full" containerClassName="h-full">
            {photos.map((src, position) => (
              <CarouselItem key={src} className="flex h-full items-center justify-center pl-0" aria-label={t("booking.gallery.photo", { current: position + 1, total: photos.length })}>
                <img src={src} alt={`${title} · ${position + 1}`} className="max-h-full max-w-full object-contain" draggable={false} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {photos.length > 1 && (
            <>
              <Button type="button" variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-white/20" onClick={() => api?.scrollPrev()} aria-label={t("booking.gallery.previous")}>
                <ThemaIcon name="chevronLeft" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-white/20" onClick={() => api?.scrollNext()} aria-label={t("booking.gallery.next")}>
                <ThemaIcon name="chevronRight" />
              </Button>
            </>
          )}
        </Carousel>

        {photos.length > 1 && (
          <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]" role="tablist" aria-label={title}>
            {photos.map((src, position) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={position === current}
                aria-label={t("booking.gallery.photo", { current: position + 1, total: photos.length })}
                onClick={() => api?.scrollTo(position)}
                className={cn(
                  "size-12 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                  position === current ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <img src={src} alt="" className="size-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
