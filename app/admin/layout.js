import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import AdminNavigation from "../../components/AdminNavigation";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <AdminNavigation />
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title"><span>Workspace</span><strong>Administrasi toko</strong></div>
          <Link href="/account" className="admin-account-chip"><span className="admin-account-avatar"><ShieldCheck size={17} /></span><span><strong>Administrator</strong><small>Panel pengelolaan</small></span></Link>
        </header>
        {children}
      </main>
    </div>
  );
}
