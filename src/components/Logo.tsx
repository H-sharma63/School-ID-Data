"use client";

import { useEffect, useState } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = "" }: LogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <img
      src={isDark ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="School ID Extractor"
      width={size}
      height={size}
      className={`${className} transition-opacity duration-120 block`}
      decoding="async"
    />
  );
}