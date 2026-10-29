export type MotorsportCategory = 'kart' | 'f3' | 'f2' | 'f1';

export type TireCompound = 'Macio' | 'Médio' | 'Duro';

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
}

export type WeatherCondition = 'Seco' | 'Nublado' | 'Chuva';

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

export type SponsorObjectiveType = 
  | 'beat_rival'       // Chegar à frente de um rival específico
  | 'laps_no_pit'      // Completar a corrida sem pit stop (ou no máximo 1)
  | 'top_finish'       // Chegar no Top X (ex: Top 3, Top 5)
  | 'gain_positions'   // Ganhar pelo menos X posições na corrida
  | 'clean_race';      // Corrida limpa terminando na zona de pontos (Top 10)

export interface SponsorContract {
  id: string;
  name: string;
  brand: string;
  logo: string;
  tier: 'local' | 'regional' | 'global';
  category: MotorsportCategory | 'all';
  objectiveType: SponsorObjectiveType;
  targetValue: number;
  targetRivalName?: string;
  title: string;
  description: string;
  rewardMoney: number; // Em Milhões ($ M)
  rewardXp: number;    // Pontos de Treino (XP)
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
  // Slot persistence data
  currentSeason?: number;
  currentRaceIndex?: number;
  trainingPoints?: number;
  savedDriverStandings?: DriverStanding[];
  savedConstructorStandings?: ConstructorStanding[];
  activeSponsors?: SponsorContract[];
  sponsorshipEarnings?: {
    money: number;
    xp: number;
    completedCount: number;
  };
  lastSaved?: string;
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
  isPlayer: boolean;
  gap: string;
  cumulativeTime: number;
  lastLapTime: string;
  tireHealth: number;       // 0 to 100
  tireCompound: TireCompound;
  pitStops: number;
  inPit: boolean;
  speedStat: number;
  cornerStat: number;
  defenseStat: number;
  carPerf: number;
  statusTag?: string;       // e.g. '⬆️ +1', '🔧 BOX', '🛡️ DEF'
}

export interface RaceEvent {
  lap: number;
  description: string;
  type: 'overtake' | 'defense' | 'incident' | 'pit' | 'weather' | 'normal';
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
