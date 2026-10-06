import type { Metadata } from "next";
import { AuthForm } from "@/components/admin/AuthForm";
export const metadata: Metadata = {
  title: "Superadmin login | Govinda Lamsal",
  robots: { index: false, follow: false },
};
export default function Login() {
  return <AuthForm />;
}
