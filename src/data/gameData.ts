import { Team, Track, RivalDriver, SponsorContract, TireCompound } from '../types';

export const TEAMS: Team[] = [
  // KART TEAMS
  { id: 'kart_birel', name: 'Birel ART Karting', shortName: 'BIR', color: '#3b82f6', category: 'kart', carPerformance: 50, reliability: 95, bonusType: 'Agilidade em Baixa Velocidade', prestige: 1 },
  { id: 'kart_crg', name: 'CRG Racing Team', shortName: 'CRG', color: '#ef4444', category: 'kart', carPerformance: 52, reliability: 92, bonusType: 'Aceleração Inicial', prestige: 1 },
  { id: 'kart_tony', name: 'Tony Kart Official', shortName: 'TNY', color: '#10b981', category: 'kart', carPerformance: 51, reliability: 94, bonusType: 'Estabilidade em Chassi', prestige: 1 },

  // F3 TEAMS
  { id: 'f3_prema', name: 'Prema Racing F3', shortName: 'PRE', color: '#e10600', category: 'f3', carPerformance: 72, reliability: 90, bonusType: 'Desenvolvimento de Piloto +15%', prestige: 3 },
  { id: 'f3_trident', name: 'Trident F3', shortName: 'TRI', color: '#0284c7', category: 'f3', carPerformance: 70, reliability: 91, bonusType: 'Acerto de Chassi Rápido', prestige: 3 },
  { id: 'f3_art', name: 'ART Grand Prix F3', shortName: 'ART', color: '#8b5cf6', category: 'f3', carPerformance: 69, reliability: 89, bonusType: 'Velocidade em Curvas de Alta', prestige: 3 },

  // F2 TEAMS
  { id: 'f2_invicta', name: 'Invicta Racing F2', shortName: 'INV', color: '#f59e0b', category: 'f2', carPerformance: 82, reliability: 88, bonusType: 'Gestão de Pneus', prestige: 6 },
  { id: 'f2_mp', name: 'MP Motorsport F2', shortName: 'MP', color: '#f97316', category: 'f2', carPerformance: 80, reliability: 87, bonusType: 'Largadas Potentes', prestige: 6 },
  { id: 'f2_cams', name: 'Campos Racing F2', shortName: 'CAM', color: '#06b6d4', category: 'f2', carPerformance: 81, reliability: 86, bonusType: 'Estratégia de Pit Stop', prestige: 6 },

  // F1 TEAMS
  { id: 'ferrari', name: 'Scuderia Ferrari F1', shortName: 'FER', color: '#e10600', category: 'f1', carPerformance: 94, reliability: 89, bonusType: 'Motor V6 Potente', prestige: 10 },
  { id: 'mclaren', name: 'McLaren F1 Team', shortName: 'MCL', color: '#ff8000', category: 'f1', carPerformance: 95, reliability: 92, bonusType: 'Aerodinâmica de Ponta', prestige: 10 },
  { id: 'redbull', name: 'Red Bull Racing F1', shortName: 'RBR', color: '#3671c6', category: 'f1', carPerformance: 96, reliability: 91, bonusType: 'Estratégia Perfeita', prestige: 10 },
  { id: 'mercedes', name: 'Mercedes-AMG Petronas F1', shortName: 'MER', color: '#6cd3bf', category: 'f1', carPerformance: 92, reliability: 95, bonusType: 'Confiabilidade Mecânica', prestige: 9 },
  { id: 'aston', name: 'Aston Martin Aramco F1', shortName: 'AMR', color: '#229971', category: 'f1', carPerformance: 87, reliability: 90, bonusType: 'Infraestrutura Avançada', prestige: 8 },
  { id: 'alpine', name: 'BWT Alpine F1 Team', shortName: 'ALP', color: '#0090ff', category: 'f1', carPerformance: 82, reliability: 85, bonusType: 'Balanço em Curvas Médias', prestige: 7 },
  { id: 'vcarb', name: 'Visa Cash App RB F1', shortName: 'VCB', color: '#6692ff', category: 'f1', carPerformance: 81, reliability: 86, bonusType: 'Trocas de Pneus Ágeis', prestige: 6 },
  { id: 'williams', name: 'Williams Racing F1', shortName: 'WIL', color: '#005aff', category: 'f1', carPerformance: 79, reliability: 86, bonusType: 'Velocidade de Reta Pura', prestige: 6 },
  { id: 'haas', name: 'Haas F1 Team', shortName: 'HAS', color: '#b6babd', category: 'f1', carPerformance: 76, reliability: 82, bonusType: 'Baixo Custo de Manutenção', prestige: 5 },
  { id: 'sauber', name: 'Stake F1 Team Sauber', shortName: 'SAU', color: '#52e252', category: 'f1', carPerformance: 74, reliability: 80, bonusType: 'Agressividade na Largada', prestige: 5 }
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

// REAL F1 DRIVERS WITH REAL NATIONALITIES, OVR, AND SPECIALIZED STATS
export const REAL_F1_DRIVERS: RivalDriver[] = [
  { name: 'Max Verstappen', nationality: 'Holanda 🇳🇱', category: 'f1', teamId: 'redbull', ovr: 98, speed: 99, cornering: 97, defense: 98 },
  { name: 'Lando Norris', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'mclaren', ovr: 95, speed: 96, cornering: 95, defense: 92 },
  { name: 'Charles Leclerc', nationality: 'Mônaco 🇲🇨', category: 'f1', teamId: 'ferrari', ovr: 94, speed: 97, cornering: 94, defense: 91 },
  { name: 'Lewis Hamilton', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'ferrari', ovr: 93, speed: 92, cornering: 95, defense: 94 },
  { name: 'Oscar Piastri', nationality: 'Austrália 🇦🇺', category: 'f1', teamId: 'mclaren', ovr: 92, speed: 92, cornering: 93, defense: 92 },
  { name: 'George Russell', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'mercedes', ovr: 91, speed: 92, cornering: 91, defense: 90 },
  { name: 'Fernando Alonso', nationality: 'Espanha 🇪🇸', category: 'f1', teamId: 'aston', ovr: 90, speed: 88, cornering: 92, defense: 96 },
  { name: 'Carlos Sainz', nationality: 'Espanha 🇪🇸', category: 'f1', teamId: 'williams', ovr: 89, speed: 89, cornering: 90, defense: 90 },
  { name: 'Alex Albon', nationality: 'Tailândia 🇹🇭', category: 'f1', teamId: 'williams', ovr: 87, speed: 90, cornering: 85, defense: 88 },
  { name: 'Yuki Tsunoda', nationality: 'Japão 🇯🇵', category: 'f1', teamId: 'vcarb', ovr: 86, speed: 87, cornering: 86, defense: 84 },
  { name: 'Nico Hulkenberg', nationality: 'Alemanha 🇩🇪', category: 'f1', teamId: 'sauber', ovr: 85, speed: 86, cornering: 84, defense: 86 },
  { name: 'Pierre Gasly', nationality: 'França 🇫🇷', category: 'f1', teamId: 'alpine', ovr: 85, speed: 85, cornering: 86, defense: 85 },
  { name: 'Esteban Ocon', nationality: 'França 🇫🇷', category: 'f1', teamId: 'haas', ovr: 84, speed: 83, cornering: 84, defense: 88 },
  { name: 'Andrea Kimi Antonelli', nationality: 'Itália 🇮🇹', category: 'f1', teamId: 'mercedes', ovr: 84, speed: 87, cornering: 84, defense: 81 },
  { name: 'Oliver Bearman', nationality: 'Reino Unido 🇬🇧', category: 'f1', teamId: 'haas', ovr: 83, speed: 85, cornering: 83, defense: 82 },
  { name: 'Gabriel Bortoleto', nationality: 'Brasil 🇧🇷', category: 'f1', teamId: 'sauber', ovr: 83, speed: 84, cornering: 85, defense: 82 },
  { name: 'Liam Lawson', nationality: 'Nova Zelândia 🇳🇿', category: 'f1', teamId: 'vcarb', ovr: 83, speed: 83, cornering: 83, defense: 85 },
  { name: 'Franco Colapinto', nationality: 'Argentina 🇦🇷', category: 'f1', teamId: 'williams', ovr: 82, speed: 84, cornering: 82, defense: 81 },
  { name: 'Jack Doohan', nationality: 'Austrália 🇦🇺', category: 'f1', teamId: 'alpine', ovr: 82, speed: 83, cornering: 81, defense: 81 },
  { name: 'Lance Stroll', nationality: 'Canadá 🇨🇦', category: 'f1', teamId: 'aston', ovr: 81, speed: 82, cornering: 80, defense: 80 }
];

// REAL F2 DRIVERS
export const REAL_F2_DRIVERS: RivalDriver[] = [
  { name: 'Isack Hadjar', nationality: 'França 🇫🇷', category: 'f2', teamId: 'f2_invicta', ovr: 84, speed: 86, cornering: 84, defense: 82 },
  { name: 'Paul Aron', nationality: 'Estônia 🇪🇪', category: 'f2', teamId: 'f2_mp', ovr: 83, speed: 83, cornering: 85, defense: 81 },
  { name: 'Zane Maloney', nationality: 'Barbados 🇧🇧', category: 'f2', teamId: 'f2_cams', ovr: 82, speed: 84, cornering: 81, defense: 82 },
  { name: 'Victor Martins', nationality: 'França 🇫🇷', category: 'f2', teamId: 'f2_mp', ovr: 82, speed: 85, cornering: 82, defense: 79 },
  { name: 'Jak Crawford', nationality: 'Estados Unidos 🇺🇸', category: 'f2', teamId: 'f2_invicta', ovr: 81, speed: 82, cornering: 80, defense: 81 },
  { name: 'Pepe Martí', nationality: 'Espanha 🇪🇸', category: 'f2', teamId: 'f2_cams', ovr: 80, speed: 80, cornering: 82, defense: 79 },
  { name: 'Zak O\'Sullivan', nationality: 'Reino Unido 🇬🇧', category: 'f2', teamId: 'f2_mp', ovr: 80, speed: 81, cornering: 80, defense: 79 },
  { name: 'Roman Staněk', nationality: 'República Tcheca 🇨🇿', category: 'f2', teamId: 'f2_cams', ovr: 79, speed: 78, cornering: 80, defense: 80 },
  { name: 'Kush Maini', nationality: 'Índia 🇮🇳', category: 'f2', teamId: 'f2_invicta', ovr: 79, speed: 81, cornering: 78, defense: 78 },
  { name: 'Oliver Goethe', nationality: 'Alemanha 🇩🇪', category: 'f2', teamId: 'f2_mp', ovr: 78, speed: 79, cornering: 78, defense: 77 }
];

// REAL F3 DRIVERS
export const REAL_F3_DRIVERS: RivalDriver[] = [
  { name: 'Leonardo Fornaroli', nationality: 'Itália 🇮🇹', category: 'f3', teamId: 'f3_trident', ovr: 76, speed: 75, cornering: 78, defense: 76 },
  { name: 'Gabriele Minì', nationality: 'Itália 🇮🇹', category: 'f3', teamId: 'f3_prema', ovr: 75, speed: 77, cornering: 75, defense: 74 },
  { name: 'Arvid Lindblad', nationality: 'Reino Unido 🇬🇧', category: 'f3', teamId: 'f3_prema', ovr: 75, speed: 76, cornering: 75, defense: 73 },
  { name: 'Luke Browning', nationality: 'Reino Unido 🇬🇧', category: 'f3', teamId: 'f3_art', ovr: 74, speed: 75, cornering: 74, defense: 74 },
  { name: 'Dino Beganovic', nationality: 'Suécia 🇸🇪', category: 'f3', teamId: 'f3_prema', ovr: 74, speed: 73, cornering: 76, defense: 73 },
  { name: 'Tim Tramnitz', nationality: 'Alemanha 🇩🇪', category: 'f3', teamId: 'f3_trident', ovr: 72, speed: 73, cornering: 71, defense: 72 },
  { name: 'Noel León', nationality: 'México 🇲🇽', category: 'f3', teamId: 'f3_art', ovr: 71, speed: 71, cornering: 72, defense: 70 },
  { name: 'Nikola Tsolov', nationality: 'Bulgária 🇧🇬', category: 'f3', teamId: 'f3_art', ovr: 71, speed: 72, cornering: 70, defense: 70 },
  { name: 'Mari Boya', nationality: 'Espanha 🇪🇸', category: 'f3', teamId: 'f3_trident', ovr: 70, speed: 70, cornering: 71, defense: 69 }
];

// KART RIVALS
export const KART_RIVAL_DRIVERS: RivalDriver[] = [
  { name: 'Enzo Rossi', nationality: 'Itália 🇮🇹', category: 'kart', teamId: 'kart_tony', ovr: 54, speed: 55, cornering: 54, defense: 52 },
  { name: 'Lucas Vance', nationality: 'Reino Unido 🇬🇧', category: 'kart', teamId: 'kart_birel', ovr: 53, speed: 52, cornering: 55, defense: 52 },
  { name: 'Matteo Silva', nationality: 'Brasil 🇧🇷', category: 'kart', teamId: 'kart_crg', ovr: 52, speed: 54, cornering: 51, defense: 51 },
  { name: 'Noah Becker', nationality: 'Alemanha 🇩🇪', category: 'kart', teamId: 'kart_tony', ovr: 51, speed: 50, cornering: 52, defense: 52 },
  { name: 'Leo Laurent', nationality: 'França 🇫🇷', category: 'kart', teamId: 'kart_birel', ovr: 50, speed: 51, cornering: 50, defense: 49 },
  { name: 'Daniel Santos', nationality: 'Portugal 🇵🇹', category: 'kart', teamId: 'kart_crg', ovr: 49, speed: 48, cornering: 51, defense: 48 },
  { name: 'Julian Weber', nationality: 'Áustria 🇦🇹', category: 'kart', teamId: 'kart_tony', ovr: 48, speed: 49, cornering: 47, defense: 48 },
  { name: 'Marco Moretti', nationality: 'Itália 🇮🇹', category: 'kart', teamId: 'kart_birel', ovr: 47, speed: 47, cornering: 48, defense: 46 },
  { name: 'Theo Martin', nationality: 'Bélgica 🇧🇪', category: 'kart', teamId: 'kart_crg', ovr: 46, speed: 48, cornering: 45, defense: 45 },
  { name: 'Alexandre Costa', nationality: 'Brasil 🇧🇷', category: 'kart', teamId: 'kart_birel', ovr: 45, speed: 45, cornering: 46, defense: 44 }
];

export const SPONSOR_CONTRACTS: SponsorContract[] = [
  // --- TIER LOCAL (KART & F3) ---
  {
    id: 'sp_rival_duel',
    name: 'Apex Fuel Energy',
    brand: 'Apex Fuel',
    logo: '⚡',
    tier: 'local',
    category: 'all',
    objectiveType: 'beat_rival',
    targetValue: 0,
    title: 'Duelo de Rivalidade',
    description: 'Terminar a corrida à frente do seu rival de equipe ou rival direto na pista.',
    rewardMoney: 0.45,
    rewardXp: 3
  },
  {
    id: 'sp_endurance_kart',
    name: 'Duracool Radiators',
    brand: 'Duracool',
    logo: '🛡️',
    tier: 'local',
    category: 'all',
    objectiveType: 'laps_no_pit',
    targetValue: 0, // 0 pit stops
    title: 'Resistência Pura (Zero Box)',
    description: 'Completar toda a prova sem realizar nenhum pit stop de pneus.',
    rewardMoney: 0.60,
    rewardXp: 4
  },
  {
    id: 'sp_top_five',
    name: 'Brembo Racing Pads',
    brand: 'Brembo',
    logo: '🔴',
    tier: 'local',
    category: 'all',
    objectiveType: 'top_finish',
    targetValue: 5,
    title: 'Pelotão da Frente (Top 5)',
    description: 'Cruzar a linha de chegada entre os 5 primeiros colocados (P1 a P5).',
    rewardMoney: 0.50,
    rewardXp: 3
  },
  {
    id: 'sp_overtake_master',
    name: 'Nitro Surge Drinks',
    brand: 'Nitro Surge',
    logo: '🔥',
    tier: 'local',
    category: 'all',
    objectiveType: 'gain_positions',
    targetValue: 2,
    title: 'Mestre da Escalada (+2 Posições)',
    description: 'Ganhar pelo menos 2 posições na corrida em relação ao seu grid de largada.',
    rewardMoney: 0.55,
    rewardXp: 3
  },

  // --- TIER REGIONAL (F3 & F2) ---
  {
    id: 'sp_podium_strike',
    name: 'Pirelli P-Zero Pro',
    brand: 'Pirelli',
    logo: '🟡',
    tier: 'regional',
    category: 'all',
    objectiveType: 'top_finish',
    targetValue: 3,
    title: 'Pódio de Honra (Top 3)',
    description: 'Garantir um troféu no pódio terminando em 1º, 2º ou 3º lugar.',
    rewardMoney: 1.10,
    rewardXp: 5
  },
  {
    id: 'sp_charge_forward',
    name: 'Mobil 1 Super Syn',
    brand: 'Mobil 1',
    logo: '🚀',
    tier: 'regional',
    category: 'all',
    objectiveType: 'gain_positions',
    targetValue: 4,
    title: 'Recuperação Épica (+4 Posições)',
    description: 'Fazer uma corrida agressiva ganhando 4 ou mais posições após a largada.',
    rewardMoney: 1.25,
    rewardXp: 5
  },
  {
    id: 'sp_clean_points',
    name: 'Tag Chrono Watches',
    brand: 'Tag Chrono',
    logo: '⏱️',
    tier: 'regional',
    category: 'all',
    objectiveType: 'clean_race',
    targetValue: 10,
    title: 'Ritmo Pontual (Top 10)',
    description: 'Completar a corrida com solidez sem erros e pontuar na zona do Top 10.',
    rewardMoney: 0.85,
    rewardXp: 3
  },

  // --- TIER GLOBAL (F2 & F1) ---
  {
    id: 'sp_victory_crown',
    name: 'Rolex Global Precision',
    brand: 'Rolex',
    logo: '👑',
    tier: 'global',
    category: 'all',
    objectiveType: 'top_finish',
    targetValue: 1,
    title: 'Vitória Suprema (1º Lugar)',
    description: 'Dominar o final de semana e vencer a corrida no degrau mais alto do pódio.',
    rewardMoney: 2.50,
    rewardXp: 8
  },
  {
    id: 'sp_mega_duel',
    name: 'Santander Premier Racing',
    brand: 'Santander',
    logo: '💎',
    tier: 'global',
    category: 'all',
    objectiveType: 'beat_rival',
    targetValue: 0,
    title: 'Supremacia Absoluta sobre Rival',
    description: 'Bater o principal rival de campeonato com vantagem na linha de chegada.',
    rewardMoney: 1.80,
    rewardXp: 6
  },
  {
    id: 'sp_tire_strategy_pro',
    name: 'Michelin Endurance Elite',
    brand: 'Michelin',
    logo: '🏁',
    tier: 'global',
    category: 'all',
    objectiveType: 'laps_no_pit',
    targetValue: 1, // Max 1 pit stop em corrida longa
    title: 'Estratégia Econômica (Máx 1 Pit)',
    description: 'Executar estratégia de pneus conservadora completando com no máximo 1 pit stop.',
    rewardMoney: 1.40,
    rewardXp: 5
  }
];

export interface TeamTireAdvice {
  recommendedTire: TireCompound;
  title: string;
  reason: string;
  badgeStyle: string;
}

export const getTeamTireAdvice = (track: Track): TeamTireAdvice => {
  if (track.weather === 'Chuva') {
    return {
      recommendedTire: 'Médio',
      title: 'Pista Molhada (Chuva)',
      reason: 'Asfalto molhado e escorregadio! O composto Médio garante o melhor compromisso de aderência e dirigibilidade nas curvas úmidas, reduzindo drasticamente o risco de rodadas.',
      badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    };
  }

  // Highly abrasive track
  if (track.tireAbrasion >= 1.12) {
    if (track.laps >= 14) {
      return {
        recommendedTire: 'Duro',
        title: 'Alta Abrasão & Corrida Longa',
        reason: `Asfalto extremamente agressivo (${track.tireAbrasion}x) ao longo de ${track.laps} voltas. O pneu Duro é a melhor arma para tentar 0 a 1 pit stop sem sofrer colapso de borracha no fim.`,
        badgeStyle: 'bg-slate-700/50 text-slate-200 border-slate-500/40'
      };
    }
    return {
      recommendedTire: 'Médio',
      title: 'Abrasão Elevada',
      reason: `Circuito de alta degradação (${track.tireAbrasion}x). O pneu Médio oferece velocidade consistente e encaixa perfeitamente na janela da nossa parada automática programada.`,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  }

  // High speed straight track with moderate/low abrasion
  if (track.profileType === 'Alta Velocidade (Retas)' || track.straightWeight >= 0.42) {
    if (track.tireAbrasion <= 1.05) {
      return {
        recommendedTire: 'Macio',
        title: 'Traçado de Velocidade Pura',
        reason: 'Pista veloz com retas amplas e desgaste brando! O pneu Macio proporcionará vantagem de aceleração imediata para abrir margem ou buscar ultrapassagens nas primeiras voltas.',
        badgeStyle: 'bg-red-500/20 text-red-300 border-red-500/40'
      };
    }
  }

  // Technical or street track with high cornering
  if (track.profileType === 'Técnico (Muitas Curvas)' || track.cornerWeight >= 0.45) {
    return {
      recommendedTire: 'Médio',
      title: 'Traçado Técnico e Travado',
      reason: 'Muitas curvas exigem estabilidade de chassi constante. O pneu Médio aguenta as frenagens fortes e mudanças de direção sem superaquecer.',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  }

  // Default balanced
  return {
    recommendedTire: 'Médio',
    title: 'Estratégia Recomendada Padrão',
    reason: 'Configuração mista e equilibrada. O composto Médio é a nossa recomendação oficial: ótimo ritmo inicial com durabilidade segura até o pit stop automático.',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  };
};
