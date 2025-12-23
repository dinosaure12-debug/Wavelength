export function setPair(pairDiv, category, word){
  if(!category && !word){
    pairDiv.innerHTML = `<span class="pill">—</span>`;
    return;
  }
  if(category && word){
    pairDiv.innerHTML = `<span class="pill">${category}</span><span class="pill">${word}</span>`;
    return;
  }
  pairDiv.innerHTML = `<span class="pill">${category || word}</span>`;
}

export function renderLobby(lobbyPlayers, playersMap, hostId, myId){
  lobbyPlayers.innerHTML = "";
  const entries = Object.entries(playersMap || {});
  if(entries.length === 0){
    lobbyPlayers.innerHTML = `<div class="small">Personne dans la room.</div>`;
    return;
  }
  entries.sort((a,b)=> (a[1]?.joinedAt||0) - (b[1]?.joinedAt||0));

  for(const [pid, p] of entries){
    const line = document.createElement("div");
    line.className = "scoreline";
    line.innerHTML = `
      <div class="scoreLeft">
        <span class="colorDot" style="background:${p.color || "#999"}"></span>
        <span class="nameText">
          ${(p.name || pid)}
          ${pid === hostId ? " (Host)" : ""}
          ${pid === myId ? " (Toi)" : ""}
        </span>
      </div>
      <div class="scorePts">${p.score ?? 0} pts</div>
    `;
    lobbyPlayers.appendChild(line);
  }
}

export function renderScores(scoresDiv, playersMap, psychicId){
  scoresDiv.innerHTML = "";
  const entries = Object.entries(playersMap || {});
  entries.sort((a,b)=> (a[1]?.score||0) < (b[1]?.score||0) ? 1 : -1);

  for(const [pid, p] of entries){
    const line = document.createElement("div");
    line.className = "scoreline";
    line.innerHTML = `
      <div class="scoreLeft">
        <span class="colorDot" style="background:${p.color || "#999"}"></span>
        <span class="nameText">
          ${(p.name || pid)}${pid===psychicId ? " (Psychic)" : ""}
        </span>
      </div>
      <div class="scorePts">${p.score ?? 0} pts</div>
    `;
    scoresDiv.appendChild(line);
  }
}

export function openWinner(winnerOverlay, winnerTitle, winnerSub, name, score, target){
  winnerTitle.textContent = "Victoire !";
  winnerSub.textContent = `${name} gagne avec ${score} points (objectif: ${target}).`;
  winnerOverlay.classList.add("show");
}
export function closeWinner(winnerOverlay){
  winnerOverlay.classList.remove("show");
}
