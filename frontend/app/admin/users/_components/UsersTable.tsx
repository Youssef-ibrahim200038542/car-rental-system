import Link from "next/link";
import type { User } from "@/lib/types";
import { DataRow, DataTable } from "../../_components/DataTable";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatDate, initial } from "../../_lib/format";
import { cellClass, rowActionClass } from "../../_lib/ui";

export function UsersTable({
  users,
  deletingId,
  onDelete,
}: {
  users: User[];
  deletingId: number | null;
  onDelete: (user: User) => void;
}) {
  return (
    <DataTable
      columns={["User", "Phone", "Role", "Bookings", "Joined", "Actions"]}
      minWidth="min-w-[950px]"
    >
      {users.map((user) => (
        <DataRow key={user.id}>
          <td className={cellClass}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e7dcc4] bg-[#f3ead7] font-bold text-[#806331]">
                {initial(user.name)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#0a1411]">{user.name}</p>
                <p className="mt-1 text-sm text-[#73786f]">{user.email}</p>
                <p className="mt-1 text-xs text-[#85867c]">ID #{user.id}</p>
              </div>
            </div>
          </td>
          <td className={`${cellClass} text-sm text-[#59645c]`}>{user.phone || "—"}</td>
          <td className={cellClass}>
            <StatusBadge kind="role" status={user.role ?? "customer"} />
          </td>
          <td className={cellClass}>
            <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-[#edf1e9] px-2.5 py-1.5 text-sm font-bold text-[#34443b]">
              {user.bookings_count ?? 0}
            </span>
          </td>
          <td className={`${cellClass} text-sm text-[#73786f]`}>{formatDate(user.created_at)}</td>
          <td className={cellClass}>
            <div className="flex items-center justify-end gap-2">
              <Link href={`/admin/users/edit/${user.id}`} className={rowActionClass.edit}>
                Edit
              </Link>
              <button
                type="button"
                onClick={() => onDelete(user)}
                disabled={deletingId !== null}
                className={rowActionClass.delete}
              >
                {deletingId === user.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </td>
        </DataRow>
      ))}
    </DataTable>
  );
}
