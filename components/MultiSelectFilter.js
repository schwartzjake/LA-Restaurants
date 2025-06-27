// components/MultiSelectFilter.js
import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  inputClassName = ''
}) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const boxRef           = useRef(null);

  /* outside-click closes dropdown */
  useEffect(() => {
    const h = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const menu = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o))
    .sort();

  const add    = item => { onChange([...value, item]); setQuery(''); };
  const remove = item => onChange(value.filter(v => v !== item));

  return (
    <div ref={boxRef} className="relative w-full md:w-auto">
      {/* chips + input */}
      <div className="flex flex-wrap items-center gap-2">
        {value.map(item => (
          <span
            key={item}
            onClick={() => remove(item)}
            className="cursor-pointer bg-white text-black px-2 py-0.5 text-xs font-semibold uppercase"
          >
            {item} &times;
          </span>
        ))}

        <input
          className={`min-w-[120px] flex-1 bg-transparent focus:outline-none ${inputClassName}`}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>

      {/* dropdown list – always black-on-white */}
      {open && menu.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto
                       rounded border border-gray-400 bg-white text-black shadow-lg">
          {menu.map(item => (
            <li
              key={item}
              onClick={() => { add(item); setOpen(false); }}
              className="cursor-pointer px-3 py-1 hover:bg-gray-200 text-sm uppercase"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
