/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CultivationState, StoreItem } from '../types';
import { STORE_ITEMS } from '../data';
import { ShoppingBag, Package, Gem, Shield } from 'lucide-react';

interface TreasureStoreProps {
  state: CultivationState;
  onBuyItem: (item: StoreItem) => void;
  onUseConsumable: (itemId: string) => void;
}

export default function TreasureStore({ state, onBuyItem, onUseConsumable }: TreasureStoreProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="treasure-store">
      {/* Left 2 Columns: Items for Sale */}
      <div className="lg:col-span-2 space-y-4">
        <div className="neo-card p-5">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-950 pb-3">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Tàng Bảo Các (Spiritual Shop)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STORE_ITEMS.map(item => {
              const alreadyOwned = item.type === 'PERMANENT' && state.inventory.some(i => i.itemId === item.id);
              const canAfford = state.linhThach >= item.cost && !alreadyOwned;
              return (
                <div
                  key={item.id}
                  className="bg-[#1e2638] border-2 border-slate-950 p-4 rounded-xl transition-all flex flex-col justify-between shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-950 bg-amber-400 border-2 border-slate-950 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shrink-0 shadow-[1px_1px_0px_#000] pixel-label">
                        <Gem className="w-3 h-3 text-slate-950" />
                        {item.cost}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <button
                    onClick={() => onBuyItem(item)}
                    disabled={!canAfford}
                    className={`w-full py-1.5 text-[10px] font-bold mt-4 tracking-wider ${
                      alreadyOwned
                        ? 'bg-emerald-950 text-emerald-450 border-2 border-slate-950 rounded-lg cursor-not-allowed font-extrabold shadow-[2px_2px_0px_#000]'
                        : canAfford
                        ? 'neo-btn neo-btn-primary'
                        : 'bg-slate-900 text-slate-650 border-2 border-slate-950 rounded-lg cursor-not-allowed font-extrabold'
                    }`}
                  >
                    {alreadyOwned ? 'ĐÃ SỞ HỮU BÍ TỊCH' : canAfford ? 'MUA BẰNG LINH THẠCH' : 'CHƯA ĐỦ LINH THẠCH'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Inventory & Stats */}
      <div className="space-y-4">
        <div className="neo-card p-5 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-950 pb-3">
            <Package className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Hành Trang Nhân Vật</h3>
          </div>

          {/* Active Shield Indicator */}
          {state.shieldActive && (
            <div className="bg-[#1e2638] border-2 border-slate-950 p-3 rounded-xl mb-4 flex items-center gap-3 shadow-[2px_2px_0px_#000]">
              <Shield className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-indigo-300">HỘ TÂM KÍNH ĐANG KÍCH HOẠT</p>
                <p className="text-[9px] text-slate-500">Đạo tâm được bảo vệ vững vàng trong lần đột phá tiếp theo!</p>
              </div>
            </div>
          )}

          {/* Inventory Items list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
            {state.inventory.length > 0 ? (
              state.inventory.map(inv => {
                const storeItem = STORE_ITEMS.find(s => s.id === inv.itemId);
                if (!storeItem) return null;

                const isSpell = storeItem.type === 'PERMANENT';
                const isEquipped = state.activeSpells?.includes(inv.itemId);

                return (
                  <div
                    key={inv.itemId}
                    className="bg-[#1e2638] border-2 border-slate-950 p-3 rounded-xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_#000]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{storeItem.icon}</span>
                        <h4 className="text-xs font-bold text-slate-200 truncate">
                          {storeItem.name}
                        </h4>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">
                        {isSpell 
                          ? <>Trạng thái: <strong className={isEquipped ? 'text-emerald-450' : 'text-slate-400'}>{isEquipped ? 'Đang trang bị' : 'Đang cất giữ'}</strong></>
                          : <>Số lượng: <strong className="text-slate-300 font-mono">{inv.quantity}</strong></>
                        }
                      </p>
                    </div>

                    <button
                      onClick={() => onUseConsumable(inv.itemId)}
                      className={`px-3 py-1.5 neo-btn ${
                        isSpell 
                          ? (isEquipped ? 'bg-slate-950 text-amber-400 hover:text-amber-300' : 'neo-btn-success text-slate-950')
                          : 'neo-btn neo-btn-success text-slate-950'
                      } text-[9px] shrink-0 font-bold`}
                    >
                      {isSpell 
                        ? (isEquipped ? 'THÁO RA' : 'TRANG BỊ') 
                        : 'SỬ DỤNG'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-24 text-slate-600 text-xs flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-950 rounded-xl h-full">
                <Package className="w-6 h-6 text-slate-700 animate-pulse" />
                <span>Hành trang trống rỗng. Hãy mua đan dược bổ trợ!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
