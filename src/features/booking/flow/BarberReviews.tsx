import { useAppT } from "@/app/i18n";
import { Rating } from "@/components/forms";
import { Heading, Text } from "@/components/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { useBarberReviewsQuery } from "../queries";
import { useBookingFlow } from "./BookingContext";

/**
 * Las últimas reseñas del barbero: solo de clientes que vinieron (una por cita), con su nombre y
 * la inicial del apellido. Da confianza antes de elegirlo.
 */
export function BarberReviews({ barberId, rating }: { barberId: string; rating: number }) {
  const t = useAppT();
  const { fmt } = useBookingFlow();
  const query = useBarberReviewsQuery(barberId);
  const items = query.data?.items ?? [];

  if (query.isLoading) return <Skeleton className="h-28 rounded-2xl" />;
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <Heading level={6}>{t("booking.barber.reviewsTitle")}</Heading>
        <Text size="xs" tone="muted">
          {t("booking.barber.reviewsAll", { count: query.data?.total ?? items.length })}
        </Text>
      </div>
      <div className="flex items-center gap-2">
        <Text size="lg" weight="semibold" tabular>
          {rating.toFixed(1)}
        </Text>
        <Rating value={Math.round(rating * 2) / 2} allowHalf readOnly size="sm" aria-label={`${rating.toFixed(1)} / 5`} />
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
        {items.map((review) => (
          <li key={review.id} className="flex flex-col gap-1 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <Text size="sm" weight="medium">
                {review.clientName}
              </Text>
              <Text size="xs" tone="muted">
                {fmt.dayShort(new Date(review.createdAt))}
              </Text>
            </div>
            <Rating value={review.rating} readOnly size="sm" aria-label={`${review.rating} / 5`} />
            {review.comment && (
              <Text size="sm" tone="secondary">
                {review.comment}
              </Text>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
