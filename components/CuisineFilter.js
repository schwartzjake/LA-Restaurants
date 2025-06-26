import { useState, useRef, useEffect } from 'react';

/**
 * Props
 * ───────────────────────────────────────────
 * allCuisines : string[]             // every unique cuisine in the data
 * selected    : string[]             // currently-chosen cuisines
 * onChange    : (string[]) => void   // callback when selection changes
 */
export default function CuisineFilter({ allCuisines, selected, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]  = useState(false);
  const boxRef           = useRef(null);

  /* ---------- derived: suggestions that start with / include query ---------- */
  const suggestions = allCuisines
    .filter(c =>
      c.toLowerCase().includes(query.toLowerCase()) && !selected.includes(c)
    )
    .slice(0, 10); // keep list short

  /* ---------- helpers ---------- */
  const add    = c => { onChange([...selected, c]); setQuery(''); };
  const remove = c => onChange(selected.filter(x => x !== c));

  /* ---------- close dropdown if user clicks outside ---------- */
  useEffect(() => {
    const handle = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  return (
    <div ref={boxRef} style={{ position: 'relative', marginBottom: '1rem' }}>
      {/* Tag chips + input */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {selected.map(c => (
          <span
            key={c}
            onClick={() => remove(c)}
            style={{
              background: '#eee',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            title="Click to remove"
          >
            {c} ✕
          </span>
        ))}

        <input
          type="text"
          placeholder="Type or pick cuisine"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{ flex: '1 0 150px', minWidth: 120, padding: 6 }}
        />
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            position: 'absolute',
            zIndex: 10,
            background: '#fff',
            border: '1px solid #ccc',
            maxHeight: 180,
            overflowY: 'auto',
            width: '100%'
          }}
        >
          {suggestions.map(c => (
            <li
              key={c}
              onClick={() => { add(c); setOpen(false); }}
              style={{ padding: '6px 10px', cursor: 'pointer' }}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
