"use client";

import React from 'react';
import type { ControlSchema, PanelProps, SectionSchema } from './types';

export const SettingsPanel: React.FC<PanelProps> = ({ sections, controls, className, style, onSearch }) => {
  const [query, setQuery] = React.useState('');
  const visibleControls = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return controls;
    return controls.filter(c => c.label.toLowerCase().includes(q));
  }, [controls, query]);

  const sectionsById = React.useMemo(() => {
    const map = new Map<string, SectionSchema>();
    sections.forEach(s => map.set(s.id, s));
    return map;
  }, [sections]);

  const grouped = React.useMemo(() => {
    const g = new Map<string, ControlSchema[]>();
    for (const c of visibleControls) {
      const id = c.sectionId ?? 'default';
      if (!g.has(id)) g.set(id, []);
      g.get(id)!.push(c);
    }
    for (const arr of g.values()) arr.sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
    return g;
  }, [visibleControls]);

  const orderedSections = React.useMemo(() => {
    const ids = Array.from(grouped.keys());
    ids.sort((a,b) => ((sectionsById.get(a)?.order ?? 0) - (sectionsById.get(b)?.order ?? 0)));
    return ids;
  }, [grouped, sectionsById]);

  return (
    <div className={className} style={{ ...style, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {onSearch && (
        <input
          placeholder="Search controls..."
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }}
          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: 'inherit' }}
        />
      )}
      {orderedSections.map(id => (
        <section key={id}>
          {sectionsById.get(id)?.title && (
            <h3 style={{ margin: '8px 0 6px 0', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', opacity: .85 }}>
              {sectionsById.get(id)!.title}
            </h3>
          )}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {grouped.get(id)!.map(ctrl => (
              <div
                key={ctrl.id}
                style={{
                  gridColumn: ctrl.fullRow ? '1 / -1' : undefined,
                  borderRadius: 10,
                  padding: 12,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                }}
              >
                {ctrl.render(ctrl)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SettingsPanel;


