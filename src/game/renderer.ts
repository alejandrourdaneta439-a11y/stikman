import { CHARACTER_CLASSES } from './characters';
import { ARENA_H, ARENA_W, GROUND_Y, PLATFORMS, SimulationWorld } from './engine';
import {
  BuiltStructure,
  EnemyState,
  PlayerState,
  ResourceNode,
} from './types';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  world: SimulationWorld,
  timeSec: number
): void {
  const wType = world.weather.current;
  const intensity = world.weather.intensity;

  // Deep nuclear twilight sky adapted to active weather
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  if (wType === 'acid_rain' && intensity > 0.1) {
    skyGrad.addColorStop(0, '#0a130c');
    skyGrad.addColorStop(0.55, '#192a17');
    skyGrad.addColorStop(1, '#2b3e1b');
  } else if (wType === 'radiation_storm' && intensity > 0.1) {
    skyGrad.addColorStop(0, '#141109');
    skyGrad.addColorStop(0.55, '#292212');
    skyGrad.addColorStop(1, '#3f3015');
  } else if (wType === 'ash_blizzard' && intensity > 0.1) {
    skyGrad.addColorStop(0, '#13181e');
    skyGrad.addColorStop(0.55, '#222a33');
    skyGrad.addColorStop(1, '#323c46');
  } else {
    skyGrad.addColorStop(0, '#0b0e11');
    skyGrad.addColorStop(0.6, '#1a1f24');
    skyGrad.addColorStop(1, '#31291f');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Distant toxic horizon glow
  const glow = ctx.createRadialGradient(
    ARENA_W * 0.5,
    GROUND_Y - 40,
    40,
    ARENA_W * 0.5,
    GROUND_Y - 40,
    620
  );
  glow.addColorStop(
    0,
    wType === 'acid_rain'
      ? 'rgba(132, 204, 22, 0.2)'
      : wType === 'radiation_storm'
      ? 'rgba(245, 158, 11, 0.22)'
      : wType === 'ash_blizzard'
      ? 'rgba(148, 163, 184, 0.14)'
      : 'rgba(245, 158, 11, 0.14)'
  );
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 120, ARENA_W, GROUND_Y - 120);

  // Distant ruined skyline silhouettes
  ctx.fillStyle = '#121619';
  const buildings = [
    [40, 180, 68],
    [120, 130, 52],
    [195, 220, 84],
    [320, 150, 60],
    [420, 110, 48],
    [760, 165, 72],
    [860, 210, 88],
    [980, 140, 56],
    [1065, 195, 78],
    [1175, 145, 65],
  ];
  for (const [bx, bh, bw] of buildings) {
    ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
    ctx.fillStyle = '#0f1316';
    ctx.fillRect(bx + 8, GROUND_Y - bh + 22, 10, 12);
    ctx.fillRect(bx + bw - 22, GROUND_Y - bh + 44, 10, 12);
    ctx.fillStyle = '#121619';
  }

  // Central Bunker background pillar walls
  ctx.fillStyle = '#1b2026';
  ctx.fillRect(486, 494, 24, GROUND_Y - 494);
  ctx.fillRect(770, 494, 24, GROUND_Y - 494);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
  ctx.fillRect(510, 494, 260, GROUND_Y - 494);

  ctx.fillStyle = 'rgba(245, 158, 11, 0.32)';
  ctx.font = '700 18px Oswald, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BÚNKER CERO · ZONA SEGURA', 640, 535);

  // Shelter highlight during hazardous weather or 12s warning
  if (
    wType === 'radiation_storm' ||
    wType === 'acid_rain' ||
    world.weather.timer <= 12
  ) {
    const pulse = 0.35 + Math.sin(timeSec * 8) * 0.2;
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse * 0.16})`;
    for (const plat of PLATFORMS) {
      if (plat.isShelter) {
        ctx.fillRect(
          plat.x + 8,
          plat.y + plat.h,
          plat.w - 16,
          GROUND_Y - (plat.y + plat.h)
        );
      }
    }
  }

  // Weather precipitation & wind streaks
  if (intensity > 0.05 && wType !== 'clear') {
    if (wType === 'acid_rain') {
      ctx.strokeStyle = `rgba(163, 230, 53, ${0.42 * intensity})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 48; i++) {
        const rx = ((i * 137 + timeSec * 210) % (ARENA_W + 80)) - 40;
        const ry = (i * 89 + timeSec * 820) % GROUND_Y;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 7, ry + 22);
      }
      ctx.stroke();
    } else if (wType === 'radiation_storm') {
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.28 * intensity})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 36; i++) {
        const rx = ((i * 151 + timeSec * 380) % (ARENA_W + 80)) - 40;
        const ry = (i * 73 + timeSec * 180) % GROUND_Y;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + 28, ry + 8);
      }
      ctx.stroke();
    } else if (wType === 'ash_blizzard') {
      ctx.strokeStyle = `rgba(203, 213, 225, ${0.28 * intensity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 42; i++) {
        const dir = world.weather.windDir;
        const rx =
          (((i * 163 + timeSec * 460 * dir) % (ARENA_W + 100)) +
            ARENA_W +
            100) %
            (ARENA_W + 100) -
          50;
        const ry = (i * 97 + timeSec * 240) % GROUND_Y;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + dir * 24, ry + 9);
      }
      ctx.stroke();
    }
  }
}

function drawPlatforms(ctx: CanvasRenderingContext2D): void {
  for (const p of PLATFORMS) {
    if (p.style === 'ground') {
      ctx.fillStyle = '#191d21';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // Scorched concrete top rim
      ctx.fillStyle = '#2d343b';
      ctx.fillRect(p.x, p.y, p.w, 6);
      // Hazard stripes on edges
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      for (let x = 20; x < ARENA_W; x += 90) {
        ctx.fillRect(x, p.y + 12, 24, 3);
      }
    } else if (p.style === 'bunker') {
      ctx.fillStyle = '#333b44';
      drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 4);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(p.x + 8, p.y, p.w - 16, 4);
      ctx.fillStyle = '#1e242b';
      ctx.fillRect(p.x + 12, p.y + 9, p.w - 24, 5);
    } else if (p.style === 'concrete') {
      ctx.fillStyle = '#2a3038';
      drawRoundedRect(ctx, p.x, p.y, p.w, p.h, 3);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillRect(p.x, p.y, p.w, 3);
      // Support pillar
      ctx.fillStyle = '#1a1f25';
      ctx.fillRect(p.x + p.w * 0.5 - 10, p.y + p.h, 20, GROUND_Y - (p.y + p.h));
    } else {
      // Steel catwalk
      ctx.fillStyle = '#26303a';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let gx = p.x + 12; gx < p.x + p.w - 12; gx += 22) {
        ctx.moveTo(gx, p.y + 3);
        ctx.lineTo(gx + 12, p.y + p.h);
      }
      ctx.stroke();
    }
  }
}

function drawResourceNode(
  ctx: CanvasRenderingContext2D,
  node: ResourceNode,
  hasScout: boolean,
  timeSec: number
): void {
  if (!node.active) return;

  ctx.save();
  ctx.translate(node.x, node.y);

  if (hasScout) {
    const pulse = 0.4 + Math.sin(timeSec * 5) * 0.25;
    ctx.strokeStyle = `rgba(168, 85, 247, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -14, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (node.hitFlashTimer > 0) {
    ctx.filter = 'brightness(2)';
  }

  if (node.type === 'wood') {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-15, -18, 30, 18);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-13, -15, 26, 4);
    ctx.fillRect(-13, -8, 26, 4);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-10, -26, 20, 8);
  } else if (node.type === 'metal') {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-10, -24);
    ctx.lineTo(12, -20);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Electronics box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, -24, 26, 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-13, -24, 26, 24);
    ctx.fillStyle = Math.sin(timeSec * 8) > 0 ? '#38bdf8' : '#0284c7';
    ctx.fillRect(-7, -18, 6, 6);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(2, -18, 5, 6);
  }

  // Pip count dots
  for (let i = 0; i < node.amount; i++) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8 + i * 7, -32, 4, 3);
  }
  ctx.restore();
}

function drawBuiltStructure(
  ctx: CanvasRenderingContext2D,
  st: BuiltStructure,
  timeSec: number
): void {
  ctx.save();
  ctx.translate(st.x, st.y);

  if (st.kind === 'shelter') {
    // Portable Shelter Canopy + Barricade
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fillRect(-st.w * 0.5, -st.h, st.w, st.h);

    // Steel uprights
    ctx.fillStyle = '#475569';
    ctx.fillRect(-st.w * 0.5, -st.h, 6, st.h);
    ctx.fillRect(st.w * 0.5 - 6, -st.h, 6, st.h);

    // Corrugated roof
    ctx.fillStyle = st.hitFlashTimer > 0 ? '#ffffff' : '#334155';
    ctx.fillRect(-st.w * 0.5 - 6, -st.h, st.w + 12, 12);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-st.w * 0.5 - 6, -st.h, st.w + 12, 3);

    // Sandbag lower wall
    ctx.fillStyle = '#78716c';
    ctx.fillRect(-st.w * 0.45, -18, st.w * 0.9, 18);
  } else if (st.kind === 'trap') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-st.w * 0.5, -5, st.w, 5);
    ctx.fillStyle = '#f97316';
    for (let sx = -st.w * 0.42; sx <= st.w * 0.42; sx += 11) {
      ctx.beginPath();
      ctx.moveTo(sx - 4, -5);
      ctx.lineTo(sx, -16);
      ctx.lineTo(sx + 4, -5);
      ctx.closePath();
      ctx.fill();
    }
  } else if (st.kind === 'turret') {
    // Tripod
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(0, -24);
    ctx.lineTo(12, 0);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -36, 24, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-16, -32, 32, 5);
    ctx.fillStyle = Math.sin(timeSec * 10) > 0 ? '#34d399' : '#10b981';
    ctx.beginPath();
    ctx.arc(0, -39, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mini HP bar above structure
  const hpRatio = Math.max(0, st.hp / st.maxHp);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(-20, -st.h - 10, 40, 4);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-20, -st.h - 10, 40 * hpRatio, 4);

  ctx.restore();
}

function drawStickman(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  timeSec: number
): void {
  if (!p.enabled || p.dead) return;

  const def = CHARACTER_CLASSES[p.classId];
  const playerTagColor = p.id === 1 ? '#38bdf8' : '#fb7185';
  const bodyColor =
    p.hitFlashTimer > 0
      ? '#ffffff'
      : p.downed
      ? '#64748b'
      : '#f8fafc';

  // Draw Scout Scarf behind stickman
  if (p.classId === 'scout' && p.scarfPoints.length > 1 && !p.downed) {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.scarfPoints[0].x, p.scarfPoints[0].y);
    for (let i = 1; i < p.scarfPoints.length; i++) {
      ctx.lineTo(p.scarfPoints[i].x, p.scarfPoints[i].y);
    }
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  // Shield Aura
  if (p.shieldTimer > 0) {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -34, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Overcharge Aura
  if (p.overchargeTimer > 0) {
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(timeSec * 14) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -34, 34, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (p.downed) {
    // Crawling downed stickman pose
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(8, -12);
    ctx.stroke();
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(14, -15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Revive ring / timer
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -34, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.downedTimer / 15));
    ctx.stroke();

    if (p.reviveProgress > 0) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -34, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.reviveProgress);
      ctx.stroke();
    }

    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('¡HERIDO!', 0, -56);
    ctx.restore();
    return;
  }

  ctx.scale(p.squashX * p.facing, p.squashY);

  const moving = Math.abs(p.vx) > 15;
  const legSwing = !p.onGround ? 0.55 : moving ? Math.sin(p.walkCycle) * 0.65 : 0.14;
  const armBob = moving ? Math.cos(p.walkCycle) * 3 : 0;

  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = p.classId === 'juggernaut' ? 5.2 : 3.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(Math.sin(legSwing) * 14, -10);
  ctx.lineTo(Math.sin(legSwing) * 17, 0);
  ctx.moveTo(0, -24);
  ctx.lineTo(-Math.sin(legSwing) * 14, -10);
  ctx.lineTo(-Math.sin(legSwing) * 17, 0);
  ctx.stroke();

  // Torso
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -47);
  ctx.stroke();

  // Class Backpack / Armor Details
  if (p.classId === 'medic') {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-10, -46, 7, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -41, 3, 6);
  } else if (p.classId === 'engineer') {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-9, -45, 7, 14);
  } else if (p.classId === 'juggernaut') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-9, -48, 18, 14);
  }

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, -56, 9, 0, Math.PI * 2);
  ctx.fill();

  // Class Headgear
  if (p.classId === 'medic') {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-8, -60, 16, 4);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(2, -57, 7, 4);
  } else if (p.classId === 'engineer') {
    // Yellow safety helmet
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -58, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-11, -59, 22, 3);
  } else if (p.classId === 'scout') {
    // Twin NVG goggles
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1, -59, 9, 5);
    ctx.fillStyle = '#d8b4fe';
    ctx.fillRect(4, -58, 4, 3);
  } else if (p.classId === 'juggernaut') {
    // Heavy welding visor
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9, -64, 18, 13);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1, -58, 7, 3);
  }

  // Player indicator headband dot
  ctx.fillStyle = playerTagColor;
  ctx.fillRect(-9, -67, 18, 2.5);

  // Arms & Weapon
  const recoil = p.attackAnimTimer > 0 ? -4 : 0;
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = p.classId === 'juggernaut' ? 4.5 : 3.5;

  if (p.classId === 'juggernaut') {
    const swingAngle = p.attackAnimTimer > 0 ? 1.25 : -0.55;
    ctx.save();
    ctx.translate(4, -42);
    ctx.rotate(swingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, -8);
    ctx.stroke();
    // Seismic Hammer
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.lineTo(30, -24);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(24, -34, 14, 22);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(35, -34, 4, 22);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.lineTo(14 + recoil, -38 + armBob);
    ctx.stroke();

    // Gun silhouette
    ctx.fillStyle = def.armorColor;
    if (p.classId === 'scout') {
      ctx.fillRect(10 + recoil, -42 + armBob, 26, 4);
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(28 + recoil, -42 + armBob, 8, 2);
    } else if (p.classId === 'medic') {
      ctx.fillRect(10 + recoil, -42 + armBob, 15, 5);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(21 + recoil, -41 + armBob, 4, 3);
    } else {
      ctx.fillRect(10 + recoil, -42 + armBob, 19, 6);
    }
  }

  ctx.restore();

  // Player Label (J1 / J2) + Pickaxe badge
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = playerTagColor;
  ctx.font = '700 11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  const tagText = p.isBot ? 'BOT' : `J${p.id}`;
  ctx.fillText(p.hasPickaxe ? `${tagText} ⛏` : tagText, 0, -76);

  // Active Emote / Signal Speech Bubble
  if (p.activeEmote) {
    const label = p.activeEmote.label;
    ctx.font = '700 12px Plus Jakarta Sans, sans-serif';
    const tw = Math.max(54, ctx.measureText(label).width + 18);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = p.activeEmote.color;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -tw / 2, -110, tw, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.activeEmote.color;
    ctx.fillText(label, 0, -94);
  }
  ctx.restore();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: EnemyState,
  timeSec: number
): void {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.kind === 'drone') {
    // Hovering Drone
    const bob = Math.sin(timeSec * 6 + e.id) * 4;
    ctx.translate(0, bob);
    ctx.fillStyle = e.hitFlashTimer > 0 ? '#ffffff' : '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = e.state === 'windup' ? '#f43f5e' : '#f97316';
    ctx.beginPath();
    ctx.arc(e.facing * 6, 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Rotors
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -9);
    ctx.lineTo(-8, -9);
    ctx.moveTo(8, -9);
    ctx.lineTo(22, -9);
    ctx.stroke();
  } else {
    ctx.save();
    ctx.scale(e.facing, 1);
    const scale = e.kind === 'brute' ? 1.45 : 1;
    ctx.scale(scale, scale);

    const color =
      e.hitFlashTimer > 0
        ? '#ffffff'
        : e.slowTimer > 0
        ? '#38bdf8'
        : e.kind === 'brute'
        ? '#65a30d'
        : '#84cc16';

    const legSwing = Math.sin(e.walkCycle) * 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = e.kind === 'brute' ? 5 : 3.6;
    ctx.lineCap = 'round';

    // Mutant Stickman Legs
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(Math.sin(legSwing) * 12, 0);
    ctx.moveTo(0, -22);
    ctx.lineTo(-Math.sin(legSwing) * 12, 0);
    ctx.stroke();

    // Hunched Torso + Glowing Spikes
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(5, -42);
    ctx.stroke();

    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.moveTo(-3, -36);
    ctx.lineTo(-10, -40);
    ctx.lineTo(-1, -30);
    ctx.fill();

    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(7, -49, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing red mutant eye (telegraphs windup!)
    ctx.fillStyle = e.state === 'windup' ? '#f43f5e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(10, -50, e.state === 'windup' ? 3.5 : 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(4, -39);
    ctx.lineTo(17, e.state === 'windup' ? -48 : -32);
    ctx.stroke();

    ctx.restore();
  }

  // Enemy HP Bar
  if (e.hp < e.maxHp) {
    const bw = e.kind === 'brute' ? 48 : 30;
    const by = e.kind === 'drone' ? -22 : -e.h - 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-bw / 2, by, bw, 4);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(-bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
  ctx.restore();
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: SimulationWorld,
  timeSec: number
): void {
  ctx.save();

  // Camera Shake
  if (world.shakeIntensity > 0.2) {
    const sx = (Math.random() - 0.5) * world.shakeIntensity * 1.4;
    const sy = (Math.random() - 0.5) * world.shakeIntensity * 1.4;
    ctx.translate(sx, sy);
  }

  drawBackground(ctx, world, timeSec);
  drawPlatforms(ctx);

  const hasScout = world.players.some(
    (p) => !p.dead && p.classId === 'scout'
  );

  // Resource Nodes
  for (const node of world.resourceNodes) {
    drawResourceNode(ctx, node, hasScout, timeSec);
  }

  // Built Structures
  for (const st of world.structures) {
    drawBuiltStructure(ctx, st, timeSec);
  }

  // Hazard Zones
  for (const h of world.hazards) {
    ctx.save();
    if (h.kind === 'acid') {
      ctx.fillStyle = 'rgba(132, 204, 22, 0.45)';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y - 2, h.radius, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.kind === 'healDome') {
      const pulse = 0.22 + Math.sin(timeSec * 5) * 0.06;
      ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (h.kind === 'mine') {
      ctx.fillStyle = '#334155';
      ctx.fillRect(h.x - 10, h.y - 6, 20, 6);
      ctx.fillStyle = Math.sin(timeSec * 14) > 0 ? '#d8b4fe' : '#a855f7';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 7, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.kind === 'flare') {
      ctx.fillStyle = 'rgba(216, 180, 254, 0.12)';
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Explosive Barrels
  for (const b of world.barrels) {
    if (!b.active) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = b.hitFlashTimer > 0 ? '#ffffff' : '#ea580c';
    drawRoundedRect(ctx, -b.w / 2, -b.h, b.w, b.h, 4);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-b.w / 2 + 2, -b.h + 12, b.w - 4, 8);
    ctx.fillStyle = '#18181b';
    ctx.font = '700 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RAD', 0, -b.h + 19);
    ctx.restore();
  }

  // Supply Drops
  for (const s of world.supplies) {
    ctx.save();
    const bob = s.onGround ? 0 : Math.sin(s.bobPhase) * 3;
    ctx.translate(s.x, s.y + bob);
    if (!s.onGround) {
      // Parachute
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(-18, -46);
      ctx.moveTo(12, -26);
      ctx.lineTo(18, -46);
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, -46, 20, Math.PI, 0);
      ctx.fill();
    }
    const crateColors: Record<string, string> = {
      medkit: '#10b981',
      antirad: '#38bdf8',
      overcharge: '#f59e0b',
      resources: '#a855f7',
    };
    const crateLabels: Record<string, string> = {
      medkit: '+',
      antirad: 'RAD',
      overcharge: 'PWR',
      resources: 'REC',
    };
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = crateColors[s.kind];
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -14, -26, 28, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = crateColors[s.kind];
    ctx.font = '700 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(crateLabels[s.kind], 0, -10);
    ctx.restore();
  }

  // Enemies
  for (const e of world.enemies) {
    drawEnemy(ctx, e, timeSec);
  }

  // Players
  for (const p of world.players) {
    drawStickman(ctx, p, timeSec);
  }

  // Projectiles
  for (const pr of world.projectiles) {
    if (pr.trail.length > 1) {
      ctx.strokeStyle = pr.color;
      ctx.lineWidth = pr.kind === 'rail' ? 3 : 2;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(pr.trail[0].x, pr.trail[0].y);
      for (const pt of pr.trail) {
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = pr.color;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles & Shockwave Rings
  for (const pt of world.particles) {
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    if (pt.ring) {
      const progress = 1 - pt.life / pt.maxLife;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * progress, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Scout Passive: Danger Radar Edge Pips for incoming/offscreen enemies
  if (hasScout) {
    for (const e of world.enemies) {
      if (e.x < 40 || e.x > ARENA_W - 40) {
        const edgeX = e.x < 40 ? 18 : ARENA_W - 18;
        const edgeY = Math.max(90, Math.min(GROUND_Y - 20, e.y - 24));
        ctx.fillStyle = '#d8b4fe';
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', edgeX, edgeY + 3.5);
      }
    }
  }

  // Floating Texts
  for (const ft of world.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, ft.life / ft.maxLife);
    ctx.fillStyle = ft.color;
    ctx.font = '700 13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Wave Banner
  if (world.waveBannerTimer > 0 && world.mode === 'COOP') {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.waveBannerTimer);
    ctx.fillStyle = 'rgba(14, 17, 19, 0.78)';
    drawRoundedRect(ctx, ARENA_W * 0.5 - 165, 130, 330, 56, 8);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 26px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`OLEADA NUCLEAR ${world.wave}`, ARENA_W * 0.5, 167);
    ctx.restore();
  }

  ctx.restore();
}
