import { useState, useRef, useCallback, useEffect } from 'react';
import { RetouchSettings } from '../types/retouch';

const MAX_HISTORY_LIMIT = 40;
const DEBOUNCE_TIME_MS = 350;

export function useRetouchHistory(initialSettings: RetouchSettings) {
  const [past, setPast] = useState<RetouchSettings[]>([]);
  const [present, setPresent] = useState<RetouchSettings>(initialSettings);
  const [future, setFuture] = useState<RetouchSettings[]>([]);

  // Ref to track last committed baseline state before a series of continuous adjustments (e.g. slider drags)
  const baselineRef = useRef<RetouchSettings>(initialSettings);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep baseline updated if present changes via undo/redo
  const isUndoRedoActionRef = useRef<boolean>(false);

  /**
   * Update settings with intelligent history management.
   * If `immediate` is true (e.g., button clicks, preset selection, toggles),
   * the previous state is immediately pushed to the history stack.
   * If `immediate` is false (e.g., slider drags), changes are debounced so only
   * one snapshot is recorded per gesture rather than 50 micro-steps.
   */
  const updateSettings = useCallback(
    (newSettings: RetouchSettings | ((prev: RetouchSettings) => RetouchSettings), immediate: boolean = false) => {
      setPresent((current) => {
        const next = typeof newSettings === 'function' ? newSettings(current) : newSettings;

        // Skip if identical
        if (JSON.stringify(current) === JSON.stringify(next)) {
          return current;
        }

        if (immediate) {
          // Cancel any pending debounced commit
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }

          // Push current state to past stack
          setPast((p) => [...p.slice(-MAX_HISTORY_LIMIT + 1), current]);
          setFuture([]); // clear redo stack on new action
          baselineRef.current = next;
        } else {
          // Debounced commit for continuous sliders
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(() => {
            setPast((p) => [...p.slice(-MAX_HISTORY_LIMIT + 1), baselineRef.current]);
            setFuture([]);
            baselineRef.current = next;
            debounceTimerRef.current = null;
          }, DEBOUNCE_TIME_MS);
        }

        return next;
      });
    },
    []
  );

  /**
   * Undo to previous state
   */
  const undo = useCallback((): boolean => {
    // Cancel any pending debounced change
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    let success = false;
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setPresent((currentPresent) => {
        setFuture((prevFuture) => [currentPresent, ...prevFuture]);
        baselineRef.current = previous;
        return previous;
      });

      success = true;
      return newPast;
    });

    return success;
  }, []);

  /**
   * Redo to next state
   */
  const redo = useCallback((): boolean => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    let success = false;
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPresent((currentPresent) => {
        setPast((prevPast) => [...prevPast.slice(-MAX_HISTORY_LIMIT + 1), currentPresent]);
        baselineRef.current = next;
        return next;
      });

      success = true;
      return newFuture;
    });

    return success;
  }, []);

  /**
   * Reset everything to clean initial state
   */
  const resetTo = useCallback((newInitial: RetouchSettings) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setPast((p) => [...p.slice(-MAX_HISTORY_LIMIT + 1), baselineRef.current]);
    setFuture([]);
    setPresent(newInitial);
    baselineRef.current = newInitial;
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    settings: present,
    updateSettings,
    undo,
    redo,
    canUndo,
    canRedo,
    historyDepth: past.length,
    futureDepth: future.length,
    resetTo,
  };
}
