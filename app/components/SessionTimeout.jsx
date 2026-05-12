"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { popup } from "../../lib/popup";

const IDLE_LIMIT = 10 * 60 * 1000; // 10 menit

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef(null);
  const isLoggingOut = useRef(false);

  const logoutUser = useCallback(async (reason = "idle") => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("AUTO LOGOUT ERROR:", err);
    } finally {
      if (reason === "idle") {
        await popup.warning(
          "Sesi Berakhir",
          "Kamu logout otomatis karena tidak ada aktivitas selama 10 menit."
        );
      } else if (reason === "expired") {
        await popup.warning(
          "Sesi Kedaluwarsa",
          "Token sesi sudah kedaluwarsa. Silakan login kembali."
        );
      }
      router.replace("/login");
      isLoggingOut.current = false;
    }
  }, [router]);

  // Validasi sesi saat halaman pertama kali load atau user kembali ke tab
  const validateSession = useCallback(async () => {
    if (pathname === "/login") return;

    try {
      const res = await fetch("/api/me", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        logoutUser("expired");
      }
    } catch {
      // Network error, jangan logout — mungkin offline
    }
  }, [pathname, logoutUser]);

  useEffect(() => {
    if (pathname === "/login") return;

    // Validasi sesi saat pertama kali mount
    validateSession();

    // Cek saat user kembali ke tab (dari tab lain atau setelah lock screen)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        validateSession();
        resetTimer();
      }
    };

    // Idle timeout
    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        logoutUser("idle");
      }, IDLE_LIMIT);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, logoutUser, validateSession]);

  return null;
}