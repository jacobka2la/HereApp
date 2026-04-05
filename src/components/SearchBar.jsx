export default function SearchBar({ value, onChange }) {
  return (
    <label className="search-wrap">
      <span>Search bars</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Rick's, Harper's, Dublin Square..."
      />
    </label>
  );
}
