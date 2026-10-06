import type { Metadata } from "next";
import { SiteProvider } from "@/components/ui/SiteProvider";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://govinda-lamsal.higgsfield.app"),
  alternates: { canonical: "/" },
  title: "Govinda Lamsal | Cloud Solution Architect & Developer",
  description:
    "Cloud Solution Architect at TekBay Academy. AWS and NVIDIA certified. Full-stack development, cloud architecture and data-driven solutions.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Govinda Lamsal",
    description: "Cloud architecture, full-stack development and data science.",
    type: "website",
    url: "https://govinda-lamsal.higgsfield.app",
    images: [
      "https://d8j0ntlcm91z4.cloudfront.net/user_3BIuHQuHui5xGsLp7N7veDoqy3R/hf_20261002_085800_a1bbdcca-4b16-47f1-8a50-af837458525d.png",
    ],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteProvider>{children}</SiteProvider>
      </body>
    </html>
  );
}
