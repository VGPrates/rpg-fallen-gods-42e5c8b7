import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  /** Render the value as a typeable number input instead of static text. */
  editable?: boolean;
  ariaLabel: string;
  onChange?: (value: number) => void;
};

/**
 * Shared tactile number control for attributes, vitals, modifiers and GM
 * corrections. It keeps a hidden form value so it can be dropped into native
 * forms without changing their submit behavior.
 */
export function ValueStepper({
  name,
  value,
  defaultValue = 0,
  min = 0,
  max = 9999,
  step = 1,
  disabled,
  required,
  compact,
  ariaLabel,
  onChange,
}: Props) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value : internal;
  const [delta, setDelta] = useState<number | null>(null);
  const [pulse, setPulse] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const update = (next: number) => {
    const bounded = Math.max(min, Math.min(max, Math.trunc(next)));
    if (bounded === current) return;
    const change = bounded - current;
    if (!controlled) setInternal(bounded);
    onChange?.(bounded);
    setDelta(change);
    setPulse((x) => x + 1);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setDelta(null), 480);
  };

  return (
    <span className={cn("value-stepper", compact && "scale-[0.92] origin-right")} data-value-stepper="">
      {name ? <input type="hidden" name={name} value={current} required={required} /> : null}
      <button
        type="button"
        className="value-stepper__button"
        disabled={disabled || current <= min}
        onClick={() => update(current - step)}
        aria-label={`Diminuir ${ariaLabel}`}
        data-testid={`button-decrease-${name ?? ariaLabel}`}
      >
        <Minus className="size-3.5" strokeWidth={2.2} />
      </button>
      <span key={pulse} className={cn("value-stepper__value", pulse > 0 && "is-changing")} aria-live="polite">
        {current}
        {delta !== null ? (
          <span className={cn("value-stepper__delta", delta < 0 && "is-negative")}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        className="value-stepper__button"
        disabled={disabled || current >= max}
        onClick={() => update(current + step)}
        aria-label={`Aumentar ${ariaLabel}`}
        data-testid={`button-increase-${name ?? ariaLabel}`}
      >
        <Plus className="size-3.5" strokeWidth={2.2} />
      </button>
    </span>
  );
}