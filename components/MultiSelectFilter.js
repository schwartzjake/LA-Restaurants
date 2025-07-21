// MultiSelectFilter – dropdown chips with explicit light dropdown styling
// Used globally; default dropdown list is readable black-on-white.

import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  inputClassName = '',
}) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const h = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const menu = options
    .filter(o => o.toLowerCase().includes(query.toLowerCase()) && !value.includes(o))
    .sort();

  const add = item => {
  onChange([...value, item]);
  setQuery('');
  setOpen(true);
  setTimeout(() => {
    inputRef.current?.focus();
  }, 0); // ensure DOM update first
};
  const remove = item => onChange(value.filter(v => v !== item));

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    setOpen(false);
    return;
  }
  if (!open || menu.length === 0) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setHighlightedIndex((prev) => {
      const next = (prev + 1) % menu.length;
      const el = listRef.current?.children?.[next];
      el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      return next;
    });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setHighlightedIndex((prev) => {
      const next = (prev - 1 + menu.length) % menu.length;
      const el = listRef.current?.children?.[next];
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return next;
    });
  } 
 else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = menu[highlightedIndex];
      if (selected) {
        add(selected);
        const el = listRef.current?.children?.[highlightedIndex];
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={boxRef} className="relative w-full md:w-auto">
      {/* Chips + input */}
      <div className="flex flex-wrap items-center gap-2">
        {value.map(item => (
          <span
            key={item}
            onClick={() => remove(item)}
            className="cursor-pointer bg-white text-black px-2 py-0.5 text-xs font-semibold uppercase"
          >
            {item} ×
          </span>
        ))}
        <input
          ref={inputRef}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className={`min-w-[120px] flex-1 bg-transparent focus:outline-none ${inputClassName}`}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>

      {/* Dropdown list */}
      {open && menu.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-400 bg-white text-black shadow-lg">
          {menu.map((item, index) => (
            <li
              key={item}
              onMouseDown={(e) => {
                e.preventDefault();
                add(item);
              }}
              className={`cursor-pointer px-3 py-1 text-sm uppercase transition-colors duration-150 ${index === highlightedIndex ? 'bg-yellow-300 font-bold' : 'hover:bg-yellow-100'}`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
