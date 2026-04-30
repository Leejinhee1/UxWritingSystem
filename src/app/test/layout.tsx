import { TestSidebar } from "@/components/TestSidebar";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <TestSidebar />
      <div className="flex-1 py-8 px-8 max-w-4xl">{children}</div>
    </div>
  );
}
