"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import IntroPage from "@/features/intro/intro-animation";

export const HomeNavbar = () => {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <>
      {showIntro && (
        <div className="fixed inset-0 z-50">
          <IntroPage />
        </div>
      )}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="NodeSpace Logo" width={32} height={32} />
          <span className="text-xl font-bold">NodeSpace</span>
        </div>
        <div>
          <Button onClick={() => setShowIntro(true)}>Create Workflow</Button>
        </div>
      </nav>
    </>
  );
};
