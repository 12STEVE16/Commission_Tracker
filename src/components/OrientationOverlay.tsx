// components/OrientationOverlay.tsx
"use client";

import React, { useEffect, useState } from "react";

export default function OrientationOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  const checkOrientation = () => {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    setShowOverlay(isPortrait);
  };

  useEffect(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white text-center px-6">
      <div className="text-2xl font-semibold mb-4">
        Please Rotate Your Device
      </div>
      <div className="text-lg">
        This application is best viewed in landscape mode.
      </div>
    </div>
  );
}
