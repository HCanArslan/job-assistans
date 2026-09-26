"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const isDarkSnapshot = () => document.documentElement.classList.contains("dark");
const serverSnapshot = () => false;

/** Reads the current theme from <html class="dark"> without effects. */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, isDarkSnapshot, serverSnapshot);
}
