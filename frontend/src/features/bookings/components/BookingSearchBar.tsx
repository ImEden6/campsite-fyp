/**
 * BookingSearchBar Component
 * Search functionality for bookings
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input, Button } from '@/components/ui';

export interface BookingSearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

const BookingSearchBar: React.FC<BookingSearchBarProps> = ({
  onSearch,
  placeholder = 'Search by guest name, booking ID, or site number...',
  defaultValue = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          icon={<Search className="w-4 h-4" />}
          className="pr-10"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
};

export default BookingSearchBar;
