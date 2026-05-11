"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  fallback = "/dashboard",
  label = "Kembali",
  className = "",
}) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm ${className}`}
    >
      <span>←</span>
      <span>{label}</span>
    </button>
  );
}