'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import type { Pin } from '@/lib/types';

interface SearchModalProps {
  pins: Pin[];
  onSelectPin: (pinId: string) => void;
}

export default function SearchModal({ pins, onSelectPin }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Pin[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }

      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }

      // Arrow key navigation
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            onSelectPin(selected.id);
            setIsOpen(false);
            setSearchQuery('');
            setSelectedIndex(0);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelectPin]);

  // Filter pins based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pins.filter(
      (pin) =>
        pin.name.ko?.toLowerCase().includes(query) ||
        pin.description?.ko?.toLowerCase().includes(query)
    );

    setResults(filtered.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [searchQuery, pins]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-white border border-gray-300 rounded-lg hover:border-gray-400"
        title="Cmd+K (Mac) or Ctrl+K (Windows)"
      >
        🔍 검색...
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <span className="text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="탐방 장소 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm"
            autoFocus
          />
          <span className="text-xs text-gray-400">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && searchQuery ? (
            <div className="p-4 text-center text-sm text-gray-500">결과가 없습니다</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              탐방 장소를 검색하세요
            </div>
          ) : (
            results.map((pin, idx) => (
              <button
                key={pin.id}
                onClick={() => {
                  onSelectPin(pin.id);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className={`w-full px-4 py-3 text-left border-b last:border-b-0 text-sm transition ${
                  selectedIndex === idx
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{pin.name.ko}</div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {pin.description?.ko}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
          <span>↑↓ 이동</span>
          <span>Enter 선택</span>
        </div>
      </div>
    </>
  );
}
