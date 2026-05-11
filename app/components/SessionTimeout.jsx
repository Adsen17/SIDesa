"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { popup } from "../../lib/popup";

const IDLE_LIMIT = 10 * 60 * 1000;

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef(null);

  useEffect(() => {
    if (pathname === "/login") return;

    const logoutUser = async () => {
      try {
        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("AUTO LOGOUT ERROR:", err);
      } finally {
        await popup.warning(
          "Sesi Berakhir",
          "Kamu logout otomatis karena tidak ada aktivitas selama 10 menit."
        );
        router.replace("/login");
      }
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        logoutUser();
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

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pathname, router]);

  return null;
}