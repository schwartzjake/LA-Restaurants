/**
 * Generic chip-style multi-select with optional autocomplete.
 *
 * Props
 * ──────────────────────────────
 * options     string[]          Full list to choose from
 * value       string[]          Currently-selected chips
 * onChange    (string[])        Lifted state setter
 * placeholder string           Input placeholder
 */
import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({ options, value, onChange, placeholder }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  /* list shown in dropdown */
  const menu = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o));

  /* event helpers */
  const add    = item => { onChange([...value, item]); setQuery(''); };
  const remove = item => onChange(value.filter(v => v !== item));

  return (
    <div ref={boxRef} className="relative w-full md:w-auto">
      {/* chips + input row */}
      <div className="flex flex-wrap gap-2">
        {value.map(item => (
          <span key={item} onClick={() => remove(item)}
                className="pill cursor-pointer">
            {item} &times;
          </span>
        ))}
        <input
          className="input flex-1 min-w-[120px]"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>

      {/* dropdown */}
      {open && menu.length > 0 && (
        <ul className="dropdown">
          {menu.map(item => (
            <li key={item} onClick={() => { add(item); setOpen(false); }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Tailwind shortcuts (via @apply in globals.css or a module)
--------------------------------------------------------------
.pill      { @apply rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-900; }
.input     { @apply rounded border border-neutral-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none; }
.dropdown  { @apply absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-neutral-300 bg-white shadow; }
*/
