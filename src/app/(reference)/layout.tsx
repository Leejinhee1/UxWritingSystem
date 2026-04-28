import { Sidebar } from "@/components/Sidebar";

export default function ReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex-1 py-8 px-8 max-w-4xl">{children}</div>
    </div>
  );
}
