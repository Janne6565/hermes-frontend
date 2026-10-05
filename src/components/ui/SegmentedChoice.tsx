import { cn } from '@/lib/utils';

/**
 * A segmented pick-one-of-few, shared by the new-rule and new-automation forms.
 *
 * A `<fieldset>` of hidden radios rather than a row of buttons: the browser then owns the
 * grouping, the "1 of 3" position, the selected state and arrow-key traversal, none of which a
 * button row can express. The label carries the whole visual, so it also carries the focus ring —
 * a hidden input's own outline would be drawn around nothing.
 */
export function SegmentedChoice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  renderLabel,
}: {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (next: T) => void;
  /** Display text for an option; the raw value when omitted. */
  readonly renderLabel?: (option: T) => string;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
      <legend className="p-0 text-[10.5px] tracking-wider text-ink-fainter uppercase">
        {legend}
      </legend>
      <div className="flex gap-1.5">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              'flex-1 cursor-pointer border py-1.5 text-center text-[11.5px]',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-amber',
              value === option
                ? 'border-amber-line text-amber'
                : 'border-line text-ink-faint hover:text-ink-dim',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {renderLabel ? renderLabel(option) : option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
