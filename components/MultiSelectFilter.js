// MultiSelectFilter – dropdown chips with explicit light dropdown styling
// Used globally; default dropdown list is readable black-on-white.

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  inputClassName = '',
  usePortal = false,
}) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [menuPlacement, setMenuPlacement] = useState({ top: 0, left: 0, width: 0, maxHeight: 240, render: false });
  const [portalEl, setPortalEl] = useState(null);
  const keyboardEngagedRef = useRef(false);

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

  useEffect(() => {
    if (!usePortal) return undefined;
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('div');
    el.className = 'multiselect-portal';
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [usePortal]);

  useLayoutEffect(() => {
    if (!usePortal || !open || !boxRef.current) return;

    const updatePlacement = () => {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewport = window.visualViewport;
      const viewportHeight = (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0);
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const padding = 12;
      const gap = 6;
      const availableBelow = Math.max(0, viewportHeight - rect.bottom - padding);
      const availableAbove = Math.max(0, rect.top - padding);
      const left = Math.min(rect.left, viewportWidth - rect.width - padding);
      const width = rect.width;

      const keyboardHeightThreshold = 40;
      const isKeyboardShowing = viewport ? viewport.height < window.innerHeight - keyboardHeightThreshold : false;
      keyboardEngagedRef.current = isKeyboardShowing;

      let top = rect.bottom + gap;
      let maxHeight = Math.min(360, Math.max(80, viewportHeight - padding - top));

      if (maxHeight <= 0) {
        top = Math.max(padding, viewportHeight - padding - 240);
        maxHeight = Math.min(360, Math.max(120, viewportHeight - padding - top));
      }

      setMenuPlacement({ top, left, width, maxHeight, render: true, drop: 'down' });
    };

    updatePlacement();

    const handler = () => updatePlacement();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    const viewport = window.visualViewport;
    const handleViewportResize = () => {
      keyboardEngagedRef.current = true;
      updatePlacement();
    };
    const handleViewportScroll = () => {
      keyboardEngagedRef.current = true;
      updatePlacement();
    };
    viewport?.addEventListener('resize', handleViewportResize);
    viewport?.addEventListener('scroll', handleViewportScroll);

    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
      viewport?.removeEventListener('resize', handleViewportResize);
      viewport?.removeEventListener('scroll', handleViewportScroll);
    };
  }, [usePortal, open, menu.length]);

  useEffect(() => {
    if (!usePortal) return;
    if (!open) {
      setMenuPlacement(prev => ({ ...prev, render: false }));
      keyboardEngagedRef.current = false;
    }
  }, [usePortal, open]);

  useEffect(() => {
    if (!usePortal || !open) return undefined;
    const handleScroll = () => {
      if (!keyboardEngagedRef.current) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { passive: true });
  }, [usePortal, open]);

  const add = item => {
    onChange([...value, item]);
    setQuery('');
    setOpen(true);
    keyboardEngagedRef.current = Boolean(window.visualViewport && window.visualViewport.height < window.innerHeight);
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
    } else if (e.key === 'Enter') {
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
          className={`min-w-[14rem] sm:min-w-[18rem] flex-1 bg-transparent focus:outline-none ${inputClassName}`}
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
      </div>

      {/* Dropdown list */}
      {!usePortal && open && menu.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-gray-400 bg-white text-black shadow-lg"
        >
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

      {usePortal && open && menu.length > 0 && menuPlacement.render && portalEl &&
        createPortal(
          <ul
            ref={listRef}
            style={{
              position: 'fixed',
              top: menuPlacement.top,
              left: menuPlacement.left,
              width: menuPlacement.width,
              maxHeight: menuPlacement.maxHeight,
              zIndex: 1300,
            }}
            className="mt-0 overflow-y-auto rounded border border-gray-400 bg-white text-black shadow-lg"
          >
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
          </ul>,
          portalEl
        )}
    </div>
  );
}
