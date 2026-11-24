import SlidingSegment from '../SlidingSegment.jsx';

const RubberSegment = ({
  options = [],
  value,
  onChange,
  className = '',
  buttonClassName = '',
  activeTextClassName = 'text-white',
  inactiveTextClassName = 'text-muted hover:text-app',
  indicatorClassName = 'bg-indigo-600 shadow-md shadow-indigo-600/30',
  ariaLabel = 'Segmented choice'
}) => (
  <SlidingSegment
    options={options}
    value={value}
    onChange={onChange}
    ariaLabel={ariaLabel}
    buttonClassName={buttonClassName}
    activeTextClassName={activeTextClassName}
    inactiveTextClassName={inactiveTextClassName}
    indicatorClassName={indicatorClassName}
    className={`rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900 ${className}`}
  />
);

export { RubberSegment };
export default RubberSegment;
