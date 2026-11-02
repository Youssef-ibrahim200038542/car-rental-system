"use client";

import { useState } from "react";
import Link from "next/link";
import type { Car } from "@/lib/types";
import { AdminPage } from "../_components/AdminPage";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { ListPanel } from "../_components/ListPanel";
import { PageHeader } from "../_components/PageHeader";
import { RefreshButton } from "../_components/RefreshButton";
import { SearchFilterBar } from "../_components/SearchFilterBar";
import { StatCard, StatGrid } from "../_components/StatCard";
import {
  ClearFiltersButton,
  EmptyState,
  ErrorAlert,
  ErrorState,
  LoadingState,
} from "../_components/states";
import { useAdminCars, useAdminStats } from "../_lib/resources";
import { buttonClass } from "../_lib/ui";
import { CarsTable } from "./_components/CarsTable";
import { carName, carStatusOptions, filterCars } from "./_lib/car-list";

const BACK = { href: "/admin", label: "Back to Dashboard" };

export default function AdminCarsPage() {
  const cars = useAdminCars();
  const stats = useAdminStats();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Car | null>(null);

  if (cars.loading) {
    return <LoadingState message="Loading your vehicle fleet..." />;
  }

  if (cars.loadError) {
    return (
      <ErrorState
        title="Unable to load cars"
        message={cars.loadError}
        onRetry={cars.reload}
        retrying={cars.refreshing}
        back={BACK}
      />
    );
  }

  const filteredCars = filterCars(cars.items, search, statusFilter);
  const availableCars = cars.items.filter((car) => car.status === "available").length;
  // Bookings no longer flip a car to rented, so "in use" comes from booking counts.
  const bookingCounts = stats.data?.bookings;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await cars.remove(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <AdminPage>
      <PageHeader
        back={BACK}
        eyebrow="Fleet Management"
        title="Manage Cars"
        description="Manage your vehicles, monitor availability, and keep your fleet organized."
        actions={
          <>
            <RefreshButton onClick={cars.reload} refreshing={cars.refreshing} />
            <Link href="/admin/cars/create" className={buttonClass.create}>
              <span className="text-lg leading-none">+</span>
              Add New Car
            </Link>
          </>
        }
      />

      <ErrorAlert message={cars.actionError} onDismiss={() => cars.setActionError("")} />

      <StatGrid columns={3}>
        <StatCard
          label="Total Vehicles"
          value={cars.items.length}
          detail="Registered in your fleet"
          icon="fleet"
        />
        <StatCard
          label="Available"
          value={availableCars}
          detail="Fleet status set to available"
          icon="checkCircle"
          tone="success"
        />
        <StatCard
          label="In Use Now"
          value={bookingCounts ? bookingCounts.active : "—"}
          detail={
            bookingCounts
              ? `Active bookings · ${bookingCounts.confirmed} upcoming`
              : "Booking counts unavailable"
          }
          icon="calendar"
          tone="gold"
        />
      </StatGrid>

      <ListPanel
        title="Vehicle Inventory"
        shown={filteredCars.length}
        total={cars.items.length}
        noun="vehicles"
        footerNote="DriveX Fleet Management"
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search vehicles..."
            searchLabel="Search vehicles"
            filters={[
              {
                label: "Filter by status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: carStatusOptions(cars.items),
              },
            ]}
          />
        }
      >
        {cars.items.length === 0 ? (
          <EmptyState
            icon="fleet"
            title="Your fleet is empty"
            message="Add your first vehicle to start building your rental fleet."
            action={
              <Link href="/admin/cars/create" className={buttonClass.primary}>
                <span>+</span>
                Add Your First Car
              </Link>
            }
          />
        ) : filteredCars.length === 0 ? (
          <EmptyState
            icon="search"
            title="No vehicles found"
            message="Try changing your search or status filter to find a vehicle."
            action={<ClearFiltersButton onClick={clearFilters} />}
          />
        ) : (
          <CarsTable
            cars={filteredCars}
            deletingId={cars.deletingId}
            onDelete={setPendingDelete}
          />
        )}
      </ListPanel>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this car?"
        message={`${pendingDelete ? carName(pendingDelete) : "This car"} will be removed from the fleet. This action cannot be undone.`}
        busy={cars.deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPage>
  );
}
