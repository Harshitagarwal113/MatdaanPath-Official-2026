"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackPageView } from "@/lib/google-services";

export default function AppAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    void trackPageView(pathname || "/");
  }, [pathname]);

  return null;
}
