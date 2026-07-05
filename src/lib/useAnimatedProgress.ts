"use client";

import { useEffect, useState } from "react";

const ease = (x: number) => 1 - Math.pow(1 - x, 3);

/** Returns an eased 0->1 progress value that animates once on mount (or when `trigger` changes). */
export function useAnimatedProgress(duration = 1400, trigger: unknown = true) {
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    setP(0);
    const t0 = performance.now();
    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / duration);
      setP(ease(x));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
     
  }, [duration, trigger]);

  return p;
}
