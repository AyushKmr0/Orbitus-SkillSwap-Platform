'use client';

import React, { isValidElement, useLayoutEffect, useRef, useState } from 'react';
import './BranchedMenu.css';

const DEFAULT_ITEMS = [
  {
    label: 'Discussions',
    children: [
      { value: 'all', label: 'All Replies' },
      { value: 'recent', label: 'Recent Replies' }
    ]
  }
];
const PAD = 6;
const MARK = 16;

const renderIcon = icon => {
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'function') return React.createElement(icon, { size: 14 });
  return null;
};
const toSet = open => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

export default function BranchedMenu({
  items = DEFAULT_ITEMS,
  defaultOpen = 0,
  defaultActive = '',
  onSelect,
  onToggle,
  color = '#f5f5f5',
  accentColor = '#f5f5f5',
  lineColor = '#3f3f46',
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = ''
}) {
  const [open, setOpen] = useState(() => toSet(defaultOpen));
  const [active, setActive] = useState(() => {
    if (defaultActive) return defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return first?.children?.[0]?.value ?? '';
  });
  const navRef = useRef(null);
  const heads = useRef([]);
  const markerRef = useRef(null);
  const latest = useRef({});
  latest.current = { onSelect, onToggle };

  const activeSection = items.findIndex(it => it.children?.some(kid => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);
  useLayoutEffect(() => {
    const place = glide => {
      const m = markerRef.current;
      const el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = 'none';
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute('data-on', Boolean(on));
      if (!glide) {
        void m.offsetHeight;
        m.style.transition = '';
      }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      place(false);
    });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value, item) => {
    setActive(value);
    latest.current.onSelect?.(value, item);
  };
  const toggle = i => {
    setOpen(prev => {
      const next = new Set(prev);
      const isOpen = !next.has(i);
      if (isOpen) next.add(i);
      else next.delete(i);
      latest.current.onToggle?.(i, isOpen);
      return next;
    });
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = k => PAD + k * rowHeight + rowHeight / 2;
  const branch = k => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = k => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = k => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  return (
    <nav
      ref={navRef}
      className={`branched-menu${className ? ` ${className}` : ''}`}
      style={{
        '--bm-w': `${width}px`,
        '--bm-ink': color,
        '--bm-accent': accentColor,
        '--bm-line': lineColor,
        '--bm-font': `${fontSize}px`,
        '--bm-row': `${rowHeight}px`,
        '--bm-indent': `${indent}px`,
        '--bm-line-w': lineWidth,
        '--bm-draw': `${drawDuration}ms`,
        '--bm-fold': `${foldDuration}ms`
      }}
    >
      <span ref={markerRef} className="branched-menu__marker" aria-hidden="true" />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        return (
          <div key={item.value ?? item.label} className="branched-menu__section" data-open={isOpen ? '' : undefined}>
            <button
              ref={el => {
                heads.current[i] = el;
              }}
              type="button"
              className="branched-menu__head"
              aria-expanded={kids ? isOpen : undefined}
              aria-current={leafActive ? 'true' : undefined}
              data-active={leafActive ? '' : undefined}
              onClick={() => (kids ? toggle(i) : select(leafValue, item))}
            >
              {item.label}
            </button>
            {kids ? (
              <div className="branched-menu__body">
                <div className="branched-menu__fold">
                  <div className="branched-menu__tree" style={{ height: bodyH }}>
                    <svg className="branched-menu__lines" width={indent} height={bodyH} aria-hidden="true">
                      <path className="branched-menu__base" d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                      {kids.map((kid, k) => (
                        <path key={kid.value} className="branched-menu__base" d={branch(k)} />
                      ))}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className="branched-menu__reach"
                          d={reach(k)}
                          style={{
                            strokeDasharray: length(k),
                            strokeDashoffset: kid.value === active ? 0 : length(k)
                          }}
                        />
                      ))}
                    </svg>
                    {kids.map(kid => (
                      <button
                        key={kid.value}
                        type="button"
                        className="branched-menu__item"
                        aria-current={kid.value === active ? 'true' : undefined}
                        data-active={kid.value === active ? '' : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => select(kid.value, kid)}
                      >
                        {kid.icon ? (
                          <span className="branched-menu__icon" aria-hidden="true">
                            {renderIcon(kid.icon)}
                          </span>
                        ) : null}
                        <span className="branched-menu__label">{kid.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * BranchedCommentBranch
 * Renders comment replies connected via SVG branch curves (matching React Bits BranchedMenu tree structure).
 * Whoever comments or replies forms an authentic branch with the conversation tree.
 */
export function BranchedCommentBranch({
  rootComment,
  replies = [],
  renderCommentCard,
  activeReplyTargetId = null,
  color = '#4f46e5',
  accentColor = '#6366f1',
  lineColor = 'rgba(99, 102, 241, 0.45)',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`branched-comment-thread relative space-y-2 ${className}`}>
      {/* Root Comment Card */}
      <div className="relative z-10">
        {renderCommentCard(rootComment, false, null)}
      </div>

      {/* Child replies branch tree */}
      {replies.length > 0 && (
        <div className="relative pl-5 sm:pl-7 ml-2 sm:ml-3">
          {/* Trunk line leading from parent comment downward */}
          <div
            className="absolute left-2.5 top-0 bottom-3 w-0.5 rounded-full pointer-events-none transition-colors"
            style={{
              background: `linear-gradient(to bottom, ${color} 0%, ${lineColor} 75%, transparent 100%)`
            }}
          />

          {/* Branch fold toggle button */}
          <div className="flex items-center gap-2 py-0.5 relative z-10">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer group"
              title={isOpen ? 'Collapse replies branch' : 'Expand replies branch'}
            >
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span>
                {isOpen ? 'Branch' : 'Show branch'} ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
              </span>
            </button>
          </div>

          {/* Replies list with SVG branched connectors */}
          {isOpen && (
            <div className="space-y-2.5 relative">
              {replies.map((reply, index) => {
                const isLast = index === replies.length - 1;
                const isTargetOfReply = activeReplyTargetId === reply._id;
                return (
                  <div key={reply._id} className="relative group">
                    {/* SVG Branch connector: trunk continuation + smooth arc curve into reply */}
                    <div className="absolute -left-5 sm:-left-7 top-0 bottom-0 w-5 sm:w-7 pointer-events-none">
                      {/* Vertical line through this segment */}
                      <div
                        className={`absolute left-2.5 top-0 ${
                          isLast ? 'h-6' : 'bottom-0'
                        } w-0.5 pointer-events-none transition-colors`}
                        style={{
                          backgroundColor: isTargetOfReply ? accentColor : lineColor
                        }}
                      />
                      {/* Curved branch path connecting trunk to reply card */}
                      <svg
                        className="absolute left-2.5 top-0 w-5 sm:w-7 h-8 overflow-visible"
                        fill="none"
                      >
                        <path
                          d="M 1 0 V 12 A 10 10 0 0 0 11 22 H 22"
                          stroke={isTargetOfReply ? accentColor : lineColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-colors duration-200"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="2.5"
                          fill={isTargetOfReply ? accentColor : color}
                          className="transition-colors duration-200"
                        />
                      </svg>
                    </div>

                    {/* Child Reply Card */}
                    <div
                      className={`transition-all duration-200 rounded-2xl ${
                        isTargetOfReply
                          ? 'ring-2 ring-indigo-500/60 shadow-md'
                          : ''
                      }`}
                    >
                      {renderCommentCard(reply, true, rootComment._id)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
