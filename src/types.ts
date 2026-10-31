export type MotorsportCategory = 'kart' | 'f3' | 'f2' | 'f1';

export type TireCompound = 'Macio' | 'Médio' | 'Duro' | 'Chuva Leve' | 'Chuva Pesada';

export type RaceMode = 'rapido' | 'estrategico';

export interface DriverAttributes {
  speed: number;        
  overtaking: number;   
  defense: number;      
  consistency: number;  
  starts: number;       
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  category: MotorsportCategory;
  carPerformance: number; 
  reliability: number;     
  bonusType: string;
  prestige: number;        
  attributeBonuses?: Partial<DriverAttributes>;
}

export type WeatherCondition = 'Seco' | 'Nublado' | 'Chuva' | 'Chuva Leve' | 'Chuva Pesada';

export interface Track {
  id: string;
  name: string;
  country: string;
  circuit: string;
  category: MotorsportCategory;
  laps: number;
  realLaps: number;
  weather: WeatherCondition;
  difficulty: number;
  characteristics: string;
  profileType: 'Alta Velocidade (Retas)' | 'Técnico (Muitas Curvas)' | 'Misto Equilibrado' | 'Travado (Rua)';
  straightWeight: number; // 0.1 to 0.6
  cornerWeight: number;   // 0.1 to 0.6
  defenseWeight: number;  // 0.1 to 0.5
  tireAbrasion: number;   // 0.85 to 1.25 multiplier
  svgPath: string;        // SVG path d string in a 300x180 viewBox
}

export interface SeasonHistoryEntry {
  season: number;
  category: MotorsportCategory;
  teamId: string;
  teamName: string;
  teamColor: string;
  finalPosition: number;
  wins: number;
  podiums: number;
  points: number;
  promoted: boolean;
}

export type SponsorDifficulty = 'facil' | 'media' | 'dificil';

export type SponsorObjectiveType = 
  | 'season_podiums'      // Conquistar X pódios na temporada
  | 'season_wins'         // Vencer X corridas na temporada
  | 'season_points'       // Conquistar X pontos no campeonato mundial
  | 'season_top_pos'      // Terminar a temporada no Top X (ex: Top 3, Top 5)
  | 'beat_rival_season'   // Terminar a temporada à frente do Rival no Mundial
  | 'points_finishes'     // Pontuar (Top 10) em pelo menos X corridas da temporada
  | 'clean_season_stints'; // Completar X corridas com no máximo 1 pit stop

export interface SponsorContract {
  id: string;
  name: string;
  brand: string;
  logo: string;
  tier: 'local' | 'regional' | 'global';
  difficulty: SponsorDifficulty;
  category: MotorsportCategory | 'all';
  objectiveType: SponsorObjectiveType;
  targetValue: number;
  targetRivalName?: string;
  title: string;
  description: string;
  rewardMoney: number; // Em Milhões ($ M) - Bônus de fim de temporada
  rewardXp: number;    // Pontos de Treino (XP) - Bônus de fim de temporada
  perRaceRetainer?: number; // Estipêndio fixo pago por corrida ($ M)
  currentProgress?: number; // Progresso atual na temporada
  isCompleted?: boolean;
}

export interface SeasonAutosave {
  season: number;
  category: MotorsportCategory;
  teamId: string;
  attributes: DriverAttributes;
  money: number;
  reputation: number;
  savedAt: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  isWidescreenMode: boolean;
  simulationSpeed: 1 | 2;
  autosaveNotifications: boolean;
  aiDifficulty: 'Normal' | 'Desafiador' | 'Hardcore';
}

export interface Driver {
  id: number; // Slot 1, 2, 3, 4
  name: string;
  nationality: string;
  helmetColor: string;
  helmetSecondaryColor?: string;
  category: MotorsportCategory;
  teamId: string;
  attributes: DriverAttributes;
  lockedAttributes: DriverAttributes;
  reputation: number; 
  money: number;      
  careerStats: {
    seasons: number;
    races: number;
    wins: number;
    podiums: number;
    poles: number;
    championships: number;
    points: number;
  };
  seasonHistory: SeasonHistoryEntry[];
  seasonAutosaves?: SeasonAutosave[]; // Autosaves automáticos ao início de todo novo ano
  // Slot persistence data
  currentSeason?: number;
  currentRaceIndex?: number;
  trainingPoints?: number;
  savedDriverStandings?: DriverStanding[];
  savedConstructorStandings?: ConstructorStanding[];
  activeSponsors?: SponsorContract[];
  seasonGoals?: SponsorContract[];
  sponsorshipEarnings?: {
    money: number;
    xp: number;
    completedCount: number;
  };
  claimedMilestones?: string[]; // IDs das conquistas resgatadas
  raceMode?: RaceMode; // Modo de corrida selecionado na carreira (Rápido ou Estratégico)
  lastSaved?: string;
}

export type MilestoneConditionType =
  | 'podiums'        // Total de pódios na carreira
  | 'poles'          // Total de pole positions na carreira
  | 'wins'           // Total de vitórias na carreira
  | 'races'          // Total de corridas disputadas na carreira
  | 'championships'  // Títulos de campeonato conquistados
  | 'driver_ovr'     // Média OVR dos atributos do piloto
  | 'money'          // Saldo bancário em milhões ($ M)
  | 'category_f1';   // Alcançar a Fórmula 1

export interface CareerMilestone {
  id: string;
  title: string;
  description: string;
  conditionType: MilestoneConditionType;
  targetValue: number;
  rewardMoney: number; // Em Milhões ($ M)
  rewardXp: number;    // Pontos de Treino (XP)
  categoryTag: 'Vitórias & Pódios' | 'Evolução & Títulos' | 'Experiência & Riqueza';
}

export interface RivalDriver {
  name: string;
  nationality: string;
  category: MotorsportCategory;
  teamId: string;
  ovr: number;
  speed: number;
  cornering: number;
  defense: number;
  consistency?: number;
  starts?: number;
}

export interface QualifyingResult {
  driverName: string;
  teamId: string;
  lapTime: string; 
  rawTime: number; 
  isPlayer: boolean;
}

export interface LiveRaceCar {
  driverName: string;
  teamId: string;
  pos: number;
  prevPos: number;
  startGridPos: number;
  isPlayer: boolean;
  gap: string;
  cumulativeTime: number;
  lastLapTime: string;
  bestLapSeconds: number;
  bestLapTimeStr: string;
  overtakesCount: number;
  tireHealth: number;       // 0 to 100
  tireCompound: TireCompound;
  pitStops: number;
  inPit: boolean;
  speedStat: number;
  cornerStat: number;
  defenseStat: number;
  carPerf: number;
  statusTag?: string;       // e.g. '⬆️ +1', '🔧 BOX', '🛡️ DEF'
  dnf?: boolean;
  dnfReason?: 'Acidente (Derrapagem)' | 'Acidente (Ultrapassagem)' | 'Falha no Motor';
  willFailEngineLap?: number;
  aggressiveRainLaps?: number;
}

export interface RaceEvent {
  lap: number;
  description: string;
  type: 'overtake' | 'defense' | 'incident' | 'pit' | 'weather' | 'normal';
  attackerName?: string;
  defenderName?: string;
  attackerTeamId?: string;
  defenderTeamId?: string;
  isPlayerInvolved?: boolean;
  newPosition?: number;
  intensity?: 'mild' | 'intense' | 'extreme';
}

export interface ConstructorStanding {
  teamId: string;
  points: number;
  wins: number;
}

export interface DriverStanding {
  driverName: string;
  teamId: string;
  points: number;
  wins: number;
  podiums: number;
}
