import CarCard, { CarCardPill } from "@/app/components/CarCard";
import { postRecommendationEvent, recommendedBookingHref } from "@/lib/recommendation-events";
import type { Recommendation } from "@/lib/recommendation-types";

type Props = {
  recommendation: Recommendation;
  /** Ties the click/book events to the impressions the server logged; absent on older servers. */
  requestId?: string;
};

export default function RecommendationCard({ recommendation, requestId }: Props) {
  const { car, score, reasons, position } = recommendation;

  // Fire-and-forget: navigation never waits for the event.
  const logClick = requestId
    ? () => postRecommendationEvent({ request_id: requestId, car_id: car.id, event: "click", position })
    : undefined;
  const bookHref = requestId
    ? recommendedBookingHref(car.id, requestId, position)
    : `/bookings/create?car_id=${car.id}`;

  return (
    <CarCard
      car={car}
      badge={<CarCardPill>{position === 1 ? "Top match" : `Option ${position}`}</CarCardPill>}
      tag={<span title="Match score out of 100">{score}/100</span>}
      action={{ label: "Book this car", href: bookHref }}
      onNavigate={logClick}
    >
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#929a94]">Why this car</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#526057]">
          {reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true" className="text-[#9a783c]">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </CarCard>
  );
}
