import { useState } from 'react';
import { X } from 'lucide-react';
import { CRAFT_RECIPES } from '../game/characters';
import { getEffectiveCost } from '../game/engine';
import { CraftItemId, HudSnapshot } from '../game/types';

interface CraftingPanelProps {
  hud: HudSnapshot;
  onCraft: (playerId: 1 | 2, itemId: CraftItemId) => void;
  onClose: () => void;
}

export function CraftingPanel({ hud, onCraft, onClose }: CraftingPanelProps) {
  const hasHumanP2 = !hud.isOnline && hud.p2.enabled && !hud.p2.isBot;
  const [targetPlayer, setTargetPlayer] = useState<1 | 2>(1);
  const resolvedTarget: 1 | 2 =
    hud.isOnline && hud.localPlayerId
      ? hud.localPlayerId
      : hasHumanP2
      ? targetPlayer
      : 1;
  const activePlayer = resolvedTarget === 1 ? hud.p1 : hud.p2;

  return (
    <div className="pointer-events-auto absolute inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-20 z-30 w-auto sm:w-[540px] max-w-full bg-[#111518]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-100 tracking-wide">
            MESA DE CRAFTEO
          </h3>
          <span className="text-xs font-mono-num text-slate-400">
            MAD {hud.resources.wood} · MET {hud.resources.metal} · CIR{' '}
            {hud.resources.electronics}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mesa de crafteo"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#1e262d] text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        {hasHumanP2 ? (
          <>
            <span className="text-xs text-slate-400">Fabricar para:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-[#0b0e11] border border-white/10">
              <button
                type="button"
                onClick={() => setTargetPlayer(1)}
                className={`min-h-[34px] px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  resolvedTarget === 1
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                J1 ({hud.p1.name.split(' ')[0]})
              </button>
              <button
                type="button"
                onClick={() => setTargetPlayer(2)}
                className={`min-h-[34px] px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  resolvedTarget === 2
                    ? 'bg-rose-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                J2 ({hud.p2.name.split(' ')[0]})
              </button>
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-300">
            Fabricando para J1 ({hud.p1.name})
          </span>
        )}
        {activePlayer.classId === 'engineer' && (
          <span className="text-[11px] text-amber-400 font-medium">
            Descuento Ingeniero activo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CRAFT_RECIPES.map((recipe) => {
          const cost = getEffectiveCost(activePlayer.classId, recipe.id);
          const alreadyHasPickaxe =
            recipe.id === 'pickaxe' && activePlayer.hasPickaxe;
          const canAfford =
            !alreadyHasPickaxe &&
            hud.resources.wood >= cost.wood &&
            hud.resources.metal >= cost.metal &&
            hud.resources.electronics >= cost.electronics;

          return (
            <button
              key={recipe.id}
              type="button"
              disabled={!canAfford}
              onClick={() => onCraft(resolvedTarget, recipe.id)}
              className={`text-left p-2.5 rounded-lg border transition-colors flex flex-col justify-between gap-1.5 ${
                canAfford
                  ? 'bg-[#1a2026] border-amber-400/50 hover:border-amber-400 cursor-pointer active:scale-[0.98]'
                  : 'bg-[#101417] border-white/5 opacity-55 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-100">
                  {recipe.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  {recipe.desc}
                </p>
              </div>
              <div className="text-[10px] font-mono-num text-amber-300 pt-1 border-t border-white/5">
                {alreadyHasPickaxe ? (
                  <span className="text-emerald-400">YA EQUIPADO</span>
                ) : (
                  <span>
                    {cost.wood > 0 ? `MAD:${cost.wood} ` : ''}
                    {cost.metal > 0 ? `MET:${cost.metal} ` : ''}
                    {cost.electronics > 0 ? `CIR:${cost.electronics}` : ''}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
