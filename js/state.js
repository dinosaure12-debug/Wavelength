import { CATEGORY_PACKS } from "./settings.js";

export const SETTINGS_KEY = "wl_mobile_settings_v2";

export let settings = { pointsToWin: 20, packsEnabled: {} };

export function saveSettings(){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw){
      settings.packsEnabled = Object.fromEntries(Object.keys(CATEGORY_PACKS).map(k=>[k,true]));
      return;
    }
    const data = JSON.parse(raw);
    if(typeof data.pointsToWin === "number") settings.pointsToWin = data.pointsToWin;
    if(data.packsEnabled && typeof data.packsEnabled === "object") settings.packsEnabled = data.packsEnabled;
    for(const k of Object.keys(CATEGORY_PACKS)){
      if(settings.packsEnabled[k] == null) settings.packsEnabled[k] = true;
    }
  }catch{
    settings.packsEnabled = Object.fromEntries(Object.keys(CATEGORY_PACKS).map(k=>[k,true]));
  }
}

export const rand  = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const now   = ()=>Date.now();

export function enabledItems(){
  const keys = Object.keys(CATEGORY_PACKS).filter(k => settings.packsEnabled[k]);
  const list = [];
  for(const k of keys) list.push(...CATEGORY_PACKS[k].items);
  if(list.length === 0){
    for(const k of Object.keys(CATEGORY_PACKS)) list.push(...CATEGORY_PACKS[k].items);
  }
  return list;
}

export function pickCategory(){
  const items = enabledItems();
  return items[rand(0, items.length-1)];
}

/** Identifiant joueur persistant */
export function getOrCreateMyId(){
  const k = "wl_myId_v1";
  let v = localStorage.getItem(k);
  if(!v){
    v = "p_" + Math.random().toString(36).slice(2,10);
    localStorage.setItem(k, v);
  }
  return v;
}

export function generateRoomCode(){
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for(let i=0;i<4;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}
