"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The old professor portal is replaced by the case library and designer. */
export default function LegacyCasesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/cases'); }, [router]);
  return null;
}
