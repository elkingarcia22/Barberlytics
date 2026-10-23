import * as React from "react";
import { useLocation, useNavigate } from "react-router";
import { CommentLayer, CommentsPanel, CommentsProvider, useComments, type CommentThread } from "@/components/comments";
import { SidePanelShell } from "@/components/overlays";
import { ReviewerNameDialog } from "@/features/booking/comments/ReviewerNameDialog";
import { useReviewer, useSharedComments } from "@/features/booking/comments/useSharedComments";
import { locateCommentPoint } from "@/lib/comments/locate";
import { isPlatformThread, platformContextOf, PLATFORM_CONTEXT_PREFIX } from "@/lib/comments/scope";

/** La ruta en que se dejó un hilo: la de su ubicación o, si no la trae, la de su vista. */
const routeOf = (thread: CommentThread): string | undefined => thread.location?.route ?? thread.context?.slice(PLATFORM_CONTEXT_PREFIX.length);

const locate = (point: { x: number; y: number }) => locateCommentPoint(point);

/**
 * Los comentarios de revisión en toda la plataforma, los mismos de la reserva en línea: el botón
 * va en la cabecera, se comenta haciendo clic en cualquier punto de una pantalla y cada comentario
 * queda en la hoja con dónde se dejó (ruta, módulo, sección y elemento). Los pins de cada pantalla
 * solo salen en ella; el panel lleva a la de cada comentario.
 *
 * Firma con su nombre quien comenta, no la cuenta con la que entró: en la demo todos entran con la
 * misma. Se pide la primera vez que se abren los comentarios (el mismo diálogo de la reserva) y queda
 * guardado en el navegador; no se vuelve a pedir. El atajo «C» solo funciona con el panel abierto: en
 * el resto de la app la letra es de cada pantalla.
 */
export function PlatformCommentsProvider({ pageLabel, children }: { pageLabel?: string; children: React.ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const { author, isAsking, askName, saveName } = useReviewer();
  const { threads, onThreadsChange } = useSharedComments(author, { include: isPlatformThread });
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) askName();
  };

  return (
    <CommentsProvider
      currentUser={author}
      threads={threads}
      onThreadsChange={onThreadsChange}
      context={platformContextOf(`${location.pathname}${location.search}`)}
      contextLabel={pageLabel}
      open={open}
      onOpenChange={changeOpen}
      shortcuts={open}
    >
      {children}
      <ReviewerNameDialog open={isAsking} onSubmit={saveName} />
    </CommentsProvider>
  );
}

/** Envuelve la pantalla: los pins se clavan sobre ella y viajan con su scroll. */
export function PlatformCommentLayer({ children }: { children: React.ReactNode }) {
  return (
    <CommentLayer className="flex h-full min-h-0 flex-1 flex-col" locate={locate}>
      {children}
    </CommentLayer>
  );
}

/** El panel con la lista y cada hilo, al lado de la pantalla: empuja el contenido, no lo tapa. */
export function PlatformCommentsPanel() {
  const navigate = useNavigate();
  const { open, setOpen } = useComments();
  const goTo = (thread: CommentThread) => {
    const route = routeOf(thread);
    if (route) navigate(route);
  };
  return (
    <SidePanelShell open={open} onOpenChange={setOpen} showCloseButton={false} disablePadding>
      {/* El panel trae su cabecera (título, «Comentar», cerrar): el del costado solo le da sitio. */}
      <CommentsPanel onNavigate={goTo} className="static inset-auto z-auto h-full w-full border-0 md:w-full md:border-l-0" />
    </SidePanelShell>
  );
}
