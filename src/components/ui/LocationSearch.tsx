import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({ value, onChange, placeholder, className }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = async (text: string) => {
    if (!text || text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=en&format=json`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // Pass raw text up so form has it even if they don't click
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      search(val);
    }, 400);
  };

  const selectItem = (item: any) => {
    const name = `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}, ${item.country}`;
    setQuery(name);
    onChange(name);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder || "Search city..."}
          className={className || "w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20 pr-10"}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-secondary animate-spin" />
          </div>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-container-low border ghost-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => selectItem(r)}
              className="p-3 hover:bg-surface-container cursor-pointer flex items-center gap-2 text-sm border-b last:border-0 border-outline-variant/30"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-on-surface">{r.name}</div>
                <div className="text-xs text-secondary">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
