'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Category {
  id: string;
  name: string;
  isCustom: boolean;
}

interface CategoryAutocompleteProps {
  label?: string;
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  required?: boolean;
}

export function CategoryAutocomplete({
  label = 'Category',
  value,
  onChange,
  error,
  required = false,
}: CategoryAutocompleteProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find((c) => c.id === value);
      setSelectedCategory(category || null);
      setSearchTerm(category?.name || '');
    }
  }, [value, categories]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expenses/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomCategory = async (name: string) => {
    try {
      setCreating(true);
      const response = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      onChange(newCategory.id);
      setSelectedCategory(newCategory);
      setSearchTerm(newCategory.name);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectCategory = (category: Category) => {
    onChange(category.id);
    setSelectedCategory(category);
    setSearchTerm(category.name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm && filteredCategories.length === 0) {
      e.preventDefault();
      createCustomCategory(searchTerm);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-900 mb-1">
        {label}
        {required && <span className="text-red-700">*</span>}
      </label>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search or create category..."
        required={required}
        disabled={creating}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-700' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      {creating && <p className="mt-1 text-sm text-gray-600">Creating category...</p>}

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-600 text-sm">Loading categories...</div>
          ) : filteredCategories.length > 0 ? (
            <>
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                >
                  <span className="text-gray-900">{category.name}</span>
                  {category.isCustom && (
                    <span className="text-xs text-gray-600 italic">Custom</span>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-gray-600">
              {searchTerm ? (
                <div>
                  <p className="text-sm">No categories found.</p>
                  <p className="text-xs mt-1">Press Enter to create &quot;{searchTerm}&quot;</p>
                </div>
              ) : (
                <p className="text-sm">Start typing to search or create a category...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
