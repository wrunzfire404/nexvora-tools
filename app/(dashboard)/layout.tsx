import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileNav />

      {/* Main content area */}
      <div className="md:pl-64">
        <Header />
        <main className="p-4 md:p-6 pt-16 md:pt-6">
          <AnnouncementBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
