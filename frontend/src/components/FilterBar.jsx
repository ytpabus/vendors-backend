import React from 'react';

function FilterBar({
  viewMode,
  setViewMode,
  availableMonths,
  selectedMonths,
  setSelectedMonths,
  filterOpen,
  setFilterOpen
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0' }}>
      <button onClick={() => setFilterOpen(v => !v)}>Фильтр</button>

      {filterOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#f7f7f7',
            flexWrap: 'wrap'
          }}
        >
          {/* 3-way toggle */}
          <div style={{ display: 'inline-flex', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('active')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'active' ? '#e6f4ea' : 'white',
                fontWeight: viewMode === 'active' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              В Процессе
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '6px 10px',
                borderLeft: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                background: viewMode === 'all' ? '#e6f4ea' : 'white',
                fontWeight: viewMode === 'all' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Все
            </button>
            <button
              onClick={() => setViewMode('arch')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'arch' ? '#e6f4ea' : 'white',
                fontWeight: viewMode === 'arch' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Архив
            </button>
          </div>

          {/* Месяц multiselect */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Месяц:</span>
            <select
              multiple
              size={Math.max(availableMonths.length, 4)}
              value={selectedMonths}
              onChange={() => { /* noop, controlled below */ }}
            >
              {availableMonths.map(m => (
                <option
                  key={m}
                  value={m}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedMonths(prev =>
                      prev.includes(m) ? prev.filter(v => v !== m) : [...prev, m]
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedMonths(prev =>
                        prev.includes(m) ? prev.filter(v => v !== m) : [...prev, m]
                      );
                    }
                  }}
                  aria-selected={selectedMonths.includes(m)}
                >
                  {m}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setSelectedMonths([])}>Сброс</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
