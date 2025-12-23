import { loadSettings, saveSettings, settings, getOrCreateMyId, rand, clamp } from "./state.js";
import { COLOR_CHOICES, CATEGORY_PACKS } from "./settings.js";
import { drawDial } from "./dial.js";
import { setPair, renderLobby, renderScores, openWinner, closeWinner } from "./ui.js";
import {
  createRoom, joinRoom, listenRoom,
  isMyTurnPsychic, isRoomHost,
  hostStartRound, psychicSubmitWord, playerSubmitGuess,
  hostComputeRevealAndScore, hostNextRound,
  hostResetScores
} from "./multiplayer.js";

/* ===== Debug mobile ===== */
window.addEventListener("error", function (e) {
  const box = document.getElementById("errBox");
  if (!box) return;
  box.classList.remove("hidden");
  box.innerHTML = `
    <b>Erreur JavaScript</b><br>
    ${e.message}<br>
    <small>${e.filename}:${e.lineno}</small>
  `;
});
window.addEventListener("unhandledrejection", function (e) {
  const box = document.getElementById("errBox");
  if (!box) return;
  box.classList.remove("hidden");
  box.innerHTML = `
    <b>Promise rejetée</b><br>
    ${String(e.reason)}
  `;
});

/* ===== DOM ===== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const pairDiv = document.getElementById("pair");
const btnSettings = document.getElementById("btnSettings");
const btnAction = document.getElementById("actionBtn");

const sliderWrap = document.getElementById("sliderWrap");
const needleSlider = document.getElementById("needleSlider");
const sliderVal = document.getElementById("sliderVal");
const legendWrap = document.getElementById("legendWrap");
const revealNote = document.getElementById("revealNote");

const scoresDiv = document.getElementById("scores");
const btnResetScores = document.getElementById("btnResetScores");

const btnHost = document.getElementById("btnHost");
const btnJoin = document.getElementById("btnJoin");
const multiBox = document.getElementById("multiBox");
const roomCodeInput = document.getElementById("roomCodeInput");
const playerNameInput = document.getElementById("playerNameInput");
const btnConfirmJoin = document.getElementById("btnConfirmJoin");
const roomInfo = document.getElementById("roomInfo");
const roomCodeLabel = document.getElementById("roomCodeLabel");
const lobbyPlayers = document.getElementById("lobbyPlayers");
const roomStatusLabel = document.getElementById("roomStatusLabel");
const roleLabel = document.getElementById("roleLabel");

/* Settings modal */
const settingsOverlay = document.getElementById("settingsOverlay");
const btnCloseSettings = document.getElementById("btnCloseSettings");
const packsList = document.getElementById("packsList");
const btnSelectAll = document.getElementById("btnSelectAll");
const btnSelectNone = document.getElementById("btnSelectNone");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const pointsToWinInput = document.getElementById("pointsToWinInput");

/* Winner modal */
const winnerOverlay = document.getElementById("winnerOverlay");
const winnerTitle = document.getElementById("winnerTitle");
const winnerSub = document.getElementById("winnerSub");
const btnCloseWinner = document.getElementById("btnCloseWinner");
const btnContinue = document.getElementById("btnContinue");

/* ===== State ===== */
let roomCode = null;
let myId = null;
let roomData = null;
let unsub = null;

let currentNeedle = 50;
let dragging = false;

function syncSlider(){
  needleSlider.value = String(currentNeedle);
  sliderVal.textContent = String(currentNeedle);
}

function pointerToPct(ev){
  const rect = canvas.getBoundingClientRect();
  const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
  return Math.round(x * 100);
}

/* ===== Settings UI ===== */
function renderSettingsUI(){
  pointsToWinInput.value = String(settings.pointsToWin || 20);
  packsList.innerHTML = "";

  for(const [key, pack] of Object.entries(CATEGORY_PACKS)){
    const row = document.createElement("div");
    row.className = "scoreline";
    row.style.justifyContent = "space-between";

    const left = document.createElement("div");
    left.className = "scoreLeft";
    left.innerHTML = `<span class="nameText">${pack.label}</span>`;

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "10px";

    const count = document.createElement("span");
    count.className = "badge";
    count.textContent = `${pack.items.length} mots`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!settings.packsEnabled[key];
    checkbox.onchange = ()=>{ settings.packsEnabled[key] = checkbox.checked; };

    right.appendChild(count);
    right.appendChild(checkbox);

    row.appendChild(left);
    row.appendChild(right);
    packsList.appendChild(row);
  }
}

function openSettings(){
  settingsOverlay.classList.add("show");
  renderSettingsUI();
}
function closeSettings(){
  settingsOverlay.classList.remove("show");
}

btnSettings.onclick = openSettings;
btnCloseSettings.onclick = closeSettings;

btnSelectAll.onclick = ()=>{
  for(const k of Object.keys(CATEGORY_PACKS)) settings.packsEnabled[k] = true;
  renderSettingsUI();
};
btnSelectNone.onclick = ()=>{
  for(const k of Object.keys(CATEGORY_PACKS)) settings.packsEnabled[k] = false;
  renderSettingsUI();
};

btnSaveSettings.onclick = async ()=>{
  const v = parseInt((pointsToWinInput.value || "").trim(), 10);
  if(!Number.isNaN(v) && v >= 1 && v <= 999){
    settings.pointsToWin = v;
  }
  saveSettings();
  closeSettings();
  // Si besoin: pousser settings dans la room (comme ton code initial) -> à ajouter si tu veux.
};

/* ===== Winner modal ===== */
btnCloseWinner.onclick = ()=>closeWinner(winnerOverlay);
btnContinue.onclick = ()=>closeWinner(winnerOverlay);

/* ===== Multi UI ===== */
btnJoin.onclick = ()=> multiBox.classList.toggle("hidden");

btnHost.onclick = async ()=>{
  myId = getOrCreateMyId();
  const name = (prompt("Ton pseudo (host) ?", "Host") || "Host").slice(0,14);
  const color = COLOR_CHOICES[0].value;

  const code = await createRoom({ myId, hostName: name, hostColor: color, settings });
  roomCode = code;

  alert("Code à partager : " + code);
  attachListener(code);
};

btnConfirmJoin.onclick = async ()=>{
  myId = getOrCreateMyId();
  const code = (roomCodeInput.value || "").trim().toUpperCase();
  const name = ((playerNameInput.value || "").trim() || "Joueur").slice(0,14);
  const color = COLOR_CHOICES[rand(0, COLOR_CHOICES.length-1)].value;

  if(code.length !== 4){
    alert("Le code doit faire 4 caractères.");
    return;
  }

  const ok = await joinRoom({ myId, code, playerName: name, playerColor: color });
  if(!ok) return;

  roomCode = code;
  attachListener(code);
};

function attachListener(code){
  if(unsub) unsub();
  unsub = listenRoom({
    code,
    onData: async (d)=>{
      roomData = d;

      roomCodeLabel.textContent = code;
      roomInfo.classList.remove("hidden");

      renderLobby(lobbyPlayers, roomData.players || {}, roomData.hostId, myId);
      renderScores(scoresDiv, roomData.players || {}, roomData.psychicId);

      roomStatusLabel.textContent = roomData.phase || "—";
      roleLabel.textContent =
        (isRoomHost(roomData, myId) ? "Tu es HOST." : "Tu es JOUEUR.")
        + " "
        + (isMyTurnPsychic(roomData, myId) ? "Tu es PSYCHIC." : "");

      // Rendu jeu
      const phase = roomData.phase || "lobby";
      const category = roomData.category;
      const word = roomData.word;

      if(phase === "lobby"){
        setPair(pairDiv, "Lobby", isRoomHost(roomData, myId) ? "Host: lance la manche" : "En attente du host…");
        sliderWrap.classList.add("hidden");
        legendWrap.classList.add("hidden");
        revealNote.classList.add("hidden");
        drawDial(ctx, {mode:"psychic_word", secret:50, guesses:{}, playersMap:{}, psychicId:roomData.psychicId, currentNeedle:50});
      } else if(phase === "psychic_word"){
        setPair(pairDiv, category || "Catégorie", isMyTurnPsychic(roomData, myId) ? "Écris le mot…" : "En attente du Psychic…");
        sliderWrap.classList.add("hidden");
        legendWrap.classList.add("hidden");
        revealNote.classList.add("hidden");
        drawDial(ctx, {mode:"psychic_word", secret:50, guesses:{}, playersMap:{}, psychicId:roomData.psychicId, currentNeedle:50});
      } else if(phase === "team"){
        setPair(pairDiv, category || "Catégorie", word || "Mot");
        legendWrap.classList.add("hidden");
        revealNote.classList.add("hidden");
        sliderWrap.classList.toggle("hidden", isMyTurnPsychic(roomData, myId));
        drawDial(ctx, {
          mode:"team",
          secret:roomData.secret,
          guesses:roomData.guesses || {},
          playersMap:roomData.players || {},
          psychicId:roomData.psychicId,
          currentNeedle
        });

        // Host auto reveal + anti double-score dans multiplayer.js
        if(isRoomHost(roomData, myId)){
          await hostComputeRevealAndScore({ roomCode, roomData });
        }
      } else if(phase === "reveal"){
        setPair(pairDiv, category || "Catégorie", word || "Mot");
        sliderWrap.classList.add("hidden");
        legendWrap.classList.remove("hidden");
        revealNote.classList.remove("hidden");
        drawDial(ctx, {
          mode:"reveal",
          secret:roomData.secret,
          guesses:roomData.guesses || {},
          playersMap:roomData.players || {},
          psychicId:roomData.psychicId,
          currentNeedle:50
        });

        // Victoire
        const target = Number(roomData.pointsToWin || 20);
        if(Number.isFinite(target) && target > 0){
          let best = null;
          for(const [pid, p] of Object.entries(roomData.players || {})){
            const s = p.score || 0;
            if(s >= target && (!best || s > best.score)){
              best = {pid, name:p.name||pid, score:s};
            }
          }
          if(best){
            openWinner(winnerOverlay, winnerTitle, winnerSub, best.name, best.score, target);
          }
        }
      }

      updateActionButton();
    }
  });
}

function updateActionButton(){
  const d = roomData;
  if(!d){
    btnAction.textContent = "—";
    btnAction.onclick = null;
    return;
  }

  const phase = d.phase || "lobby";

  if(phase === "lobby"){
    if(isRoomHost(d, myId)){
      btnAction.textContent = "Lancer la manche";
      btnAction.onclick = ()=>hostStartRound({ roomCode, roomData: d });
    } else {
      btnAction.textContent = "En attente (host lance)";
      btnAction.onclick = null;
    }
    return;
  }

  if(phase === "psychic_word"){
    if(isMyTurnPsychic(d, myId)){
      btnAction.textContent = "Valider le mot";
      btnAction.onclick = async ()=>{
        const w = prompt("Mot choisi par le Psychic (visible à tous) :", "");
        if(w == null) return;
        await psychicSubmitWord({ roomCode, word: w });
      };
    } else {
      btnAction.textContent = "En attente du Psychic…";
      btnAction.onclick = null;
    }
    return;
  }

  if(phase === "team"){
    if(isMyTurnPsychic(d, myId)){
      btnAction.textContent = "Psychic : observe";
      btnAction.onclick = null;
    } else {
      const already = d.guesses && typeof d.guesses[myId] === "number";
      btnAction.textContent = already ? "Placement envoyé" : "Valider mon placement";
      btnAction.onclick = async ()=>{
        if(already) return;
        await playerSubmitGuess({ roomCode, myId, val: currentNeedle });
      };
    }
    return;
  }

  if(phase === "reveal"){
    if(isRoomHost(d, myId)){
      btnAction.textContent = "Manche suivante";
      btnAction.onclick = ()=>hostNextRound({ roomCode, roomData: d });
    } else {
      btnAction.textContent = "En attente (host)";
      btnAction.onclick = null;
    }
  }
}

/* ===== Inputs: canvas + slider ===== */
canvas.addEventListener("pointerdown", (e)=>{
  if(!roomData || roomData.phase !== "team") return;
  if(isMyTurnPsychic(roomData, myId)) return;

  dragging = true;
  canvas.setPointerCapture(e.pointerId);
  currentNeedle = pointerToPct(e);
  syncSlider();

  drawDial(ctx, {
    mode:"team",
    secret:roomData.secret,
    guesses:roomData.guesses || {},
    playersMap:roomData.players || {},
    psychicId:roomData.psychicId,
    currentNeedle
  });
});

canvas.addEventListener("pointermove", (e)=>{
  if(!dragging) return;
  if(!roomData || roomData.phase !== "team") return;
  if(isMyTurnPsychic(roomData, myId)) return;

  currentNeedle = pointerToPct(e);
  syncSlider();

  drawDial(ctx, {
    mode:"team",
    secret:roomData.secret,
    guesses:roomData.guesses || {},
    playersMap:roomData.players || {},
    psychicId:roomData.psychicId,
    currentNeedle
  });
});

canvas.addEventListener("pointerup", ()=> dragging=false);
canvas.addEventListener("pointercancel", ()=> dragging=false);

needleSlider.addEventListener("input", ()=>{
  if(!roomData || roomData.phase !== "team") return;
  if(isMyTurnPsychic(roomData, myId)) return;

  currentNeedle = Number(needleSlider.value);
  sliderVal.textContent = String(currentNeedle);

  drawDial(ctx, {
    mode:"team",
    secret:roomData.secret,
    guesses:roomData.guesses || {},
    playersMap:roomData.players || {},
    psychicId:roomData.psychicId,
    currentNeedle
  });
});

/* ===== Reset scores ===== */
btnResetScores.onclick = async ()=>{
  if(!roomCode || !roomData) return;
  if(!isRoomHost(roomData, myId)){
    alert("Seul le host peut reset les scores.");
    return;
  }
  await hostResetScores({ roomCode, roomData });
  closeWinner(winnerOverlay);
};

/* ===== INIT ===== */
loadSettings();
setPair(pairDiv, null, null);
sliderWrap.classList.add("hidden");
legendWrap.classList.add("hidden");
revealNote.classList.add("hidden");
drawDial(ctx, {mode:"psychic_word", secret:50, guesses:{}, playersMap:{}, psychicId:"", currentNeedle:50});
btnAction.textContent = "Crée ou rejoins une room";
btnAction.onclick = null;
syncSlider();
