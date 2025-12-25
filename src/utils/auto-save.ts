import { useEffect, useRef, useCallback } from "react";
import { logger } from "./logger";

/**
 * Auto-save form data to localStorage
 * Saves form state every 30 seconds or when user navigates away
 */
export function useAutoSave<T extends Record<string, any>>(
  key: string,
  data: T,
  enabled = true,
  intervalMs = 30000 // 30 seconds
) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedRef = useRef<string>("");

  const saveToStorage = useCallback(() => {
    if (!enabled) return;

    try {
      const dataString = JSON.stringify(data);
      
      // Only save if data has changed
      if (dataString === lastSavedRef.current) return;
      
      localStorage.setItem(key, dataString);
      lastSavedRef.current = dataString;
      logger.log(`Auto-saved form data to: ${key}`);
    } catch (error) {
      logger.error("Error saving form data:", error);
    }
  }, [key, data, enabled]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      saveToStorage();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [saveToStorage, intervalMs, enabled]);

  // Save on unmount (user navigates away)
  useEffect(() => {
    if (!enabled) return;

    return () => {
      saveToStorage();
    };
  }, [saveToStorage, enabled]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, 2000); // Save 2 seconds after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, saveToStorage, enabled]);

  return { saveNow: saveToStorage };
}

/**
 * Load saved form data from localStorage
 */
export function loadSavedFormData<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;

    const parsed = JSON.parse(saved);
    logger.log(`Loaded saved form data from: ${key}`);
    return parsed;
  } catch (error) {
    logger.error("Error loading saved form data:", error);
    return defaultValue;
  }
}

/**
 * Clear saved form data from localStorage
 */
export function clearSavedFormData(key: string): void {
  try {
    localStorage.removeItem(key);
    logger.log(`Cleared saved form data: ${key}`);
  } catch (error) {
    logger.error("Error clearing saved form data:", error);
  }
}

/**
 * Check if there's saved form data
 */
export function hasSavedFormData(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get timestamp of last save
 */
export function getLastSaveTime(key: string): Date | null {
  try {
    const timeKey = `${key}_timestamp`;
    const timestamp = localStorage.getItem(timeKey);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  } catch (error) {
    return null;
  }
}
