import CuisineFilter from './CuisineFilter';   // reuse the same UI

export default function NeighborhoodFilter({ options, value, onChange }) {
  return (
    <CuisineFilter
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}
