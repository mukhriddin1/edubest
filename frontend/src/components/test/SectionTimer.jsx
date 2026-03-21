import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function SectionTimer({ totalSeconds, sectionStartTime, onTimeUp }) {
  const [remaining, setRemaining] = useState(() => {
    if (!sectionStartTime) return totalSeconds;
    const elapsed = Math.floor((Date.now() - sectionStartTime) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });
  const calledRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0 && !calledRef.current) {
      calledRef.current = true;
      onTimeUp?.();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !calledRef.current) {
          calledRef.current = true;
          clearInterval(timer);
          onTimeUp?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 300 && remaining > 60; // last 5 min
  const isCritical = remaining <= 60; // last 1 min
  const progress = remaining / totalSeconds;

  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors',
      isCritical ? 'bg-red-500/20 text-red-400 animate-pulse' :
      isWarning ? 'bg-amber-500/20 text-amber-400' :
      'bg-slate-800 text-slate-200'
    )}>
      {/* Circular mini-progress */}
      <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 -rotate-90">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="2" />
        <motion.circle
          cx="10" cy="10" r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 8}`}
          animate={{ strokeDashoffset: `${2 * Math.PI * 8 * (1 - progress)}` }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
