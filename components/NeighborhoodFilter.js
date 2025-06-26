import CuisineFilter from './CuisineFilter';

export default function NeighborhoodFilter({ options, value, onChange }) {
  return (
    <CuisineFilter
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Pick a neighborhood"
    />
  );
}
