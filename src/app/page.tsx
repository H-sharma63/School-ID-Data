"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LandingNavbar from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ProductTour } from "@/components/landing/ProductTour";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import LoginModal from "@/components/LoginModal";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Redirect signed-in users to dashboard - only once
  useEffect(() => {
    if (status === "authenticated" && !hasRedirected) {
      setHasRedirected(true);
      router.push("/dashboard");
    }
  }, [session, status, router, hasRedirected]);

  // Show loading skeleton while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <LandingNavbar onLoginClick={() => setShowLogin(true)} />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="space-y-6 max-w-2xl animate-pulse">
            <div className="h-16 w-48 bg-muted rounded-lg" />
            <div className="h-12 w-3/4 bg-muted rounded" />
            <div className="h-8 w-1/2 bg-muted rounded" />
            <div className="h-12 w-48 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, don't render (middleware will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar onLoginClick={() => setShowLogin(true)} />
      <main className="flex-1">
        <Hero onLoginClick={() => setShowLogin(true)} />
        <ProblemSection />
        <HowItWorks />
        <ProductTour />
        <FeatureGrid />
        <BeforeAfter />
        <FinalCTA onLoginClick={() => setShowLogin(true)} />
      </main>
      <Footer />
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}