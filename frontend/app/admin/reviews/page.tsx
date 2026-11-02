"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { AdminPage } from "../_components/AdminPage";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { ListPanel } from "../_components/ListPanel";
import { PageHeader } from "../_components/PageHeader";
import { RefreshButton } from "../_components/RefreshButton";
import { SearchFilterBar } from "../_components/SearchFilterBar";
import { StatCard, StatGrid, StatUnit } from "../_components/StatCard";
import {
  ClearFiltersButton,
  EmptyState,
  ErrorAlert,
  ErrorState,
  LoadingState,
} from "../_components/states";
import { useAdminReviews } from "../_lib/resources";
import { ReviewCard, reviewCarName } from "./_components/ReviewCard";

const BACK = { href: "/admin", label: "Back to Dashboard" };

const RATING_OPTIONS = [
  { value: "all", label: "All ratings" },
  ...[5, 4, 3, 2, 1].map((stars) => ({
    value: String(stars),
    label: stars === 1 ? "1 star" : `${stars} stars`,
  })),
];

function filterReviews(reviews: Review[], search: string, rating: string): Review[] {
  const query = search.trim().toLowerCase();

  return reviews.filter((review) => {
    const matchesSearch =
      !query ||
      (review.user?.name || "").toLowerCase().includes(query) ||
      (review.user?.email || "").toLowerCase().includes(query) ||
      reviewCarName(review).toLowerCase().includes(query) ||
      String(review.id).includes(query) ||
      String(review.booking_id).includes(query);

    return matchesSearch && (rating === "all" || Number(review.rating) === Number(rating));
  });
}

export default function AdminReviewsPage() {
  const reviews = useAdminReviews();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);

  if (reviews.loading) {
    return <LoadingState message="Loading customer reviews..." />;
  }

  if (reviews.loadError) {
    return (
      <ErrorState
        title="Unable to load reviews"
        message={reviews.loadError}
        onRetry={reviews.reload}
        retrying={reviews.refreshing}
        back={BACK}
      />
    );
  }

  const all = reviews.items;
  const filteredReviews = filterReviews(all, search, ratingFilter);
  const ratingTotal = all.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = all.length ? (ratingTotal / all.length).toFixed(1) : "—";
  const atLeast = (stars: number) => all.filter((review) => Number(review.rating) >= stars).length;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await reviews.remove(pendingDelete.id);
    setPendingDelete(null);
  };

  const clearFilters = () => {
    setSearch("");
    setRatingFilter("all");
  };

  return (
    <AdminPage>
      <PageHeader
        back={BACK}
        eyebrow="Customer Experience"
        title="Customer Reviews"
        description="Review customer feedback, monitor vehicle ratings, and manage reviews across your fleet."
        actions={<RefreshButton onClick={reviews.reload} refreshing={reviews.refreshing} />}
      />

      <ErrorAlert message={reviews.actionError} onDismiss={() => reviews.setActionError("")} />

      <StatGrid>
        <StatCard label="Total Reviews" value={all.length} detail="Customer submissions" icon="receipt" />
        <StatCard
          label="Average Rating"
          value={
            <>
              {averageRating}
              <StatUnit>/ 5</StatUnit>
            </>
          }
          detail="Across all reviews"
          icon="star"
        />
        <StatCard
          label="5-Star Reviews"
          value={atLeast(5)}
          detail="Excellent experiences"
          icon="star"
          tone="success"
        />
        <StatCard
          label="4+ Star Reviews"
          value={atLeast(4)}
          detail="Positive feedback"
          icon="checkCircle"
          tone="gold"
        />
      </StatGrid>

      <ListPanel
        title="Review Management"
        shown={filteredReviews.length}
        total={all.length}
        noun="reviews"
        footerNote="DriveX Admin · Customer Feedback"
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search customer, car, ID..."
            searchLabel="Search reviews"
            filters={[
              {
                label: "Filter by rating",
                value: ratingFilter,
                onChange: setRatingFilter,
                options: RATING_OPTIONS,
              },
            ]}
          />
        }
      >
        {all.length === 0 ? (
          <EmptyState
            icon="star"
            title="No Reviews Yet"
            message="Customer reviews will appear here once customers submit feedback about their rental experience."
          />
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching reviews"
            message="Try another search term or rating."
            action={<ClearFiltersButton onClick={clearFilters} />}
          />
        ) : (
          <div className="divide-y divide-[#eeeae2]">
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                deleting={reviews.deletingId === review.id}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </ListPanel>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this review?"
        message="The review will be removed from the car's page. This action cannot be undone."
        busy={reviews.deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPage>
  );
}
