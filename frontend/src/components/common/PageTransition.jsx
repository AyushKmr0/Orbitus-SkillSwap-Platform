import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import './PageTransition.css';

const PageTransition = ({ children, dashboard = false, contained = false }) => {
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();

  return (
    <div
      key={pathname}
      className={`page-route-transition${dashboard ? ' dashboard-page-transition' : ''}${contained ? ' contained-page-transition' : ''}${reducedMotion ? ' page-route-transition-reduced' : ''}`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
