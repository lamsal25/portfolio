import type { Metadata } from "next";
import { AuthForm } from "@/components/admin/AuthForm";
export const metadata: Metadata = {
  title: "Activate superadmin | Govinda Lamsal",
  robots: { index: false, follow: false },
};
export default function Setup() {
  return <AuthForm setup />;
}
