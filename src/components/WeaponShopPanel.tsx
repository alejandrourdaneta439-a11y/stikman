import { useState } from 'react';
import { Check, Crosshair, X } from 'lucide-react';
import { WEAPON_SHOP_ITEMS } from '../game/characters';
import { HudSnapshot, WeaponId } from '../game/types';

interface WeaponShopPanelProps {
  hud: HudSnapshot;
  onBuyOrEquip: (playerId: 1 | 2, weaponId: WeaponId) => void;
  onClose: () => void;
}

export function WeaponShopPanel({
  hud,
  onBuyOrEquip,
  onClose,
}: WeaponShopPanelProps) {
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
    <div className="pointer-events-auto absolute inset-x-2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-20 z-30 w-auto sm:w-[580px] max-w-full bg-[#111518]/95 border border-sky-400/40 rounded-xl p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-100 tracking-wide truncate">
            TIENDA DE ARMAS
          </h3>
          <span className="text-xs font-mono-num font-bold text-amber-400 whitespace-nowrap">
            {activePlayer.credits} CR
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar tienda de armas"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#1e262d] text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
        {hasHumanP2 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Comprar para:</span>
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
                J1 · {hud.p1.credits} CR
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
                J2 · {hud.p2.credits} CR
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-300">
            Armería de J1 ({hud.p1.name})
          </span>
        )}
        <span className="text-[11px] text-slate-400">
          Elimina mutantes y recolecta para ganar CR
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {WEAPON_SHOP_ITEMS.map((weapon) => {
          const isOwned = activePlayer.ownedWeapons.includes(weapon.id);
          const isEquipped = activePlayer.equippedWeapon === weapon.id;
          const canAfford = activePlayer.credits >= weapon.costCredits;
          const disabled = isEquipped || (!isOwned && !canAfford);

          return (
            <button
              key={weapon.id}
              type="button"
              disabled={disabled}
              onClick={() => onBuyOrEquip(resolvedTarget, weapon.id)}
              className={`text-left p-2.5 rounded-lg border transition-colors flex flex-col justify-between gap-1.5 ${
                isEquipped
                  ? 'bg-sky-950/50 border-sky-400 cursor-default'
                  : isOwned
                  ? 'bg-[#1a2026] border-emerald-400/50 hover:border-emerald-400 cursor-pointer active:scale-[0.98]'
                  : canAfford
                  ? 'bg-[#1a2026] border-amber-400/50 hover:border-amber-400 cursor-pointer active:scale-[0.98]'
                  : 'bg-[#101417] border-white/5 opacity-55 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {weapon.name}
                  </span>
                  <span
                    className="w-2 h-2 rounded-xs shrink-0"
                    style={{ backgroundColor: weapon.color }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  {weapon.desc}
                </p>
              </div>

              <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400">
                  <span>DMG {weapon.damageLabel}</span>
                  <span>{weapon.rateLabel}</span>
                </div>
                <div className="text-[11px] font-mono-num font-bold">
                  {isEquipped ? (
                    <span className="inline-flex items-center gap-1 text-sky-400">
                      <Check className="w-3 h-3" />
                      EQUIPADA
                    </span>
                  ) : isOwned ? (
                    <span className="text-emerald-400">EQUIPAR</span>
                  ) : (
                    <span className={canAfford ? 'text-amber-300' : 'text-rose-400/80'}>
                      COMPRAR · {weapon.costCredits} CR
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
