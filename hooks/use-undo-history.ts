import { useState, useCallback, useRef } from "react";

const MAX_HISTORY = 50;

export function useUndoHistory<T>(initial: T) {
  const [current, setCurrent] = useState<T>(initial);
  const historyRef = useRef<T[]>([]);

  const push = useCallback(
    (value: T) => {
      historyRef.current = [
        ...historyRef.current.slice(-(MAX_HISTORY - 1)),
        structuredClone(current),
      ];
      setCurrent(value);
    },
    [current]
  );

  const set = useCallback((value: T) => {
    setCurrent(value);
  }, []);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    historyRef.current = history.slice(0, -1);
    setCurrent(previous);
  }, []);

  const clear = useCallback(
    (resetTo: T) => {
      historyRef.current = [];
      setCurrent(resetTo);
    },
    []
  );

  const canUndo = historyRef.current.length > 0;

  return { current, push, set, undo, clear, canUndo };
}
