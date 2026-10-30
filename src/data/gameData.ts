import { Team, Track, RivalDriver, SponsorContract, TireCompound, CareerMilestone } from '../types';

export const TEAMS: Team[] = [
  // KART TEAMS
  { 
    id: 'kart_birel', 
    name: 'Birel ART Karting', 
    shortName: 'BIR', 
    color: '#3b82f6', 
    category: 'kart', 
    carPerformance: 50, 
    reliability: 95, 
    bonusType: 'Agilidade em Baixa Velocidade', 
    prestige: 1,
    attributeBonuses: { overtaking: 2, starts: 1 }
  },
  { 
    id: 'kart_crg', 
    name: 'CRG Racing Team', 
    shortName: 'CRG', 
    color: '#ef4444', 
    category: 'kart', 
    carPerformance: 52, 
    reliability: 92, 
    bonusType: 'Aceleração Inicial & Largadas', 
    prestige: 1,
    attributeBonuses: { starts: 2, speed: 1 }
  },
  { 
    id: 'kart_tony', 
    name: 'Tony Kart Official', 
    shortName: 'TNY', 
    color: '#10b981', 
    category: 'kart', 
    carPerformance: 51, 
    reliability: 94, 
    bonusType: 'Estabilidade em Chassi & Consistência', 
    prestige: 1,
    attributeBonuses: { consistency: 2, defense: 1 }
  },

  // F3 TEAMS
  { 
    id: 'f3_prema', 
    name: 'Prema Racing F3', 
    shortName: 'PRE', 
    color: '#e10600', 
    category: 'f3', 
    carPerformance: 72, 
    reliability: 90, 
    bonusType: 'Equilíbrio e Consistência de Traçado', 
    prestige: 3,
    attributeBonuses: { consistency: 3, speed: 2 }
  },
  { 
    id: 'f3_trident', 
    name: 'Trident F3', 
    shortName: 'TRI', 
    color: '#0284c7', 
    category: 'f3', 
    carPerformance: 70, 
    reliability: 91, 
    bonusType: 'Acerto de Reta & Largada Rápida', 
    prestige: 3,
    attributeBonuses: { speed: 3, starts: 2 }
  },
  { 
    id: 'f3_art', 
    name: 'ART Grand Prix F3', 
    shortName: 'ART', 
    color: '#8b5cf6', 
    category: 'f3', 
    carPerformance: 69, 
    reliability: 89, 
    bonusType: 'Ataque em Curvas & Ultrapassagem', 
    prestige: 3,
    attributeBonuses: { overtaking: 3, consistency: 2 }
  },

  // F2 TEAMS
  { 
    id: 'f2_invicta', 
    name: 'Invicta Racing F2', 
    shortName: 'INV', 
    color: '#f59e0b', 
    category: 'f2', 
    carPerformance: 82, 
    reliability: 88, 
    bonusType: 'Velocidade Máxima & Ritmo Constante', 
    prestige: 6,
    attributeBonuses: { speed: 3, consistency: 2 }
  },
  { 
    id: 'f2_mp', 
    name: 'MP Motorsport F2', 
    shortName: 'MP', 
    color: '#f97316', 
    category: 'f2', 
    carPerformance: 80, 
    reliability: 87, 
    bonusType: 'Largadas Potentes & Manobras de Ataque', 
    prestige: 6,
    attributeBonuses: { starts: 3, overtaking: 2 }
  },
  { 
    id: 'f2_cams', 
    name: 'Campos Racing F2', 
    shortName: 'CAM', 
    color: '#06b6d4', 
    category: 'f2', 
    carPerformance: 81, 
    reliability: 86, 
    bonusType: 'Defesa de Posição & Gestão de Pneus', 
    prestige: 6,
    attributeBonuses: { defense: 3, consistency: 2 }
  },

  // F1 TEAMS
  { 
    id: 'ferrari', 
    name: 'Scuderia Ferrari F1', 
    shortName: 'FER', 
    color: '#e10600', 
    category: 'f1', 
    carPerformance: 94, 
    reliability: 89, 
    bonusType: 'Motor V6 Potente (+4 Vel, +3 Ult, +1 Lar)', 
    prestige: 10,
    attributeBonuses: { speed: 4, overtaking: 3, starts: 1 }
  },
  { 
    id: 'mclaren', 
    name: 'McLaren F1 Team', 
    shortName: 'MCL', 
    color: '#ff8000', 
    category: 'f1', 
    carPerformance: 95, 
    reliability: 92, 
    bonusType: 'Aerodinâmica de Ponta (+4 Cons, +3 Vel, +1 Ult)', 
    prestige: 10,
    attributeBonuses: { consistency: 4, speed: 3, overtaking: 1 }
  },
  { 
    id: 'redbull', 
    name: 'Red Bull Racing F1', 
    shortName: 'RBR', 
    color: '#3671c6', 
    category: 'f1', 
    carPerformance: 96, 
    reliability: 91, 
    bonusType: 'Chassi Ágil & Estratégia (+3 Vel, +3 Ult, +2 Lar)', 
    prestige: 10,
    attributeBonuses: { speed: 3, overtaking: 3, starts: 2 }
  },
  { 
    id: 'mercedes', 
    name: 'Mercedes-AMG Petronas F1', 
    shortName: 'MER', 
    color: '#6cd3bf', 
    category: 'f1', 
    carPerformance: 92, 
    reliability: 95, 
    bonusType: 'Confiabilidade Mecânica (+4 Cons, +3 Def, +1 Lar)', 
    prestige: 9,
    attributeBonuses: { consistency: 4, defense: 3, starts: 1 }
  },
  { 
    id: 'aston', 
    name: 'Aston Martin Aramco F1', 
    shortName: 'AMR', 
    color: '#229971', 
    category: 'f1', 
    carPerformance: 87, 
    reliability: 90, 
    bonusType: 'Muralha Defensiva & Tração (+4 Def, +3 Cons, +1 Vel)', 
    prestige: 8,
    attributeBonuses: { defense: 4, consistency: 3, speed: 1 }
  },
  { 
    id: 'alpine', 
    name: 'BWT Alpine F1 Team', 
    shortName: 'ALP', 
    color: '#0090ff', 
    category: 'f1', 
    carPerformance: 82, 
    reliability: 85, 
    bonusType: 'Balanço em Curvas Médias (+3 Cons, +2 Vel, +2 Ult)', 
    prestige: 7,
    attributeBonuses: { consistency: 3, speed: 2, overtaking: 2 }
  },
  { 
    id: 'vcarb', 
    name: 'Visa Cash App RB F1', 
    shortName: 'VCB', 
    color: '#6692ff', 
    category: 'f1', 
    carPerformance: 81, 
    reliability: 86, 
    bonusType: 'Largadas Explosivas & Ataque (+3 Lar, +3 Ult, +1 Vel)', 
    prestige: 6,
    attributeBonuses: { starts: 3, overtaking: 3, speed: 1 }
  },
  { 
    id: 'williams', 
    name: 'Williams Racing F1', 
    shortName: 'WIL', 
    color: '#005aff', 
    category: 'f1', 
    carPerformance: 79, 
    reliability: 86, 
    bonusType: 'Velocidade Pura em Reta (+5 Vel, +2 Lar)', 
    prestige: 6,
    attributeBonuses: { speed: 5, starts: 2 }
  },
  { 
    id: 'haas', 
    name: 'Haas F1 Team', 
    shortName: 'HAS', 
    color: '#b6babd', 
    category: 'f1', 
    carPerformance: 76, 
    reliability: 82, 
    bonusType: 'Defesa Cerrada de Pelotão (+3 Def, +3 Lar, +1 Vel)', 
    prestige: 5,
    attributeBonuses: { defense: 3, starts: 3, speed: 1 }
  },
  { 
    id: 'sauber', 
    name: 'Stake F1 Team Sauber', 
    shortName: 'SAU', 
    color: '#52e252', 
    category: 'f1', 
    carPerformance: 74, 
    reliability: 80, 
    bonusType: 'Reação Rápida em Partidas (+3 Lar, +2 Cons, +2 Def)', 
    prestige: 5,
    attributeBonuses: { starts: 3, consistency: 2, defense: 2 }
  }
];

export const TRACKS: Track[] = [
  // ================= KART (5 ETAPAS) =================
  {
    id: 'kart_lonato',
    name: 'South Garda Karting (Lonato)',
    country: 'Itália',
    circuit: 'SGP Karting Circuit',
    category: 'kart',
    laps: 18,
    realLaps: 18,
    weather: 'Seco',
    difficulty: 40,
    characteristics: 'Traçado técnico e travado de alta aderência. Favorece controle nas curvas.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.25,
    cornerWeight: 0.50,
    defenseWeight: 0.25,
    tireAbrasion: 1.0,
    svgPath: 'M 50 130 L 210 130 C 245 130, 255 95, 225 85 L 160 80 C 140 78, 145 50, 175 48 L 235 45 C 260 40, 255 20, 220 22 L 85 28 C 55 30, 45 60, 75 72 L 115 85 C 130 92, 115 110, 90 105 L 55 95 C 30 90, 25 130, 50 130 Z'
  },
  {
    id: 'kart_campina',
    name: 'Kartódromo Granja Viana',
    country: 'Brasil',
    circuit: 'KGV Kart Circuit',
    category: 'kart',
    laps: 20,
    realLaps: 20,
    weather: 'Chuva',
    difficulty: 48,
    characteristics: 'Pista mista e sinuosa sob chuva. Pista escorregadia exige máximo Controle e Consistência.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.35,
    cornerWeight: 0.40,
    defenseWeight: 0.25,
    tireAbrasion: 1.05,
    svgPath: 'M 45 140 L 235 140 C 265 140, 270 105, 240 90 L 195 75 C 175 68, 195 40, 225 38 C 250 36, 245 18, 210 20 L 125 25 C 95 28, 100 65, 75 65 L 45 60 C 25 60, 20 140, 45 140 Z'
  },
  {
    id: 'kart_genk',
    name: 'Karting Genk',
    country: 'Bélgica',
    circuit: 'Home of Champions',
    category: 'kart',
    laps: 22,
    realLaps: 22,
    weather: 'Seco',
    difficulty: 52,
    characteristics: 'Retas longas para karts de competição. Premia velocidade máxima e vácuo.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.55,
    cornerWeight: 0.25,
    defenseWeight: 0.20,
    tireAbrasion: 1.08,
    svgPath: 'M 40 135 L 255 135 C 275 135, 275 95, 250 90 L 120 75 C 95 70, 100 40, 130 38 L 245 35 C 270 32, 265 15, 230 18 L 60 22 C 30 25, 25 65, 50 80 L 40 135 Z'
  },
  {
    id: 'kart_lemans',
    name: 'Le Mans Karting International',
    country: 'França',
    circuit: 'Circuit Alain Prost',
    category: 'kart',
    laps: 20,
    realLaps: 20,
    weather: 'Nublado',
    difficulty: 55,
    characteristics: 'Tempo encoberto e temperatura amena. Setores rápidos com forte frenagem.',
    profileType: 'Travado (Rua)',
    straightWeight: 0.30,
    cornerWeight: 0.35,
    defenseWeight: 0.35,
    tireAbrasion: 0.95,
    svgPath: 'M 45 130 L 230 135 L 255 85 L 185 70 L 210 30 L 90 25 L 65 75 L 115 95 L 45 110 Z'
  },
  {
    id: 'kart_portimao',
    name: 'Kartódromo Internacional do Algarve',
    country: 'Portugal',
    circuit: 'Portimão Karting',
    category: 'kart',
    laps: 22,
    realLaps: 22,
    weather: 'Seco',
    difficulty: 58,
    characteristics: 'Traçado largo e veloz com curvas de raio longo e forte exigência dos pneus.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.42,
    cornerWeight: 0.38,
    defenseWeight: 0.20,
    tireAbrasion: 1.12,
    svgPath: 'M 40 140 L 250 140 L 260 75 L 195 45 L 155 80 L 115 35 L 55 40 L 40 140 Z'
  },

  // ================= F3 (6 ETAPAS) =================
  {
    id: 'f3_bahrain',
    name: 'Sakhir F3 Feature Race',
    country: 'Bahrein',
    circuit: 'Bahrain International Circuit',
    category: 'f3',
    laps: 22,
    realLaps: 22,
    weather: 'Seco',
    difficulty: 65,
    characteristics: 'Asfalto abrasivo do deserto com 3 retas de DRS e fortes freadas.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.42,
    cornerWeight: 0.35,
    defenseWeight: 0.23,
    tireAbrasion: 1.12,
    svgPath: 'M 50 145 L 245 145 L 220 30 L 155 45 L 185 95 L 135 110 L 110 40 L 55 30 L 80 105 L 40 125 Z'
  },
  {
    id: 'f3_imola',
    name: 'GP da Emília-Romanha F3 (Imola)',
    country: 'Itália',
    circuit: 'Autodromo Enzo e Dino Ferrari',
    category: 'f3',
    laps: 24,
    realLaps: 24,
    weather: 'Nublado',
    difficulty: 68,
    characteristics: 'Curvas técnicas (Acque Minerali) e zebras altas sob tempo encoberto.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.30,
    cornerWeight: 0.45,
    defenseWeight: 0.25,
    tireAbrasion: 1.0,
    svgPath: 'M 40 120 L 145 125 L 225 110 C 260 102, 270 65, 240 50 L 195 35 L 165 55 L 125 35 L 65 45 C 35 55, 25 115, 40 120 Z'
  },
  {
    id: 'f3_monaco',
    name: 'GP de Mônaco F3',
    country: 'Mônaco',
    circuit: 'Circuit de Monaco',
    category: 'f3',
    laps: 27,
    realLaps: 27,
    weather: 'Seco',
    difficulty: 78,
    characteristics: 'Ruas estreitas de Monte Carlo. Ultrapassar é dificílimo e defesa é soberana.',
    profileType: 'Travado (Rua)',
    straightWeight: 0.15,
    cornerWeight: 0.40,
    defenseWeight: 0.45,
    tireAbrasion: 0.90,
    svgPath: 'M 55 135 L 155 145 L 235 110 L 255 60 L 215 35 L 180 65 L 125 60 L 95 35 L 55 55 L 75 95 L 45 115 Z'
  },
  {
    id: 'f3_redbullring',
    name: 'GP da Áustria F3 (Spielberg)',
    country: 'Áustria',
    circuit: 'Red Bull Ring',
    category: 'f3',
    laps: 26,
    realLaps: 26,
    weather: 'Nublado',
    difficulty: 64,
    characteristics: 'Três longas retas em subida seguidas de curvas de alta no setor final.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.55,
    cornerWeight: 0.25,
    defenseWeight: 0.20,
    tireAbrasion: 1.02,
    svgPath: 'M 55 140 L 245 135 L 260 65 L 165 25 L 135 65 L 175 90 L 115 105 L 55 45 L 40 115 C 38 132, 45 140, 55 140 Z'
  },
  {
    id: 'f3_silverstone',
    name: 'GP da Grã-Bretanha F3 (Silverstone)',
    country: 'Reino Unido',
    circuit: 'Silverstone Circuit',
    category: 'f3',
    laps: 24,
    realLaps: 24,
    weather: 'Chuva',
    difficulty: 74,
    characteristics: 'Pista encharcada em Maggots e Becketts! Aderência crítica, alto risco de rodadas.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.35,
    cornerWeight: 0.45,
    defenseWeight: 0.20,
    tireAbrasion: 1.14,
    svgPath: 'M 65 140 L 195 145 C 235 145, 265 115, 250 85 L 210 60 L 235 30 L 155 20 L 120 45 L 75 30 C 45 35, 35 80, 65 95 L 50 120 C 45 132, 52 140, 65 140 Z'
  },
  {
    id: 'f3_monza',
    name: 'GP da Itália F3 (Monza)',
    country: 'Itália',
    circuit: 'Autodromo Nazionale Monza',
    category: 'f3',
    laps: 25,
    realLaps: 25,
    weather: 'Seco',
    difficulty: 72,
    characteristics: 'Vácuo constante nas longas retas de Monza e freadas fortes nas chicanes.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.60,
    cornerWeight: 0.20,
    defenseWeight: 0.20,
    tireAbrasion: 0.98,
    svgPath: 'M 45 140 L 255 140 C 275 140, 275 95, 250 90 L 165 85 L 145 30 L 65 25 L 55 75 L 35 115 C 32 130, 38 140, 45 140 Z'
  },

  // ================= F2 (7 ETAPAS) =================
  {
    id: 'f2_jeddah',
    name: 'GP da Arábia Saudita F2 (Jeddah)',
    country: 'Arábia Saudita',
    circuit: 'Jeddah Corniche Circuit',
    category: 'f2',
    laps: 28,
    realLaps: 28,
    weather: 'Seco',
    difficulty: 82,
    characteristics: 'Circuito de rua mais veloz do mundo, entre muros e curvas de alta velocidade.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.50,
    cornerWeight: 0.30,
    defenseWeight: 0.20,
    tireAbrasion: 1.0,
    svgPath: 'M 40 140 L 255 130 L 265 95 L 175 90 L 140 60 L 60 50 L 35 85 L 95 105 L 40 140 Z'
  },
  {
    id: 'f2_imola',
    name: 'GP de Imola F2',
    country: 'Itália',
    circuit: 'Autodromo Enzo e Dino Ferrari',
    category: 'f2',
    laps: 35,
    realLaps: 35,
    weather: 'Nublado',
    difficulty: 80,
    characteristics: 'Pista estreita e técnica que exige precisão milimétrica nas curvas sob céu encoberto.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.28,
    cornerWeight: 0.47,
    defenseWeight: 0.25,
    tireAbrasion: 1.02,
    svgPath: 'M 40 120 L 145 125 L 225 110 C 260 102, 270 65, 240 50 L 195 35 L 165 55 L 125 35 L 65 45 C 35 55, 25 115, 40 120 Z'
  },
  {
    id: 'f2_monaco',
    name: 'GP de Mônaco F2',
    country: 'Mônaco',
    circuit: 'Circuit de Monaco',
    category: 'f2',
    laps: 42,
    realLaps: 42,
    weather: 'Seco',
    difficulty: 95,
    characteristics: 'Ruas estreitas, baixa velocidade e defesa absoluta. Erros custam caro.',
    profileType: 'Travado (Rua)',
    straightWeight: 0.15,
    cornerWeight: 0.40,
    defenseWeight: 0.45,
    tireAbrasion: 0.88,
    svgPath: 'M 55 135 L 155 145 L 235 110 L 255 60 L 215 35 L 180 65 L 125 60 L 95 35 L 55 55 L 75 95 L 45 115 Z'
  },
  {
    id: 'f2_silverstone',
    name: 'GP da Grã-Bretanha F2',
    country: 'Reino Unido',
    circuit: 'Silverstone Circuit',
    category: 'f2',
    laps: 29,
    realLaps: 29,
    weather: 'Chuva',
    difficulty: 84,
    characteristics: 'Chuva intensa no asfalto inglês! Aderência reduzida exige consistência perfeita.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.34,
    cornerWeight: 0.46,
    defenseWeight: 0.20,
    tireAbrasion: 1.15,
    svgPath: 'M 65 140 L 195 145 C 235 145, 265 115, 250 85 L 210 60 L 235 30 L 155 20 L 120 45 L 75 30 C 45 35, 35 80, 65 95 L 50 120 C 45 132, 52 140, 65 140 Z'
  },
  {
    id: 'f2_spa',
    name: 'GP da Bélgica F2 (Spa)',
    country: 'Bélgica',
    circuit: 'Spa-Francorchamps',
    category: 'f2',
    laps: 25,
    realLaps: 25,
    weather: 'Chuva',
    difficulty: 88,
    characteristics: 'Tempestade na floresta de Ardenas. Eau Rouge molhada com alto perigo de rodada.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.45,
    cornerWeight: 0.35,
    defenseWeight: 0.20,
    tireAbrasion: 1.10,
    svgPath: 'M 45 125 L 115 145 L 245 115 L 260 65 L 190 25 L 145 55 L 175 85 L 105 90 L 65 35 L 35 85 Z'
  },
  {
    id: 'f2_monza',
    name: 'GP da Itália F2 (Monza)',
    country: 'Itália',
    circuit: 'Autodromo Nazionale Monza',
    category: 'f2',
    laps: 30,
    realLaps: 30,
    weather: 'Seco',
    difficulty: 78,
    characteristics: 'Retas quilométricas e chicanes estreitas. Velocidade pura domina.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.60,
    cornerWeight: 0.20,
    defenseWeight: 0.20,
    tireAbrasion: 0.96,
    svgPath: 'M 45 140 L 255 140 C 275 140, 275 95, 250 90 L 165 85 L 145 30 L 65 25 L 55 75 L 35 115 C 32 130, 38 140, 45 140 Z'
  },
  {
    id: 'f2_abudhabi',
    name: 'GP de Abu Dhabi F2 (Yas Marina)',
    country: 'Emirados Árabes',
    circuit: 'Yas Marina Circuit',
    category: 'f2',
    laps: 33,
    realLaps: 33,
    weather: 'Seco',
    difficulty: 82,
    characteristics: 'Final da temporada com longas retas de DRS e setor técnico do Hotel.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.40,
    cornerWeight: 0.35,
    defenseWeight: 0.25,
    tireAbrasion: 1.05,
    svgPath: 'M 45 135 L 235 135 L 255 85 L 185 80 L 185 30 L 115 25 L 115 95 L 45 95 Z'
  },

  // ================= F1 (10 ETAPAS - VOLTAS REAIS) =================
  {
    id: 'f1_bahrain',
    name: 'GP do Bahrein',
    country: 'Bahrein',
    circuit: 'Sakhir International Circuit',
    category: 'f1',
    laps: 57,
    realLaps: 57,
    weather: 'Seco',
    difficulty: 76,
    characteristics: 'Asfalto abrasivo sob calor noturno, com 3 zonas de DRS e fortes freadas.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.40,
    cornerWeight: 0.35,
    defenseWeight: 0.25,
    tireAbrasion: 1.15,
    svgPath: 'M 50 145 L 245 145 L 220 30 L 155 45 L 185 95 L 135 110 L 110 40 L 55 30 L 80 105 L 40 125 Z'
  },
  {
    id: 'f1_jeddah',
    name: 'GP da Arábia Saudita (Jeddah)',
    country: 'Arábia Saudita',
    circuit: 'Jeddah Corniche Circuit',
    category: 'f1',
    laps: 50,
    realLaps: 50,
    weather: 'Seco',
    difficulty: 84,
    characteristics: 'Circuito de rua de altíssima velocidade às margens do Mar Vermelho.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.52,
    cornerWeight: 0.28,
    defenseWeight: 0.20,
    tireAbrasion: 0.96,
    svgPath: 'M 40 140 L 255 130 L 265 95 L 175 90 L 140 60 L 60 50 L 35 85 L 95 105 L 40 140 Z'
  },
  {
    id: 'f1_monaco',
    name: 'GP de Mônaco',
    country: 'Mônaco',
    circuit: 'Circuit de Monaco',
    category: 'f1',
    laps: 78,
    realLaps: 78,
    weather: 'Seco',
    difficulty: 96,
    characteristics: '78 voltas de precisão absoluta entre os guard-rails. Pneus duros rendem muito.',
    profileType: 'Travado (Rua)',
    straightWeight: 0.15,
    cornerWeight: 0.40,
    defenseWeight: 0.45,
    tireAbrasion: 0.85,
    svgPath: 'M 55 135 L 155 145 L 235 110 L 255 60 L 215 35 L 180 65 L 125 60 L 95 35 L 55 55 L 75 95 L 45 115 Z'
  },
  {
    id: 'f1_canada',
    name: 'GP do Canadá (Montreal)',
    country: 'Canadá',
    circuit: 'Circuit Gilles-Villeneuve',
    category: 'f1',
    laps: 70,
    realLaps: 70,
    weather: 'Nublado',
    difficulty: 85,
    characteristics: 'Céu nublado e temperatura de pista fria na Ilha de Notre-Dame.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.48,
    cornerWeight: 0.28,
    defenseWeight: 0.24,
    tireAbrasion: 0.95,
    svgPath: 'M 35 125 L 250 135 L 265 95 L 180 85 L 120 55 L 45 55 L 35 125 Z'
  },
  {
    id: 'f1_austria',
    name: 'GP da Áustria (Spielberg)',
    country: 'Áustria',
    circuit: 'Red Bull Ring',
    category: 'f1',
    laps: 71,
    realLaps: 71,
    weather: 'Nublado',
    difficulty: 80,
    characteristics: 'Nuvens pesadas nos Alpes austríacos. Volta curta e veloz com 3 zonas de DRS.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.54,
    cornerWeight: 0.26,
    defenseWeight: 0.20,
    tireAbrasion: 1.02,
    svgPath: 'M 55 140 L 245 135 L 260 65 L 165 25 L 135 65 L 175 90 L 115 105 L 55 45 L 40 115 C 38 132, 45 140, 55 140 Z'
  },
  {
    id: 'f1_silverstone',
    name: 'GP da Grã-Bretanha (Silverstone)',
    country: 'Reino Unido',
    circuit: 'Silverstone Circuit',
    category: 'f1',
    laps: 52,
    realLaps: 52,
    weather: 'Chuva',
    difficulty: 88,
    characteristics: 'Chuva torrencial! Aderência despenca e exige máximo Controle para evitar rodadas.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.30,
    cornerWeight: 0.50,
    defenseWeight: 0.20,
    tireAbrasion: 1.15,
    svgPath: 'M 65 140 L 195 145 C 235 145, 265 115, 250 85 L 210 60 L 235 30 L 155 20 L 120 45 L 75 30 C 45 35, 35 80, 65 95 L 50 120 C 45 132, 52 140, 65 140 Z'
  },
  {
    id: 'f1_spa',
    name: 'GP da Bélgica (Spa)',
    country: 'Bélgica',
    circuit: 'Spa-Francorchamps',
    category: 'f1',
    laps: 44,
    realLaps: 44,
    weather: 'Chuva',
    difficulty: 90,
    characteristics: 'Clássica chuva em Spa! Pista ensaboada com alto índice de aquaplanagem.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.45,
    cornerWeight: 0.35,
    defenseWeight: 0.20,
    tireAbrasion: 1.10,
    svgPath: 'M 45 125 L 115 145 L 245 115 L 260 65 L 190 25 L 145 55 L 175 85 L 105 90 L 65 35 L 35 85 Z'
  },
  {
    id: 'f1_monza',
    name: 'GP da Itália (Monza)',
    country: 'Itália',
    circuit: 'Autodromo Nazionale Monza',
    category: 'f1',
    laps: 53,
    realLaps: 53,
    weather: 'Seco',
    difficulty: 82,
    characteristics: 'O Templo da Velocidade. Asfalto seco e quente, velocidade pura nas retas.',
    profileType: 'Alta Velocidade (Retas)',
    straightWeight: 0.60,
    cornerWeight: 0.20,
    defenseWeight: 0.20,
    tireAbrasion: 0.94,
    svgPath: 'M 45 140 L 255 140 C 275 140, 275 95, 250 90 L 165 85 L 145 30 L 65 25 L 55 75 L 35 115 C 32 130, 38 140, 45 140 Z'
  },
  {
    id: 'f1_interlagos',
    name: 'GP de São Paulo (Interlagos)',
    country: 'Brasil',
    circuit: 'Autódromo José Carlos Pace',
    category: 'f1',
    laps: 71,
    realLaps: 71,
    weather: 'Chuva',
    difficulty: 92,
    characteristics: 'Chuva histórica de Interlagos! Baixa aderência transforma a curva do Sol em armadilha.',
    profileType: 'Técnico (Muitas Curvas)',
    straightWeight: 0.32,
    cornerWeight: 0.45,
    defenseWeight: 0.23,
    tireAbrasion: 1.08,
    svgPath: 'M 45 135 L 240 145 C 265 140, 265 85, 230 75 L 140 85 C 115 88, 115 55, 145 52 L 220 45 C 240 40, 235 20, 200 22 L 75 28 C 45 35, 65 85, 95 95 L 60 110 C 40 115, 35 130, 45 135 Z'
  },
  {
    id: 'f1_abudhabi',
    name: 'GP de Abu Dhabi (Yas Marina)',
    country: 'Emirados Árabes',
    circuit: 'Yas Marina Circuit',
    category: 'f1',
    laps: 58,
    realLaps: 58,
    weather: 'Seco',
    difficulty: 84,
    characteristics: 'Duas longas retas de DRS seguidas pelo setor técnico do Hotel sob os refletores.',
    profileType: 'Misto Equilibrado',
    straightWeight: 0.40,
    cornerWeight: 0.35,
    defenseWeight: 0.25,
    tireAbrasion: 1.02,
    svgPath: 'M 45 135 L 235 135 L 255 85 L 185 80 L 185 30 L 115 25 L 115 95 L 45 95 Z'
  }
];

// REAL F1 DRIVERS - ALL CAPPED AT MAXIMUM AVERAGE OF 90 WITH SPECIALIZED PROFILES
export const REAL_F1_DRIVERS: RivalDriver[] = [
  // Max Verstappen: Aggressive master, raw speed & cornering specialist (Avg: 90.0)
  { name: 'Max Verstappen', nationality: 'Holanda 🇳🇱', category: 'f1', teamId: 'redbull', ovr: 90, speed: 95, cornering: 93, defense: 91, consistency: 88, starts: 83 },
  // Charles Leclerc: Qualifying & pure speed specialist (Avg: 90.0)
  { name: 'Charles Leclerc', nationality: 'Mônaco 🇲🇨', category: 'f1', teamId: 'ferrari', ovr: 90, speed: 96, cornering: 92, defense: 84, consistency: 86, starts: 92 },
  // Lewis Hamilton: Tire management & racecraft consistency specialist (Avg: 90.0)
  { name: 'Lewis Hamilton', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'ferrari', ovr: 90, speed: 87, cornering: 91, defense: 93, consistency: 96, starts: 83 },
  // Fernando Alonso: Defensive fortress & wheel-to-wheel master (Avg: 90.0)
  { name: 'Fernando Alonso', nationality: 'Espanha 🇪🇸', category: 'f1', teamId: 'aston', ovr: 90, speed: 85, cornering: 89, defense: 97, consistency: 93, starts: 86 },
  // Lando Norris: High-speed flowing curves & attack specialist (Avg: 90.0)
  { name: 'Lando Norris', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'mclaren', ovr: 90, speed: 93, cornering: 92, defense: 88, consistency: 89, starts: 88 },
  // Oscar Piastri: Smooth precision & balanced race execution (Avg: 90.0)
  { name: 'Oscar Piastri', nationality: 'Austrália 🇦🇺', category: 'f1', teamId: 'mclaren', ovr: 90, speed: 92, cornering: 91, defense: 88, consistency: 90, starts: 89 },
  // George Russell: Steady qualifier & race pace (Avg: 90.0)
  { name: 'George Russell', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'mercedes', ovr: 90, speed: 91, cornering: 90, defense: 90, consistency: 90, starts: 89 },
  // Carlos Sainz: Strategic defense & adaptability (Avg: 90.0)
  { name: 'Carlos Sainz', nationality: 'Espanha 🇪🇸', category: 'f1', teamId: 'williams', ovr: 90, speed: 89, cornering: 90, defense: 92, consistency: 91, starts: 88 },
  // Alex Albon: Straight line fighter (Avg: 88.0)
  { name: 'Alex Albon', nationality: 'Tailândia 🇹🇭', category: 'f1', teamId: 'williams', ovr: 88, speed: 93, cornering: 86, defense: 89, consistency: 87, starts: 85 },
  // Nico Hulkenberg: Qualifying ace & battle veteran (Avg: 88.0)
  { name: 'Nico Hulkenberg', nationality: 'Alemanha 🇩🇪', category: 'f1', teamId: 'sauber', ovr: 88, speed: 92, cornering: 86, defense: 87, consistency: 88, starts: 87 },
  // Yuki Tsunoda: Fast reactions & aggressive cornering (Avg: 87.0)
  { name: 'Yuki Tsunoda', nationality: 'Japão 🇯🇵', category: 'f1', teamId: 'vcarb', ovr: 87, speed: 90, cornering: 88, defense: 84, consistency: 85, starts: 88 },
  // Pierre Gasly: Well-rounded midfielder (Avg: 87.0)
  { name: 'Pierre Gasly', nationality: 'França 🇫🇷', category: 'f1', teamId: 'alpine', ovr: 87, speed: 87, cornering: 88, defense: 88, consistency: 87, starts: 85 },
  // Esteban Ocon: Fierce defender (Avg: 87.0)
  { name: 'Esteban Ocon', nationality: 'França 🇫🇷', category: 'f1', teamId: 'haas', ovr: 87, speed: 84, cornering: 85, defense: 94, consistency: 86, starts: 86 },
  // Andrea Kimi Antonelli: Young prodigy, high raw pace (Avg: 87.0)
  { name: 'Andrea Kimi Antonelli', nationality: 'Itália 🇮🇹', category: 'f1', teamId: 'mercedes', ovr: 87, speed: 92, cornering: 87, defense: 82, consistency: 85, starts: 89 },
  // Gabriel Bortoleto: High technical finesse (Avg: 87.0)
  { name: 'Gabriel Bortoleto', nationality: 'Brasil 🇧🇷', category: 'f1', teamId: 'sauber', ovr: 87, speed: 88, cornering: 90, defense: 86, consistency: 87, starts: 84 },
  // Oliver Bearman: Street circuit fighter (Avg: 86.0)
  { name: 'Oliver Bearman', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'haas', ovr: 86, speed: 88, cornering: 86, defense: 86, consistency: 85, starts: 85 },
  // Liam Lawson: Hard defender & clutch starter (Avg: 86.0)
  { name: 'Liam Lawson', nationality: 'Nova Zelândia 🇳🇿', category: 'f1', teamId: 'vcarb', ovr: 86, speed: 87, cornering: 86, defense: 88, consistency: 85, starts: 84 },
  // Franco Colapinto: Fearless overtaking (Avg: 86.0)
  { name: 'Franco Colapinto', nationality: 'Argentina 🇦🇷', category: 'f1', teamId: 'williams', ovr: 86, speed: 89, cornering: 85, defense: 85, consistency: 85, starts: 86 },
  // Jack Doohan: Consistent developmental driver (Avg: 85.0)
  { name: 'Jack Doohan', nationality: 'Austrália 🇦🇺', category: 'f1', teamId: 'alpine', ovr: 85, speed: 87, cornering: 85, defense: 84, consistency: 85, starts: 84 },
  // Lance Stroll: Strong starts & wet weather capability (Avg: 85.0)
  { name: 'Lance Stroll', nationality: 'Canadá 🇨🇦', category: 'f1', teamId: 'aston', ovr: 85, speed: 86, cornering: 83, defense: 85, consistency: 84, starts: 87 }
];

// REAL F2 DRIVERS (Averages between 78 and 83)
export const REAL_F2_DRIVERS: RivalDriver[] = [
  { name: 'Isack Hadjar', nationality: 'França 🇫🇷', category: 'f2', teamId: 'f2_invicta', ovr: 83, speed: 86, cornering: 84, defense: 82, consistency: 82, starts: 81 },
  { name: 'Paul Aron', nationality: 'Estônia 🇪🇪', category: 'f2', teamId: 'f2_mp', ovr: 82, speed: 83, cornering: 85, defense: 81, consistency: 82, starts: 79 },
  { name: 'Zane Maloney', nationality: 'Barbados 🇧🇧', category: 'f2', teamId: 'f2_cams', ovr: 82, speed: 84, cornering: 81, defense: 82, consistency: 82, starts: 81 },
  { name: 'Victor Martins', nationality: 'França 🇫🇷', category: 'f2', teamId: 'f2_mp', ovr: 81, speed: 85, cornering: 82, defense: 79, consistency: 80, starts: 79 },
  { name: 'Jak Crawford', nationality: 'Estados Unidos 🇺🇸', category: 'f2', teamId: 'f2_invicta', ovr: 81, speed: 82, cornering: 80, defense: 81, consistency: 81, starts: 81 },
  { name: 'Pepe Martí', nationality: 'Espanha 🇪🇸', category: 'f2', teamId: 'f2_cams', ovr: 80, speed: 80, cornering: 82, defense: 79, consistency: 80, starts: 79 },
  { name: 'Zak O\'Sullivan', nationality: 'Reino Unido 🇬🇧', category: 'f2', teamId: 'f2_mp', ovr: 80, speed: 81, cornering: 80, defense: 79, consistency: 80, starts: 80 },
  { name: 'Roman Staněk', nationality: 'República Tcheca 🇨🇿', category: 'f2', teamId: 'f2_cams', ovr: 79, speed: 78, cornering: 80, defense: 80, consistency: 79, starts: 78 },
  { name: 'Kush Maini', nationality: 'Índia 🇮🇳', category: 'f2', teamId: 'f2_invicta', ovr: 79, speed: 81, cornering: 78, defense: 78, consistency: 79, starts: 79 },
  { name: 'Oliver Goethe', nationality: 'Alemanha 🇩🇪', category: 'f2', teamId: 'f2_mp', ovr: 78, speed: 79, cornering: 78, defense: 77, consistency: 78, starts: 78 }
];

// REAL F3 DRIVERS (Averages between 70 and 76)
export const REAL_F3_DRIVERS: RivalDriver[] = [
  { name: 'Leonardo Fornaroli', nationality: 'Itália 🇮🇹', category: 'f3', teamId: 'f3_trident', ovr: 76, speed: 75, cornering: 78, defense: 76, consistency: 76, starts: 75 },
  { name: 'Gabriele Minì', nationality: 'Itália 🇮🇹', category: 'f3', teamId: 'f3_prema', ovr: 75, speed: 77, cornering: 75, defense: 74, consistency: 75, starts: 74 },
  { name: 'Arvid Lindblad', nationality: 'Reino Unido 🇬🇧', category: 'f3', teamId: 'f3_prema', ovr: 75, speed: 76, cornering: 75, defense: 73, consistency: 75, starts: 76 },
  { name: 'Luke Browning', nationality: 'Reino Unido 🇬🇧', category: 'f3', teamId: 'f3_art', ovr: 74, speed: 75, cornering: 74, defense: 74, consistency: 74, starts: 73 },
  { name: 'Dino Beganovic', nationality: 'Suécia 🇸🇪', category: 'f3', teamId: 'f3_prema', ovr: 74, speed: 73, cornering: 76, defense: 73, consistency: 74, starts: 74 },
  { name: 'Tim Tramnitz', nationality: 'Alemanha 🇩🇪', category: 'f3', teamId: 'f3_trident', ovr: 72, speed: 73, cornering: 71, defense: 72, consistency: 72, starts: 72 },
  { name: 'Noel León', nationality: 'México 🇲🇽', category: 'f3', teamId: 'f3_art', ovr: 71, speed: 71, cornering: 72, defense: 70, consistency: 71, starts: 71 },
  { name: 'Nikola Tsolov', nationality: 'Bulgária 🇧🇬', category: 'f3', teamId: 'f3_art', ovr: 71, speed: 72, cornering: 70, defense: 70, consistency: 71, starts: 72 },
  { name: 'Mari Boya', nationality: 'Espanha 🇪🇸', category: 'f3', teamId: 'f3_trident', ovr: 70, speed: 70, cornering: 71, defense: 69, consistency: 70, starts: 70 }
];

// KART RIVALS (Averages between 45 and 54)
export const KART_RIVAL_DRIVERS: RivalDriver[] = [
  { name: 'Enzo Rossi', nationality: 'Itália 🇮🇹', category: 'kart', teamId: 'kart_tony', ovr: 54, speed: 55, cornering: 54, defense: 52, consistency: 54, starts: 55 },
  { name: 'Lucas Vance', nationality: 'Reino Unido 🇬🇧', category: 'kart', teamId: 'kart_birel', ovr: 53, speed: 52, cornering: 55, defense: 52, consistency: 53, starts: 53 },
  { name: 'Matteo Silva', nationality: 'Brasil 🇧🇷', category: 'kart', teamId: 'kart_crg', ovr: 52, speed: 54, cornering: 51, defense: 51, consistency: 52, starts: 52 },
  { name: 'Noah Becker', nationality: 'Alemanha 🇩🇪', category: 'kart', teamId: 'kart_tony', ovr: 51, speed: 50, cornering: 52, defense: 52, consistency: 51, starts: 50 },
  { name: 'Leo Laurent', nationality: 'França 🇫🇷', category: 'kart', teamId: 'kart_birel', ovr: 50, speed: 51, cornering: 50, defense: 49, consistency: 50, starts: 50 },
  { name: 'Daniel Santos', nationality: 'Portugal 🇵🇹', category: 'kart', teamId: 'kart_crg', ovr: 49, speed: 48, cornering: 51, defense: 48, consistency: 49, starts: 49 },
  { name: 'Julian Weber', nationality: 'Áustria 🇦🇹', category: 'kart', teamId: 'kart_tony', ovr: 48, speed: 49, cornering: 47, defense: 48, consistency: 48, starts: 48 },
  { name: 'Marco Moretti', nationality: 'Itália 🇮🇹', category: 'kart', teamId: 'kart_birel', ovr: 47, speed: 47, cornering: 48, defense: 46, consistency: 47, starts: 47 },
  { name: 'Theo Martin', nationality: 'Bélgica 🇧🇪', category: 'kart', teamId: 'kart_crg', ovr: 46, speed: 48, cornering: 45, defense: 45, consistency: 46, starts: 46 },
  { name: 'Alexandre Costa', nationality: 'Brasil 🇧🇷', category: 'kart', teamId: 'kart_birel', ovr: 45, speed: 45, cornering: 46, defense: 44, consistency: 45, starts: 45 }
];

// METAS DE PATROCÍNIO PARA A TEMPORADA (3 FÁCEIS, 2 MÉDIAS, 1 DIFÍCIL)
export const SPONSOR_CONTRACTS: SponsorContract[] = [
  // --- 3 METAS FÁCEIS ---
  {
    id: 'goal_facil_1_points',
    name: 'Apex Fuel Energy',
    brand: 'Apex Fuel',
    logo: '⚡',
    tier: 'local',
    difficulty: 'facil',
    category: 'all',
    objectiveType: 'points_finishes',
    targetValue: 2,
    title: 'Pontuar em 2 Corridas',
    description: 'Chegar no Top 10 e pontuar em pelo menos 2 etapas do campeonato.',
    rewardMoney: 1.20,
    rewardXp: 4,
    perRaceRetainer: 0.10
  },
  {
    id: 'goal_facil_2_pit',
    name: 'Duracool Radiators',
    brand: 'Duracool',
    logo: '🛡️',
    tier: 'local',
    difficulty: 'facil',
    category: 'all',
    objectiveType: 'clean_season_stints',
    targetValue: 2,
    title: '2 GPs com Máx 1 Pit Stop',
    description: 'Gerenciar os pneus e completar 2 etapas com no máximo 1 pit stop.',
    rewardMoney: 1.20,
    rewardXp: 4,
    perRaceRetainer: 0.10
  },
  {
    id: 'goal_facil_3_score',
    name: 'Nitro Surge Drinks',
    brand: 'Nitro Surge',
    logo: '🔥',
    tier: 'local',
    difficulty: 'facil',
    category: 'all',
    objectiveType: 'season_points',
    targetValue: 15,
    title: 'Somar 15+ Pontos no Ano',
    description: 'Acumular no mínimo 15 pontos na classificação geral do campeonato.',
    rewardMoney: 1.50,
    rewardXp: 5,
    perRaceRetainer: 0.10
  },

  // --- 2 METAS MÉDIAS ---
  {
    id: 'goal_media_1_podiums',
    name: 'Pirelli P-Zero Pro',
    brand: 'Pirelli',
    logo: '🟡',
    tier: 'regional',
    difficulty: 'media',
    category: 'all',
    objectiveType: 'season_podiums',
    targetValue: 2,
    title: 'Conquistar 2 Pódios',
    description: 'Subir ao pódio (Top 3) em pelo menos 2 Grandes Prêmios da temporada.',
    rewardMoney: 3.00,
    rewardXp: 9,
    perRaceRetainer: 0.20
  },
  {
    id: 'goal_media_2_points',
    name: 'Tag Chrono Watches',
    brand: 'Tag Chrono',
    logo: '⏱️',
    tier: 'regional',
    difficulty: 'media',
    category: 'all',
    objectiveType: 'season_points',
    targetValue: 40,
    title: 'Acumular 40+ Pontos',
    description: 'Demonstrar constância de ponta e somar 40 ou mais pontos no Mundial.',
    rewardMoney: 3.50,
    rewardXp: 9,
    perRaceRetainer: 0.20
  },

  // --- 1 META DIFÍCIL ---
  {
    id: 'goal_dificil_1_victory_top3',
    name: 'Rolex & Michelin Global Elite',
    brand: 'Rolex',
    logo: '👑',
    tier: 'global',
    difficulty: 'dificil',
    category: 'all',
    objectiveType: 'season_wins',
    targetValue: 1,
    title: 'Vitória em GP ou Top 3 Mundial',
    description: 'Vencer pelo menos 1 corrida em 1º lugar (P1) ou encerrar a temporada no Top 3 do Mundial!',
    rewardMoney: 6.50,
    rewardXp: 18,
    perRaceRetainer: 0.35
  }
];

export const getInitialSeasonGoals = (): SponsorContract[] => {
  return SPONSOR_CONTRACTS.map(g => ({
    ...g,
    currentProgress: 0,
    isCompleted: false
  }));
};

export interface TireDurabilityDetail {
  compound: TireCompound;
  minLaps: number;
  maxLaps: number;
  paceNote: string;
  durabilityNote: string;
  isOptimal: boolean;
  idealReason: string;
}

// Function to calculate precise lap lifespan and viability for any track
export const getTireDurabilityDetails = (track: Track): Record<TireCompound, TireDurabilityDetail> => {
  const laps = track.laps;
  const abrasion = track.tireAbrasion;
  const isWet = track.weather === 'Chuva';

  // Base durability in laps adjusted by track abrasion
  // Soft: fast degradation, around 35%-45% of race distance on normal tracks, down to 25% on abrasive tracks
  const softMax = Math.max(3, Math.round((laps * 0.44) / (abrasion * 1.05)));
  const softMin = Math.max(2, Math.round(softMax * 0.75));

  // Medium: balanced, around 65%-75% of race distance
  const medMax = Math.max(5, Math.round((laps * 0.72) / abrasion));
  const medMin = Math.max(4, Math.round(medMax * 0.8));

  // Hard: ultra durable, around 110%-130% of race distance (can run whole race without stopping)
  const hardMax = Math.max(8, Math.round((laps * 1.25) / abrasion));
  const hardMin = Math.max(6, Math.round(hardMax * 0.82));

  // Determine optimal compound based on track conditions:
  // 1. Wet track: Medium is optimal (grooved water evacuation)
  // 2. High abrasion track (abrasion >= 1.08 or long GP like Sakhir, Silverstone, Interlagos): Hard is optimal!
  //    Soft tires degrade too fast and cost 2-3s/lap penalty or multiple pits.
  // 3. Low abrasion track (abrasion <= 0.98 like Monaco, Monza, Canada, Jeddah): Soft is optimal!
  //    Tires don't wear out fast and Soft's +0.7s/lap pace dominates.
  // 4. Balanced tracks: Medium is optimal.
  let optimalCompound: TireCompound = 'Médio';
  if (isWet) {
    optimalCompound = 'Médio';
  } else if (abrasion >= 1.08 || track.id === 'f1_bahrain' || track.id === 'f1_silverstone' || track.id === 'f1_interlagos' || track.id === 'f3_silverstone' || track.id === 'f2_silverstone') {
    optimalCompound = 'Duro';
  } else if (abrasion <= 0.98 || track.id === 'f1_monaco' || track.id === 'f1_monza' || track.id === 'f1_canada' || track.id === 'f1_jeddah' || track.id === 'kart_genk') {
    optimalCompound = 'Macio';
  } else {
    optimalCompound = 'Médio';
  }

  return {
    Macio: {
      compound: 'Macio',
      minLaps: softMin,
      maxLaps: softMax,
      paceNote: '+0.5s a +0.8s mais rápido por volta',
      durabilityNote: `Duração: ${softMin} a ${softMax} voltas (Degradação Rápida)`,
      isOptimal: optimalCompound === 'Macio',
      idealReason: optimalCompound === 'Macio'
        ? 'Traçado com baixo desgaste de asfalto! O pneu Macio entrega vantagem brutal de aderência e velocidade sem colapsar a borracha.'
        : 'Em asfalto abrasivo, o pneu Macio sofrerá superaquecimento após poucas voltas, exigindo 2 pit stops.'
    },
    Médio: {
      compound: 'Médio',
      minLaps: medMin,
      maxLaps: medMax,
      paceNote: 'Ritmo padrão equilibrado',
      durabilityNote: `Duração: ${medMin} a ${medMax} voltas (Janela Ideal para 1 Parada)`,
      isOptimal: optimalCompound === 'Médio',
      idealReason: isWet 
        ? 'Asfalto molhado! O composto Médio fornece a melhor drenagem e equilíbrio para evitar rodadas.' 
        : 'Janela de corrida perfeita: permite 1 parada programada com excelente ritmo de volta em curvas.'
    },
    Duro: {
      compound: 'Duro',
      minLaps: hardMin,
      maxLaps: hardMax,
      paceNote: '-0.3s a -0.5s mais lento por volta',
      durabilityNote: `Duração: ${hardMin} a ${hardMax}+ voltas (Suporta a corrida toda sem parar)`,
      isOptimal: optimalCompound === 'Duro',
      idealReason: optimalCompound === 'Duro'
        ? `Asfalto altamente abrasivo (${abrasion}x)! O pneu Duro é a arma vencedora: mantém consistência por ${hardMin}+ voltas e economiza 20s+ de pit stop!`
        : 'Pneu muito rígido para pistas de baixa abrasão; demorará para aquecer e renderá menos aderência.'
    }
  };
};

export interface TeamTireAdvice {
  recommendedTire: TireCompound;
  title: string;
  reason: string;
  badgeStyle: string;
}

export const getTeamTireAdvice = (track: Track): TeamTireAdvice => {
  const details = getTireDurabilityDetails(track);
  if (track.weather === 'Chuva') {
    return {
      recommendedTire: 'Médio',
      title: 'Pista Molhada (Chuva)',
      reason: 'Asfalto molhado e escorregadio! O composto Médio garante o melhor compromisso de aderência e dirigibilidade nas curvas úmidas, reduzindo drasticamente o risco de rodadas.',
      badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    };
  }

  if (details.Duro.isOptimal) {
    return {
      recommendedTire: 'Duro',
      title: 'Alta Abrasão · Pneu Duro Ideal',
      reason: `Asfalto extremamente agressivo (${track.tireAbrasion}x) ao longo de ${track.laps} voltas. Pneus Macios colapsam em poucas voltas. O pneu Duro aguenta ${details.Duro.minLaps}-${details.Duro.maxLaps} voltas e permite vencer economizando paradas no box!`,
      badgeStyle: 'bg-slate-700/50 text-slate-200 border-slate-500/40'
    };
  }

  if (details.Macio.isOptimal) {
    return {
      recommendedTire: 'Macio',
      title: 'Baixa Degradação · Pneu Macio Ideal',
      reason: `Traçado veloz com asfalto suave (${track.tireAbrasion}x). O pneu Macio suporta até ${details.Macio.maxLaps} voltas com ganho de +0.7s/volta de velocidade pura, sendo a estratégia mais veloz para a vitória!`,
      badgeStyle: 'bg-red-500/20 text-red-300 border-red-500/40'
    };
  }

  return {
    recommendedTire: 'Médio',
    title: 'Estratégia Equilibrada · Pneu Médio',
    reason: `Configuração mista e equilibrada. O pneu Médio dura ${details.Médio.minLaps} a ${details.Médio.maxLaps} voltas, encaixando perfeitamente na estratégia de 1 parada rápida.`,
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  };
};

export const CAREER_MILESTONES: CareerMilestone[] = [
  {
    id: 'first_win',
    title: 'Primeira Vitória',
    description: 'Vença sua primeira corrida oficial na carreira.',
    conditionType: 'wins',
    targetValue: 1,
    rewardMoney: 1.0,
    rewardXp: 8,
    categoryTag: 'Vitórias & Pódios'
  },
  {
    id: 'poles_5',
    title: '5 Pole Positions',
    description: 'Conquiste 5 pole positions oficiais na carreira.',
    conditionType: 'poles',
    targetValue: 5,
    rewardMoney: 1.8,
    rewardXp: 10,
    categoryTag: 'Vitórias & Pódios'
  },
  {
    id: 'podiums_10',
    title: '10 Pódios na Carreira',
    description: 'Suba ao pódio (Top 3) em 10 corridas ao longo da sua trajetória.',
    conditionType: 'podiums',
    targetValue: 10,
    rewardMoney: 2.5,
    rewardXp: 12,
    categoryTag: 'Vitórias & Pódios'
  },
  {
    id: 'podiums_25',
    title: 'Lenda dos Pódios (25 Pódios)',
    description: 'Acumule 25 pódios de prestígio no automobilismo.',
    conditionType: 'podiums',
    targetValue: 25,
    rewardMoney: 6.0,
    rewardXp: 20,
    categoryTag: 'Vitórias & Pódios'
  },
  {
    id: 'first_championship',
    title: 'Primeira Vitória no Campeonato',
    description: 'Conquiste seu primeiro título de Campeão da temporada.',
    conditionType: 'championships',
    targetValue: 1,
    rewardMoney: 5.0,
    rewardXp: 25,
    categoryTag: 'Evolução & Títulos'
  },
  {
    id: 'races_10',
    title: 'Estreante de Garra',
    description: 'Dispute 10 corridas no automobilismo profissional.',
    conditionType: 'races',
    targetValue: 10,
    rewardMoney: 0.8,
    rewardXp: 5,
    categoryTag: 'Experiência & Riqueza'
  },
  {
    id: 'races_30',
    title: 'Veterano das Pistas',
    description: 'Dispute 30 Grandes Prêmios ao longo da sua carreira.',
    conditionType: 'races',
    targetValue: 30,
    rewardMoney: 3.0,
    rewardXp: 15,
    categoryTag: 'Experiência & Riqueza'
  },
  {
    id: 'ovr_80',
    title: 'Mestre da Telemetria',
    description: 'Alcance uma Média FIA de 80 OVR ou mais.',
    conditionType: 'driver_ovr',
    targetValue: 80,
    rewardMoney: 2.0,
    rewardXp: 15,
    categoryTag: 'Evolução & Títulos'
  },
  {
    id: 'reach_f1',
    title: 'Chegada à Fórmula 1',
    description: 'Alcance o topo do automobilismo e ingresse na categoria F1.',
    conditionType: 'category_f1',
    targetValue: 1,
    rewardMoney: 10.0,
    rewardXp: 40,
    categoryTag: 'Evolução & Títulos'
  },
  {
    id: 'millionaire',
    title: 'Magnata das Pistas',
    description: 'Acumule $15.0M ou mais no seu orçamento bancário.',
    conditionType: 'money',
    targetValue: 15,
    rewardMoney: 2.5,
    rewardXp: 20,
    categoryTag: 'Experiência & Riqueza'
  }
];
