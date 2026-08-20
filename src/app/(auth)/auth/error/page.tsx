"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error");

    useEffect(() => {
        // Redirect to landing page with error
        router.push(`/?error=${encodeURIComponent(error || "Authentication failed")}`);
    }, [router, error]);

    return null;
}

export default function AuthError() {
    return (
        <Suspense fallback={null}>
            <AuthErrorContent />
        </Suspense>
    );
}