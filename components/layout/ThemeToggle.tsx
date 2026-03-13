"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "object-echo-theme";

function readIsDark() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains("dark");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => setIsDark(readIsDark());

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("object-echo-themechange", syncTheme as EventListener);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("object-echo-themechange", syncTheme as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !readIsDark();
    document.body.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem(STORAGE_KEY, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event("object-echo-themechange"));
    setIsDark(nextIsDark);
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark theme">
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-thumb ${isDark ? "is-dark" : "is-light"}`} />
      </span>
      <span className="theme-toggle-label">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
