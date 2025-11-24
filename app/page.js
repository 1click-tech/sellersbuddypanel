"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      router.replace("/board"); 
    } else {
      router.replace("/login"); 
    }
  }, [router]);

  return <div className="text-center mt-20">Redirecting...</div>;
}
