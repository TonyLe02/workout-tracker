'use client';

// React/Next.js
import { useEffect, useMemo, useRef, useState } from 'react';

// External libraries
import { format, parseISO } from 'date-fns';

// Utils/Helpers
import { buildHeatmapData, type HeatmapCell } from '@/lib/heatmap';
import { hexWithAlpha } from '@/lib/tiers';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

// Icons
import { Activity } from 'lucide-react';

interface HeatmapCardProps {
  workouts: WorkoutEntry[];
}

const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 22;
const CELL_GAP = 3;
const WEEKDAY_LABEL_WIDTH = 28;
const SAFETY_MARGIN = 4;
const MIN_WEEKS = 26;
const MAX_WEEKS = 52;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEATMAP_COLOR = '#22c55e';

const INTENSITY_ALPHA: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 0.25,
  2: 0.45,
  3: 0.7,
  4: 0.95,
};

interface CellPos {
  x: number;
  yTop: number;
  yBottom: number;
  preferAbove: boolean;
}

export function HeatmapCard({ workouts }: HeatmapCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [weekCount, setWeekCount] = useState(MAX_WEEKS);
  const [cellSize, setCellSize] = useState(MIN_CELL_SIZE);
  const [hoverCell, setHoverCell] = useState<HeatmapCell | null>(null);
  const [hoverPos, setHoverPos] = useState<CellPos | null>(null);
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  const positionFor = (target: HTMLElement, dayIndex: number): CellPos | null => {
    const cellRect = target.getBoundingClientRect();
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return null;
    return {
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      yTop: cellRect.top - gridRect.top,
      yBottom: cellRect.bottom - gridRect.top,
      preferAbove: dayIndex >= 2,
    };
  };

  const handleHover = (cell: HeatmapCell, target: HTMLElement, dayIndex: number) => {
    const pos = positionFor(target, dayIndex);
    if (!pos) return;
    setHoverCell(cell);
    setHoverPos(pos);
  };

  const handleSelect = (cell: HeatmapCell) => {
    setSelectedCell((prev) => (prev?.date === cell.date ? null : cell));
  };

  const clearHover = () => {
    setHoverCell(null);
    setHoverPos(null);
  };

  const clearSelection = () => {
    setSelectedCell(null);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const usableWidth = width - WEEKDAY_LABEL_WIDTH - SAFETY_MARGIN;

        const sizeForMaxWeeks = Math.floor(
          (usableWidth - (MAX_WEEKS - 1) * CELL_GAP) / MAX_WEEKS
        );

        if (sizeForMaxWeeks >= MIN_CELL_SIZE) {
          setCellSize(Math.min(MAX_CELL_SIZE, sizeForMaxWeeks));
          setWeekCount(MAX_WEEKS);
        } else {
          const fitWeeks = Math.floor(
            (usableWidth + CELL_GAP) / (MIN_CELL_SIZE + CELL_GAP)
          );
          setCellSize(MIN_CELL_SIZE);
          setWeekCount(Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, fitWeeks)));
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const grid = useMemo(
    () => buildHeatmapData(workouts, weekCount),
    [workouts, weekCount]
  );

  // Scroll to show latest entries on mount
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollLeft = scrollContainer.scrollWidth;
  }, [grid]);

  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    grid.forEach((column, weekIndex) => {
      const firstReal = column.find((cell) => !cell.isPadding && cell.date);
      if (!firstReal) return;
      const monthIndex = parseISO(firstReal.date).getMonth();
      if (monthIndex !== lastMonth) {
        labels.push({ weekIndex, label: format(parseISO(firstReal.date), 'MMM') });
        lastMonth = monthIndex;
      }
    });

    return labels;
  }, [grid]);

  const totalDaysActive = useMemo(
    () =>
      grid.reduce(
        (count, column) =>
          count +
          column.filter((cell) => !cell.isPadding && cell.intensity > 0).length,
        0
      ),
    [grid]
  );

  return (
    <div
      className="glass rounded-2xl p-6"
      onClick={clearSelection}
    >
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Activity
          </span>
        </div>
        <div className="text-xs text-right">
          {selectedCell && !selectedCell.isPadding ? (
            <span>
              <span className="text-text-primary font-semibold">
                {format(parseISO(selectedCell.date), 'EEE, MMM d')}
              </span>
              <span className="text-text-secondary">
                {' · '}
                {selectedCell.reps} {selectedCell.reps === 1 ? 'rep' : 'reps'}
                {selectedCell.kcal > 0 ? ` · ${selectedCell.kcal} kcal` : ''}
              </span>
            </span>
          ) : (
            <span className="text-text-secondary">
              <span className="text-text-primary font-semibold">{totalDaysActive}</span>{' '}
              active {totalDaysActive === 1 ? 'day' : 'days'} · last{' '}
              <span className="text-text-primary font-semibold">{weekCount}</span> weeks
            </span>
          )}
        </div>
      </div>

      <div ref={containerRef} className="w-full relative">
        {hoverCell && hoverPos && !hoverCell.isPadding && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-50 rounded-lg border border-white/20 bg-surface/95 backdrop-blur-xl px-3 py-2 text-xs text-white shadow-2xl whitespace-nowrap"
            style={{
              left: `${hoverPos.x}px`,
              top: hoverPos.preferAbove
                ? `${hoverPos.yTop - 8}px`
                : `${hoverPos.yBottom + 8}px`,
              transform: hoverPos.preferAbove
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, 0)',
            }}
          >
            <div className="font-semibold text-text-primary">
              {format(parseISO(hoverCell.date), 'EEE, MMM d')}
            </div>
            <div className="text-text-secondary mt-0.5">
              {hoverCell.reps} {hoverCell.reps === 1 ? 'rep' : 'reps'}
              {hoverCell.kcal > 0 ? ` · ${hoverCell.kcal} kcal` : ''}
            </div>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingTop: '4px',
            paddingBottom: '4px',
            paddingRight: '4px',
            marginTop: '-4px',
            marginBottom: '-4px'
          }}
        >
          <div
            ref={gridRef}
            className="relative"
            onMouseLeave={clearHover}
            style={{
              display: 'grid',
              gridTemplateColumns: `${WEEKDAY_LABEL_WIDTH}px repeat(${grid.length}, ${cellSize}px)`,
              gridTemplateRows: `auto repeat(7, ${cellSize}px)`,
              columnGap: `${CELL_GAP}px`,
              rowGap: `${CELL_GAP}px`,
              minWidth: 'fit-content',
            }}
          >
          <div />
          {grid.map((_, weekIndex) => {
            const monthLabel = monthLabels.find((entry) => entry.weekIndex === weekIndex);
            return (
              <div
                key={`month-${weekIndex}`}
                className="text-[10px] text-text-secondary leading-none h-3"
                style={{ gridColumn: weekIndex + 2, gridRow: 1 }}
              >
                {monthLabel?.label ?? ''}
              </div>
            );
          })}

          {WEEKDAY_LABELS.map((label, dayIndex) => (
            <div
              key={`weekday-${label}`}
              className="text-[10px] text-text-secondary leading-none flex items-center pr-1"
              style={{ gridColumn: 1, gridRow: dayIndex + 2 }}
            >
              {dayIndex % 2 === 1 ? label : ''}
            </div>
          ))}

          {grid.map((column, weekIndex) =>
            column.map((cell, dayIndex) => {
              const gridColumn = weekIndex + 2;
              const gridRow = dayIndex + 2;

              if (cell.isPadding) {
                return (
                  <div
                    key={`pad-${weekIndex}-${dayIndex}`}
                    style={{ gridColumn, gridRow }}
                  />
                );
              }

              const alpha = INTENSITY_ALPHA[cell.intensity];
              const background =
                cell.intensity === 0
                  ? 'rgba(255,255,255,0.06)'
                  : hexWithAlpha(HEATMAP_COLOR, alpha);

              const ariaLabel = `${cell.date}: ${cell.reps} reps, ${cell.kcal} kcal`;
              const isSelected = selectedCell?.date === cell.date;

              return (
                <button
                  key={`cell-${cell.date}`}
                  type="button"
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelect(cell);
                  }}
                  onMouseEnter={(event) => handleHover(cell, event.currentTarget, dayIndex)}
                  className={`rounded-[2px] focus:outline-none focus:ring-1 focus:ring-white/60 transition-transform hover:scale-110 ${
                    isSelected ? 'ring-2 ring-white' : cell.isToday ? 'ring-1 ring-white' : ''
                  }`}
                  style={{
                    gridColumn,
                    gridRow,
                    backgroundColor: background,
                  }}
                />
              );
            })
          )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <div className="flex items-center gap-1 text-[10px] text-text-secondary">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((step) => (
            <span
              key={step}
              className="w-3 h-3 rounded-[2px]"
              style={{
                backgroundColor:
                  step === 0
                    ? 'rgba(255,255,255,0.06)'
                    : hexWithAlpha(HEATMAP_COLOR, INTENSITY_ALPHA[step]),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
