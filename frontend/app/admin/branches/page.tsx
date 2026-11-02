"use client";

import { useState } from "react";
import Link from "next/link";
import type { Branch } from "@/lib/types";
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
import { useAdminBranches } from "../_lib/resources";
import { buttonClass } from "../_lib/ui";
import { BranchCard } from "./_components/BranchCard";

const BACK = { href: "/admin", label: "Back to Dashboard" };

function filterBranches(branches: Branch[], search: string): Branch[] {
  const query = search.trim().toLowerCase();
  if (!query) return branches;

  return branches.filter((branch) =>
    [branch.name, branch.address, branch.city, branch.phone, String(branch.id)].some(
      (value) => value?.toLowerCase().includes(query)
    )
  );
}

export default function AdminBranchesPage() {
  const branches = useAdminBranches();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);

  if (branches.loading) {
    return <LoadingState message="Loading branches..." />;
  }

  if (branches.loadError) {
    return (
      <ErrorState
        title="Unable to load branches"
        message={branches.loadError}
        onRetry={branches.reload}
        retrying={branches.refreshing}
        back={BACK}
      />
    );
  }

  const filteredBranches = filterBranches(branches.items, search);
  const cityCount = new Set(
    branches.items.map((branch) => branch.city?.trim().toLowerCase()).filter(Boolean)
  ).size;
  const hasBranches = branches.items.length > 0;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await branches.remove(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <AdminPage>
      <PageHeader
        back={BACK}
        eyebrow="Location Management"
        title="Manage Branches"
        description="Manage your rental locations and keep your branch information organized in one place."
        actions={
          <>
            <RefreshButton onClick={branches.reload} refreshing={branches.refreshing} />
            <Link href="/admin/branches/create" className={buttonClass.create}>
              <span className="text-lg leading-none">+</span>
              Add New Branch
            </Link>
          </>
        }
      />

      <ErrorAlert
        message={branches.actionError}
        onDismiss={() => branches.setActionError("")}
      />

      <StatGrid columns={3}>
        <StatCard
          label="Total Branches"
          value={branches.items.length}
          detail="Registered rental locations"
          icon="branch"
        />
        <StatCard
          label="Cities Covered"
          value={cityCount}
          detail="Unique cities with branches"
          icon="pin"
        />
        <StatCard
          label="Branch Management"
          value={hasBranches ? "Up to date" : "Ready to set up"}
          detail={
            hasBranches ? "Your branch records are available" : "Add your first rental location"
          }
          icon="checkCircle"
          tone="sage"
        />
      </StatGrid>

      <ListPanel
        title="All Branches"
        shown={filteredBranches.length}
        total={branches.items.length}
        noun="branches"
        footerNote="DriveX Branch Management · Keep your rental locations organized."
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search branches..."
            searchLabel="Search branches"
          />
        }
      >
        {!hasBranches ? (
          <EmptyState
            icon="branch"
            title="No branches yet"
            message="Get started by adding your first rental branch to DriveX."
            action={
              <Link href="/admin/branches/create" className={buttonClass.primary}>
                + Add Your First Branch
              </Link>
            }
          />
        ) : filteredBranches.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching branches"
            message="Try another search term or check the branch name, city, or phone number."
            action={<ClearFiltersButton onClick={() => setSearch("")} />}
          />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3">
            {filteredBranches.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                deleting={branches.deletingId === branch.id}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </ListPanel>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this branch?"
        message={`${pendingDelete?.name ?? "This branch"} will be removed. This action cannot be undone.`}
        busy={branches.deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPage>
  );
}
