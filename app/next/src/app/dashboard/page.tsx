import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/Dashboard";
export const metadata: Metadata = {
  title: "Portfolio dashboard | Govinda Lamsal",
  robots: { index: false, follow: false },
};
export default function Admin() {
  return <Dashboard />;
}
