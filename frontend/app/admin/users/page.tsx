"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
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
import { useAdminUsers } from "../_lib/resources";
import { UsersTable } from "./_components/UsersTable";

const BACK = { href: "/admin", label: "Back to Dashboard" };

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customers" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Administrators" },
];

function filterUsers(users: User[], search: string, role: string): User[] {
  const query = search.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      String(user.id).includes(query) ||
      (user.phone || "").toLowerCase().includes(query);

    return matchesSearch && (role === "all" || user.role === role);
  });
}

export default function AdminUsersPage() {
  const users = useAdminUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);

  if (users.loading) {
    return <LoadingState message="Loading users..." />;
  }

  if (users.loadError) {
    return (
      <ErrorState
        title="Unable to load users"
        message={users.loadError}
        onRetry={users.reload}
        retrying={users.refreshing}
        back={BACK}
      />
    );
  }

  const countRole = (role: User["role"]) =>
    users.items.filter((user) => user.role === role).length;
  const adminCount = countRole("admin");
  const filteredUsers = filterUsers(users.items, search, roleFilter);

  const requestDelete = (user: User) => {
    if (user.role === "admin" && adminCount <= 1) {
      users.setActionError("The only administrator cannot be deleted.");
      return;
    }
    setPendingDelete(user);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await users.remove(pendingDelete.id);
    setPendingDelete(null);
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  return (
    <AdminPage>
      <PageHeader
        back={BACK}
        eyebrow="User Management"
        title="Manage Users"
        description="Manage customer accounts, staff members, and administrators from one place."
        actions={
          <RefreshButton
            onClick={users.reload}
            refreshing={users.refreshing}
            label="Refresh Users"
          />
        }
      />

      <ErrorAlert message={users.actionError} onDismiss={() => users.setActionError("")} />

      <StatGrid>
        <StatCard label="Total Users" value={users.items.length} detail="Registered accounts" icon="users" />
        <StatCard
          label="Customers"
          value={countRole("customer")}
          detail="Rental customers"
          icon="user"
          tone="success"
        />
        <StatCard
          label="Staff"
          value={countRole("staff")}
          detail="Operational team"
          icon="wrench"
          tone="sage"
        />
        <StatCard
          label="Administrators"
          value={adminCount}
          detail="Users with admin role"
          icon="shield"
          tone="gold"
        />
      </StatGrid>

      <ListPanel
        title="All Users"
        shown={filteredUsers.length}
        total={users.items.length}
        noun="accounts"
        footerNote="DriveX Admin · User Management"
        filters={
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search name, email, phone..."
            searchLabel="Search users"
            filters={[
              {
                label: "Filter users by role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: ROLE_OPTIONS,
              },
            ]}
          />
        }
      >
        {users.items.length === 0 ? (
          <EmptyState
            icon="users"
            title="No Users Found"
            message="Registered users will appear here."
          />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching users"
            message="Try a different search term or role."
            action={<ClearFiltersButton onClick={clearFilters} />}
          />
        ) : (
          <UsersTable
            users={filteredUsers}
            deletingId={users.deletingId}
            onDelete={requestDelete}
          />
        )}
      </ListPanel>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this user?"
        message={`${pendingDelete?.name ?? "This user"} will lose access to DriveX. This action cannot be undone.`}
        busy={users.deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPage>
  );
}
