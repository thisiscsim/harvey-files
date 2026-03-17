"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/assistant");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4">
          <img src="/harvey-avatar.svg" alt="Harvey" className="w-8 h-8" />
        </div>
        <p className="text-fg-muted text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
