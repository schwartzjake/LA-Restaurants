/*
 * MultiSelectFilter
 * -----------------
 * A generic chip-based multi-select with an autocomplete dropdown.
 *
 * Props
 *   options     string[]          // full list of possible options
 *   value       string[]          // currently-selected chips
 *   onChange    (string[]) => {}  // parent setter
 *   placeholder string            // input placeholder (e.g. "Add cuisine…")
 */

import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Select…',
}) {
  /* ————— local state ————— */
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const boxRef = useRef(null);

  /* ————— close dropdown on outside click ————— */
  useEffect(() => {
    const handle = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  /* ————— derived dropdown list ————— */
  const menu = options
    .filter(
      (o) =>
        o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o)
    )
    .sort();

  /* ————— helpers ————— */
  const add    = (item) => { onChange([...value, item]); setQuery(''); };
  const remove = (item) => onChange(value.filter((v) => v !== item));

  /* ————— render ————— */
  return (
    <div ref={boxRef} className="relative w-full md:w-auto">
      {/* chips + input row */}
      <div className="flex flex-wrap items-center gap-2">
        {value.map((item) => (
          <span
            key={item}
            onClick={() => remove(item)}
            title="Click to remove"
            className="cursor-pointer rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-900"
          >
            {item} &times;
          </span>
        ))}

        <input
          className="min-w-[120px] flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>

      {/* dropdown */}
      {open && menu.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded border border-neutral-300 bg-white shadow">
          {menu.map((item) => (
            <li
              key={item}
              onClick={() => { add(item); setOpen(false); }}
              className="cursor-pointer px-3 py-1 hover:bg-emerald-50"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
