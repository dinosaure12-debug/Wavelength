import { clamp } from "./state.js";
import { Z_GREEN, Z_ORANGE, Z_RED } from "./settings.js";

export function pctToAngle(pct){
  return Math.PI - (pct/100) * Math.PI;
}

export function drawBaseArc(ctx, cx,cy,r){
  ctx.save();
  ctx.strokeStyle="rgba(255,255,255,.18)";
  ctx.lineWidth=60;
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.arc(cx,cy,r,Math.PI,0,false);
  ctx.stroke();
  ctx.restore();
}

export function drawArcBand(ctx, cx,cy,r, centerPct, radiusPct, color, lw){
  const leftPct = clamp(centerPct - radiusPct, 0, 100);
  const rightPct = clamp(centerPct + radiusPct, 0, 100);

  const aLeft = pctToAngle(leftPct);
  const aRight = pctToAngle(rightPct);

  const start = aLeft;
  const end = aRight;
  const anticlockwise = start > end;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 900, cy);
  ctx.clip();

  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end, anticlockwise);
  ctx.stroke();

  ctx.restore();
}

export function drawScoringBands(ctx, cx, cy, r, secret){
  const ringR = r - 18;
  const lw = 40;
  drawArcBand(ctx, cx, cy, ringR, secret, Z_RED,    "rgba(239,68,68,.28)",  lw);
  drawArcBand(ctx, cx, cy, ringR, secret, Z_ORANGE, "rgba(245,158,11,.32)", lw);
  drawArcBand(ctx, cx, cy, ringR, secret, Z_GREEN,  "rgba(34,197,94,.36)",  lw);
}

export function drawNeedle(ctx, pct, color, width, cx,cy,r){
  const a = pctToAngle(pct);
  const nx = cx + Math.cos(a)*r;
  const ny = cy - Math.sin(a)*r;

  ctx.save();
  ctx.lineCap="round";

  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = width + 3;
  ctx.beginPath();
  ctx.moveTo(cx,cy);
  ctx.lineTo(nx,ny);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(cx,cy);
  ctx.lineTo(nx,ny);
  ctx.stroke();

  ctx.restore();
}

export function drawDial(ctx, {mode, secret, guesses, playersMap, psychicId, currentNeedle}){
  ctx.clearRect(0,0,900,520);
  const cx=450, cy=460, r=320;
  // Fallback de sécurité : si on est en psychic_secret, on force l'aiguille sur secret
    if (mode === "psychic_secret") {
  // dessine ton fond / arc si ce n'est pas déjà fait avant
  // (si ton code efface déjà l'écran + dessine l'arc avant les if, laisse-le tel quel)

  drawNeedle(ctx, secret, "rgba(255,255,255,.95)", 10, cx, cy, r);
    return; // IMPORTANT : on sort pour éviter d'autres dessins qui remettraient 50
}

  drawBaseArc(ctx, cx,cy,r);

  if(mode === "reveal"){
    drawScoringBands(ctx, cx,cy,r, secret);
  }

  ctx.save();
  ctx.fillStyle="rgba(255,255,255,.90)";
  ctx.beginPath();
  ctx.arc(cx,cy,12,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  if(mode === "psychic_secret"){
    // Aiguille blanche FIXE sur le secret (Psychic)
    drawNeedle(ctx, secret, "rgba(255,255,255,.95)", 10, cx, cy, r);

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "900 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Position secrète", cx, 92);
    ctx.restore();
  }



// Optionnel: label discret
ctx.save();
ctx.fillStyle = "rgba(255,255,255,.75)";
ctx.font = "900 14px Arial";
ctx.textAlign = "center";
ctx.fillText("Position secrète", cx, 92);
ctx.restore();
}

  if(mode === "team"){
    drawNeedle(ctx, currentNeedle, "rgba(255,255,255,.92)", 6, cx,cy,r);

    ctx.save();
    ctx.fillStyle="rgba(255,255,255,.88)";
    ctx.font="900 32px Arial";
    ctx.textAlign="center";
    ctx.fillText(String(currentNeedle), cx, 70);
    ctx.font="700 14px Arial";
    ctx.fillStyle="rgba(255,255,255,.60)";
    ctx.fillText("Ton placement", cx, 95);
    ctx.restore();
  }

  if(mode === "reveal"){
    drawNeedle(ctx, secret, "rgba(255,255,255,.95)", 11, cx,cy,r);

    for(const [pid, g] of Object.entries(guesses || {})){
      if(pid === psychicId) continue;
      const p = playersMap?.[pid];
      if(p && typeof g === "number"){
        drawNeedle(ctx, g, p.color || "#999", 5, cx,cy,r);
      }
    }

    const as = pctToAngle(secret);
    ctx.save();
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(cx+Math.cos(as)*r, cy-Math.sin(as)*r, 7, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

