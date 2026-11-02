import type { User } from "@/lib/types";

type NavUserProps = {
  user: User;
  onLogout: () => void;
  variant: "desktop" | "mobile";
};

/** Avatar initial, name, role and the logout button. */
export default function NavUser({ user, onLogout, variant }: NavUserProps) {
  const mobile = variant === "mobile";

  const info = (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d4af6a]/40 bg-[#d4af6a]/10 text-sm font-bold text-[#e7cb91]">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold text-[#f3efe6] ${mobile ? "" : "max-w-[130px]"}`}>
          {user.name}
        </p>
        <p className="text-xs capitalize text-[#f3efe6]/50">{user.role}</p>
      </div>
    </div>
  );

  const button = (
    <button
      type="button"
      onClick={onLogout}
      className={`whitespace-nowrap rounded-full border border-white/15 px-4 text-sm font-semibold text-[#f3efe6]/75 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 ${
        mobile ? "w-full py-3" : "py-2.5"
      }`}
    >
      Logout
    </button>
  );

  if (mobile) {
    return (
      <div className="flex flex-col gap-4">
        {info}
        {button}
      </div>
    );
  }

  return (
    <>
      {info}
      {button}
    </>
  );
}
