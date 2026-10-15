import SlidingSegment from '../SlidingSegment.jsx';

const RubberSegment = ({
  options = [],
  value,
  onChange,
  className = '',
  ariaLabel = 'Segmented choice'
}) => (
  <SlidingSegment
    options={options}
    value={value}
    onChange={onChange}
    ariaLabel={ariaLabel}
    className={`rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${className}`}
  />
);

export { RubberSegment };
export default RubberSegment;
