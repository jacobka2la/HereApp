import { SearchIcon } from './AppIcons';

export default function SearchBar({ value, onChange }) {
  return (
    <label className="search-wrap">
      <span>Search Bars</span>
      <div className="search-field">
        <SearchIcon size={18} className="search-field-icon" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Rick's, Harper's, Dublin Square..."
        />
      </div>
    </label>
  );
}
