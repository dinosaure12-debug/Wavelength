import { db, doc, getDoc, setDoc, updateDoc, onSnapshot } from "./firebase.js";
import { now, rand, pickCategory, generateRoomCode } from "./state.js";
import { pointsForGuess } from "./settings.js";

export function isMyTurnPsychic(d, myId){ return d && d.psychicId === myId; }
export function isRoomHost(d, myId){ return d && d.hostId === myId; }

export async function createRoom({ myId, hostName, hostColor, settings }){
  const code = generateRoomCode();
  const roomRef = doc(db, "rooms", code);

  const roundId = now();

  await setDoc(roomRef, {
    hostId: myId,
    pointsToWin: settings.pointsToWin || 20,
    packsEnabled: settings.packsEnabled || {},
    phase: "lobby",
    psychicId: myId,
    category: null,
    word: null,
    secret: null,
    guesses: {},
    order: [myId],
    players: {
      [myId]: { name: hostName, color: hostColor, score: 0, joinedAt: now() }
    },
    roundId,
    scoredRoundId: null,
    createdAt: now(),
    updatedAt: now()
  });

  return code;
}

export async function joinRoom({ myId, code, playerName, playerColor }){
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  if(!snap.exists()){
    alert("Room inexistante");
    return false;
  }

  const data = snap.data();
  const order = Array.isArray(data.order) ? data.order.slice() : [];
  if(!order.includes(myId)) order.push(myId);

  await updateDoc(roomRef, {
    [`players.${myId}`]: { name: playerName, color: playerColor, score: 0, joinedAt: now() },
    order,
    updatedAt: now()
  });

  return true;
}

export async function hostStartRound({ roomCode, roomData }){
  if(!roomCode || !roomData) return;
  const roomRef = doc(db, "rooms", roomCode);

  const cat = pickCategory();
  const secret = rand(0,100);
  const roundId = now();

  await updateDoc(roomRef, {
    phase: "psychic_word",
    category: cat,
    word: null,
    secret,
    guesses: {},
    roundId,
    scoredRoundId: null,
    updatedAt: now()
  });
}

export async function psychicSubmitWord({ roomCode, word }){
  if(!roomCode) return;
  const roomRef = doc(db, "rooms", roomCode);

  const cleaned = (word || "").trim().slice(0,40);
  if(!cleaned){
    alert("Écris un mot avant de valider.");
    return;
  }

  await updateDoc(roomRef, {
    word: cleaned,
    phase: "team",
    updatedAt: now()
  });
}

export async function playerSubmitGuess({ roomCode, myId, val }){
  if(!roomCode) return;
  const roomRef = doc(db, "rooms", roomCode);

  await updateDoc(roomRef, {
    [`guesses.${myId}`]: Number(val),
    updatedAt: now()
  });
}

export function allTeamGuessed(d){
  const playersMap = d.players || {};
  const ids = Object.keys(playersMap);
  const psychicId = d.psychicId;
  const teamIds = ids.filter(id => id !== psychicId);
  const guesses = d.guesses || {};
  return teamIds.every(id => typeof guesses[id] === "number");
}

export async function hostComputeRevealAndScore({ roomCode, roomData }){
  const d = roomData;
  if(!d || !roomCode) return;
  if(d.phase !== "team") return;
  if(!allTeamGuessed(d)) return;

  // Anti double-score (verrou)
  if(d.roundId && d.scoredRoundId === d.roundId) return;

  const roomRef = doc(db, "rooms", roomCode);
  const playersMap = d.players || {};
  const guesses = d.guesses || {};
  const secret = d.secret;

  const updates = {};
  for(const [pid, p] of Object.entries(playersMap)){
    if(pid === d.psychicId) continue;
    const g = guesses[pid];
    if(typeof g !== "number") continue;
    const add = pointsForGuess(secret, g);
    updates[`players.${pid}.score`] = (p.score || 0) + add;
  }

  updates.phase = "reveal";
  updates.scoredRoundId = d.roundId || now();
  updates.updatedAt = now();

  await updateDoc(roomRef, updates);
}

export async function hostNextRound({ roomCode, roomData }){
  if(!roomCode || !roomData) return;

  const order = Array.isArray(roomData.order) ? roomData.order : [];
  if(order.length < 2){
    alert("Il faut au moins 2 joueurs.");
    return;
  }

  const idx = Math.max(0, order.indexOf(roomData.psychicId));
  const nextPsychic = order[(idx + 1) % order.length];

  const roomRef = doc(db, "rooms", roomCode);

  await updateDoc(roomRef, {
    psychicId: nextPsychic,
    phase: "lobby",
    category: null,
    word: null,
    secret: null,
    guesses: {},
    updatedAt: now()
  });
}

export function listenRoom({ code, onData }){
  const roomRef = doc(db, "rooms", code);
  return onSnapshot(roomRef, (snap)=>{
    if(!snap.exists()) return;
    onData(snap.data());
  });
}

export async function hostResetScores({ roomCode, roomData }){
  if(!roomCode || !roomData) return;
  const roomRef = doc(db, "rooms", roomCode);

  const updates = {};
  for(const [pid] of Object.entries(roomData.players || {})){
    updates[`players.${pid}.score`] = 0;
  }
  updates.updatedAt = now();
  await updateDoc(roomRef, updates);
}
