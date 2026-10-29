import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Zap, Award, Play, ChevronRight, Activity, 
  ArrowUpRight, RotateCcw, Newspaper, Timer, User, Calendar, BarChart2, 
  PlusCircle, Trash2, Palette, Wrench, Shield, Flame, AlertTriangle, History, FastForward,
  Target, CheckCircle2, CloudRain, Cloud, Sun, Briefcase, Radio, Headphones, DollarSign, Sparkles
} from 'lucide-react';
import { 
  Driver, Track, DriverStanding, ConstructorStanding, RaceEvent, 
  QualifyingResult, MotorsportCategory, LiveRaceCar, RivalDriver, TireCompound, SeasonHistoryEntry,
  WeatherCondition, SponsorContract 
} from './types';
import { TEAMS, TRACKS, REAL_F1_DRIVERS, REAL_F2_DRIVERS, REAL_F3_DRIVERS, KART_RIVAL_DRIVERS, SPONSOR_CONTRACTS, getTeamTireAdvice } from './data/gameData';
import { HelmetVector, CategoryCarVector, TrackMapVector } from './components/MotorsportVectors';

const STORAGE_KEY = 'apex_gp_career_slots_v2';

const getInitialSlots = (): (Driver | null)[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Falha ao carregar pilotos salvos do localStorage', err);
  }
  return [null, null, null, null];
};

export default function App() {
  const [slots, setSlots] = useState<(Driver | null)[]>(getInitialSlots);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isCreatingDriver, setIsCreatingDriver] = useState<boolean>(false);
  const [creatingSlotId, setCreatingSlotId] = useState<number>(0);

  // Live preview states during creation
  const [newHelmetPrimary, setNewHelmetPrimary] = useState<string>('#e10600');
  const [newHelmetSecondary, setNewHelmetSecondary] = useState<string>('#1e3a8a');

  const [gameState, setGameState] = useState<'title' | 'hub' | 'qualifying' | 'race' | 'result' | 'promotion' | 'season_failed'>('title');
  const [activeTab, setActiveTab] = useState<'garagem' | 'treino' | 'patrocinio' | 'calendario' | 'classificacao' | 'historico' | 'noticias'>('garagem');

  const [currentSeason, setCurrentSeason] = useState<number>(2026);
  const [currentRaceIndex, setCurrentRaceIndex] = useState<number>(0);
  const [trainingPoints, setTrainingPoints] = useState<number>(5);

  // Pre-race & Live Strategy States
  const [startingTire, setStartingTire] = useState<TireCompound>('Médio');
  const [drivingStyle, setDrivingStyle] = useState<'conservador' | 'equilibrado' | 'agressivo'>('equilibrado');
  const [autoPitMode, setAutoPitMode] = useState<'conservador' | 'arriscado'>('conservador');
  const [forcePitNextLap, setForcePitNextLap] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const [showSeasonSummaryDetails, setShowSeasonSummaryDetails] = useState<boolean>(false);

  const [qualifyingResults, setQualifyingResults] = useState<QualifyingResult[]>([]);
  const [isQualifyingRunning, setIsQualifyingRunning] = useState<boolean>(false);
  const [isRacing, setIsRacing] = useState<boolean>(false);
  const [currentLap, setCurrentLap] = useState<number>(0);
  const [racePositions, setRacePositions] = useState<LiveRaceCar[]>([]);
  const [raceEventsLog, setRaceEventsLog] = useState<RaceEvent[]>([]);
  const [postRaceResult, setPostRaceResult] = useState<{
    position: number;
    points: number;
    prize: number;
    repGain: number;
    pitStops: number;
    podium: { driverName: string; teamId: string; gap: string; isPlayer: boolean }[];
    sponsorBonuses?: {
      name: string;
      logo: string;
      title: string;
      achieved: boolean;
      rewardMoney: number;
      rewardXp: number;
    }[];
    totalSponsorMoney?: number;
    totalSponsorXp?: number;
  } | null>(null);
  const [seasonEndRank, setSeasonEndRank] = useState<number>(1);
  const playerGridPositionRef = useRef<number>(10);

  // Refs for real-time race loop access
  const autoPitModeRef = useRef<'conservador' | 'arriscado'>('conservador');
  const forcePitRef = useRef<boolean>(false);
  const drivingStyleRef = useRef<'conservador' | 'equilibrado' | 'agressivo'>('equilibrado');
  const simSpeedRef = useRef<1 | 2>(1);
  const raceIntervalRef = useRef<any>(null);

  useEffect(() => {
    drivingStyleRef.current = drivingStyle;
  }, [drivingStyle]);

  useEffect(() => {
    autoPitModeRef.current = autoPitMode;
  }, [autoPitMode]);

  useEffect(() => {
    simSpeedRef.current = simSpeed;
  }, [simSpeed]);

  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [constructorStandings, setConstructorStandings] = useState<ConstructorStanding[]>([]);

  const [aiNews, setAiNews] = useState<string>("Início da temporada no Kart! Escolha bem seus pneus na largada e busque o Top 3 do campeonato para subir à Fórmula 3.");
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  const driver = selectedSlotIndex !== null ? slots[selectedSlotIndex] : null;

  const getCategoryRivals = (cat: MotorsportCategory): RivalDriver[] => {
    if (cat === 'f1') return REAL_F1_DRIVERS;
    if (cat === 'f2') return REAL_F2_DRIVERS;
    if (cat === 'f3') return REAL_F3_DRIVERS;
    return KART_RIVAL_DRIVERS;
  };

  useEffect(() => {
    if (driver) {
      initCategoryStandings(driver.category, driver);
    }
  }, [driver?.category, selectedSlotIndex]);

  const initCategoryStandings = (cat: MotorsportCategory, currentDriver: Driver) => {
    const catTeams = TEAMS.filter(t => t.category === cat);
    const rivals = getCategoryRivals(cat);
    const dStandings: DriverStanding[] = rivals.map(rd => ({
      driverName: rd.name,
      teamId: rd.teamId,
      points: 0,
      wins: 0,
      podiums: 0
    }));

    if (!dStandings.some(d => d.driverName === currentDriver.name)) {
      dStandings.push({
        driverName: currentDriver.name,
        teamId: currentDriver.teamId,
        points: 0,
        wins: 0,
        podiums: 0
      });
    }

    setDriverStandings(dStandings);

    const cStandings: ConstructorStanding[] = catTeams.map(t => ({
      teamId: t.id,
      points: 0,
      wins: 0
    }));
    setConstructorStandings(cStandings);
  };

  // Persist all driver slots automatically into localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch (err) {
      console.error('Falha ao salvar slots no localStorage', err);
    }
  }, [slots]);

  const selectDriverSlot = (index: number) => {
    const chosen = slots[index];
    if (!chosen) return;
    if (!chosen.activeSponsors || chosen.activeSponsors.length === 0) {
      chosen.activeSponsors = [SPONSOR_CONTRACTS[0], SPONSOR_CONTRACTS[1]];
    }
    if (!chosen.sponsorshipEarnings) {
      chosen.sponsorshipEarnings = { money: 0, xp: 0, completedCount: 0 };
    }
    setSelectedSlotIndex(index);
    if (chosen.currentSeason) setCurrentSeason(chosen.currentSeason);
    if (typeof chosen.currentRaceIndex === 'number') setCurrentRaceIndex(chosen.currentRaceIndex);
    if (typeof chosen.trainingPoints === 'number') setTrainingPoints(chosen.trainingPoints);
    if (chosen.savedDriverStandings && chosen.savedDriverStandings.length > 0) {
      setDriverStandings(chosen.savedDriverStandings);
    } else {
      initCategoryStandings(chosen.category, chosen);
    }
    if (chosen.savedConstructorStandings && chosen.savedConstructorStandings.length > 0) {
      setConstructorStandings(chosen.savedConstructorStandings);
    }
    setGameState('hub');
  };

  const handleDeleteSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
    if (selectedSlotIndex === index) {
      setSelectedSlotIndex(null);
    }
  };

  const handleCreateDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('driverName') as string || 'Lucas Senna';
    const nationality = formData.get('nationality') as string || 'Brasil 🇧🇷';

    const startingTeam = TEAMS.find(t => t.category === 'kart')!;

    const initialAttrs = {
      speed: 48,
      overtaking: 47,
      defense: 48,
      consistency: 50,
      starts: 49,
    };

    const newDriver: Driver = {
      id: creatingSlotId,
      name,
      nationality,
      helmetColor: newHelmetPrimary,
      helmetSecondaryColor: newHelmetSecondary,
      category: 'kart',
      teamId: startingTeam.id,
      attributes: { ...initialAttrs },
      lockedAttributes: { ...initialAttrs },
      reputation: 15,
      money: 0.2,
      careerStats: { seasons: 1, races: 0, wins: 0, podiums: 0, poles: 0, championships: 0, points: 0 },
      seasonHistory: [],
      currentSeason: 2026,
      currentRaceIndex: 0,
      trainingPoints: 5,
      activeSponsors: [SPONSOR_CONTRACTS[0], SPONSOR_CONTRACTS[1]],
      sponsorshipEarnings: { money: 0, xp: 0, completedCount: 0 },
      lastSaved: new Date().toISOString()
    };

    const newSlots = [...slots];
    newSlots[creatingSlotId] = newDriver;
    setSlots(newSlots);
    setSelectedSlotIndex(creatingSlotId);
    setIsCreatingDriver(false);
    setCurrentSeason(2026);
    setCurrentRaceIndex(0);
    setTrainingPoints(5);
    initCategoryStandings('kart', newDriver);
    setGameState('hub');
    fetchAiNews(`O piloto ${name} (${nationality}) inicia sua carreira nas pistas de Kart pela ${startingTeam.name}.`);
  };

  const updateActiveDriver = (updater: (prev: Driver) => Driver) => {
    if (selectedSlotIndex === null) return;
    setSlots(prevSlots => {
      const copy = [...prevSlots];
      if (copy[selectedSlotIndex]) {
        const updated = updater(copy[selectedSlotIndex]!);
        copy[selectedSlotIndex] = {
          ...updated,
          currentSeason: updated.currentSeason ?? currentSeason,
          currentRaceIndex: updated.currentRaceIndex ?? currentRaceIndex,
          trainingPoints: updated.trainingPoints ?? trainingPoints,
          savedDriverStandings: driverStandings,
          savedConstructorStandings: constructorStandings,
          activeSponsors: updated.activeSponsors ?? copy[selectedSlotIndex]?.activeSponsors ?? [SPONSOR_CONTRACTS[0], SPONSOR_CONTRACTS[1]],
          sponsorshipEarnings: updated.sponsorshipEarnings ?? copy[selectedSlotIndex]?.sponsorshipEarnings ?? { money: 0, xp: 0, completedCount: 0 },
          lastSaved: new Date().toISOString()
        };
      }
      return copy;
    });
  };

  const toggleSponsorContract = (contract: SponsorContract) => {
    if (!driver) return;
    const currentActive = driver.activeSponsors || [];
    const isAlreadyActive = currentActive.some(c => c.id === contract.id);

    let updatedActive: SponsorContract[];
    if (isAlreadyActive) {
      updatedActive = currentActive.filter(c => c.id !== contract.id);
    } else {
      if (currentActive.length >= 2) {
        // Keep second and replace first
        updatedActive = [currentActive[1], contract];
      } else {
        updatedActive = [...currentActive, contract];
      }
    }

    updateActiveDriver(prev => ({
      ...prev,
      activeSponsors: updatedActive
    }));
  };

  const getUpgradeCost = (val: number) => (val >= 80 ? 4 : val >= 65 ? 3 : 2);

  const upgradeAttribute = (attr: keyof Driver['attributes']) => {
    if (!driver) return;
    const currentVal = driver.attributes[attr];
    const cost = getUpgradeCost(currentVal);

    if (trainingPoints < cost) return;
    if (currentVal >= 99) return;

    setTrainingPoints(prev => prev - cost);
    updateActiveDriver(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: prev.attributes[attr] + 1
      }
    }));
  };

  const downgradeAttribute = (attr: keyof Driver['attributes']) => {
    if (!driver) return;
    const currentVal = driver.attributes[attr];
    const lockedVal = driver.lockedAttributes?.[attr] ?? currentVal;

    if (currentVal <= lockedVal) return;

    const refund = getUpgradeCost(currentVal - 1);
    setTrainingPoints(prev => prev + refund);
    updateActiveDriver(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: prev.attributes[attr] - 1
      }
    }));
  };

  const resetPendingUpgrades = () => {
    if (!driver || !driver.lockedAttributes) return;
    let totalRefund = 0;
    const keys: (keyof Driver['attributes'])[] = ['speed', 'overtaking', 'defense', 'consistency', 'starts'];
    keys.forEach(k => {
      const curr = driver.attributes[k];
      const locked = driver.lockedAttributes[k];
      for (let v = locked; v < curr; v++) {
        totalRefund += getUpgradeCost(v);
      }
    });

    if (totalRefund === 0) return;
    setTrainingPoints(prev => prev + totalRefund);
    updateActiveDriver(prev => ({
      ...prev,
      attributes: { ...prev.lockedAttributes }
    }));
  };

  const getDriverCombatStats = (driverName: string, teamId: string) => {
    const team = TEAMS.find(t => t.id === teamId) || TEAMS[0];
    if (driver && driverName === driver.name) {
      return {
        speedStat: driver.attributes.speed,
        cornerStat: Math.round((driver.attributes.overtaking * 0.55) + (driver.attributes.consistency * 0.45)),
        defenseStat: driver.attributes.defense,
        carPerf: team.carPerformance
      };
    }
    const rivals = driver ? getCategoryRivals(driver.category) : REAL_F1_DRIVERS;
    const found = rivals.find(r => r.name === driverName);
    if (found) {
      return {
        speedStat: found.speed,
        cornerStat: found.cornering,
        defenseStat: found.defense,
        carPerf: team.carPerformance
      };
    }
    return { speedStat: 60, cornerStat: 60, defenseStat: 60, carPerf: team.carPerformance };
  };

  // Start Qualifying Session (locks pending attribute upgrades)
  const startQualifying = () => {
    if (!driver) return;
    updateActiveDriver(prev => ({
      ...prev,
      lockedAttributes: { ...prev.attributes }
    }));
    setGameState('qualifying');
    setIsQualifyingRunning(true);

    const catTracks = TRACKS.filter(t => t.category === driver.category);
    const track = catTracks[currentRaceIndex] || catTracks[0];

    setTimeout(() => {
      const baseSeconds = driver.category === 'kart' ? 52.0 : driver.category === 'f3' ? 76.0 : driver.category === 'f2' ? 88.0 : 79.0;
      const isWet = track.weather === 'Chuva';
      const weatherBaseDelta = isWet ? 4.2 : track.weather === 'Nublado' ? 0.35 : 0;
      const effStraightW = isWet ? track.straightWeight * 0.45 : track.straightWeight;
      const effCornerW = isWet ? track.cornerWeight * 1.6 : track.cornerWeight;

      const results: QualifyingResult[] = driverStandings.map(ds => {
        const isPlayer = ds.driverName === driver.name;
        const stats = getDriverCombatStats(ds.driverName, ds.teamId);
        const wetControlBonus = isWet ? ((isPlayer ? driver.attributes.consistency : stats.cornerStat) - 50) * 0.1 : 0;

        const trackWeightedSkill =
          stats.speedStat * effStraightW +
          stats.cornerStat * effCornerW +
          stats.defenseStat * track.defenseWeight +
          stats.carPerf * 0.35 +
          wetControlBonus;

        const maxPossible = 135;
        const delta = Math.max(0, maxPossible - trackWeightedSkill) * 0.085 + weatherBaseDelta + (Math.random() * 0.55);
        const rawTime = Number((baseSeconds + delta).toFixed(3));
        
        const mins = Math.floor(rawTime / 60);
        const secs = (rawTime % 60).toFixed(3).padStart(6, '0');
        const lapTime = mins > 0 ? `${mins}:${secs}` : `${secs}s`;

        return {
          driverName: ds.driverName,
          teamId: ds.teamId,
          lapTime,
          rawTime,
          isPlayer
        };
      });

      results.sort((a, b) => a.rawTime - b.rawTime);
      setQualifyingResults(results);
      setIsQualifyingRunning(false);

      if (results[0]?.isPlayer) {
        updateActiveDriver(prev => ({
          ...prev,
          careerStats: { ...prev.careerStats, poles: prev.careerStats.poles + 1 }
        }));
      }
    }, 1400);
  };

  const triggerManualPitNow = () => {
    if (!isRacing) return;
    setForcePitNextLap(prev => {
      forcePitRef.current = !prev;
      return !prev;
    });
  };

  const startRaceFromQualifying = () => {
    if (!driver) return;
    setGameState('race');
    setIsRacing(true);
    setCurrentLap(0);
    setRaceEventsLog([]);
    setPostRaceResult(null);
    setForcePitNextLap(false);
    forcePitRef.current = false;

    const playerStartIdx = qualifyingResults.findIndex(q => q.isPlayer);
    playerGridPositionRef.current = playerStartIdx !== -1 ? playerStartIdx + 1 : 10;

    const catTracks = TRACKS.filter(t => t.category === driver.category);
    const track = catTracks[currentRaceIndex] || catTracks[0];

    const aiCompounds: TireCompound[] = ['Macio', 'Médio', 'Médio', 'Duro'];

    const initialCars: LiveRaceCar[] = qualifyingResults.map((q, idx) => {
      const stats = getDriverCombatStats(q.driverName, q.teamId);
      const startGap = idx * 0.42;
      // Top qualifiers often start on Soft/Medium, midfield mixes Medium/Hard
      const aiTire = aiCompounds[(idx + Math.floor(Math.random() * 2)) % aiCompounds.length];
      return {
        driverName: q.driverName,
        teamId: q.teamId,
        pos: idx + 1,
        prevPos: idx + 1,
        isPlayer: q.isPlayer,
        gap: idx === 0 ? 'LÍDER' : `+${startGap.toFixed(1)}s`,
        cumulativeTime: startGap,
        lastLapTime: q.lapTime,
        tireHealth: 100,
        tireCompound: q.isPlayer ? startingTire : aiTire,
        pitStops: 0,
        inPit: false,
        speedStat: stats.speedStat,
        cornerStat: stats.cornerStat,
        defenseStat: stats.defenseStat,
        carPerf: stats.carPerf,
        statusTag: undefined
      };
    });

    setRacePositions(initialCars);
    runLiveRaceSimulation(initialCars, track);
  };

  const runLiveRaceSimulation = (initialGrid: LiveRaceCar[], track: Track) => {
    if (!driver) return;
    if (raceIntervalRef.current) clearTimeout(raceIntervalRef.current);

    let lap = 0;
    let cars = initialGrid.map(c => ({ ...c }));
    const totalLaps = track.laps;
    const baseLapSec = driver.category === 'kart' ? 53.0 : driver.category === 'f3' ? 77.0 : driver.category === 'f2' ? 89.0 : 80.0;

    // Base wear per lap normalized to totalLaps so:
    // - Duro (0.68x): ~68% wear over full race -> 0 pit stops needed!
    // - Médio (1.18x): ~118% wear over full race -> 1 automatic pit stop around 62% of race!
    // - Macio (1.52x): ~152% wear over full race -> 1 automatic pit stop around 48% of race (or 2 if aggressive)!
    const baseWearUnit = 100 / totalLaps;

    const stepLap = () => {
      lap += 1;
      if (lap <= totalLaps) {
        setCurrentLap(lap);
        const lapEvents: RaceEvent[] = [];
        const remainingLaps = totalLaps - lap;

        // 1. Update each car's tire wear, automatic pit stop execution, and raw lap pace
        cars.forEach(car => {
          car.prevPos = car.pos;
          car.inPit = false;
          car.statusTag = undefined;

          const isPlayer = car.isPlayer;
          const style = isPlayer ? drivingStyleRef.current : 'equilibrado';
          const wearStyleMult = style === 'agressivo' ? 1.24 : style === 'conservador' ? 0.82 : 1.0;
          const compoundWearMult =
            car.tireCompound === 'Macio' ? 1.52 :
            car.tireCompound === 'Médio' ? 1.18 : 0.68;

          // Automatic Pit Stop Trigger when tire health drops below 27% (and at least 2 laps left)
          const needsAutoPit = car.tireHealth <= 27 && remainingLaps >= 2;
          const playerForcedPit = isPlayer && forcePitRef.current && remainingLaps >= 1;

          let pitPenaltySeconds = 0;

          if (isPlayer && (needsAutoPit || playerForcedPit)) {
            forcePitRef.current = false;
            setForcePitNextLap(false);
            car.pitStops += 1;
            car.inPit = true;

            // Choose next compound based on remaining laps & pit mode
            const nextCompound: TireCompound =
              remainingLaps <= totalLaps * 0.38
                ? (autoPitModeRef.current === 'arriscado' ? 'Macio' : 'Médio')
                : (autoPitModeRef.current === 'arriscado' ? 'Médio' : 'Duro');

            if (autoPitModeRef.current === 'conservador') {
              pitPenaltySeconds = 3.0;
              car.tireHealth = 100;
              car.tireCompound = nextCompound;
              car.statusTag = `🔧 BOX ${nextCompound[0]} (3.0s)`;
              lapEvents.push({
                lap,
                description: `🔧 Pit Stop Automático Seguro (3.0s): ${car.driverName} colocou pneus ${nextCompound} novos!`,
                type: 'pit'
              });
            } else {
              // Risky Automatic Pit Stop: 75% chance of fast 1.8s stop, 25% chance of 5.0s wheel gun delay
              if (Math.random() < 0.75) {
                pitPenaltySeconds = 1.8;
                car.tireHealth = 100;
                car.tireCompound = nextCompound;
                car.statusTag = `⚡ BOX ${nextCompound[0]} (1.8s)`;
                lapEvents.push({
                  lap,
                  description: `⚡ Box Automático Relâmpago (1.8s)! ${car.driverName} voltou de pneus ${nextCompound}!`,
                  type: 'pit'
                });
              } else {
                pitPenaltySeconds = 5.0;
                car.tireHealth = 100;
                car.tireCompound = nextCompound;
                car.statusTag = `⚠️ ERRO BOX (5.0s)`;
                lapEvents.push({
                  lap,
                  description: `⚠️ Porca travada no Box Arriscado! ${car.driverName} perdeu 5.0s na troca para ${nextCompound}.`,
                  type: 'incident'
                });
              }
            }
          } else if (!isPlayer && needsAutoPit) {
            car.pitStops += 1;
            car.inPit = true;
            pitPenaltySeconds = Number((2.3 + Math.random() * 1.1).toFixed(1));
            car.tireHealth = 100;
            car.tireCompound = remainingLaps <= totalLaps * 0.38 ? 'Macio' : 'Médio';
            car.statusTag = `🔧 BOX (${pitPenaltySeconds}s)`;
            if (car.pos <= 5) {
              lapEvents.push({
                lap,
                description: `🔧 ${car.driverName} (P${car.pos}) fez parada automática para pneus ${car.tireCompound} (${pitPenaltySeconds}s).`,
                type: 'pit'
              });
            }
          } else {
            // Normal tire wear on track
            const jitter = 0.92 + Math.random() * 0.16;
            const wearAmount = baseWearUnit * track.tireAbrasion * wearStyleMult * compoundWearMult * jitter;
            car.tireHealth = Math.max(5, Math.round(car.tireHealth - wearAmount));
          }

          // Calculate track-specific performance for this lap
          const isRain = track.weather === 'Chuva';
          const isCloudy = track.weather === 'Nublado';

          // In rain, straight speeds contribute less while cornering & consistency (car.cornerStat) dominate
          const straightWeight = isRain ? track.straightWeight * 0.65 : track.straightWeight;
          const cornerWeight = isRain ? track.cornerWeight * 1.35 : track.cornerWeight;

          const trackSkill =
            car.speedStat * straightWeight +
            car.cornerStat * cornerWeight +
            car.defenseStat * track.defenseWeight +
            car.carPerf * 0.35;

          const styleBonus = style === 'agressivo' ? 2.2 : style === 'conservador' ? -1.5 : 0;
          // Tire compound speed difference: Soft is fastest, Medium balanced, Hard slower per lap but no pit stop loss!
          const compoundSpeedBonus =
            car.tireCompound === 'Macio' ? 3.2 :
            car.tireCompound === 'Médio' ? 1.5 : 0.0;

          const tireWearPenalty = car.tireHealth < 40 ? (40 - car.tireHealth) * 0.12 : (100 - car.tireHealth) * 0.015;

          // Rain and weather grip impact:
          // Rain drastically lowers grip (+4.0s baseline penalty)
          // High consistency/control offsets rain penalty:
          const wetControlBonus = isRain ? ((car.cornerStat - 60) * 0.09) : 0;
          const weatherGripLoss = isRain ? 4.2 : isCloudy ? 0.4 : 0;

          // Rain Spin Check (Rodadas na Chuva):
          // Lower consistency + aggressive style = severe risk of spinning out
          let spinPenalty = 0;
          if (isRain && !car.inPit) {
            // Spin chance per lap based on driver's consistency / cornerStat
            // Range: 80+ consistency has ~2% chance, 50 consistency has ~14% chance
            let spinChance = Math.max(0.015, (85 - car.cornerStat) * 0.0035);
            if (style === 'agressivo') spinChance *= 1.6;
            if (style === 'conservador') spinChance *= 0.45;
            if (car.tireHealth < 35) spinChance *= 1.4;

            if (Math.random() < spinChance) {
              spinPenalty = Number((3.8 + Math.random() * 2.8).toFixed(1));
              car.statusTag = '🌀 RODOU!';
              if (car.isPlayer) {
                lapEvents.push({
                  lap,
                  description: `🌀 RODADA NA CHUVA! ${car.driverName} perdeu o controle na pista molhada e perdeu ${spinPenalty}s!`,
                  type: 'incident'
                });
              } else if (car.pos <= 6) {
                lapEvents.push({
                  lap,
                  description: `🌀 ${car.driverName} (P${car.pos}) rodou no asfalto molhado e perdeu tempo!`,
                  type: 'incident'
                });
              }
            }
          }

          const lapDelta = Math.max(0, (135 - (trackSkill + styleBonus + compoundSpeedBonus + wetControlBonus)) * 0.065) + tireWearPenalty + pitPenaltySeconds + spinPenalty + weatherGripLoss + (Math.random() * 0.38);
          const lapSeconds = Number((baseLapSec + lapDelta).toFixed(3));
          car.cumulativeTime = Number((car.cumulativeTime + lapSeconds).toFixed(3));

          const mins = Math.floor(lapSeconds / 60);
          const secs = (lapSeconds % 60).toFixed(3).padStart(6, '0');
          car.lastLapTime = mins > 0 ? `${mins}:${secs}` : `${secs}s`;
        });

        // 2. Dynamic Head-to-Head Overtaking & Defense Battles across the entire grid
        cars.sort((a, b) => {
          if (Math.abs(a.cumulativeTime - b.cumulativeTime) > 1.25) {
            return a.cumulativeTime - b.cumulativeTime;
          }
          const leader = a.pos < b.pos ? a : b;
          const attacker = a.pos < b.pos ? b : a;

          if (attacker.cumulativeTime < leader.cumulativeTime) {
            const attackPower =
              attacker.speedStat * track.straightWeight +
              attacker.cornerStat * track.cornerWeight +
              attacker.carPerf * 0.3 +
              (attacker.tireHealth - leader.tireHealth) * 0.22;

            const defensePower =
              leader.defenseStat * (0.45 + track.defenseWeight) +
              leader.cornerStat * (track.cornerWeight * 0.5) +
              leader.carPerf * 0.3 +
              1.4;

            if (attackPower + (Math.random() * 10 - 4) > defensePower) {
              return attacker === a ? -1 : 1;
            } else {
              attacker.cumulativeTime = Number((leader.cumulativeTime + 0.22).toFixed(3));
              if (leader.isPlayer || attacker.isPlayer || leader.pos <= 4) {
                leader.statusTag = leader.statusTag || '🛡️ DEF';
              }
              return leader === a ? -1 : 1;
            }
          }
          return a.pos - b.pos;
        });

        // 3. Update positions, gaps, and record overtake badges/logs
        const leaderTime = cars[0].cumulativeTime;
        cars.forEach((car, idx) => {
          const newPos = idx + 1;
          const posDiff = car.prevPos - newPos;
          car.pos = newPos;
          car.gap = idx === 0 ? 'LÍDER' : `+${Math.max(0.2, car.cumulativeTime - leaderTime).toFixed(1)}s`;

          if (!car.inPit && posDiff > 0) {
            car.statusTag = `⬆️+${posDiff}`;
            const overtakenCar = cars[idx + 1];
            if (car.isPlayer) {
              lapEvents.push({
                lap,
                description: `🔥 ULTRAPASSAGEM! ${car.driverName} superou ${overtakenCar?.driverName || 'rival'} e assumiu a P${newPos}!`,
                type: 'overtake'
              });
            } else if (overtakenCar?.isPlayer) {
              lapEvents.push({
                lap,
                description: `⚠️ ${car.driverName} ultrapassou você para a P${newPos}!`,
                type: 'overtake'
              });
            } else if (newPos <= 4 && lapEvents.length < 2) {
              lapEvents.push({
                lap,
                description: `⚔️ ${car.driverName} ultrapassa ${overtakenCar?.driverName} pela P${newPos}!`,
                type: 'overtake'
              });
            }
          } else if (!car.inPit && posDiff < 0) {
            car.statusTag = `⬇️${posDiff}`;
          }
        });

        if (lapEvents.length === 0) {
          lapEvents.push({
            lap,
            description: `Volta ${lap}/${totalLaps} · ${cars[0].driverName} lidera (${cars[0].tireCompound[0]} ${cars[0].tireHealth}%).`,
            type: 'normal'
          });
        }

        setRacePositions([...cars]);
        setRaceEventsLog(prev => [...lapEvents, ...prev].slice(0, 6));

        const nextDelay = simSpeedRef.current === 2 ? 380 : 750;
        raceIntervalRef.current = setTimeout(stepLap, nextDelay);
      } else {
        finishRaceActions(cars, track);
      }
    };

    raceIntervalRef.current = setTimeout(stepLap, 750);
  };

  const finishRaceActions = (finalCars: LiveRaceCar[], track: Track) => {
    if (!driver) return;
    setIsRacing(false);

    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const playerEntry = finalCars.find(c => c.isPlayer) || finalCars[0];
    const position = playerEntry.pos;

    const pointsWon = position <= 10 ? pointsTable[position - 1] : 0;
    const prizeWon = position === 1 ? 1.8 : position <= 3 ? 1.0 : position <= 10 ? 0.4 : 0.1;
    const repGain = position === 1 ? 12 : position <= 3 ? 8 : position <= 10 ? 4 : 1;

    const podium = finalCars.slice(0, 3).map(c => ({
      driverName: c.driverName,
      teamId: c.teamId,
      gap: c.gap,
      isPlayer: c.isPlayer
    }));

    // Evaluate active sponsor contract objectives
    const activeContracts = driver.activeSponsors || [];
    const playerStartGrid = playerGridPositionRef.current || 10;
    const positionsGained = playerStartGrid - position;

    const categoryRivals = getCategoryRivals(driver.category);
    const mainRival = categoryRivals.find(r => r.teamId === driver.teamId) || categoryRivals[0];
    const rivalCar = finalCars.find(c => c.driverName === mainRival.name);
    const rivalPos = rivalCar ? rivalCar.pos : 10;

    let totalSponsorMoney = 0;
    let totalSponsorXp = 0;
    let completedInThisRace = 0;

    const sponsorBonuses = activeContracts.map(contract => {
      let achieved = false;
      switch (contract.objectiveType) {
        case 'beat_rival':
          achieved = position < rivalPos;
          break;
        case 'laps_no_pit':
          achieved = playerEntry.pitStops <= contract.targetValue;
          break;
        case 'top_finish':
          achieved = position <= contract.targetValue;
          break;
        case 'gain_positions':
          achieved = positionsGained >= contract.targetValue;
          break;
        case 'clean_race':
          achieved = position <= 10;
          break;
        default:
          achieved = false;
      }

      if (achieved) {
        totalSponsorMoney += contract.rewardMoney;
        totalSponsorXp += contract.rewardXp;
        completedInThisRace += 1;
      }

      return {
        name: contract.name,
        logo: contract.logo,
        title: contract.title,
        achieved,
        rewardMoney: contract.rewardMoney,
        rewardXp: contract.rewardXp
      };
    });

    setPostRaceResult({
      position,
      points: pointsWon,
      prize: prizeWon,
      repGain,
      pitStops: playerEntry.pitStops,
      podium,
      sponsorBonuses,
      totalSponsorMoney: Number(totalSponsorMoney.toFixed(2)),
      totalSponsorXp
    });

    const totalMoneyWon = Number((prizeWon + totalSponsorMoney).toFixed(2));
    const totalTpWon = 3 + totalSponsorXp;

    updateActiveDriver(prev => ({
      ...prev,
      money: Number((prev.money + totalMoneyWon).toFixed(2)),
      reputation: Math.min(100, prev.reputation + repGain),
      careerStats: {
        ...prev.careerStats,
        races: prev.careerStats.races + 1,
        wins: prev.careerStats.wins + (position === 1 ? 1 : 0),
        podiums: prev.careerStats.podiums + (position <= 3 ? 1 : 0),
        points: prev.careerStats.points + pointsWon
      },
      sponsorshipEarnings: {
        money: Number(((prev.sponsorshipEarnings?.money || 0) + totalSponsorMoney).toFixed(2)),
        xp: (prev.sponsorshipEarnings?.xp || 0) + totalSponsorXp,
        completedCount: (prev.sponsorshipEarnings?.completedCount || 0) + completedInThisRace
      }
    }));

    setTrainingPoints(prev => prev + totalTpWon);

    const teamPointsGain: Record<string, { pts: number; wins: number }> = {};

    setDriverStandings(prev =>
      prev.map(ds => {
        const finishIdx = finalCars.findIndex(c => c.driverName === ds.driverName);
        const finishPos = finishIdx !== -1 ? finishIdx + 1 : 99;
        const pts = finishPos <= 10 ? pointsTable[finishPos - 1] : 0;
        const win = finishPos === 1 ? 1 : 0;
        const pod = finishPos <= 3 ? 1 : 0;

        if (!teamPointsGain[ds.teamId]) {
          teamPointsGain[ds.teamId] = { pts: 0, wins: 0 };
        }
        teamPointsGain[ds.teamId].pts += pts;
        teamPointsGain[ds.teamId].wins += win;

        return {
          ...ds,
          points: ds.points + pts,
          wins: ds.wins + win,
          podiums: ds.podiums + pod
        };
      })
    );

    setConstructorStandings(prev =>
      prev.map(cs => ({
        ...cs,
        points: cs.points + (teamPointsGain[cs.teamId]?.pts || 0),
        wins: cs.wins + (teamPointsGain[cs.teamId]?.wins || 0)
      }))
    );

    setGameState('result');
    fetchAiNews(
      `Fim do ${track.name}! Pódio: 1º ${podium[0]?.driverName}, 2º ${podium[1]?.driverName} e 3º ${podium[2]?.driverName}. ${driver.name} terminou em P${position} (${playerEntry.pitStops} parada(s)).`
    );
  };

  // End of Race -> Check if Season Ended -> Record Season History & Check Top 3 Promotion
  const handleContinueSeason = () => {
    if (!driver) return;
    const catTracks = TRACKS.filter(t => t.category === driver.category);
    if (currentRaceIndex < catTracks.length - 1) {
      setCurrentRaceIndex(prev => prev + 1);
      setGameState('hub');
    } else {
      const sortedStandings = [...driverStandings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.podiums - a.podiums;
      });

      const playerRank = sortedStandings.findIndex(d => d.driverName === driver.name) + 1;
      const playerStanding = sortedStandings.find(d => d.driverName === driver.name);
      const defendedTeam = TEAMS.find(t => t.id === driver.teamId) || TEAMS[0];
      const isPromoted = playerRank <= 3;

      const historyEntry: SeasonHistoryEntry = {
        season: currentSeason,
        category: driver.category,
        teamId: defendedTeam.id,
        teamName: defendedTeam.name,
        teamColor: defendedTeam.color,
        finalPosition: playerRank,
        wins: playerStanding?.wins || 0,
        podiums: playerStanding?.podiums || 0,
        points: playerStanding?.points || 0,
        promoted: isPromoted
      };

      setSeasonEndRank(playerRank);

      updateActiveDriver(prev => ({
        ...prev,
        careerStats: {
          ...prev.careerStats,
          championships: prev.careerStats.championships + (playerRank === 1 ? 1 : 0)
        },
        seasonHistory: [...(prev.seasonHistory || []), historyEntry]
      }));

      if (isPromoted) {
        setGameState('promotion');
      } else {
        setGameState('season_failed');
      }
    }
  };

  const retryCategorySeason = () => {
    if (!driver) return;
    setCurrentSeason(prev => prev + 1);
    setCurrentRaceIndex(0);
    updateActiveDriver(prev => ({
      ...prev,
      careerStats: { ...prev.careerStats, seasons: prev.careerStats.seasons + 1 }
    }));
    initCategoryStandings(driver.category, driver);
    setGameState('hub');
  };

  const promoteCategory = (nextCat: MotorsportCategory, chosenTeamId?: string) => {
    if (!driver) return;
    const catTeams = TEAMS.filter(t => t.category === nextCat);
    const nextTeam = chosenTeamId ? (catTeams.find(t => t.id === chosenTeamId) || catTeams[0]) : catTeams[0];

    const updatedDriver: Driver = {
      ...driver,
      category: nextCat,
      teamId: nextTeam.id,
      reputation: Math.min(100, driver.reputation + 12),
      careerStats: { ...driver.careerStats, seasons: driver.careerStats.seasons + 1 }
    };

    updateActiveDriver(() => updatedDriver);
    setCurrentSeason(prev => prev + 1);
    setCurrentRaceIndex(0);
    initCategoryStandings(nextCat, updatedDriver);
    setGameState('hub');
    fetchAiNews(`PROMOÇÃO MERECIDA! Após terminar no Top 3 do campeonato, ${driver.name} sobe para a ${nextCat.toUpperCase()} assinando com a ${nextTeam.name}!`);
  };

  const fetchAiNews = async (customPrompt?: string) => {
    if (!driver) return;
    setLoadingNews(true);
    try {
      const prompt = customPrompt || `Gere uma notícia esportiva da categoria ${driver.category.toUpperCase()} sobre o piloto ${driver.name}. Escreva em português, em um parágrafo cativante.`;
      const res = await fetch('/api/gemini/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.text) {
          setAiNews(data.text);
          return;
        }
      }
      // If endpoint returned non-ok or empty text, use local context
      if (customPrompt) {
        setAiNews(customPrompt);
      }
    } catch {
      // Offline or network fallback
      if (customPrompt) {
        setAiNews(customPrompt);
      } else {
        setAiNews(`BOLETIM DO PADDOCK: ${driver.name} segue com preparação intensiva no comando do carro da ${currentTeam.name}. Foco total no Top 3 da categoria ${driver.category.toUpperCase()}!`);
      }
    } finally {
      setLoadingNews(false);
    }
  };

  const currentTeam = driver ? (TEAMS.find(t => t.id === driver.teamId) || TEAMS[0]) : TEAMS[0];
  const catTracks = driver ? TRACKS.filter(t => t.category === driver.category) : TRACKS;
  const currentTrack = catTracks[currentRaceIndex] || catTracks[0];
  const playerRaceCar = racePositions.find(c => c.isPlayer);
  const sortedSeasonStandings = [...driverStandings].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const currentPlayerStanding = driver ? sortedSeasonStandings.find(d => d.driverName === driver.name) : null;
  const currentPlayerRank = driver ? sortedSeasonStandings.findIndex(d => d.driverName === driver.name) + 1 : 1;
  const playerPoints = currentPlayerStanding?.points || 0;

  // Top 3 Target & Gap Calculations
  const thirdPlaceDriver = sortedSeasonStandings[2] || sortedSeasonStandings[0];
  const thirdPlacePoints = thirdPlaceDriver?.points || 0;
  const thirdPlaceName = thirdPlaceDriver?.driverName || '3º Colocado';
  const fourthPlaceDriver = sortedSeasonStandings[3];
  const fourthPlacePoints = fourthPlaceDriver?.points || 0;
  const isInTop3 = currentPlayerRank <= 3;

  // Points gap to Top 3 (safety margin if in top 3, or deficit if outside top 3)
  const pointsDiffToTarget = isInTop3 
    ? (fourthPlaceDriver ? playerPoints - fourthPlacePoints : playerPoints) 
    : (thirdPlacePoints - playerPoints);

  const racesRemaining = Math.max(0, catTracks.length - currentRaceIndex);
  const maxAvailablePoints = racesRemaining * 25;

  // Visual progress percentage (0 - 100%)
  let top3ProgressPercentage = 0;
  if (isInTop3) {
    top3ProgressPercentage = 100;
  } else if (thirdPlacePoints === 0) {
    top3ProgressPercentage = Math.max(10, Math.round(((20 - currentPlayerRank) / 17) * 80));
  } else {
    top3ProgressPercentage = Math.min(96, Math.max(8, Math.round((playerPoints / Math.max(1, thirdPlacePoints)) * 100)));
  }

  const getTireBadgeStyle = (compound: TireCompound) => {
    if (compound === 'Macio') return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (compound === 'Médio') return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    return 'bg-slate-200/20 text-white border-slate-300/60';
  };

  const getWeatherBadge = (weather: WeatherCondition) => {
    if (weather === 'Chuva') {
      return {
        label: 'Chuva',
        icon: '🌧️',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        hint: 'Aderência reduzida! O atributo de Controle & Consistência é vital para evitar rodadas.'
      };
    }
    if (weather === 'Nublado') {
      return {
        label: 'Nublado',
        icon: '☁️',
        badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        hint: 'Asfalto mais frio, menor degradação dos pneus.'
      };
    }
    return {
      label: 'Seco',
      icon: '☀️',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      hint: 'Pista seca com máxima aderência e velocidade.'
    };
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans flex flex-col selection:bg-[#e10600] selection:text-white pb-20">
      
      {/* TITLE SCREEN / SAVE SLOTS SELECTOR */}
      {gameState === 'title' && !isCreatingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gradient-to-br from-[#090a0f] via-[#12141c] to-[#1a0505] overflow-y-auto">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e10600_1px,transparent_1px)] [background-size:24px_24px]"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl my-auto"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-[#e10600] rounded-xl flex items-center justify-center shadow-lg shadow-[#e10600]/40 shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#e10600] font-bold">Gerenciador de Carreiras · Até 4 Pilotos</span>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">APEX GP: RUMO À F1</h1>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm mb-5 leading-relaxed">
              Evolua do Kart à Fórmula 1! Seus pilotos ficam salvos automaticamente para continuar quando quiser. Fique atento às variáveis climáticas (Seco, Nublado e Chuva) e termine no <strong className="text-white">Top 3 do campeonato</strong> para subir de categoria.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
              {slots.map((slot, index) => {
                const slotTeam = slot ? (TEAMS.find(t => t.id === slot.teamId) || TEAMS[0]) : null;
                return (
                  <div 
                    key={index}
                    className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                  >
                    {slot && slotTeam ? (
                      <>
                        <div className="absolute -right-8 -bottom-4 w-48 opacity-15 pointer-events-none">
                          <CategoryCarVector 
                            category={slot.category} 
                            teamColor={slotTeam.color} 
                            helmetColor={slot.helmetColor} 
                            className="w-full h-24"
                          />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono text-[#e10600] uppercase font-bold">Slot {index + 1}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                                💾 Salvo
                              </span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{slot.category.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <HelmetVector 
                              primaryColor={slot.helmetColor} 
                              secondaryColor={slot.helmetSecondaryColor || '#1e3a8a'} 
                              className="w-14 h-14 shrink-0" 
                            />
                            <div>
                              <div className="text-sm font-bold text-white mb-0.5">{slot.name}</div>
                              <div className="text-xs text-slate-400">{slot.nationality} · {slot.careerStats.wins}V</div>
                              <div className="text-[11px] font-semibold mt-0.5" style={{ color: slotTeam.color }}>
                                {slotTeam.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Temporada {slot.currentSeason || 2026} · Etapa {(slot.currentRaceIndex ?? 0) + 1}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectDriverSlot(index)}
                              className="flex-1 bg-[#e10600] hover:bg-[#c80500] text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Carregar Piloto
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(index)}
                              className="p-2 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Carreira"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-5">
                        <div className="text-xs font-mono text-slate-500 uppercase mb-2.5">Slot {index + 1} Vazio</div>
                        <button
                          onClick={() => {
                            setCreatingSlotId(index);
                            setIsCreatingDriver(true);
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-400" />
                          <span>Criar Piloto</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* DRIVER CREATION MODAL */}
      {isCreatingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl my-auto"
          >
            <h3 className="text-xl font-black text-white mb-1">Novo Piloto (Slot {creatingSlotId + 1})</h3>
            <p className="text-slate-400 text-xs mb-5">Personalize os dados e pinte o vetor do seu capacete em tempo real.</p>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 mb-4 flex flex-col items-center justify-center">
              <HelmetVector 
                primaryColor={newHelmetPrimary} 
                secondaryColor={newHelmetSecondary} 
                className="w-24 h-24" 
              />
              <span className="text-[10px] font-mono text-slate-400 mt-1">Prévia Vetorial Sem Fundo</span>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nome do Piloto</label>
                <input 
                  type="text" 
                  name="driverName" 
                  defaultValue="Lucas Senna" 
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nacionalidade</label>
                <select name="nationality" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="Brasil 🇧🇷">Brasil 🇧🇷</option>
                  <option value="Portugal 🇵🇹">Portugal 🇵🇹</option>
                  <option value="Argentina 🇦🇷">Argentina 🇦🇷</option>
                  <option value="Itália 🇮🇹">Itália 🇮🇹</option>
                  <option value="Reino Unido 🇬🇧">Reino Unido 🇬🇧</option>
                  <option value="França 🇫🇷">França 🇫🇷</option>
                  <option value="Espanha 🇪🇸">Espanha 🇪🇸</option>
                  <option value="Alemanha 🇩🇪">Alemanha 🇩🇪</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cor Principal</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1.5">
                    <input 
                      type="color" 
                      value={newHelmetPrimary}
                      onChange={(e) => setNewHelmetPrimary(e.target.value)}
                      className="w-8 h-7 bg-transparent cursor-pointer rounded" 
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{newHelmetPrimary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Faixas / Detalhes</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1.5">
                    <input 
                      type="color" 
                      value={newHelmetSecondary}
                      onChange={(e) => setNewHelmetSecondary(e.target.value)}
                      className="w-8 h-7 bg-transparent cursor-pointer rounded" 
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{newHelmetSecondary}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingDriver(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#e10600] hover:bg-[#c80500] text-white font-bold py-2.5 rounded-xl shadow-lg cursor-pointer text-xs"
                >
                  Iniciar Carreira
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* HUB / CAREER DASHBOARD */}
      {gameState === 'hub' && driver && (
        <div className="relative max-w-5xl mx-auto w-full px-3 py-2.5 sm:p-4 space-y-4 overflow-y-auto">
          
          <div className="fixed inset-x-0 top-24 flex justify-center pointer-events-none opacity-[0.06] z-0 overflow-hidden">
            <CategoryCarVector 
              category={driver.category} 
              teamColor={currentTeam.color} 
              helmetColor={driver.helmetColor}
              className="w-[780px] h-[300px]" 
            />
          </div>

          {/* SUMMARIZED COMPACT HEADER */}
          <header className="relative flex items-center justify-between gap-2 bg-slate-900/95 border border-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md sticky top-0 z-20 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={() => setGameState('title')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                title="Voltar ao Menu"
              >
                ←
              </button>
              <HelmetVector 
                primaryColor={driver.helmetColor} 
                secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-white truncate">{driver.name}</h2>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#e10600]/20 text-[#e10600] font-mono font-bold shrink-0">
                    {driver.category.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  <span style={{ color: currentTeam.color }} className="font-semibold">{currentTeam.shortName}</span> · {currentSeason} · R{currentRaceIndex + 1}/{catTracks.length}
                </p>
              </div>
            </div>

          </header>

          {/* TOP 3 PROMOTION PROGRESS BAR & SEASON SUMMARY BANNER */}
          <div className="relative z-10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md overflow-hidden">
            <div 
              className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-15 pointer-events-none blur-3xl transition-colors duration-500"
              style={{ backgroundColor: isInTop3 ? '#10b981' : '#e10600' }}
            />

            <div className="relative z-10 space-y-3">
              {/* Header row of the banner */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm font-mono border shadow-md shrink-0 ${
                    isInTop3 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10'
                  }`}>
                    P{currentPlayerRank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-[#e10600]" />
                        Corrida pelo Top 3 · Promoção de Categoria
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isInTop3 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {isInTop3 ? 'Na Zona de Promoção' : 'Abaixo do Corte'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {isInTop3 
                        ? `Você está no Top 3 com ${playerPoints} pts (${pointsDiffToTarget} pts de vantagem sobre o P4 ${fourthPlaceDriver?.driverName || 'perseguidor'})`
                        : `Você tem ${playerPoints} pts · Faltam ${pointsDiffToTarget} pts para alcançar o 3º colocado (${thirdPlaceName} - ${thirdPlacePoints} pts)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                    <span>Etapa <strong className="text-white">{currentRaceIndex + 1}/{catTracks.length}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span className="text-amber-400 font-bold">+{maxAvailablePoints} pts em disputa</span>
                  </div>
                  <button
                    onClick={() => setShowSeasonSummaryDetails(prev => !prev)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                    title="Alternar Resumo da Temporada"
                  >
                    {showSeasonSummaryDetails ? 'Ocultar Resumo' : 'Resumo da Temporada'}
                  </button>
                </div>
              </div>

              {/* Progress Bar & Numerical Comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Sua Pontuação:</span>
                    <span className="text-amber-400 font-bold tabular-nums text-xs sm:text-sm">{playerPoints} pts</span>
                    {isInTop3 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-slate-400">3º Colocado ({thirdPlaceName}):</span>
                    <span className="text-emerald-400 font-bold tabular-nums text-xs sm:text-sm">{thirdPlacePoints} pts</span>
                  </div>
                </div>

                {/* Progress Bar Line */}
                <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <motion.div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isInTop3 
                        ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                        : 'bg-gradient-to-r from-[#e10600] via-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${top3ProgressPercentage}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${top3ProgressPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>0 pts</span>
                  <span className="text-slate-400 font-medium">
                    {isInTop3 
                      ? 'Zona de Classificação Conquistada (100%)' 
                      : `${top3ProgressPercentage}% da pontuação necessária do P3`}
                  </span>
                  <span>Corte: {thirdPlacePoints} pts</span>
                </div>
              </div>

              {/* Collapsible/Expandable Season Summary in Hub */}
              {showSeasonSummaryDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t border-slate-800 space-y-2.5 font-mono text-xs"
                >
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Resumo Atual da Temporada {currentSeason} ({driver.category.toUpperCase()})</span>
                    <span className="text-slate-400 text-[10px]">{catTracks.length - currentRaceIndex} corridas para o fim</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Posição Geral</div>
                      <div className="text-base font-bold text-white tabular-nums">P{currentPlayerRank} / 20</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Vitórias / Pódios</div>
                      <div className="text-base font-bold text-amber-400 tabular-nums">
                        {currentPlayerStanding?.wins || 0}V · {currentPlayerStanding?.podiums || 0}P
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Distância P3</div>
                      <div className={`text-base font-bold tabular-nums ${isInTop3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isInTop3 ? `+${pointsDiffToTarget} pts` : `-${pointsDiffToTarget} pts`}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Chances de Subir</div>
                      <div className={`text-sm font-bold ${
                        isInTop3 ? 'text-emerald-400' : pointsDiffToTarget <= maxAvailablePoints ? 'text-cyan-400' : 'text-red-400'
                      }`}>
                        {isInTop3 ? 'Muito Alta' : pointsDiffToTarget <= maxAvailablePoints ? 'Possível' : 'Mat. Impossível'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Pódio Atual do Campeonato:</span>
                    <div className="flex items-center gap-3">
                      {sortedSeasonStandings.slice(0, 3).map((s, idx) => (
                        <span key={s.driverName} className={s.driverName === driver.name ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          #{idx + 1} {s.driverName.split(' ').slice(-1)[0]} ({s.points}p)
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="relative z-10 pb-8 space-y-5">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: GARAGEM */}
              {activeTab === 'garagem' && (
                <motion.div 
                  key="garagem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 65% 50%, ${currentTeam.color}, transparent 70%)`
                      }}
                    ></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-sm">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          Chassi Oficial · Etapa {driver.category.toUpperCase()}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {currentTeam.name}
                        </h3>
                        <p className="text-xs text-emerald-400 font-semibold">
                          {currentTeam.bonusType}
                        </p>
                        <div className="flex items-center gap-4 pt-1 text-xs font-mono text-slate-300">
                          <span>Performance: <strong className="text-white">{currentTeam.carPerformance}</strong></span>
                          <span>·</span>
                          <span>Confiabilidade: <strong className="text-white">{currentTeam.reliability}%</strong></span>
                        </div>
                      </div>

                      <div className="w-full md:w-[380px] flex items-center justify-center">
                        <CategoryCarVector 
                          category={driver.category} 
                          teamColor={currentTeam.color} 
                          helmetColor={driver.helmetColor}
                          className="w-full h-32 sm:h-36 drop-shadow-2xl" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 lg:col-span-2 space-y-5">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Atributos do Piloto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { key: 'speed', label: 'Velocidade Pura (Retas)', val: driver.attributes.speed },
                            { key: 'overtaking', label: 'Ultrapassagem (Curvas)', val: driver.attributes.overtaking },
                            { key: 'defense', label: 'Defesa de Posição', val: driver.attributes.defense },
                            { key: 'consistency', label: 'Controle & Consistência', val: driver.attributes.consistency },
                            { key: 'starts', label: 'Reflexo de Largada', val: driver.attributes.starts },
                          ].map(attr => (
                            <div key={attr.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="font-semibold text-white">{attr.label}</span>
                                <span className="font-mono text-amber-400 font-bold tabular-nums">{attr.val}/99</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${attr.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-slate-400 font-semibold mb-0.5">Meta de Promoção (Kart ➔ F3 ➔ F2 ➔ F1)</div>
                          <div className="text-slate-300">Terminar no <strong className="text-amber-400">Top 3 do Campeonato</strong> ao fim da temporada</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 font-semibold mb-0.5">Vitórias / Pódios</div>
                          <div className="font-bold text-amber-400 font-mono text-sm tabular-nums">
                            {driver.careerStats.wins}V · {driver.careerStats.podiums} Pódios
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-[#e10600]" />
                          Pintura do Capacete (Vetor)
                        </h3>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center mb-3">
                          <HelmetVector 
                            primaryColor={driver.helmetColor} 
                            secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                            className="w-20 h-20" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Casco</label>
                            <input 
                              type="color" 
                              value={driver.helmetColor}
                              onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetColor: e.target.value }))}
                              className="w-full h-6 bg-transparent cursor-pointer"
                            />
                          </div>
                          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Faixas</label>
                            <input 
                              type="color" 
                              value={driver.helmetSecondaryColor || '#1e3a8a'}
                              onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetSecondaryColor: e.target.value }))}
                              className="w-full h-6 bg-transparent cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-[#e10600]/10 border border-[#e10600]/30 rounded-xl text-xs text-slate-300">
                        As cores do capacete também aparecem no cockpit do carro!
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: TREINAMENTO */}
              {activeTab === 'treino' && (
                <motion.div 
                  key="treino"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">Centro de Treinamento</h3>
                      <p className="text-xs text-slate-400">
                        Você pode desfazer evoluções e realocar seu XP livremente até iniciar a próxima corrida.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['speed', 'overtaking', 'defense', 'consistency', 'starts'] as const).some(
                        k => driver.attributes[k] > (driver.lockedAttributes?.[k] ?? driver.attributes[k])
                      ) && (
                        <button
                          onClick={resetPendingUpgrades}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Devolver todo o XP gasto antes desta corrida"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Resetar Etapa</span>
                        </button>
                      )}
                      <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-400 font-mono font-bold text-sm tabular-nums">
                        {trainingPoints} XP
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'speed' as const, label: 'Velocidade Pura (Ideal para pistas de retas)', val: driver.attributes.speed },
                      { key: 'overtaking' as const, label: 'Ultrapassagem (Manobras por dentro)', val: driver.attributes.overtaking },
                      { key: 'defense' as const, label: 'Defesa de Posição (Segurar rivais)', val: driver.attributes.defense },
                      { key: 'consistency' as const, label: 'Controle em Curvas & Consistência', val: driver.attributes.consistency },
                      { key: 'starts' as const, label: 'Largada & Reação', val: driver.attributes.starts },
                    ].map(attr => {
                      const cost = getUpgradeCost(attr.val);
                      const lockedVal = driver.lockedAttributes?.[attr.key] ?? attr.val;
                      const pendingGain = attr.val - lockedVal;
                      const refund = pendingGain > 0 ? getUpgradeCost(attr.val - 1) : 0;

                      return (
                        <div key={attr.key} className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800 gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-white">{attr.label}</span>
                              <span className="text-xs text-amber-400 font-mono font-bold tabular-nums">({attr.val}/99)</span>
                              {pendingGain > 0 && (
                                <span className="text-[10px] font-mono font-bold text-emerald-400">
                                  +{pendingGain}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Custo: {cost} XP
                              {pendingGain > 0 && ` · Desfazer devolve +${refund} XP`}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => downgradeAttribute(attr.key)}
                              disabled={pendingGain <= 0}
                              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Desfazer evolução e recuperar XP"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>-1</span>
                            </button>

                            <button
                              onClick={() => upgradeAttribute(attr.key)}
                              disabled={trainingPoints < cost || attr.val >= 99}
                              className="px-3.5 py-2 bg-[#e10600] hover:bg-[#c80500] disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>+1</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB: PATROCINADORES & METAS DE CORRIDA */}
              {activeTab === 'patrocinio' && (
                <motion.div 
                  key="patrocinio"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* HERO BANNER DE PATROCÍNIOS */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Briefcase className="w-4 h-4" />
                          </span>
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                            Departamento Comercial & Patrocínios
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          Contratos de Patrocínio & Metas
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
                          Assine até 2 contratos ativos simultaneamente. Atinja as metas na corrida (duelo contra rivais, voltas sem pit stop, pódios ou posições) para faturar prêmios milionários e Pontos de Treino (XP).
                        </p>
                      </div>

                      {/* Cumulative earnings stats */}
                      <div className="grid grid-cols-3 gap-2 w-full md:w-auto font-mono text-center shrink-0">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Faturamento</div>
                          <div className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                            +${driver.sponsorshipEarnings?.money?.toFixed(2) || '0.00'}M
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">XP Acumulado</div>
                          <div className="text-sm sm:text-base font-bold text-amber-400 tabular-nums">
                            +{driver.sponsorshipEarnings?.xp || 0} XP
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Metas Pagas</div>
                          <div className="text-sm sm:text-base font-bold text-cyan-400 tabular-nums">
                            {driver.sponsorshipEarnings?.completedCount || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE CONTRACTS SLOTS (MAX 2) */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Seus Contratos Ativos no Macacão & Carro ({driver.activeSponsors?.length || 0}/2)
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Válidos para a próxima corrida
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[0, 1].map((slotIdx) => {
                        const activeContract = driver.activeSponsors?.[slotIdx];
                        if (activeContract) {
                          return (
                            <div 
                              key={activeContract.id}
                              className="bg-slate-950 border-2 border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden"
                            >
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Slot {slotIdx + 1} Ativo
                                </span>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-2xl p-1.5 bg-slate-900 rounded-xl border border-slate-800">
                                    {activeContract.logo}
                                  </span>
                                  <div>
                                    <h5 className="font-bold text-white text-sm">{activeContract.name}</h5>
                                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                                      {activeContract.title}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                  {activeContract.description}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="text-emerald-400 font-bold">+${activeContract.rewardMoney}M</span>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-amber-400 font-bold">+{activeContract.rewardXp} XP</span>
                                </div>
                                <button
                                  onClick={() => toggleSponsorContract(activeContract)}
                                  className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                                >
                                  Cancelar Contrato
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={`empty-${slotIdx}`}
                            className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]"
                          >
                            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="text-xs font-bold text-slate-400">Slot {slotIdx + 1} Disponível</div>
                            <p className="text-[11px] text-slate-500 max-w-xs">
                              Selecione um dos patrocinadores da lista abaixo para ativar esta vaga.
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ALL AVAILABLE CONTRACTS BOARD */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Catálogo de Patrocinadores Disponíveis
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Escolha o patrocinador de acordo com sua estratégia
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {SPONSOR_CONTRACTS.map((sp) => {
                        const isCurrentlyActive = (driver.activeSponsors || []).some(c => c.id === sp.id);
                        const tierColor = sp.tier === 'global' ? 'text-amber-400 border-amber-500/40 bg-amber-500/10' : sp.tier === 'regional' ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' : 'text-slate-300 border-slate-700 bg-slate-800';

                        return (
                          <div 
                            key={sp.id}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                              isCurrentlyActive 
                                ? 'bg-slate-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30' 
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl p-1 bg-slate-900 rounded-lg border border-slate-800">
                                    {sp.logo}
                                  </span>
                                  <div>
                                    <div className="text-xs font-bold text-white leading-tight">{sp.name}</div>
                                    <span className="text-[10px] text-slate-400 font-mono">{sp.title}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono font-bold ${tierColor}`}>
                                  {sp.tier}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-300 leading-snug">
                                {sp.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="text-emerald-400 font-bold">+${sp.rewardMoney}M</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-amber-400 font-bold">+{sp.rewardXp} XP</span>
                              </div>

                              <button
                                onClick={() => toggleSponsorContract(sp)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  isCurrentlyActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-red-950 hover:text-red-300 hover:border-red-500'
                                    : 'bg-[#e10600] hover:bg-[#c80500] text-white shadow-sm'
                                }`}
                              >
                                {isCurrentlyActive ? '✓ Ativo no Carro' : 'Assinar Contrato'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: CALENDARIO, ESCOLHA DE PNEU E TRAÇADO */}
              {activeTab === 'calendario' && (
                <motion.div 
                  key="calendario"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                >
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-widest text-[#e10600] font-bold">
                        Etapa {currentRaceIndex + 1} de {catTracks.length} · {driver.category.toUpperCase()}
                      </span>
                      {(() => {
                        const wb = getWeatherBadge(currentTrack.weather);
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2.5 py-0.5 rounded border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                              <span>{wb.icon}</span>
                              <span>{wb.label}</span>
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {currentTrack.laps} Voltas
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-white mb-1">{currentTrack.name}</h3>
                        <p className="text-slate-400 text-xs mb-2">{currentTrack.circuit} · {currentTrack.country}</p>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{currentTrack.characteristics}</p>

                        {currentTrack.weather === 'Chuva' && (
                          <div className="mb-3 p-2.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-[11px] text-blue-200 leading-snug flex items-center gap-2">
                            <span className="text-base shrink-0">🌧️</span>
                            <div>
                              <strong className="text-blue-300">Pista Molhada!</strong> Aderência severamente reduzida. O atributo <strong>Controle & Consistência</strong> é vital para evitar rodadas. Ritmo agressivo aumenta risco de incidentes!
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                          <span>Retas: <strong className="text-cyan-400">{Math.round(currentTrack.straightWeight * 100)}%</strong></span>
                          <span>·</span>
                          <span>Curvas: <strong className="text-amber-400">{Math.round(currentTrack.cornerWeight * 100)}%</strong></span>
                          <span>·</span>
                          <span>Defesa: <strong className="text-emerald-400">{Math.round(currentTrack.defenseWeight * 100)}%</strong></span>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center">
                        <TrackMapVector svgPath={currentTrack.svgPath} accentColor={currentTeam.color} className="w-full h-28" />
                        <span className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                          {currentTrack.profileType} · {currentTrack.laps} Voltas
                        </span>
                      </div>
                    </div>

                    {/* DICA DA EQUIPE DE ENGENHARIA */}
                    {(() => {
                      const tireAdvice = getTeamTireAdvice(currentTrack);
                      return (
                        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3">
                          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                            <Headphones className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                Rádio da Equipe · Dica do Engenheiro de Pista
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${tireAdvice.badgeStyle}`}>
                                Recomendado: Pneu {tireAdvice.recommendedTire}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">
                              "{tireAdvice.reason}"
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* TIRE COMPOUND SELECTION BEFORE RACE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Escolha o Composto de Pneu para a Largada (Pit Stop Automático)
                        </label>
                        <span className="text-[11px] text-amber-400 font-mono">
                          Recomendação: {getTeamTireAdvice(currentTrack).recommendedTire}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {([
                          {
                            id: 'Macio' as TireCompound,
                            badge: 'S',
                            color: 'border-red-500 text-red-400',
                            title: 'Macio (Veloz)',
                            desc: '+0.38s/volta · 1 a 2 Pit Stops'
                          },
                          {
                            id: 'Médio' as TireCompound,
                            badge: 'M',
                            color: 'border-amber-400 text-amber-300',
                            title: 'Médio (Padrão)',
                            desc: 'Equilibrado · 1 Pit Stop médio'
                          },
                          {
                            id: 'Duro' as TireCompound,
                            badge: 'H',
                            color: 'border-slate-200 text-white',
                            title: 'Duro (Durável)',
                            desc: 'Dura a corrida toda (0 paradas)'
                          }
                        ]).map(t => {
                          const isRecommended = t.id === getTeamTireAdvice(currentTrack).recommendedTire;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setStartingTire(t.id)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                                startingTire === t.id
                                  ? 'bg-slate-800 border-[#e10600] ring-1 ring-[#e10600]'
                                  : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-black ${t.color}`}>
                                    {t.badge}
                                  </span>
                                  <span className="text-xs font-bold text-white">{t.title}</span>
                                </div>
                                {isRecommended && (
                                  <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono hidden sm:inline">
                                    ★ Equipe
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 leading-tight">{t.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* METAS DE PATROCÍNIO ATIVAS NESTA CORRIDA */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Metas de Patrocínio Ativas ({driver.activeSponsors?.length || 0}/2)
                        </span>
                        <button
                          onClick={() => setActiveTab('patrocinio')}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          Gerenciar Contratos →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(driver.activeSponsors || []).map(sp => (
                          <div key={sp.id} className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span>{sp.logo}</span>
                              <span className="text-slate-200 truncate">{sp.title}</span>
                            </div>
                            <span className="text-emerald-400 font-bold shrink-0 ml-1">+${sp.rewardMoney}M · +{sp.rewardXp}XP</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Ritmo Inicial de Pilotagem</label>
                        <select 
                          value={drivingStyle} 
                          onChange={(e) => setDrivingStyle(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="conservador">Conservador (Poupa Pneus · Menos Risco de Rodar)</option>
                          <option value="equilibrado">Equilibrado (Ritmo Normal)</option>
                          <option value="agressivo">Agressivo (Ataque, +Desgaste, +Risco na Chuva)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Postura no Pit Stop Automático</label>
                        <select 
                          value={autoPitMode} 
                          onChange={(e) => setAutoPitMode(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="conservador">Conservador (3.0s Seguro · Sem Erro)</option>
                          <option value="arriscado">Arriscado (1.8s Rápido · 25% Risco)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={startQualifying}
                      className="w-full bg-[#e10600] hover:bg-[#c80500] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#e10600]/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      <Timer className="w-4 h-4" />
                      <span>Ir para a Classificação ({currentTrack.laps} Voltas)</span>
                    </button>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Calendário ({catTracks.length} Corridas)
                    </h3>
                    <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                      {catTracks.map((tr, idx) => {
                        const trWb = getWeatherBadge(tr.weather);
                        return (
                          <div 
                            key={tr.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              idx === currentRaceIndex 
                                ? 'bg-[#e10600]/20 border-[#e10600] text-white font-bold' 
                                : idx < currentRaceIndex 
                                ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through' 
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>R{idx + 1} - {tr.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${trWb.badgeClass}`}>
                                  {trWb.icon} {trWb.label}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {tr.laps} voltas · {tr.profileType}
                              </div>
                            </div>
                            {idx === currentRaceIndex && <span className="text-[10px] text-[#e10600] uppercase font-mono">Atual</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: CLASSIFICACAO */}
              {activeTab === 'classificacao' && (
                <motion.div 
                  key="classificacao"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                >
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        Campeonato de Pilotos ({driver.category.toUpperCase()})
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-400">Top 3 Sobe de Categoria</span>
                    </div>
                    <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 font-mono text-xs">
                      {sortedSeasonStandings.map((ds, idx) => {
                        const isTop3 = idx < 3;
                        const isPlayer = ds.driverName === driver.name;
                        return (
                          <div 
                            key={ds.driverName} 
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isPlayer 
                                ? 'bg-[#e10600]/20 border-[#e10600] text-white font-bold' 
                                : isTop3 
                                ? 'bg-amber-500/5 border-amber-500/30 text-slate-200' 
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-6 font-bold ${isTop3 ? 'text-amber-400' : 'text-slate-500'}`}>#{idx + 1}</span>
                              <span>{ds.driverName}</span>
                              {isTop3 && <span className="text-[9px] text-emerald-400 uppercase hidden sm:inline">Zona de Promoção</span>}
                            </div>
                            <span className="text-amber-400 tabular-nums">{ds.points} pts ({ds.wins}V)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      Campeonato de Construtores
                    </h3>
                    <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1 font-mono text-xs">
                      {[...constructorStandings].sort((a, b) => b.points - a.points).map((cs, idx) => {
                        const t = TEAMS.find(x => x.id === cs.teamId)!;
                        return (
                          <div key={cs.teamId} className={`p-2.5 rounded-xl border flex items-center justify-between ${t?.id === driver.teamId ? 'bg-cyan-950/30 border-cyan-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                            <span style={{ color: t?.color }}>#{idx + 1} {t?.name}</span>
                            <span className="text-emerald-400 tabular-nums">{cs.points} pts ({cs.wins}V)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: HISTÓRICO DE TEMPORADAS */}
              {activeTab === 'historico' && (
                <motion.div
                  key="historico"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-[#e10600]" />
                        Histórico Cronológico de Carreira
                      </h3>
                      <p className="text-xs text-slate-400">
                        Registro completo das temporadas disputadas, equipes defendidas, vitórias e posição final.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span>Temporadas: <strong className="text-white">{driver.careerStats.seasons}</strong></span>
                      <span>·</span>
                      <span>Títulos: <strong className="text-amber-400">{driver.careerStats.championships}</strong></span>
                      <span>·</span>
                      <span>Vitórias: <strong className="text-emerald-400">{driver.careerStats.wins}</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                          <th className="py-2.5 px-3">Ano</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3">Equipe Defendida</th>
                          <th className="py-2.5 px-3 text-center">Vitórias</th>
                          <th className="py-2.5 px-3 text-center">Pódios</th>
                          <th className="py-2.5 px-3 text-center">Pontos</th>
                          <th className="py-2.5 px-3 text-right">Posição Final</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {(driver.seasonHistory || []).map((entry, i) => (
                          <tr key={i} className="bg-slate-950/60 hover:bg-slate-950 transition-colors">
                            <td className="py-3 px-3 font-bold text-white">{entry.season}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 uppercase text-[10px] font-bold">
                                {entry.category.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.teamColor }}></span>
                                <span className="font-semibold text-slate-200">{entry.teamName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-amber-400 tabular-nums">{entry.wins}</td>
                            <td className="py-3 px-3 text-center text-slate-300 tabular-nums">{entry.podiums}</td>
                            <td className="py-3 px-3 text-center text-slate-300 tabular-nums">{entry.points}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                entry.finalPosition === 1
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : entry.finalPosition <= 3
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {entry.finalPosition}º Lugar
                              </span>
                            </td>
                          </tr>
                        ))}

                        {/* Current Active Season Row */}
                        <tr className="bg-[#e10600]/10">
                          <td className="py-3 px-3 font-bold text-white">
                            {currentSeason} <span className="text-[9px] text-[#e10600] uppercase ml-1">(Atual)</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-[#e10600]/20 text-[#e10600] uppercase text-[10px] font-bold">
                              {driver.category.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentTeam.color }}></span>
                              <span className="font-semibold text-white">{currentTeam.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-400 tabular-nums">
                            {currentPlayerStanding?.wins ?? 0}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 tabular-nums">
                            {currentPlayerStanding?.podiums ?? 0}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 tabular-nums">
                            {currentPlayerStanding?.points ?? 0}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                              {currentPlayerRank}º (Em disputa)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TAB 6: NOTICIAS */}
              {activeTab === 'noticias' && (
                <motion.div 
                  key="noticias"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#e10600]" />
                      <h3 className="text-sm font-bold text-white">Jornal do Paddock</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">Edição Oficial</span>
                    </div>
                    <button 
                      onClick={() => fetchAiNews()} 
                      disabled={loadingNews} 
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs cursor-pointer flex items-center gap-1.5 font-medium transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin' : ''}`} />
                      <span>{loadingNews ? 'Atualizando...' : 'Atualizar'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-sm italic font-serif leading-relaxed text-slate-200 shadow-inner">
                    "{aiNews}"
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <nav aria-label="Navegação Principal" className="fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 py-2 px-2 z-40 backdrop-blur-lg flex items-center justify-around max-w-2xl mx-auto rounded-t-2xl shadow-2xl">
            {[
              { id: 'garagem', label: 'Garagem', icon: User },
              { id: 'treino', label: 'Treino', icon: Zap },
              { id: 'patrocinio', label: 'Patrocínio', icon: Briefcase },
              { id: 'calendario', label: 'Corrida', icon: Calendar },
              { id: 'classificacao', label: 'Tabela', icon: BarChart2 },
              { id: 'historico', label: 'Histórico', icon: History },
              { id: 'noticias', label: 'Notícias', icon: Newspaper },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer px-2 py-1 rounded-xl ${
                    isActive ? 'text-[#e10600] scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* QUALIFYING SESSION SCREEN WITH STARTING TIRE SELECTION */}
      {gameState === 'qualifying' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">Classificação Oficial</span>
                  {(() => {
                    const wb = getWeatherBadge(currentTrack.weather);
                    return (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                        <span>{wb.icon}</span>
                        <span>{wb.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">{currentTrack.name}</h3>
                <p className="text-xs text-slate-400">{currentTrack.profileType} · {currentTrack.laps} Voltas</p>
              </div>
              <div className="w-24">
                <TrackMapVector svgPath={currentTrack.svgPath} accentColor="#facc15" className="w-full h-14" />
              </div>
            </div>

            {isQualifyingRunning ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs sm:text-sm text-slate-300 font-mono animate-pulse">Pilotos na pista marcando volta rápida...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5 max-h-[230px] overflow-y-auto pr-1 font-mono text-xs">
                  {qualifyingResults.map((q, idx) => (
                    <motion.div 
                      key={q.driverName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.015 }}
                      className={`p-2 rounded-lg border flex items-center justify-between ${q.isPlayer ? 'bg-[#e10600]/20 border-[#e10600] text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 w-6">P{idx + 1}</span>
                        <span>{q.driverName}</span>
                      </div>
                      <span className="text-amber-400 font-bold tabular-nums">{q.lapTime}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Dica da Equipe de Engenharia */}
                {(() => {
                  const tireAdvice = getTeamTireAdvice(currentTrack);
                  return (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                            Dica do Engenheiro de Pista
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold ${tireAdvice.badgeStyle}`}>
                            Recomendação: {tireAdvice.recommendedTire}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          "{tireAdvice.reason}"
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Metas de Patrocínio Ativas nesta Corrida */}
                {driver?.activeSponsors && driver.activeSponsors.length > 0 && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-cyan-400" /> Metas de Patrocínio Ativas:
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Bônus em Dinheiro & XP
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {driver.activeSponsors.map(sp => (
                        <div key={sp.id} className="bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span>{sp.logo}</span>
                            <span className="text-slate-200 truncate">{sp.title}</span>
                          </div>
                          <span className="text-emerald-400 font-bold shrink-0 ml-1">+${sp.rewardMoney}M · +{sp.rewardXp}XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Starting Tire Compound right before Race Start */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase">Pneu de Largada:</span>
                    <span className="text-[11px] text-slate-400 font-mono">Pit Stop automático quando pneu &lt; 27%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'Macio' as TireCompound, label: 'Macio (S)', sub: 'Rápido · 1-2 Paradas' },
                      { id: 'Médio' as TireCompound, label: 'Médio (M)', sub: 'Equilibrado · 1 Parada' },
                      { id: 'Duro' as TireCompound, label: 'Duro (H)', sub: 'Durável · 0 Paradas' },
                    ]).map(t => {
                      const isRecommended = t.id === getTeamTireAdvice(currentTrack).recommendedTire;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setStartingTire(t.id)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            startingTire === t.id
                              ? 'bg-slate-800 border-[#e10600] text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold">{t.label}</div>
                            {isRecommended && (
                              <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                                ★ Equipe
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] opacity-80">{t.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={startRaceFromQualifying}
                  className="w-full bg-[#e10600] hover:bg-[#c80500] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#e10600]/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Largada Oficial ({currentTrack.laps} Voltas · Pneu {startingTire})</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* SINGLE-SCREEN MOBILE & DESKTOP LIVE RACE VIEW (FITS 100% ON ONE SCREEN) */}
      {gameState === 'race' && driver && (
        <div className="fixed inset-0 z-50 h-dvh w-screen bg-[#090a0f] flex flex-col justify-between p-2 sm:p-3 overflow-hidden select-none">
          
          {/* 1. COMPACT RACE HEADER */}
          <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-[#e10600] font-bold truncate">
                  {currentTrack.name}
                </span>
                {(() => {
                  const wb = getWeatherBadge(currentTrack.weather);
                  return (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold flex items-center gap-0.5 ${wb.badgeClass}`}>
                      <span>{wb.icon}</span>
                      <span>{wb.label}</span>
                    </span>
                  );
                })()}
                <span className="text-[10px] text-slate-500 hidden sm:inline">· {currentTrack.profileType}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Retas {Math.round(currentTrack.straightWeight * 100)}% · Curvas {Math.round(currentTrack.cornerWeight * 100)}%
                {currentTrack.weather === 'Chuva' && <span className="text-blue-300 ml-1.5 font-bold">🌧️ Pista Molhada!</span>}
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4 font-mono shrink-0">
              <button
                onClick={() => setSimSpeed(prev => (prev === 1 ? 2 : 1))}
                className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer flex items-center gap-1 ${
                  simSpeed === 2 ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="Velocidade da Simulação"
              >
                <FastForward className="w-3 h-3" />
                <span>{simSpeed}x</span>
              </button>

              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase leading-none">Pos</div>
                <div className="text-sm sm:text-base font-black text-white tabular-nums">P{playerRaceCar?.pos || '-'}</div>
              </div>
              <div className="w-px h-6 bg-slate-800"></div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase leading-none">Voltas</div>
                <div className="text-sm sm:text-base font-black text-amber-400 tabular-nums">{currentLap}/{currentTrack.laps}</div>
              </div>
            </div>
          </div>

          {/* 2. COMPACT TELEMETRY, TRACK MAP & STRATEGY STRIP */}
          {playerRaceCar && (
            <div className="grid grid-cols-12 gap-2 my-1.5 shrink-0">
              {/* Mini Track Map (4 cols on mobile, 3 on desktop) */}
              <div className="col-span-4 sm:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-1.5 flex flex-col items-center justify-center">
                <TrackMapVector 
                  svgPath={currentTrack.svgPath} 
                  accentColor={currentTeam.color} 
                  isRacing={isRacing}
                  playerColor="#e10600"
                  className="w-full h-12 sm:h-14" 
                />
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                  Volta: {playerRaceCar.lastLapTime}
                </span>
              </div>

              {/* Tire Wear + Pace + Auto-Pit Mode Controls (8 cols on mobile, 9 on desktop) */}
              <div className="col-span-8 sm:col-span-9 bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col justify-between gap-1.5">
                {/* Tire Bar & Info */}
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.2 rounded border font-bold ${getTireBadgeStyle(playerRaceCar.tireCompound)}`}>
                      {playerRaceCar.tireCompound}
                    </span>
                    <span className={playerRaceCar.tireHealth <= 32 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {playerRaceCar.tireHealth}%
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[140px] sm:max-w-xs">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        playerRaceCar.tireHealth > 55 ? 'bg-emerald-500' : playerRaceCar.tireHealth > 30 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${playerRaceCar.tireHealth}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-400">Box: {playerRaceCar.pitStops}</span>
                </div>

                {/* Compact Buttons: Pace + Auto-Pit Mode */}
                <div className="flex flex-wrap items-center justify-between gap-1">
                  {/* Driving Pace */}
                  <div className="flex items-center gap-1">
                    {([
                      { id: 'conservador', label: 'Poupar' },
                      { id: 'equilibrado', label: 'Normal' },
                      { id: 'agressivo', label: 'Ataque' }
                    ] as const).map(st => (
                      <button
                        key={st.id}
                        onClick={() => setDrivingStyle(st.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                          drivingStyle === st.id 
                            ? 'bg-slate-800 border-amber-400 text-amber-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Auto Pit Strategy Mode + Optional Manual Pit */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAutoPitMode(prev => (prev === 'conservador' ? 'arriscado' : 'conservador'))}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border flex items-center gap-1 ${
                        autoPitMode === 'conservador'
                          ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                          : 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                      }`}
                      title="Define se o Pit Stop automático será Conservador (3.0s sem erro) ou Arriscado (1.8s ou 5.0s)"
                    >
                      {autoPitMode === 'conservador' ? <Shield className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
                      <span>Auto-Box: {autoPitMode === 'conservador' ? 'Seguro' : 'Arriscado'}</span>
                    </button>

                    <button
                      onClick={triggerManualPitNow}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                        forcePitNextLap
                          ? 'bg-[#e10600] border-white text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                      title="Forçar parada imediata no fim desta volta"
                    >
                      {forcePitNextLap ? 'Box Agendado' : 'Box Agora'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FULL 20-CAR GRID IN SINGLE-FILE (INFILEIRADOS DE P1 A P20) */}
          <div className="flex-1 min-h-0 bg-slate-950/95 border border-slate-800 rounded-xl p-1.5 sm:p-2 overflow-y-auto">
            <div className="flex flex-col gap-1 font-mono">
              {racePositions.map((car) => {
                const carTeam = TEAMS.find(t => t.id === car.teamId);
                const tireColor = car.tireHealth > 55 ? 'bg-emerald-500' : car.tireHealth > 30 ? 'bg-amber-500' : 'bg-red-500';
                const posBadgeStyle = car.pos === 1 
                  ? 'bg-amber-400 text-slate-950 font-black' 
                  : car.pos === 2 
                  ? 'bg-slate-300 text-slate-950 font-bold' 
                  : car.pos === 3 
                  ? 'bg-amber-600 text-white font-bold' 
                  : 'bg-slate-800/90 text-slate-300 font-medium';

                return (
                  <motion.div 
                    key={car.driverName}
                    layout
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className={`px-2 py-1 sm:py-1.5 rounded-lg border flex items-center justify-between gap-1.5 text-[11px] sm:text-xs transition-colors ${
                      car.isPlayer 
                        ? 'bg-[#e10600]/25 border-[#e10600] text-white font-bold shadow-md ring-1 ring-[#e10600]/40' 
                        : 'bg-slate-900/80 border-slate-800/90 text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-5 rounded flex items-center justify-center text-[10px] shrink-0 tabular-nums ${posBadgeStyle}`}>
                        P{car.pos}
                      </span>
                      <div className="w-1 h-3.5 rounded-full shrink-0" style={{ backgroundColor: carTeam?.color || '#64748b' }}></div>
                      <span className="truncate">{car.driverName}</span>
                      {car.isPlayer && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#e10600] text-white font-mono font-bold uppercase shrink-0">
                          VOCÊ
                        </span>
                      )}
                      {car.statusTag && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 shrink-0 border border-slate-700">
                          {car.statusTag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 tabular-nums text-[10px] sm:text-[11px]">
                      {car.pitStops > 0 && (
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-cyan-300 border border-slate-700 hidden xs:inline">
                          {car.pitStops} PIT
                        </span>
                      )}
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getTireBadgeStyle(car.tireCompound)}`}>
                        {car.tireCompound[0]}
                      </span>
                      <div className="w-8 sm:w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${tireColor}`} style={{ width: `${car.tireHealth}%` }}></div>
                      </div>
                      <span className="text-slate-300 font-mono w-12 text-right">{car.gap}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 4. COMPACT 1-LINE LIVE RADIO FOOTER */}
          <div className="mt-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] shrink-0">
            <div className="truncate text-slate-200">
              {raceEventsLog[0] ? (
                <>
                  <span className="text-amber-400 font-mono font-bold mr-1.5">[V{raceEventsLog[0].lap}]</span>
                  <span>{raceEventsLog[0].description}</span>
                </>
              ) : (
                <span className="text-slate-400">Luzes verdes! Corrida em andamento...</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* POST-RACE RESULT MODAL WITH TOP 3 PODIUM */}
      {gameState === 'result' && postRaceResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center my-auto"
          >
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Cerimônia do Pódio</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-5">{currentTrack.name}</h3>

            {/* VISUAL TOP 3 PODIUM (2nd, 1st, 3rd) */}
            <div className="grid grid-cols-3 gap-3 items-end mb-6 pt-2 px-2">
              {postRaceResult.podium[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-full mb-1">
                    {postRaceResult.podium[1].driverName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">+18 pts</div>
                  <div className="w-full h-24 bg-gradient-to-t from-slate-800 to-slate-700 border-t-4 border-slate-300 rounded-t-xl flex flex-col items-center justify-center p-2">
                    <span className="text-2xl font-black text-slate-200 font-mono">2º</span>
                  </div>
                </div>
              )}

              {postRaceResult.podium[0] && (
                <div className="flex flex-col items-center">
                  <Trophy className="w-6 h-6 text-amber-400 mb-1" />
                  <div className="text-xs font-black text-amber-400 truncate max-w-full mb-1">
                    {postRaceResult.podium[0].driverName}
                  </div>
                  <div className="text-[10px] font-mono text-amber-300 mb-2">+25 pts</div>
                  <div className="w-full h-32 bg-gradient-to-t from-amber-900/60 to-amber-500/30 border-t-4 border-amber-400 rounded-t-xl flex flex-col items-center justify-center p-2 shadow-lg shadow-amber-500/10">
                    <span className="text-3xl font-black text-amber-400 font-mono">1º</span>
                  </div>
                </div>
              )}

              {postRaceResult.podium[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-amber-600 truncate max-w-full mb-1">
                    {postRaceResult.podium[2].driverName}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">+15 pts</div>
                  <div className="w-full h-20 bg-gradient-to-t from-amber-950/60 to-amber-800/30 border-t-4 border-amber-600 rounded-t-xl flex flex-col items-center justify-center p-2">
                    <span className="text-xl font-black text-amber-600 font-mono">3º</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Sua Posição Final:</span>
                <span className="font-bold text-white text-base">P{postRaceResult.position} ({postRaceResult.pitStops} Pit Stop)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pontos no Campeonato:</span>
                <span className="font-bold text-amber-400">+{postRaceResult.points} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prêmio Base de Corrida:</span>
                <span className="font-bold text-slate-200">+${postRaceResult.prize}M · +3 XP</span>
              </div>
              {postRaceResult.totalSponsorMoney && postRaceResult.totalSponsorMoney > 0 ? (
                <div className="flex justify-between border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Bônus de Patrocínio Atingido:</span>
                  <span className="font-bold text-emerald-400">
                    +${postRaceResult.totalSponsorMoney}M · +{postRaceResult.totalSponsorXp} XP
                  </span>
                </div>
              ) : null}
            </div>

            {/* METAS DE PATROCÍNIO ATINGIDAS */}
            {postRaceResult.sponsorBonuses && postRaceResult.sponsorBonuses.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-5 text-left font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    Metas de Patrocínio da Etapa
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    +${postRaceResult.totalSponsorMoney || 0}M · +{postRaceResult.totalSponsorXp || 0} XP
                  </span>
                </div>
                <div className="space-y-1.5">
                  {postRaceResult.sponsorBonuses.map(sb => (
                    <div 
                      key={sb.title} 
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                        sb.achieved 
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{sb.logo}</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{sb.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({sb.title})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sb.achieved ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold text-[10px]">
                            +${sb.rewardMoney}M · +{sb.rewardXp}XP CUMPRIDO!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Meta não atingida
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleContinueSeason}
              className="w-full bg-[#e10600] hover:bg-[#c80500] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#e10600]/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <span>Continuar Campeonato</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* PROMOTION MODAL (ONLY UNLOCKED WHEN FINISHING TOP 3 IN THE SEASON STANDINGS) */}
      {gameState === 'promotion' && driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center my-auto"
          >
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
              <Trophy className="w-7 h-7" />
            </div>

            <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
              {seasonEndRank}º Lugar Geral · Temporada Registrada no Histórico!
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 mb-2">
              {driver.category === 'f1' ? 'CAMPEONATO MUNDIAL DE F1 CONCLUÍDO!' : 'TOP 3 ALCANÇADO · PROMOÇÃO LIBERADA!'}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              {driver.category === 'f1'
                ? `Você encerrou a temporada da Fórmula 1 no Pódio Geral (${seasonEndRank}º lugar)! Escolha sua escuderia para o próximo ano.`
                : `Parabéns! Você terminou em ${seasonEndRank}º lugar na somatória das corridas e conquistou vaga na próxima categoria! Escolha sua nova equipe:`}
            </p>

            {/* Complete Season Summary Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                  Resumo Oficial da Temporada {currentSeason} ({driver.category.toUpperCase()})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">OBJETIVO TOP 3 CUMPRIDO!</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Posição Final</div>
                  <div className="text-sm font-bold text-amber-400">{seasonEndRank}º Lugar</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Total de Pontos</div>
                  <div className="text-sm font-bold text-white">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Vitórias</div>
                  <div className="text-sm font-bold text-emerald-400">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Pódios</div>
                  <div className="text-sm font-bold text-cyan-400">{currentPlayerStanding?.podiums || 0}</div>
                </div>
              </div>

              {/* Top 5 Standings Table */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase mb-1.5">Top 5 Final do Campeonato</div>
                <div className="space-y-1">
                  {sortedSeasonStandings.slice(0, 5).map((st, idx) => {
                    const isPlayer = st.driverName === driver.name;
                    return (
                      <div 
                        key={st.driverName} 
                        className={`flex justify-between items-center px-2 py-1 rounded ${
                          isPlayer ? 'bg-[#e10600]/25 text-white font-bold border border-[#e10600]/40' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={idx < 3 ? 'text-amber-400 font-bold' : 'text-slate-500'}>#{idx + 1}</span>
                          <span>{st.driverName}</span>
                          {idx < 3 && <span className="text-[9px] text-emerald-400 uppercase">(Promoção)</span>}
                        </div>
                        <span className="text-amber-400 tabular-nums">{st.points} pts ({st.wins}V)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {driver.category === 'kart' && TEAMS.filter(t => t.category === 'f3').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f3', t.id)}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center justify-between"
                >
                  <span>Subir para F3 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-slate-400">Carro {t.carPerformance}</span>
                </button>
              ))}
              {driver.category === 'f3' && TEAMS.filter(t => t.category === 'f2').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f2', t.id)}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center justify-between"
                >
                  <span>Subir para F2 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-slate-400">Carro {t.carPerformance}</span>
                </button>
              ))}
              {(driver.category === 'f2' || driver.category === 'f1') && TEAMS.filter(t => t.category === 'f1').slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f1', t.id)}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center justify-between"
                >
                  <span>Assinar F1 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-slate-400">Carro {t.carPerformance}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* SEASON FAILED TO REACH TOP 3 MODAL */}
      {gameState === 'season_failed' && driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center my-auto"
          >
            <div className="w-14 h-14 bg-slate-800 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-700">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">
              Fim da Temporada {currentSeason} · {seasonEndRank}º Lugar
            </h3>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Seu resultado foi arquivado na aba <strong>Histórico</strong>. Como apenas o <strong>Top 3 do campeonato</strong> sobe de categoria, você disputará mais um ano na {driver.category.toUpperCase()} com seus atributos evoluídos!
            </p>

            {/* End of Season Complete Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                  Resumo da Temporada {currentSeason}
                </span>
                <span className="text-[10px] text-amber-400 font-bold">FORA DO TOP 3</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Posição Final</div>
                  <div className="text-sm font-bold text-white">{seasonEndRank}º Lugar</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Pontos</div>
                  <div className="text-sm font-bold text-amber-400">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Vitórias</div>
                  <div className="text-sm font-bold text-white">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase">Déficit Top 3</div>
                  <div className="text-sm font-bold text-red-400">
                    -{Math.max(1, thirdPlacePoints - playerPoints)} pts
                  </div>
                </div>
              </div>

              {/* Comparison with 3rd Place */}
              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Última vaga de promoção (P3 {thirdPlaceName}):</span>
                  <span className="text-emerald-400 font-bold">{thirdPlacePoints} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sua pontuação final ({driver.name}):</span>
                  <span className="text-amber-400 font-bold">{playerPoints} pts</span>
                </div>
              </div>

              {/* Final Top 3 Podium */}
              <div>
                <div className="text-[10px] text-slate-400 uppercase mb-1">Pódio Final dos Promovidos</div>
                <div className="space-y-1">
                  {sortedSeasonStandings.slice(0, 3).map((st, idx) => (
                    <div key={st.driverName} className="flex justify-between items-center text-slate-300">
                      <span>#{idx + 1} {st.driverName}</span>
                      <span className="text-amber-400">{st.points} pts ({st.wins}V)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={retryCategorySeason}
              className="w-full py-3.5 bg-[#e10600] hover:bg-[#c80500] text-white font-bold rounded-xl shadow-lg cursor-pointer text-sm"
            >
              Iniciar Temporada {currentSeason + 1} ({driver.category.toUpperCase()})
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
