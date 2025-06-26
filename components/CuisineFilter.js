import { useState, useRef, useEffect } from 'react';

/**
 * A pill-based multi-select with a dropdown.
 * Props:
 *  - options   : string[]          (all possible cuisines)
 *  - value     : string[]          (currently selected cuisines)
 *  - onChange  : (string[]) => {}  (lifted state)
 */
export default function CuisineFilter({ options, value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const boxRef            = useRef(null);

  /* --------- close on outside click --------- */
  useEffect(() => {
    const h = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  /* --------- derive menu items --------- */
  const menu = options
    .filter(o =>
      o.toLowerCase().includes(query.toLowerCase()) &&
      !value.includes(o)
    );

  /* --------- helpers --------- */
  const add    = c => { onChange([...value, c]); setQuery(''); };
  const remove = c => onChange(value.filter(v => v !== c));

  return (
    <div ref={boxRef} className="relative">
      {/* pill row + input */}
      <div className="flex flex-wrap gap-2">
        {value.map(c => (
          <span
            key={c}
            onClick={() => remove(c)}
            className="cursor-pointer rounded-full bg-emerald-100 px-2 py-0.5 text-sm text-emerald-900"
          >
            {c} &times;
          </span>
        ))}

        <input
          className="min-w-[120px] flex-1 rounded border border-neutral-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
          placeholder="Add cuisine…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>

      {/* dropdown */}
      {open && menu.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded border border-neutral-300 bg-white shadow">
          {menu.map(c => (
            <li
              key={c}
              onClick={() => { add(c); setOpen(false); }}
              className="cursor-pointer px-3 py-1 hover:bg-emerald-50"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
