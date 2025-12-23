export const CATEGORY_PACKS = {
  table: { label:"Autour de la table", items:[
    "quelqu’un de radin","quelqu’un de drôle","quelqu’un de susceptible","quelqu’un d’organisé",
    "quelqu’un de retardataire","quelqu’un de chill","quelqu’un de compétitif","quelqu’un de têtu",
    "quelqu’un de diplomate","quelqu’un de bordélique","quelqu’un de chanceux","quelqu’un de malchanceux"
  ]},
  objets: { label:"Objets", items:[
    "un objet de cuisine","un gadget","un truc qui fait du bruit","un objet de daron",
    "une chaussure","une voiture","une console","un moyen de locomotion","un objet dangereux"
  ]},
  bouffe: { label:"Bouffe", items:["un truc pour une raclette","un fromage","un burger","un plat","un dessert","une boisson","une viennoiserie","un truc de fête"]},
  pop: { label:"Pop culture", items:["un rappeur","un acteur","un mème","un jeu vidéo","un streamer","une série","un anime","un super-héros","un clip","un banger","un blockbuster","un sportif","un auteur","un politique","un influenceur"]},
  lieux: { label:"Lieux", items:["un aéroport","une plage","un camping","un centre commercial","un métro","un stade","une boîte de nuit","un pays"]},
  marques: { label:"Marques", items:["une marque de streetwear","une marque de téléphone","une marque de voiture","un studio de jeu vidéo","une marque tech","une marque de boisson"]},
  metiers: { label:"Jobs et vie adulte", items:["un métier","un type de collègue","un type de client","un type de patron","une paye"]},
  internet: { label:"Réseaux sociaux et internet", items:["une appli","un réseau social","une trend","une notification","une vidéo YouTube"]},
  delires: { label:"Délires et situations absurdes", items:["un super-pouvoir","une catastrophe","une peur","un truc illégal"]}
};

export const COLOR_CHOICES = [
  {label:"Bleu électrique", value:"#2979FF"},
  {label:"Cyan néon",       value:"#00E5FF"},
  {label:"Vert néon",       value:"#A3FF12"},
  {label:"Jaune punchy",    value:"#FFD400"},
  {label:"Orange vif",      value:"#FF6B00"},
  {label:"Rouge néon",      value:"#FF1744"},
  {label:"Rose néon",       value:"#FF2D95"},
  {label:"Violet pop",      value:"#7C4DFF"},
];

export const Z_GREEN  = 5;
export const Z_ORANGE = 7;
export const Z_RED    = 11;

export function pointsForGuess(secret, guess){
  const d = Math.abs(guess - secret);
  if(d <= Z_GREEN) return 4;
  if(d <= Z_ORANGE) return 2;
  if(d <= Z_RED) return 1;
  return 0;
}
