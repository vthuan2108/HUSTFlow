/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GardenPlant } from '../types';
import { SPIRITUAL_SEEDS } from '../data';
import { Trash2, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpiritualGardenProps {
  plants: GardenPlant[];
  onClearGarden: () => void;
}

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Isometric projection helpers
const GRID = 5; // 5x5 Grid as per original Forest app style
const TW = 32;  // tile width (half the diamond width)
const TH = 16;  // tile height (half of TW for 2:1 aspect)
const SOIL = 18; // height of soil faces

// Convert grid (col, row) to SVG screen coordinates with +GRID shift to avoid negative X coordinates
function iso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row + GRID) * TW,
    y: (col + row) * TH,
  };
}

function pts(...coords: Array<{ x: number; y: number }>): string {
  return coords.map(p => `${p.x},${p.y}`).join(' ');
}

// Draw a single grass tile (rhombus) with a checkerboard grass pattern
function GrassTile({ col, row }: { col: number; row: number }) {
  const tl = iso(col, row);
  const tr = iso(col + 1, row);
  const br = iso(col + 1, row + 1);
  const bl = iso(col, row + 1);
  
  // alternating colors for checkerboard look like Forest app
  const isAlt = (col + row) % 2 === 0;
  const fill = isAlt ? '#9ee847' : '#8cd132';

  return (
    <polygon
      points={pts(tl, tr, br, bl)}
      fill={fill}
      stroke="none"
    />
  );
}

// Isometric pine tree standing on a tile (styled to match the reference image tree)
interface IsoTreeProps {
  col: number;
  row: number;
  icon: string;
  delay: number;
}

function IsoTree({ col, row, icon, delay }: IsoTreeProps) {
  const center = iso(col + 0.5, row + 0.5);
  const cx = center.x;
  const cy = center.y;

  return (
    <motion.g
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
      style={{ transformOrigin: `${cx}px ${cy + 2}px`, transformBox: 'fill-box' }}
    >
      {icon === '🌲' ? (
        <>
          {/* Ground shadow ellipse */}
          <ellipse cx={cx} cy={cy + 2} rx={8} ry={3.5} fill="rgba(0,0,0,0.22)" />
          {/* Trunk */}
          <rect x={cx - 1.5} y={cy - 6} width={3} height={9} fill="#854d0e" />
          {/* Bottom canopy tier */}
          <polygon
            points={`${cx - 11},${cy - 5} ${cx + 11},${cy - 5} ${cx},${cy - 20}`}
            fill="#22c55e"
          />
          {/* Mid canopy tier */}
          <polygon
            points={`${cx - 8},${cy - 16} ${cx + 8},${cy - 16} ${cx},${cy - 29}`}
            fill="#4ade80"
          />
          {/* Top canopy tier */}
          <polygon
            points={`${cx - 5},${cy - 25} ${cx + 5},${cy - 25} ${cx},${cy - 37}`}
            fill="#86efac"
          />
          {/* Highlight overlay on the right face of the tree to create 3D shading */}
          <polygon
            points={`${cx},${cy - 37} ${cx + 5},${cy - 25} ${cx},${cy - 25}`}
            fill="rgba(255,255,255,0.12)"
          />
          <polygon
            points={`${cx},${cy - 29} ${cx + 8},${cy - 16} ${cx},${cy - 16}`}
            fill="rgba(255,255,255,0.12)"
          />
          <polygon
            points={`${cx},${cy - 20} ${cx + 11},${cy - 5} ${cx},${cy - 5}`}
            fill="rgba(255,255,255,0.12)"
          />
        </>
      ) : (
        <>
          {/* Ground shadow for custom plant */}
          <ellipse cx={cx} cy={cy + 3} rx={9} ry={4} fill="rgba(0,0,0,0.22)" />
          {/* Upright custom plant emoji */}
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize="22"
            className="select-none"
            style={{
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.35))'
            }}
          >
            {icon}
          </text>
        </>
      )}
    </motion.g>
  );
}

export default function SpiritualGarden({ plants, onClearGarden }: SpiritualGardenProps) {
  const [filter, setFilter] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [selectedPlant, setSelectedPlant] = useState<GardenPlant | null>(null);

  // Filter plants based on selection
  const filteredPlants = plants.filter(plant => {
    const today = new Date();
    const plantDate = new Date(plant.harvestedAt);
    const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const plantReset = new Date(plantDate.getFullYear(), plantDate.getMonth(), plantDate.getDate());
    const diffDays = Math.round((todayReset.getTime() - plantReset.getTime()) / (1000 * 60 * 60 * 24));

    if (filter === 'DAY') return plant.harvestedAt === getLocalDateString();
    if (filter === 'WEEK') return diffDays >= 0 && diffDays <= 7;
    if (filter === 'MONTH') return plant.harvestedAt.startsWith(getLocalDateString().slice(0, 7));
    return true;
  });

  const harvestedCount = filteredPlants.filter(p => p.status === 'HARVESTED').length;

  // Sort cells from center outward (so plants fill from center)
  const cx = (GRID - 1) / 2;
  const cy = (GRID - 1) / 2;
  const sortedCells: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      sortedCells.push({ r, c });
    }
  }
  sortedCells.sort((a, b) => {
    const da = Math.abs(a.r - cy) + Math.abs(a.c - cx);
    const db = Math.abs(b.r - cy) + Math.abs(b.c - cx);
    return da !== db ? da - db : a.r !== b.r ? a.r - b.r : a.c - b.c;
  });

  // Assign plants to cells based on sorted order
  const occupiedCells: { r: number; c: number; plant: GardenPlant }[] = [];
  sortedCells.forEach((cell, idx) => {
    if (idx < filteredPlants.length) {
      occupiedCells.push({ r: cell.r, c: cell.c, plant: filteredPlants[idx] });
    }
  });

  // Sort occupied cells back-to-front (smaller r + c first) to solve depth sorting overlap issues
  const renderedPlants = [...occupiedCells].sort((a, b) => {
    const sumA = a.r + a.c;
    const sumB = b.r + b.c;
    if (sumA !== sumB) return sumA - sumB;
    return a.c - b.c;
  });

  const getDateRangeLabel = () => {
    const today = new Date();
    if (filter === 'DAY') return `${today.toLocaleDateString('vi-VN')} (Hôm Nay)`;
    if (filter === 'WEEK') {
      const ago = new Date(); ago.setDate(today.getDate() - 7);
      return `${ago.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`;
  };

  // SVG bounding box setup
  const offsetX = 20;
  const svgW = GRID * 2 * TW + 2 * offsetX;
  const offsetY = 50;
  const svgH = GRID * 2 * TH + SOIL + 65;

  // Front-Left Faces (from Left tip (0, GRID) to Bottom tip (GRID, GRID))
  // row = GRID is constant, col ranges from 0 to GRID - 1
  const frontLeftFaces: Array<[{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}]> = [];
  for (let c = 0; c < GRID; c++) {
    const top1 = iso(c, GRID);
    const top2 = iso(c + 1, GRID);
    frontLeftFaces.push([
      top1,
      top2,
      { x: top2.x, y: top2.y + SOIL },
      { x: top1.x, y: top1.y + SOIL },
    ]);
  }

  // Front-Right Faces (from Bottom tip (GRID, GRID) to Right tip (GRID, 0))
  // col = GRID is constant, row ranges from 0 to GRID - 1
  const frontRightFaces: Array<[{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}]> = [];
  for (let r = 0; r < GRID; r++) {
    const top1 = iso(GRID, r);
    const top2 = iso(GRID, r + 1);
    frontRightFaces.push([
      top1,
      top2,
      { x: top2.x, y: top2.y + SOIL },
      { x: top1.x, y: top1.y + SOIL },
    ]);
  }

  return (
    <div className="neo-card p-4 space-y-3 font-sans" id="spiritual-garden">

      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-950 pb-3">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">🌿 Linh Viên</h3>
        </div>
        {plants.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Đạo hữu có chắc chắn muốn dọn sạch Linh Viên?')) onClearGarden();
            }}
            className="flex items-center gap-1 px-2.5 py-1 neo-btn neo-btn-danger text-[9px] font-bold text-white"
          >
            <Trash2 className="w-3 h-3" />
            DỌN VƯỜN
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border-2 border-slate-950 text-[10px] font-extrabold shadow-[1px_1px_0px_#000]">
        {(['DAY', 'WEEK', 'MONTH'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
              filter === t 
                ? 'bg-amber-400 text-slate-950 border border-slate-950 shadow-[1px_1px_0px_#000]' 
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {t === 'DAY' ? 'Ngày' : t === 'WEEK' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>
      <div className="text-center font-mono text-[9px] text-slate-500 pixel-label">{getDateRangeLabel()}</div>

      {/* ── SVG Isometric Garden ── */}
      <div className="flex justify-center overflow-hidden border-2 border-slate-950 rounded-xl bg-slate-950 p-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`${-offsetX} ${-offsetY} ${svgW} ${svgH}`}
          style={{ overflow: 'visible', maxWidth: '100%', height: 'auto' }}
        >
          {/* ── GRASS TILES (rendered back to front for correct overlap) ── */}
          {Array.from({ length: GRID }, (_, r) =>
            Array.from({ length: GRID }, (_, c) => (
              <GrassTile key={`${r}-${c}`} col={c} row={r} />
            ))
          )}

          {/* ── FRONT-LEFT SOIL FACE (facing viewer) ── */}
          {frontLeftFaces.map(([a, b, c, d], i) => (
            <polygon
              key={`flsoil-${i}`}
              points={pts(a, b, c, d)}
              fill={i % 2 === 0 ? '#854d0e' : '#713f12'}
              stroke="#541b05"
              strokeWidth="0.5"
            />
          ))}

          {/* ── FRONT-RIGHT SOIL FACE (facing viewer) ── */}
          {frontRightFaces.map(([a, b, c, d], i) => (
            <polygon
              key={`frsoil-${i}`}
              points={pts(a, b, c, d)}
              fill={i % 2 === 0 ? '#451a03' : '#3f1a01'}
              stroke="#3a1100"
              strokeWidth="0.5"
            />
          ))}

          {/* ── PLANTS (rendered in correct depth-sorted Z-order) ── */}
          {renderedPlants.map((cell, idx) => {
            const isHarvested = cell.plant.status === 'HARVESTED';
            const seed = SPIRITUAL_SEEDS.find(s => s.name === cell.plant.name);

            return (
              <g
                key={`plant-${cell.r}-${cell.c}-${cell.plant.name}`}
                onClick={() => setSelectedPlant(cell.plant)}
                className="cursor-pointer hover:filter hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] transition-all"
              >
                {isHarvested ? (
                  <IsoTree
                    col={cell.c}
                    row={cell.r}
                    seedId={seed?.id}
                    icon={seed?.icon || '🌲'}
                    delay={idx * 0.05}
                  />
                ) : (
                  (() => {
                    const center = iso(cell.c + 0.5, cell.r + 0.5);
                    return (
                      <motion.text
                        x={center.x}
                        y={center.y - 5}
                        textAnchor="middle"
                        fontSize="14"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.75 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{ userSelect: 'none' }}
                      >
                        🥀
                      </motion.text>
                    );
                  })()
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer count */}
      <div className="text-center font-mono text-[10px] border-t-2 border-slate-950 pt-3 text-slate-400 italic">
        Đạo hữu đã trồng được{' '}
        <span className="text-emerald-400 font-bold font-sans">{harvestedCount}</span> gốc linh thảo.
      </div>

      {/* Plant Details Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="neo-card p-5 max-w-xs w-full text-center space-y-4 relative"
            >
              <button
                onClick={() => setSelectedPlant(null)}
                className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300 font-bold"
              >
                ✕
              </button>

              <div className="space-y-2">
                <span className="text-4xl block animate-bounce my-2 select-none">
                  {SPIRITUAL_SEEDS.find(s => s.name === selectedPlant.name)?.icon || '🌿'}
                </span>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide pixel-label">
                  {selectedPlant.name}
                </h3>
                {(() => {
                  const seed = SPIRITUAL_SEEDS.find(s => s.name === selectedPlant.name);
                  const rarity = seed?.rarity || 'SO_CAP';
                  return (
                    <span className={`text-[8px] border-2 border-slate-950 px-2.5 py-0.5 rounded-lg font-bold uppercase shadow-[1px_1px_0px_#000] pixel-label inline-block ${
                      rarity === 'THAN_CAP' ? 'bg-amber-400 text-slate-950' :
                      rarity === 'CAO_CAP' ? 'bg-orange-400 text-slate-950' :
                      rarity === 'TRUNG_CAP' ? 'bg-blue-400 text-slate-950' :
                      'bg-slate-355 text-slate-950'
                    }`}>
                      {rarity === 'SO_CAP' ? 'Sơ Cấp' :
                       rarity === 'TRUNG_CAP' ? 'Trung Cấp' :
                       rarity === 'CAO_CAP' ? 'Cao Cấp' : 'Thần Cấp'}
                    </span>
                  );
                })()}
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border-2 border-slate-950 text-left text-[10px] space-y-1.5 font-mono text-slate-300 shadow-[2px_2px_0px_#000]">
                <p><span className="text-slate-500">Trạng thái:</span> <strong className={selectedPlant.status === 'HARVESTED' ? 'text-emerald-400' : 'text-rose-500'}>{selectedPlant.status === 'HARVESTED' ? 'Viên Mãn ✓' : 'Héo Úa 🥀'}</strong></p>
                <p><span className="text-slate-500">Thu hoạch:</span> <span>{selectedPlant.harvestedAt}</span></p>
                <p><span className="text-slate-500">Linh khí tích tụ:</span> <span className="text-emerald-400">+{selectedPlant.xpGained} XP</span> / <span className="text-amber-400">+{selectedPlant.linhThachGained} Đá</span></p>
                <p className="text-[9px] text-slate-500 italic pt-1.5 border-t border-slate-900 font-sans">
                  {SPIRITUAL_SEEDS.find(s => s.name === selectedPlant.name)?.description || 'Linh thảo quý hiếm được tẩm bổ đạo tâm của tông môn.'}
                </p>
              </div>

              <button
                onClick={() => setSelectedPlant(null)}
                className="w-full py-2 neo-btn neo-btn-primary text-[10px] font-bold"
              >
                LĨNH HỘI LINH KHÍ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
