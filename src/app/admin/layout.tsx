import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function AdminWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <AdminSidebar />
      <div className="flex-1 py-8 px-8 max-w-4xl">{children}</div>
    </div>
  );
}
