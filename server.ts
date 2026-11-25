import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import {
  buyOrEquipWeapon,
  craftItem,
  createWorld,
  sendEmote,
  stepWorld,
  type SimulationWorld,
} from './src/game/engine.ts';
import type {
  CharacterClassId,
  ClientWsMessage,
  OnlineRoomPlayer,
  PlayerInput,
  ServerWsMessage,
} from './src/game/types.ts';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  roomCode: string | null;
  slot: 1 | 2 | null;
  name: string;
  classId: CharacterClassId;
}

interface OnlineRoom {
  code: string;
  isPublicQueue: boolean;
  clients: [ConnectedClient | null, ConnectedClient | null];
  world: SimulationWorld | null;
  heldInputs: [PlayerInput, PlayerInput];
  pendingPresses: [
    { jump: boolean; attack: boolean; special: boolean },
    { jump: boolean; attack: boolean; special: boolean },
  ];
  rematchVotes: [boolean, boolean];
  tickCounter: number;
}

function emptyInput(): PlayerInput {
  return {
    left: false,
    right: false,
    jumpHeld: false,
    jumpJustPressed: false,
    attackJustPressed: false,
    attackHeld: false,
    specialJustPressed: false,
  };
}

function makeRoomCode(existing: Map<string, OnlineRoom>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (existing.has(code));
  return code;
}

function sendMsg(ws: WebSocket, msg: ServerWsMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function getRoomPlayers(room: OnlineRoom): OnlineRoomPlayer[] {
  const list: OnlineRoomPlayer[] = [];
  room.clients.forEach((c, idx) => {
    if (c) {
      list.push({
        slot: (idx + 1) as 1 | 2,
        name: c.name,
        classId: c.classId,
        ready: true,
      });
    }
  });
  return list;
}

function compactWorld(world: SimulationWorld): SimulationWorld {
  return {
    ...world,
    particles: world.particles.slice(-70),
    floatingTexts: world.floatingTexts.slice(-16),
  };
}

function broadcastRoom(room: OnlineRoom, msg: ServerWsMessage): void {
  for (const c of room.clients) {
    if (c) sendMsg(c.ws, msg);
  }
}

async function startServer(): Promise<void> {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const rooms = new Map<string, OnlineRoom>();
  let clientSeq = 1;

  function startMatchInRoom(room: OnlineRoom): void {
    const c1 = room.clients[0];
    const c2 = room.clients[1];
    if (!c1 || !c2) return;

    room.heldInputs = [emptyInput(), emptyInput()];
    room.pendingPresses = [
      { jump: false, attack: false, special: false },
      { jump: false, attack: false, special: false },
    ];
    room.rematchVotes = [false, false];
    room.tickCounter = 0;
    room.world = createWorld(
      'PVP',
      c1.classId,
      c2.classId,
      2,
      c1.name,
      c2.name
    );
    broadcastRoom(room, {
      type: 'match_started',
      world: compactWorld(room.world),
    });
  }

  function detachClientFromRoom(client: ConnectedClient): void {
    if (!client.roomCode) return;
    const room = rooms.get(client.roomCode);
    const prevSlot = client.slot;
    client.roomCode = null;
    client.slot = null;

    if (!room || !prevSlot) return;
    room.clients[prevSlot - 1] = null;
    room.world = null;

    const remaining = room.clients[0] ?? room.clients[1];
    if (!remaining) {
      rooms.delete(room.code);
      return;
    }

    // Shift remaining client to slot 1 if slot 2 stayed
    if (!room.clients[0] && room.clients[1]) {
      room.clients[0] = room.clients[1];
      room.clients[1] = null;
      room.clients[0].slot = 1;
    }

    sendMsg(remaining.ws, {
      type: 'opponent_left',
      message: `${client.name} salió de la sala.`,
    });
    sendMsg(remaining.ws, {
      type: 'room_joined',
      code: room.code,
      slot: remaining.slot!,
      players: getRoomPlayers(room),
    });
  }

  wss.on('connection', (ws) => {
    const client: ConnectedClient = {
      id: `c-${clientSeq++}`,
      ws,
      roomCode: null,
      slot: null,
      name: 'Superviviente',
      classId: 'medic',
    };

    ws.on('message', (raw) => {
      let msg: ClientWsMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientWsMessage;
      } catch {
        return;
      }

      if (msg.type === 'create_room') {
        detachClientFromRoom(client);
        client.name = (msg.name || 'Superviviente 1').trim().slice(0, 18);
        client.classId = msg.classId;
        const code = makeRoomCode(rooms);
        const room: OnlineRoom = {
          code,
          isPublicQueue: false,
          clients: [client, null],
          world: null,
          heldInputs: [emptyInput(), emptyInput()],
          pendingPresses: [
            { jump: false, attack: false, special: false },
            { jump: false, attack: false, special: false },
          ],
          rematchVotes: [false, false],
          tickCounter: 0,
        };
        rooms.set(code, room);
        client.roomCode = code;
        client.slot = 1;
        sendMsg(ws, {
          type: 'room_joined',
          code,
          slot: 1,
          players: getRoomPlayers(room),
        });
        return;
      }

      if (msg.type === 'join_room') {
        const code = (msg.code || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          sendMsg(ws, {
            type: 'error',
            message: `No existe la sala "${code}".`,
          });
          return;
        }
        if (room.clients[0] && room.clients[1]) {
          sendMsg(ws, {
            type: 'error',
            message: `La sala "${code}" ya está llena.`,
          });
          return;
        }
        detachClientFromRoom(client);
        client.name = (msg.name || 'Superviviente 2').trim().slice(0, 18);
        client.classId = msg.classId;
        const slot: 1 | 2 = room.clients[0] ? 2 : 1;
        room.clients[slot - 1] = client;
        client.roomCode = code;
        client.slot = slot;

        const players = getRoomPlayers(room);
        sendMsg(ws, {
          type: 'room_joined',
          code,
          slot,
          players,
        });
        broadcastRoom(room, { type: 'room_updated', players });
        return;
      }

      if (msg.type === 'quick_match') {
        detachClientFromRoom(client);
        client.name = (msg.name || 'Superviviente').trim().slice(0, 18);
        client.classId = msg.classId;

        let waitingRoom: OnlineRoom | null = null;
        for (const r of rooms.values()) {
          if (r.isPublicQueue && r.clients[0] && !r.clients[1] && !r.world) {
            waitingRoom = r;
            break;
          }
        }

        if (waitingRoom) {
          waitingRoom.clients[1] = client;
          client.roomCode = waitingRoom.code;
          client.slot = 2;
          const players = getRoomPlayers(waitingRoom);
          sendMsg(ws, {
            type: 'room_joined',
            code: waitingRoom.code,
            slot: 2,
            players,
          });
          broadcastRoom(waitingRoom, { type: 'room_updated', players });
          startMatchInRoom(waitingRoom);
        } else {
          const code = makeRoomCode(rooms);
          const room: OnlineRoom = {
            code,
            isPublicQueue: true,
            clients: [client, null],
            world: null,
            heldInputs: [emptyInput(), emptyInput()],
            pendingPresses: [
              { jump: false, attack: false, special: false },
              { jump: false, attack: false, special: false },
            ],
            rematchVotes: [false, false],
            tickCounter: 0,
          };
          rooms.set(code, room);
          client.roomCode = code;
          client.slot = 1;
          sendMsg(ws, {
            type: 'room_joined',
            code,
            slot: 1,
            players: getRoomPlayers(room),
          });
        }
        return;
      }

      if (msg.type === 'leave_room') {
        detachClientFromRoom(client);
        return;
      }

      if (!client.roomCode || !client.slot) return;
      const room = rooms.get(client.roomCode);
      if (!room) return;

      if (msg.type === 'update_profile') {
        client.name = (msg.name || client.name).trim().slice(0, 18);
        client.classId = msg.classId;
        broadcastRoom(room, {
          type: 'room_updated',
          players: getRoomPlayers(room),
        });
        return;
      }

      if (msg.type === 'start_match') {
        if (room.clients[0] && room.clients[1]) {
          startMatchInRoom(room);
        }
        return;
      }

      if (!room.world) return;
      const idx = client.slot - 1;

      if (msg.type === 'input') {
        room.heldInputs[idx] = msg.input;
        if (msg.input.jumpJustPressed) room.pendingPresses[idx].jump = true;
        if (msg.input.attackJustPressed) room.pendingPresses[idx].attack = true;
        if (msg.input.specialJustPressed) room.pendingPresses[idx].special = true;
      } else if (msg.type === 'craft') {
        craftItem(room.world, client.slot, msg.itemId);
      } else if (msg.type === 'buy_weapon') {
        buyOrEquipWeapon(room.world, client.slot, msg.weaponId);
      } else if (msg.type === 'emote') {
        sendEmote(room.world, client.slot, msg.emoteId);
      } else if (msg.type === 'rematch') {
        room.rematchVotes[idx] = true;
        if (room.clients[0] && room.clients[1] && (room.rematchVotes[0] && room.rematchVotes[1] || client.slot === 1)) {
          startMatchInRoom(room);
        }
      }
    });

    ws.on('close', () => {
      detachClientFromRoom(client);
    });
  });

  // Authoritative 60Hz Simulation Tick, 30Hz Broadcast
  const FIXED_DT = 1 / 60;
  setInterval(() => {
    for (const room of rooms.values()) {
      if (!room.world || room.world.gameOver) continue;
      if (!room.clients[0] || !room.clients[1]) continue;

      const in1: PlayerInput = {
        ...room.heldInputs[0],
        jumpJustPressed: room.pendingPresses[0].jump,
        attackJustPressed: room.pendingPresses[0].attack,
        specialJustPressed: room.pendingPresses[0].special,
      };
      const in2: PlayerInput = {
        ...room.heldInputs[1],
        jumpJustPressed: room.pendingPresses[1].jump,
        attackJustPressed: room.pendingPresses[1].attack,
        specialJustPressed: room.pendingPresses[1].special,
      };

      room.pendingPresses[0] = { jump: false, attack: false, special: false };
      room.pendingPresses[1] = { jump: false, attack: false, special: false };

      stepWorld(room.world, FIXED_DT, [in1, in2]);
      room.tickCounter += 1;

      if (room.world.gameOver || room.tickCounter % 2 === 0) {
        broadcastRoom(room, {
          type: 'state',
          world: compactWorld(room.world),
        });
      }
    }
  }, 1000 / 60);

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Refugio Cero server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
