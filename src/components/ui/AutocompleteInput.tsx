import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Check } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  fetchSuggestions: (query: string) => Promise<string[]>;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function AutocompleteInput({ value, onChange, fetchSuggestions, placeholder, className, icon, disabled }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const timeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const doSearch = async (text: string) => {
    if (!text || text.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const results = await fetchSuggestions(text);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    onChange(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      doSearch(val);
    }, 300);
  };

  const selectItem = (item: string) => {
    setQuery(item);
    setSelected(true);
    onChange(item);
    setIsOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0 && query.length > 0) {
      setIsOpen(true);
    } else if (query.length >= 1) {
      doSearch(query);
    }
  };

  // Highlight matching portion of text
  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary font-bold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || "Start typing..."}
          disabled={disabled}
          className={className || "w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20 pr-10"}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="w-4 h-4 text-secondary animate-spin" />}
          {selected && !loading && <Check className="w-4 h-4 text-emerald-500" />}
          {!selected && !loading && (icon || <Search className="w-4 h-4 text-secondary/50" />)}
        </div>
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-container-low border ghost-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((item, i) => (
            <div
              key={i}
              onMouseDown={() => selectItem(item)}
              className="px-4 py-2.5 hover:bg-surface-container cursor-pointer flex items-center justify-between text-sm border-b last:border-0 border-outline-variant/30 transition-colors"
            >
              <span className="text-on-surface">{highlight(item, query)}</span>
              {item.toLowerCase() === query.toLowerCase() && (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
