"use client";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#081225]">
      <div className="flex flex-col items-center gap-5">
        {/* Animated spinner */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-violet-500 [animation-direction:reverse] [animation-duration:0.6s]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">Memuat data...</p>
          <p className="mt-1 text-xs text-slate-500">Mohon tunggu sebentar</p>
        </div>
      </div>
    </div>
  );
}
