import { useState, useEffect, memo } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';

export const ScrambleText = memo(function ScrambleText({
  text,
  startDelay = 0,
  duration = 700,
  className,
  style,
}: {
  text: string;
  startDelay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [output, setOutput] = useState(() =>
    text.replace(/[^\s/\\.-]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
  );

  useEffect(() => {
    let alive = true;
    const outer = setTimeout(() => {
      if (!alive) return;
      const t0 = Date.now();
      const id = setInterval(() => {
        if (!alive) {
          clearInterval(id);
          return;
        }
        const p = Math.min((Date.now() - t0) / duration, 1);
        const locked = Math.floor(p * text.length);
        setOutput(
          text
            .split('')
            .map((ch, i) =>
              i < locked || ch === ' ' || ch === '/' || ch === '-'
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join('')
        );
        if (p >= 1) {
          setOutput(text);
          clearInterval(id);
        }
      }, 40);
    }, startDelay);
    return () => {
      alive = false;
      clearTimeout(outer);
    };
  }, [text, startDelay, duration]);

  return (
    <span className={className} style={style}>
      {output}
    </span>
  );
});
