"use client";

import { useState } from "react";
import type { Payment, PaymentStatus } from "@/lib/types";
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
import { formatAmount } from "../_lib/format";
import { useAdminPayments } from "../_lib/resources";
import { useWorkspace } from "../_lib/useWorkspace";
import { PaymentsTable } from "./_components/PaymentsTable";
import {
  METHOD_OPTIONS,
  STATUS_OPTIONS,
  filterPayments,
  statusChangeCopy,
} from "./_lib/payment-list";

type PendingChange = { payment: Payment; status: PaymentStatus };

export default function AdminPaymentsPage() {
  const payments = useAdminPayments();
  const workspace = useWorkspace();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const back = { href: workspace.dashboardHref, label: "Back to Dashboard" };

  if (payments.loading) {
    return <LoadingState message="Loading payment records..." />;
  }

  if (payments.loadError) {
    return (
      <ErrorState
        title="Unable to load payments"
        message={payments.loadError}
        onRetry={payments.reload}
        retrying={payments.refreshing}
        back={back}
      />
    );
  }

  const all = payments.items;
  const filteredPayments = filterPayments(all, search, statusFilter, methodFilter);
  const withStatus = (status: PaymentStatus) =>
    all.filter((payment) => payment.payment_status === status);
  const paidPayments = withStatus("paid");
  const revenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const changeCopy = pendingChange && statusChangeCopy(pendingChange.payment, pendingChange.status);

  const confirmChange = async () => {
    if (!pendingChange) return;
    await payments.updateStatus(pendingChange.payment, pendingChange.status);
    setPendingChange(null);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
  };

  return (
    <AdminPage>
      <PageHeader
        back={back}
        eyebrow="Finance Overview"
        title="Manage Payments"
        description="Track transactions, review payment statuses, and monitor collected revenue."
        actions={
          <RefreshButton
            onClick={payments.reload}
            refreshing={payments.refreshing}
            label="Refresh Payments"
          />
        }
      />

      <ErrorAlert message={payments.actionError} onDismiss={() => payments.setActionError("")} />

      <StatGrid>
        <StatCard label="Total Payments" value={all.length} detail="All recorded transactions" icon="receipt" />
        <StatCard
          label="Successful Payments"
          value={paidPayments.length}
          detail="Transactions marked as paid"
          icon="checkCircle"
          tone="success"
        />
        <StatCard
          label="Pending Payments"
          value={withStatus("pending").length}
          detail="Awaiting payment confirmation"
          icon="clock"
          tone="gold"
        />
        <StatCard
          label="Total Revenue"
          value={
            <>
              {formatAmount(revenue)}
              <StatUnit>EGP</StatUnit>
            </>
          }
          detail="Sum of payments marked as paid"
          icon="revenue"
        />
      </StatGrid>

      <ListPanel
        title="Payment Transactions"
        shown={filteredPayments.length}
        total={all.length}
        noun="payments"
        footerNote="DriveX · Payment Management"
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search customer, booking..."
            searchLabel="Search payments"
            filters={[
              {
                label: "Filter payment status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_OPTIONS,
              },
              {
                label: "Filter payment method",
                value: methodFilter,
                onChange: setMethodFilter,
                options: METHOD_OPTIONS,
              },
            ]}
          />
        }
      >
        {all.length === 0 ? (
          <EmptyState
            icon="card"
            title="No payments yet"
            message="Payment records will appear here when transactions are created."
          />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon="search"
            title="No payments found"
            message="Try another search term or change the payment filters."
            action={<ClearFiltersButton onClick={clearFilters} />}
          />
        ) : (
          <PaymentsTable
            payments={filteredPayments}
            updatingId={payments.updatingId}
            onRequestChange={(payment, status) => setPendingChange({ payment, status })}
          />
        )}
      </ListPanel>

      <ConfirmDialog
        open={pendingChange !== null}
        title={changeCopy?.title ?? "Change payment status?"}
        message={changeCopy?.message ?? ""}
        confirmLabel={changeCopy?.confirm ?? "Confirm"}
        busyLabel="Saving..."
        destructive={pendingChange?.status !== "paid"}
        busy={payments.updatingId !== null}
        onConfirm={() => void confirmChange()}
        onCancel={() => setPendingChange(null)}
      />
    </AdminPage>
  );
}
