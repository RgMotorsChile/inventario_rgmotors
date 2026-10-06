import { Shell } from "@/components/shell";
import { requireManagement } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireManagement();
  return (
    <Shell name={profile.full_name} role={profile.role}>
      {children}
    </Shell>
  );
}
