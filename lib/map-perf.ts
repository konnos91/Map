export function startFpsTracker() {
  let frameCount = 0;
  let lastUpdate = performance.now();
  let rafId = 0;

  const tick = (now: number) => {
    frameCount++;
    if (now - lastUpdate >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastUpdate));
      const el = document.getElementById("fps-display");
      if (el) el.textContent = String(fps);
      frameCount = 0;
      lastUpdate = now;
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

export function throttle(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, ms);
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return throttled;
}
