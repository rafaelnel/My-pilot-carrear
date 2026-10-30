import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Zap, Award, Play, ChevronRight, Activity, 
  ArrowUpRight, RotateCcw, Newspaper, Timer, User, Calendar, BarChart2, 
  PlusCircle, Trash2, Palette, Wrench, Shield, Flame, AlertTriangle, History, FastForward,
  Target, CheckCircle2, CloudRain, Cloud, Sun, Briefcase, Radio, Headphones, DollarSign, Sparkles, Flag, ChevronUp, ChevronDown,
  Crown, Gift, Lock, Check, Save, LogOut, Settings, Swords, TrendingUp, ShieldAlert
} from 'lucide-react';
import { 
  Driver, Track, DriverStanding, ConstructorStanding, RaceEvent, 
  QualifyingResult, MotorsportCategory, LiveRaceCar, RivalDriver, TireCompound, SeasonHistoryEntry,
  WeatherCondition, SponsorContract, CareerMilestone, SeasonAutosave, GameSettings
} from './types';
import { TEAMS, TRACKS, REAL_F1_DRIVERS, REAL_F2_DRIVERS, REAL_F3_DRIVERS, KART_RIVAL_DRIVERS, SPONSOR_CONTRACTS, CAREER_MILESTONES, getTeamTireAdvice, getTireDurabilityDetails, getInitialSeasonGoals } from './data/gameData';
import { HelmetVector, CategoryCarVector, TrackMapVector } from './components/MotorsportVectors';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY = 'apex_gp_career_slots_v2';
const SETTINGS_STORAGE_KEY = 'apex_gp_game_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  soundVolume: 80,
  isWidescreenMode: true,
  simulationSpeed: 1,
  autosaveNotifications: true,
  aiDifficulty: 'Normal',
};

const getInitialSettings = (): GameSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Falha ao carregar configurações do localStorage', err);
  }
  return DEFAULT_SETTINGS;
};

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

  // Settings State & Modal Handler
  const [gameSettings, setGameSettings] = useState<GameSettings>(getInitialSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Live preview states during creation
  const [newHelmetPrimary, setNewHelmetPrimary] = useState<string>('#e10600');
  const [newHelmetSecondary, setNewHelmetSecondary] = useState<string>('#1e3a8a');

  const [gameState, setGameState] = useState<'title' | 'hub' | 'qualifying' | 'race' | 'result' | 'promotion' | 'season_failed'>('title');
  const HUB_TAB_ORDER = ['garagem', 'treino', 'calendario', 'patrocinio', 'classificacao'] as const;
  type HubTab = typeof HUB_TAB_ORDER[number];
  const [activeTab, setActiveTab] = useState<HubTab>('garagem');
  const [championshipViewMode, setChampionshipViewMode] = useState<'classificacao' | 'historico'>('classificacao');
  const [goalsViewMode, setGoalsViewMode] = useState<'metas' | 'milestones'>('metas');
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [isWidescreenMode, setIsWidescreenMode] = useState<boolean>(() => gameSettings.isWidescreenMode);
  const [selectedTrainAttr, setSelectedTrainAttr] = useState<'speed' | 'overtaking' | 'defense' | 'consistency' | 'starts'>('speed');

  const handleSaveSettings = (newSettings: GameSettings) => {
    setGameSettings(newSettings);
    setIsWidescreenMode(newSettings.isWidescreenMode);
    setSimSpeed(newSettings.simulationSpeed);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Falha ao salvar configurações', e);
    }
    setIsSettingsOpen(false);
    triggerSaveToast('⚙️ CONFIGURAÇÕES SALVAS COM SUCESSO!');
  };

  // Two-step deletion confirmation & recovery states
  const [deletingSlotIndex, setDeletingSlotIndex] = useState<number | null>(null);
  const [lastDeletedDriverSlot, setLastDeletedDriverSlot] = useState<{
    slotIndex: number;
    driver: Driver;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('apex_gp_last_deleted_driver_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load last deleted driver', e);
    }
    return null;
  });

  useEffect(() => {
    try {
      if (lastDeletedDriverSlot) {
        localStorage.setItem('apex_gp_last_deleted_driver_v1', JSON.stringify(lastDeletedDriverSlot));
      } else {
        localStorage.removeItem('apex_gp_last_deleted_driver_v1');
      }
    } catch (e) {
      console.error('Failed to persist last deleted driver', e);
    }
  }, [lastDeletedDriverSlot]);

  const switchHubTab = (nextTab: string) => {
    let targetTab: HubTab = 'garagem';
    if (nextTab === 'historico') {
      targetTab = 'classificacao';
      setChampionshipViewMode('historico');
    } else if (nextTab === 'conquistas') {
      targetTab = 'patrocinio';
      setGoalsViewMode('milestones');
    } else if (nextTab === 'noticias') {
      targetTab = 'garagem';
    } else if (HUB_TAB_ORDER.includes(nextTab as HubTab)) {
      targetTab = nextTab as HubTab;
      if (nextTab === 'classificacao') setChampionshipViewMode('classificacao');
      if (nextTab === 'patrocinio') setGoalsViewMode('metas');
    }

    if (targetTab === activeTab) return;
    const prevIdx = HUB_TAB_ORDER.indexOf(activeTab);
    const nextIdx = HUB_TAB_ORDER.indexOf(targetTab);
    setTabDirection(nextIdx >= prevIdx ? 1 : -1);
    setActiveTab(targetTab);
  };

  const hubTabSlideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 72 : -72,
      opacity: 0,
      scale: 0.985,
      filter: 'blur(4px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 330, damping: 32, mass: 0.85 },
        opacity: { duration: 0.22, ease: 'easeOut' as const },
        scale: { duration: 0.24, ease: 'easeOut' as const },
        filter: { duration: 0.18 },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -72 : 72,
      opacity: 0,
      scale: 0.985,
      filter: 'blur(4px)',
      transition: {
        x: { duration: 0.22, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
        opacity: { duration: 0.18, ease: 'easeIn' as const },
        scale: { duration: 0.2 },
        filter: { duration: 0.15 },
      },
    }),
  };

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
  const [showQualiSummaryModal, setShowQualiSummaryModal] = useState<boolean>(false);
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
    fastestLap?: { driverName: string; lapTime: string; isPlayer: boolean };
    mostOvertakes?: { driverName: string; count: number; isPlayer: boolean };
    fastestLapBonusWon?: boolean;
    mostOvertakesBonusWon?: boolean;
    sponsorBonuses?: {
      name: string;
      logo: string;
      title: string;
      currentProgress: number;
      targetValue: number;
      isCompleted: boolean;
      achieved: boolean;
      rewardMoney: number;
      rewardXp: number;
      perRaceRetainer?: number;
    }[];
    totalSponsorMoney?: number;
    totalSponsorXp?: number;
  } | null>(null);
  const [seasonEndRank, setSeasonEndRank] = useState<number>(1);
  const [isCareerPanelMinimized, setIsCareerPanelMinimized] = useState<boolean>(false);
  const playerGridPositionRef = useRef<number>(10);

  // Start-Line Animation States & Handlers
  const [startLineStage, setStartLineStage] = useState<'none' | 'grid_intro' | 'lights_count' | 'lights_out'>('none');
  const [redLightsCount, setRedLightsCount] = useState<number>(0);
  const lightsTimerRef = useRef<any>(null);

  const getDriverTeamColor = (teamId: string) => {
    if (!driver) return '#38bdf8';
    const catTeams = TEAMS.filter(t => t.category === driver.category);
    const found = catTeams.find(t => t.id === teamId);
    return found?.color || '#38bdf8';
  };

  const startLightsCountdown = (initialCars: LiveRaceCar[], track: Track) => {
    setStartLineStage('lights_count');
    setRedLightsCount(1);

    if (lightsTimerRef.current) {
      clearInterval(lightsTimerRef.current);
      clearTimeout(lightsTimerRef.current);
    }

    let count = 1;
    const interval = setInterval(() => {
      count += 1;
      if (count <= 5) {
        setRedLightsCount(count);
      } else {
        clearInterval(interval);
        const randomHold = 550 + Math.random() * 500;
        lightsTimerRef.current = setTimeout(() => {
          setRedLightsCount(0);
          setStartLineStage('lights_out');

          lightsTimerRef.current = setTimeout(() => {
            setStartLineStage('none');
            runLiveRaceSimulation(initialCars, track);
          }, 1200);
        }, randomHold);
      }
    }, 500);

    lightsTimerRef.current = interval;
  };

  const skipStartLineAnimation = (initialCars: LiveRaceCar[], track: Track) => {
    if (lightsTimerRef.current) {
      clearInterval(lightsTimerRef.current);
      clearTimeout(lightsTimerRef.current);
    }
    setStartLineStage('none');
    setRedLightsCount(0);
    runLiveRaceSimulation(initialCars, track);
  };

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

  // Step 1 of deletion: open confirmation modal
  const handleDeleteSlot = (index: number) => {
    setDeletingSlotIndex(index);
  };

  // Step 2 of deletion: execute deletion and save copy to lastDeletedDriverSlot
  const confirmDeleteSlot = () => {
    if (deletingSlotIndex === null) return;
    const slotToDel = slots[deletingSlotIndex];
    if (slotToDel) {
      setLastDeletedDriverSlot({
        slotIndex: deletingSlotIndex,
        driver: { ...slotToDel }
      });
    }
    const newSlots = [...slots];
    newSlots[deletingSlotIndex] = null;
    setSlots(newSlots);
    if (selectedSlotIndex === deletingSlotIndex) {
      setSelectedSlotIndex(null);
    }
    setDeletingSlotIndex(null);
  };

  // Restore the last deleted driver back to their slot or first available empty slot
  const handleRestoreLastDeletedDriver = () => {
    if (!lastDeletedDriverSlot) return;
    const targetIdx = slots[lastDeletedDriverSlot.slotIndex] === null
      ? lastDeletedDriverSlot.slotIndex
      : slots.findIndex(s => s === null);

    if (targetIdx === -1) {
      alert("Todos os slots estão ocupados. Apague ou libere um slot para restaurar.");
      return;
    }

    const newSlots = [...slots];
    newSlots[targetIdx] = { ...lastDeletedDriverSlot.driver, id: targetIdx };
    setSlots(newSlots);
    setLastDeletedDriverSlot(null);
  };

  // Save notification toast state
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'save' | 'autosave' } | null>(null);

  const triggerSaveToast = (message: string, type: 'save' | 'autosave' = 'save') => {
    setSaveToast({ message, type });
    setTimeout(() => setSaveToast(null), 3800);
  };

  // Option to save active driver state and return to driver selection menu at any time
  const handleSaveAndReturnToMenu = () => {
    if (selectedSlotIndex !== null) {
      setSlots(prevSlots => {
        const copy = [...prevSlots];
        if (copy[selectedSlotIndex]) {
          copy[selectedSlotIndex] = {
            ...copy[selectedSlotIndex]!,
            currentSeason,
            currentRaceIndex,
            trainingPoints,
            savedDriverStandings: driverStandings,
            savedConstructorStandings: constructorStandings,
            lastSaved: new Date().toISOString()
          };
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
        } catch (e) {
          console.error('Falha ao salvar slot no localStorage', e);
        }
        return copy;
      });
    }
    triggerSaveToast('💾 Jogo e carreira salvos com sucesso! Voltando ao menu de pilotos...');
    setGameState('title');
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

    const initialSeasonAutosave: SeasonAutosave = {
      season: 2026,
      category: 'kart',
      teamId: startingTeam.id,
      attributes: { ...initialAttrs },
      money: 0.2,
      reputation: 15,
      savedAt: new Date().toISOString()
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
      seasonAutosaves: [initialSeasonAutosave],
      currentSeason: 2026,
      currentRaceIndex: 0,
      trainingPoints: 5,
      seasonGoals: getInitialSeasonGoals(),
      activeSponsors: getInitialSeasonGoals(),
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
    triggerSaveToast('⚡ Autosave: Início da Temporada 2026 (Kart) salvo automaticamente!', 'autosave');
    fetchAiNews(`O piloto ${name} (${nationality}) inicia sua carreira nas pistas de Kart pela ${startingTeam.name}.`);
  };

  const updateActiveDriver = (updater: (prev: Driver) => Driver) => {
    if (selectedSlotIndex === null) return;
    setSlots(prevSlots => {
      const copy = [...prevSlots];
      if (copy[selectedSlotIndex]) {
        const updated = updater(copy[selectedSlotIndex]!);
        const goals = updated.seasonGoals || copy[selectedSlotIndex]?.seasonGoals || getInitialSeasonGoals();
        copy[selectedSlotIndex] = {
          ...updated,
          currentSeason: updated.currentSeason ?? currentSeason,
          currentRaceIndex: updated.currentRaceIndex ?? currentRaceIndex,
          trainingPoints: updated.trainingPoints ?? trainingPoints,
          savedDriverStandings: driverStandings,
          savedConstructorStandings: constructorStandings,
          seasonGoals: goals,
          activeSponsors: goals,
          sponsorshipEarnings: updated.sponsorshipEarnings ?? copy[selectedSlotIndex]?.sponsorshipEarnings ?? { money: 0, xp: 0, completedCount: 0 },
          lastSaved: new Date().toISOString()
        };
      }
      return copy;
    });
  };

  const calculateDriverAvg = (attrs: Driver['attributes']) => {
    const sum = attrs.speed + attrs.overtaking + attrs.defense + attrs.consistency + attrs.starts;
    return Number((sum / 5).toFixed(1));
  };

  const [claimedMilestoneToast, setClaimedMilestoneToast] = useState<{
    title: string;
    money: number;
    xp: number;
  } | null>(null);

  const getMilestoneCurrentValue = (m: CareerMilestone, currentDriver: Driver): number => {
    if (!currentDriver) return 0;
    switch (m.conditionType) {
      case 'podiums':
        return currentDriver.careerStats?.podiums || 0;
      case 'poles':
        return currentDriver.careerStats?.poles || 0;
      case 'wins':
        return currentDriver.careerStats?.wins || 0;
      case 'races':
        return currentDriver.careerStats?.races || 0;
      case 'championships':
        return currentDriver.careerStats?.championships || 0;
      case 'driver_ovr':
        return Math.floor(calculateDriverAvg(currentDriver.attributes));
      case 'money':
        return Math.floor(currentDriver.money);
      case 'category_f1':
        return currentDriver.category === 'f1' ? 1 : 0;
      default:
        return 0;
    }
  };

  const claimMilestoneReward = (milestoneId: string) => {
    if (!driver) return;
    const milestone = CAREER_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone) return;

    const currentVal = getMilestoneCurrentValue(milestone, driver);
    if (currentVal < milestone.targetValue) return;

    const alreadyClaimed = (driver.claimedMilestones || []).includes(milestoneId);
    if (alreadyClaimed) return;

    const updatedClaimed = [...(driver.claimedMilestones || []), milestoneId];

    updateActiveDriver(prev => ({
      ...prev,
      money: Number((prev.money + milestone.rewardMoney).toFixed(1)),
      claimedMilestones: updatedClaimed
    }));

    setTrainingPoints(prev => prev + milestone.rewardXp);

    setClaimedMilestoneToast({
      title: milestone.title,
      money: milestone.rewardMoney,
      xp: milestone.rewardXp
    });

    setTimeout(() => {
      setClaimedMilestoneToast(null);
    }, 4000);
  };

  const claimableMilestonesCount = driver ? CAREER_MILESTONES.filter(m => {
    const isClaimed = (driver.claimedMilestones || []).includes(m.id);
    if (isClaimed) return false;
    const currentVal = getMilestoneCurrentValue(m, driver);
    return currentVal >= m.targetValue;
  }).length : 0;

  const getDriverEffectiveAttributes = (baseAttrs: Driver['attributes'], teamId: string) => {
    const team = TEAMS.find(t => t.id === teamId) || TEAMS[0];
    const b = team.attributeBonuses || {};
    return {
      speed: Math.min(99, baseAttrs.speed + (b.speed || 0)),
      overtaking: Math.min(99, baseAttrs.overtaking + (b.overtaking || 0)),
      defense: Math.min(99, baseAttrs.defense + (b.defense || 0)),
      consistency: Math.min(99, baseAttrs.consistency + (b.consistency || 0)),
      starts: Math.min(99, baseAttrs.starts + (b.starts || 0))
    };
  };

  const toggleSponsorContract = (contract: SponsorContract) => {
    if (!driver) return;
    const currentActive = driver.activeSponsors || [];
    const isAlreadyActive = currentActive.some(c => c.id === contract.id);

    let updatedActive: SponsorContract[];
    if (isAlreadyActive) {
      updatedActive = currentActive.filter(c => c.id !== contract.id);
    } else {
      const contractToAdd: SponsorContract = {
        ...contract,
        currentProgress: 0,
        isCompleted: false
      };
      if (currentActive.length >= 2) {
        // Keep second and replace first
        updatedActive = [currentActive[1], contractToAdd];
      } else {
        updatedActive = [...currentActive, contractToAdd];
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
    const sum = driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts;

    if (trainingPoints < cost) return;
    if (currentVal >= 99) return;
    // Hard limit: driver attributes average cannot exceed 90 (sum cannot exceed 450)
    if (sum >= 450) return;

    setTrainingPoints(prev => prev - cost);
    updateActiveDriver(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attr]: prev.attributes[attr] + 1
      }
    }));
  };

  // Downgrade allows reallocating attribute points and specializing while respecting the 90 average cap
  const downgradeAttribute = (attr: keyof Driver['attributes']) => {
    if (!driver) return;
    const currentVal = driver.attributes[attr];

    // Permit downgrading down to 40 so the driver can freely reallocate attributes
    if (currentVal <= 40) return;

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
    const tB = team.attributeBonuses || {};
    if (driver && driverName === driver.name) {
      const eff = getDriverEffectiveAttributes(driver.attributes, teamId);
      return {
        speedStat: eff.speed,
        cornerStat: Math.round((eff.overtaking * 0.55) + (eff.consistency * 0.45)),
        defenseStat: eff.defense,
        startsStat: eff.starts,
        carPerf: team.carPerformance
      };
    }
    const rivals = driver ? getCategoryRivals(driver.category) : REAL_F1_DRIVERS;
    const found = rivals.find(r => r.name === driverName);
    if (found) {
      const effSpeed = Math.min(99, found.speed + (tB.speed || 0));
      const effCorner = Math.min(99, found.cornering + (tB.overtaking || 0));
      const effDef = Math.min(99, found.defense + (tB.defense || 0));
      const effCons = Math.min(99, (found.consistency ?? found.cornering) + (tB.consistency || 0));
      const effStarts = Math.min(99, (found.starts ?? found.speed) + (tB.starts || 0));
      return {
        speedStat: effSpeed,
        cornerStat: Math.round((effCorner * 0.55) + (effCons * 0.45)),
        defenseStat: effDef,
        startsStat: effStarts,
        carPerf: team.carPerformance
      };
    }
    return { speedStat: 60, cornerStat: 60, defenseStat: 60, startsStat: 60, carPerf: team.carPerformance };
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
      setShowQualiSummaryModal(true);

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
    setShowQualiSummaryModal(false);
    setGameState('race');
    setIsRacing(true);
    setCurrentLap(0);
    setRaceEventsLog([]);
    setPostRaceResult(null);
    setForcePitNextLap(false);
    forcePitRef.current = false;

    let qResults = qualifyingResults;
    if (!qResults || qResults.length === 0) {
      const baseSeconds = driver.category === 'kart' ? 52.0 : driver.category === 'f3' ? 76.0 : driver.category === 'f2' ? 88.0 : 79.0;
      qResults = driverStandings.map(ds => {
        const isPlayer = ds.driverName === driver.name;
        const rawTime = Number((baseSeconds + Math.random() * 2.5).toFixed(3));
        const mins = Math.floor(rawTime / 60);
        const secs = (rawTime % 60).toFixed(3).padStart(6, '0');
        return {
          driverName: ds.driverName,
          teamId: ds.teamId,
          lapTime: mins > 0 ? `${mins}:${secs}` : `${secs}s`,
          rawTime,
          isPlayer
        };
      }).sort((a, b) => a.rawTime - b.rawTime);
      setQualifyingResults(qResults);
    }

    const playerStartIdx = qResults.findIndex(q => q.isPlayer);
    playerGridPositionRef.current = playerStartIdx !== -1 ? playerStartIdx + 1 : 10;

    const catTracks = TRACKS.filter(t => t.category === driver.category);
    const track = catTracks[currentRaceIndex] || catTracks[0];

    const details = getTireDurabilityDetails(track);
    const optimalCompound: TireCompound = details.Duro.isOptimal ? 'Duro' : details.Macio.isOptimal ? 'Macio' : 'Médio';
    const aiCompounds: TireCompound[] = [optimalCompound, optimalCompound, 'Médio', optimalCompound === 'Duro' ? 'Médio' : 'Macio'];

    const initialCars: LiveRaceCar[] = qResults.map((q, idx) => {
      const stats = getDriverCombatStats(q.driverName, q.teamId);
      const startGap = idx * 0.42;
      const aiTire = aiCompounds[(idx + Math.floor(Math.random() * 2)) % aiCompounds.length];
      return {
        driverName: q.driverName,
        teamId: q.teamId,
        pos: idx + 1,
        prevPos: idx + 1,
        startGridPos: idx + 1,
        isPlayer: q.isPlayer,
        gap: idx === 0 ? 'LÍDER' : `+${startGap.toFixed(1)}s`,
        cumulativeTime: startGap,
        lastLapTime: q.lapTime,
        bestLapSeconds: 9999,
        bestLapTimeStr: '--',
        overtakesCount: 0,
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
    setStartLineStage('grid_intro');
    setRedLightsCount(0);
  };

  const runLiveRaceSimulation = (initialGrid: LiveRaceCar[], track: Track) => {
    if (!driver) return;
    if (raceIntervalRef.current) clearTimeout(raceIntervalRef.current);

    let lap = 0;
    let cars = initialGrid.map(c => ({ ...c }));
    const totalLaps = track.laps;
    const baseLapSec = driver.category === 'kart' ? 53.0 : driver.category === 'f3' ? 77.0 : driver.category === 'f2' ? 89.0 : 80.0;

    // Base wear per lap normalized to totalLaps
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
          
          let compoundWearMult =
            car.tireCompound === 'Macio' ? 1.52 :
            car.tireCompound === 'Médio' ? 1.18 : 0.68;

          // Track-dependent abrasion impact on tires:
          // Abrasive tracks rapidly degrade Soft rubber, making Hard tires the dominant winning compound!
          // Smooth low-abrasion tracks preserve Soft rubber and reward its massive grip!
          if (track.tireAbrasion >= 1.08) {
            if (car.tireCompound === 'Macio') compoundWearMult *= 1.48;
            if (car.tireCompound === 'Duro') compoundWearMult *= 0.84;
          } else if (track.tireAbrasion <= 0.98) {
            if (car.tireCompound === 'Macio') compoundWearMult *= 0.72;
            if (car.tireCompound === 'Duro') compoundWearMult *= 1.15;
          }

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
          
          // Tire compound speed difference by circuit profile:
          let compoundSpeedBonus =
            car.tireCompound === 'Macio' ? 3.2 :
            car.tireCompound === 'Médio' ? 1.5 : 0.0;

          if (track.tireAbrasion <= 0.98) {
            // Low abrasion / smooth asphalt: Soft tires dominate with +0.8s/lap pace
            if (car.tireCompound === 'Macio') compoundSpeedBonus = 4.3;
            if (car.tireCompound === 'Duro') compoundSpeedBonus = -1.2;
          } else if (track.tireAbrasion >= 1.08) {
            // High abrasion: Soft overheats, Hard stays in optimal thermo-window
            if (car.tireCompound === 'Macio') compoundSpeedBonus = 1.6;
            if (car.tireCompound === 'Duro') compoundSpeedBonus = 1.4;
          }

          if (isRain) {
            if (car.tireCompound === 'Médio') {
              compoundSpeedBonus += 2.6; // Inter/Wet groove advantage
            } else {
              compoundSpeedBonus -= 2.2; // Slicks struggle in wet conditions
            }
          }

          const wearCritMult = track.tireAbrasion >= 1.08 ? 0.22 : 0.12;
          const tireWearPenalty = car.tireHealth < 40 ? (40 - car.tireHealth) * wearCritMult : (100 - car.tireHealth) * 0.015;

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
          car.cumulativeTime = Number(((car.cumulativeTime || 0) + lapSeconds).toFixed(3));

          const mins = Math.floor(lapSeconds / 60);
          const secs = (lapSeconds % 60).toFixed(3).padStart(6, '0');
          car.lastLapTime = mins > 0 ? `${mins}:${secs}` : `${secs}s`;

          if (lapSeconds < (car.bestLapSeconds || 9999)) {
            car.bestLapSeconds = lapSeconds;
            car.bestLapTimeStr = car.lastLapTime;
          }
        });

        // 2. Dynamic Head-to-Head Overtaking & Defense Battles across the entire grid
        cars.sort((a, b) => {
          if (!a || !b) return 0;
          const aTime = a.cumulativeTime ?? 0;
          const bTime = b.cumulativeTime ?? 0;
          if (Math.abs(aTime - bTime) > 1.25) {
            return aTime - bTime;
          }
          const leader = a.pos < b.pos ? a : b;
          const attacker = a.pos < b.pos ? b : a;
          if (!leader || !attacker) return 0;

          const leaderTime = leader.cumulativeTime ?? 0;
          const attackerTime = attacker.cumulativeTime ?? 0;

          if (attackerTime < leaderTime) {
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
              attacker.cumulativeTime = Number((leaderTime + 0.22).toFixed(3));
              if (leader.isPlayer || attacker.isPlayer || leader.pos <= 4) {
                leader.statusTag = leader.statusTag || '🛡️ DEF';
              }
              return leader === a ? -1 : 1;
            }
          }
          return a.pos - b.pos;
        });

        // 3. Update positions, gaps, and record overtake badges/logs
        if (cars.length === 0) return;
        const leaderTime = cars[0]?.cumulativeTime ?? 0;
        cars.forEach((car, idx) => {
          if (!car) return;
          const newPos = idx + 1;
          const posDiff = car.prevPos - newPos;
          car.pos = newPos;
          car.gap = idx === 0 ? 'LÍDER' : `+${Math.max(0.2, (car.cumulativeTime ?? 0) - leaderTime).toFixed(1)}s`;

          if (!car.inPit && posDiff > 0) {
            car.overtakesCount = (car.overtakesCount || 0) + posDiff;
            car.statusTag = `⬆️+${posDiff}`;
            const overtakenCar = cars[idx + 1];
            const isPlayerAttacker = car.isPlayer;
            const isPlayerDefender = overtakenCar?.isPlayer;
            const isPlayerInvolved = isPlayerAttacker || isPlayerDefender;

            const struggleDescriptions = [
              "Freada tardia e mergulho agressivo por dentro!",
              "Vácuo fulminante e lado a lado na reta!",
              "Grip superior e aceleração total na saída de curva!",
              "Bote cirúrgico em alta velocidade no ponto de frenagem!",
              "Pressão contínua, xadrez de pista e manobra impecável!"
            ];
            const struggleText = struggleDescriptions[(lap + idx) % struggleDescriptions.length];

            if (isPlayerAttacker) {
              lapEvents.push({
                lap,
                description: `🔥 ULTRAPASSAGEM SENSACIONAL! Você superou ${overtakenCar?.driverName || 'o rival'} e assumiu a P${newPos}! (${struggleText})`,
                type: 'overtake',
                attackerName: car.driverName,
                defenderName: overtakenCar?.driverName || 'Rival',
                attackerTeamId: car.teamId,
                defenderTeamId: overtakenCar?.teamId,
                isPlayerInvolved: true,
                newPosition: newPos,
                intensity: 'extreme'
              });
            } else if (isPlayerDefender) {
              lapEvents.push({
                lap,
                description: `⚠️ PRESSÃO NO PADDOCK! ${car.driverName} te ultrapassou e assumiu a P${newPos}! (${struggleText})`,
                type: 'overtake',
                attackerName: car.driverName,
                defenderName: 'Você',
                attackerTeamId: car.teamId,
                defenderTeamId: overtakenCar?.teamId || car.teamId,
                isPlayerInvolved: true,
                newPosition: newPos,
                intensity: 'extreme'
              });
            } else if (newPos <= 6 && lapEvents.length < 3) {
              lapEvents.push({
                lap,
                description: `⚔️ LUTA DE WHEEL-TO-WHEEL! ${car.driverName} ultrapassa ${overtakenCar?.driverName || 'o rival'} pela P${newPos}! (${struggleText})`,
                type: 'overtake',
                attackerName: car.driverName,
                defenderName: overtakenCar?.driverName || 'Rival',
                attackerTeamId: car.teamId,
                defenderTeamId: overtakenCar?.teamId,
                isPlayerInvolved: false,
                newPosition: newPos,
                intensity: 'intense'
              });
            }
          } else if (!car.inPit && posDiff < 0) {
            car.statusTag = `⬇️${posDiff}`;
          }
        });

        if (lapEvents.length === 0 && cars[0]) {
          lapEvents.push({
            lap,
            description: `Volta ${lap}/${totalLaps} · ${cars[0].driverName} lidera (${cars[0].tireCompound?.[0] || 'M'} ${cars[0].tireHealth || 100}%).`,
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

    // 1. Determine Fastest Lap of the race across all cars
    const fastestLapCar = [...finalCars].sort((a, b) => a.bestLapSeconds - b.bestLapSeconds)[0] || playerEntry;
    const isPlayerFastestLap = fastestLapCar.isPlayer && position <= 10;
    const extraFastestLapPoints = isPlayerFastestLap ? 1 : 0;

    // 2. Determine Driver with Most Overtakes (Piloto do Dia)
    const mostOvertakesCar = [...finalCars].sort((a, b) => (b.overtakesCount || 0) - (a.overtakesCount || 0))[0] || playerEntry;
    const maxOvertakesCount = mostOvertakesCar.overtakesCount || 0;
    const isPlayerMostOvertakes = playerEntry.isPlayer && (playerEntry.overtakesCount || 0) === maxOvertakesCount && maxOvertakesCount > 0;

    // Extra awards for player
    let extraBonusXp = 0;
    let extraBonusMoney = 0;
    if (isPlayerFastestLap) {
      extraBonusXp += 2;
      extraBonusMoney += 0.50;
    }
    if (isPlayerMostOvertakes) {
      extraBonusXp += 2;
      extraBonusMoney += 0.50;
    }

    const basePointsWon = position <= 10 ? pointsTable[position - 1] : 0;
    const pointsWon = basePointsWon + extraFastestLapPoints;
    const prizeWon = Number(((position === 1 ? 1.8 : position <= 3 ? 1.0 : position <= 10 ? 0.4 : 0.1) + extraBonusMoney).toFixed(2));
    const repGain = position === 1 ? 12 : position <= 3 ? 8 : position <= 10 ? 4 : 1;

    const podium = finalCars.slice(0, 3).map(c => ({
      driverName: c.driverName,
      teamId: c.teamId,
      gap: c.gap,
      isPlayer: c.isPlayer
    }));

    // 3. Track all 6 Season Goals (3 Fáceis, 2 Médias, 1 Difícil)
    const activeGoals = (driver.seasonGoals && driver.seasonGoals.length === 6)
      ? driver.seasonGoals
      : getInitialSeasonGoals();

    const totalRetainerMoney = activeGoals.reduce((sum, c) => sum + (c.perRaceRetainer || 0), 0);

    const updatedGoals = activeGoals.map(goal => {
      let curProg = goal.currentProgress || 0;
      let newlyProgressed = false;

      switch (goal.id) {
        case 'goal_facil_1_points':
          if (position <= 10) {
            curProg += 1;
            newlyProgressed = true;
          }
          break;
        case 'goal_facil_2_pit':
          if (playerEntry.pitStops <= 1) {
            curProg += 1;
            newlyProgressed = true;
          }
          break;
        case 'goal_facil_3_score':
          curProg += pointsWon;
          if (pointsWon > 0) newlyProgressed = true;
          break;
        case 'goal_media_1_podiums':
          if (position <= 3) {
            curProg += 1;
            newlyProgressed = true;
          }
          break;
        case 'goal_media_2_points':
          curProg += pointsWon;
          if (pointsWon > 0) newlyProgressed = true;
          break;
        case 'goal_dificil_1_victory_top3':
          if (position === 1) {
            curProg = Math.max(curProg, 1);
            newlyProgressed = true;
          }
          break;
        default:
          break;
      }

      const isCompleted = curProg >= goal.targetValue;

      return {
        ...goal,
        currentProgress: curProg,
        isCompleted: isCompleted || (goal.isCompleted ?? false),
        newlyProgressed
      };
    });

    setPostRaceResult({
      position,
      points: pointsWon,
      prize: prizeWon,
      repGain,
      pitStops: playerEntry.pitStops,
      podium,
      fastestLap: {
        driverName: fastestLapCar.driverName,
        lapTime: fastestLapCar.bestLapTimeStr || '1:14.280',
        isPlayer: fastestLapCar.isPlayer
      },
      mostOvertakes: {
        driverName: mostOvertakesCar.driverName,
        count: maxOvertakesCount,
        isPlayer: mostOvertakesCar.isPlayer
      },
      fastestLapBonusWon: isPlayerFastestLap,
      mostOvertakesBonusWon: isPlayerMostOvertakes,
      sponsorBonuses: updatedGoals.map(c => ({
        name: c.name,
        logo: c.logo,
        title: c.title,
        currentProgress: c.currentProgress || 0,
        targetValue: c.targetValue,
        isCompleted: c.isCompleted || false,
        achieved: (c as any).newlyProgressed || c.isCompleted || false,
        rewardMoney: c.rewardMoney,
        rewardXp: c.rewardXp,
        perRaceRetainer: c.perRaceRetainer
      })),
      totalSponsorMoney: Number(totalRetainerMoney.toFixed(2)),
      totalSponsorXp: 0
    });

    const totalMoneyWon = Number((prizeWon + totalRetainerMoney).toFixed(2));
    const totalTpWon = 3 + extraBonusXp;

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
      seasonGoals: updatedGoals,
      activeSponsors: updatedGoals,
      sponsorshipEarnings: {
        money: Number(((prev.sponsorshipEarnings?.money || 0) + totalRetainerMoney).toFixed(2)),
        xp: (prev.sponsorshipEarnings?.xp || 0),
        completedCount: prev.sponsorshipEarnings?.completedCount || 0
      }
    }));

    setTrainingPoints(prev => prev + totalTpWon);

    const teamPointsGain: Record<string, { pts: number; wins: number }> = {};

    setDriverStandings(prev =>
      prev.map(ds => {
        const finishIdx = finalCars.findIndex(c => c.driverName === ds.driverName);
        const finishPos = finishIdx !== -1 ? finishIdx + 1 : 99;
        let pts = finishPos <= 10 ? pointsTable[finishPos - 1] : 0;
        if (ds.driverName === fastestLapCar.driverName && finishPos <= 10) {
          pts += 1;
        }
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
      `Fim do ${track.name}! Pódio: 1º ${podium[0]?.driverName}, 2º ${podium[1]?.driverName} e 3º ${podium[2]?.driverName}. ${driver.name} terminou em P${position} (${playerEntry.pitStops} parada(s)). Melhor volta: ${fastestLapCar.driverName} (${fastestLapCar.bestLapTimeStr}).`
    );
  };

  // End of Race -> Check if Season Ended -> Record Season History, Season Goals Final Payout & Check Top 3 Promotion
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

      // Final season evaluation of all 6 season goals!
      const activeGoals = (driver.seasonGoals && driver.seasonGoals.length === 6)
        ? driver.seasonGoals
        : getInitialSeasonGoals();
      const playerPts = playerStanding?.points || 0;

      let seasonGoalMoney = 0;
      let seasonGoalXp = 0;
      let seasonGoalsCompleted = 0;

      const finalizedGoals = activeGoals.map(c => {
        let passed = false;
        if (c.id === 'goal_facil_1_points') {
          passed = (c.currentProgress || 0) >= c.targetValue;
        } else if (c.id === 'goal_facil_2_pit') {
          passed = (c.currentProgress || 0) >= c.targetValue;
        } else if (c.id === 'goal_facil_3_score') {
          passed = playerPts >= c.targetValue;
        } else if (c.id === 'goal_media_1_podiums') {
          passed = (playerStanding?.podiums || 0) >= c.targetValue;
        } else if (c.id === 'goal_media_2_points') {
          passed = playerPts >= c.targetValue;
        } else if (c.id === 'goal_dificil_1_victory_top3') {
          passed = playerRank <= 3 || (playerStanding?.wins || 0) >= 1;
        }

        if (passed) {
          seasonGoalMoney += c.rewardMoney;
          seasonGoalXp += c.rewardXp;
          seasonGoalsCompleted += 1;
        }
        return {
          ...c,
          currentProgress: 0,
          isCompleted: false
        };
      });

      updateActiveDriver(prev => ({
        ...prev,
        money: Number((prev.money + seasonGoalMoney).toFixed(2)),
        seasonGoals: finalizedGoals,
        activeSponsors: finalizedGoals,
        careerStats: {
          ...prev.careerStats,
          championships: prev.careerStats.championships + (playerRank === 1 ? 1 : 0)
        },
        seasonHistory: [...(prev.seasonHistory || []), historyEntry],
        sponsorshipEarnings: {
          money: Number(((prev.sponsorshipEarnings?.money || 0) + seasonGoalMoney).toFixed(2)),
          xp: (prev.sponsorshipEarnings?.xp || 0) + seasonGoalXp,
          completedCount: (prev.sponsorshipEarnings?.completedCount || 0) + seasonGoalsCompleted
        }
      }));

      setTrainingPoints(prev => prev + seasonGoalXp);

      if (isPromoted) {
        setGameState('promotion');
      } else {
        setGameState('season_failed');
      }
    }
  };

  const retryCategorySeason = () => {
    if (!driver) return;
    const nextSeason = currentSeason + 1;
    setCurrentSeason(nextSeason);
    setCurrentRaceIndex(0);

    const autosave: SeasonAutosave = {
      season: nextSeason,
      category: driver.category,
      teamId: driver.teamId,
      attributes: { ...driver.attributes },
      money: driver.money,
      reputation: driver.reputation,
      savedAt: new Date().toISOString()
    };

    updateActiveDriver(prev => ({
      ...prev,
      careerStats: { ...prev.careerStats, seasons: prev.careerStats.seasons + 1 },
      seasonAutosaves: [...(prev.seasonAutosaves || []), autosave]
    }));
    initCategoryStandings(driver.category, driver);
    setGameState('hub');
    triggerSaveToast(`⚡ Autosave: Início da Temporada ${nextSeason} (${driver.category.toUpperCase()}) salvo automaticamente!`, 'autosave');
  };

  const promoteCategory = (nextCat: MotorsportCategory, chosenTeamId?: string) => {
    if (!driver) return;
    const catTeams = TEAMS.filter(t => t.category === nextCat);
    const nextTeam = chosenTeamId ? (catTeams.find(t => t.id === chosenTeamId) || catTeams[0]) : catTeams[0];
    const nextSeason = currentSeason + 1;

    const autosave: SeasonAutosave = {
      season: nextSeason,
      category: nextCat,
      teamId: nextTeam.id,
      attributes: { ...driver.attributes },
      money: driver.money,
      reputation: Math.min(100, driver.reputation + 12),
      savedAt: new Date().toISOString()
    };

    const updatedDriver: Driver = {
      ...driver,
      category: nextCat,
      teamId: nextTeam.id,
      reputation: Math.min(100, driver.reputation + 12),
      careerStats: { ...driver.careerStats, seasons: driver.careerStats.seasons + 1 },
      seasonAutosaves: [...(driver.seasonAutosaves || []), autosave]
    };

    updateActiveDriver(() => updatedDriver);
    setCurrentSeason(nextSeason);
    setCurrentRaceIndex(0);
    initCategoryStandings(nextCat, updatedDriver);
    setGameState('hub');
    triggerSaveToast(`⚡ Autosave: Início da Temporada ${nextSeason} (${nextCat.toUpperCase()}) salvo automaticamente!`, 'autosave');
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
    <div
      className={`min-h-screen text-[#f1f1f4] font-sans selection:bg-[#e6ff55] selection:text-black flex flex-col relative ${
        isWidescreenMode
          ? 'bg-[#070709] w-full'
          : 'bg-[#ebfa91] items-center justify-start sm:p-4 md:p-6'
      }`}
    >
      {/* GLOBAL SAVE / AUTOSAVE NOTIFICATION TOAST */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.92 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border flex items-center gap-3 backdrop-blur-xl ${
              saveToast.type === 'autosave'
                ? 'bg-[#14141c] text-[#e6ff55] border-[#e6ff55]/50'
                : 'bg-[#e6ff55] text-black border-black font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${saveToast.type === 'autosave' ? 'bg-[#e6ff55]/20 text-[#e6ff55]' : 'bg-black text-[#e6ff55]'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-display font-black italic uppercase tracking-wide">
              {saveToast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Floating View Toggle when in Compact Mobile Frame Mode */}
      {!isWidescreenMode && (
        <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-2 text-xs font-mono">
          <span className="text-[#070709] font-black italic tracking-wide uppercase font-display text-sm">
            APEX GP // MOBILE FRAME
          </span>
          <button
            onClick={() => setIsWidescreenMode(true)}
            className="px-3 py-1 bg-[#070709] text-[#e6ff55] rounded-full text-[11px] font-bold tracking-tight hover:brightness-125 transition-all cursor-pointer shadow"
          >
            🖥️ Alternar p/ Versão Desktop
          </button>
        </div>
      )}

      {/* Main Application Shell: Full-Viewport Desktop Workspace vs Smartphone Frame */}
      <div 
        className={`w-full flex flex-col relative overflow-hidden transition-all duration-300 ${
          isWidescreenMode
            ? 'min-h-screen bg-[#070709]'
            : 'sm:max-w-[420px] min-h-screen sm:min-h-[890px] bg-[#070709] sm:rounded-[48px] sm:border-[8px] sm:border-[#181822] sm:shadow-[0_25px_80px_rgba(0,0,0,0.6)] pb-20'
        }`}
      >
        {/* iOS Status Bar ONLY when in Mobile Frame Mode */}
        {!isWidescreenMode && (
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-white text-xs select-none z-30 shrink-0">
            <span className="font-semibold tracking-tight text-xs font-mono">9:41</span>
            <div className="w-24 h-4 bg-[#14141c] rounded-full mx-auto hidden sm:block border border-white/5 shadow-inner"></div>
            <div className="flex items-center gap-1.5 opacity-90 font-mono text-[10px]">
              <span className="font-bold">5G</span>
              <div className="w-5 h-2.5 border border-white/60 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-[#e6ff55] rounded-2xs"></div>
              </div>
            </div>
          </div>
        )}

        {/* TITLE SCREEN / SAVE SLOTS SELECTOR (DESKTOP WIDESCREEN & MOBILE RESPONSIVE) */}
        {gameState === 'title' && !isCreatingDriver && (
          <div className="flex-1 flex flex-col justify-between p-5 sm:p-8 lg:p-12 max-w-[1440px] w-full mx-auto overflow-y-auto">
            <div className="space-y-6 lg:space-y-8">
              {/* Top Brand Navbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#e6ff55] text-black flex items-center justify-center shadow-lg shadow-[#e6ff55]/20 shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#e6ff55]/15 text-[#e6ff55] border border-[#e6ff55]/30 font-bold">
                        DESKTOP EDITION // 2026
                      </span>
                      <span className="text-xs font-mono text-[#8e8e9c] hidden sm:inline">
                        4 Categorias · Teto FIA 90 OVR
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-display font-black italic text-white tracking-tight uppercase leading-none mt-1">
                      APEX GP <span className="text-[#e6ff55]">// CAREER HUB</span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-4 py-2 bg-[#14141c] hover:bg-[#1e1e2a] text-[#e6ff55] border border-white/10 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                    title="Abrir Configurações do Jogo"
                  >
                    <Settings className="w-4 h-4 text-[#e6ff55]" />
                    <span>CONFIGURAÇÕES</span>
                  </button>

                  <button
                    onClick={() => setIsWidescreenMode(prev => !prev)}
                    className="px-4 py-2 bg-[#14141c] hover:bg-[#1e1e2a] text-[#e6ff55] border border-white/10 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>{isWidescreenMode ? '📱 Modo Compacto Mobile' : '🖥️ Modo Desktop Fullscreen'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Feature Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#14141c] p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#38bdf8] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-display font-black italic uppercase text-white">4 Categorias Oficiais</div>
                    <div className="text-xs text-[#8e8e9c]">Suba do Kart, F3 e F2 até o topo da Fórmula 1</div>
                  </div>
                </div>
                <div className="bg-[#14141c] p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ff5f8f] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-display font-black italic uppercase text-white">Teto FIA Média 90</div>
                    <div className="text-xs text-[#8e8e9c]">Especialize atributos do piloto + bônus de equipe</div>
                  </div>
                </div>
                <div className="bg-[#14141c] p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#e6ff55] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-display font-black italic uppercase text-white">Pit Wall & Telemetria</div>
                    <div className="text-xs text-[#8e8e9c]">Clima dinâmico, desgaste de pneus e metas anuais</div>
                  </div>
                </div>
              </div>

              {/* RECOVERY BANNER FOR LAST DELETED DRIVER */}
              {lastDeletedDriverSlot && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#14141c] border border-[#e6ff55]/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl w-full"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#e6ff55]/20 text-[#e6ff55]">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono font-bold text-[#e6ff55] uppercase tracking-wider">
                        ÚLTIMO PILOTO EXCLUÍDO
                      </div>
                      <div className="text-sm font-display font-black italic uppercase text-white">
                        {lastDeletedDriverSlot.driver.name} ({lastDeletedDriverSlot.driver.category.toUpperCase()} · {lastDeletedDriverSlot.driver.careerStats?.wins || 0} Vitórias)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRestoreLastDeletedDriver}
                    className="px-4 py-2.5 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>DESFAZER & RECUPERAR PILOTO</span>
                  </button>
                </motion.div>
              )}

              {/* Section Header */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-black italic uppercase text-[#e6ff55]">
                    SELECIONE SEU PILOTO // 4 SLOTS DE CARREIRA
                  </h2>
                  <p className="text-xs text-[#8e8e9c] font-mono">
                    Progresso salvo automaticamente no navegador. Escolha um slot para continuar ou iniciar uma nova jornada.
                  </p>
                </div>
              </div>

              {/* 4 Slots Grid: 4 Columns on Desktop Widescreen, 1 Column in Mobile Frame */}
              <div className={`grid gap-5 ${isWidescreenMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {slots.map((slot, index) => {
                  const slotTeam = slot ? (TEAMS.find(t => t.id === slot.teamId) || TEAMS[0]) : null;
                  const slotAvg = slot ? calculateDriverAvg(slot.attributes) : 0;
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="relative overflow-hidden bg-[#14141c] border border-white/10 hover:border-[#e6ff55]/50 rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all group"
                    >
                      {slot && slotTeam ? (
                        <>
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <span className="text-xs font-mono font-bold text-[#e6ff55] uppercase">SLOT 0{index + 1}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-white border border-white/10">
                                  OVR {slotAvg}
                                </span>
                                <span className="text-[10px] font-display font-black italic px-2.5 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30 uppercase">
                                  {slot.category.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3.5">
                              <HelmetVector 
                                primaryColor={slot.helmetColor} 
                                secondaryColor={slot.helmetSecondaryColor || '#1e3a8a'} 
                                className="w-16 h-16 shrink-0 drop-shadow-lg" 
                              />
                              <div className="min-w-0">
                                <div className="text-lg font-display font-black italic uppercase text-white truncate">{slot.name}</div>
                                <div className="text-xs text-[#8e8e9c] font-mono">{slot.nationality}</div>
                                <div className="text-xs font-bold mt-1 truncate" style={{ color: slotTeam.color }}>
                                  {slotTeam.name}
                                </div>
                              </div>
                            </div>

                            {/* Car Preview inside Desktop Card */}
                            <div className="bg-[#070709] rounded-2xl p-2.5 border border-white/5 flex items-center justify-center">
                              <CategoryCarVector 
                                category={slot.category} 
                                teamColor={slotTeam.color} 
                                helmetColor={slot.helmetColor} 
                                className="w-full h-14" 
                              />
                            </div>

                            {/* Mini Career Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center font-mono bg-[#070709]/70 p-2.5 rounded-2xl border border-white/5">
                              <div>
                                <div className="text-[9px] text-[#8e8e9c] uppercase">Títulos</div>
                                <div className="text-xs font-bold text-[#e6ff55]">{slot.careerStats.championships}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-[#8e8e9c] uppercase">Vitórias</div>
                                <div className="text-xs font-bold text-white">{slot.careerStats.wins}</div>
                              </div>
                              <div>
                                <div className="text-[9px] text-[#8e8e9c] uppercase">Saldo</div>
                                <div className="text-xs font-bold text-[#38bdf8]">${slot.money.toFixed(1)}M</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 mt-2">
                            <button
                              onClick={() => selectDriverSlot(index)}
                              className="flex-1 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3.5 rounded-full text-sm tracking-wider transition-all cursor-pointer shadow-lg shadow-[#e6ff55]/15"
                            >
                              CONTINUAR CARREIRA
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(index)}
                              className="p-3.5 bg-[#1e1e28] hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-full transition-colors cursor-pointer"
                              title="Excluir Carreira"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-[#191924] border border-dashed border-white/15 flex items-center justify-center text-[#8e8e9c] group-hover:border-[#e6ff55]/50 group-hover:text-[#e6ff55] transition-colors">
                            <PlusCircle className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="text-sm font-display font-black italic uppercase text-white">SLOT 0{index + 1} DISPONÍVEL</div>
                            <div className="text-xs font-mono text-[#8e8e9c] mt-0.5">Inicie uma nova carreira no Kart</div>
                          </div>
                          <button
                            onClick={() => {
                              setCreatingSlotId(index);
                              setIsCreatingDriver(true);
                            }}
                            className="w-full bg-[#1e1e28] hover:bg-[#e6ff55] hover:text-black text-[#e6ff55] font-display font-black italic uppercase py-3.5 rounded-full text-xs tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-2 border border-white/10"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>CRIAR NOVO PILOTO</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-8 text-xs text-[#8e8e9c] font-mono">
              APEX GP MOTORSPORT · TEMPORADA OFICIAL 2026 · DESKTOP & MOBILE EDITION
            </div>
          </div>
        )}

      {/* STEP 2: DRIVER DELETION CONFIRMATION MODAL */}
      {deletingSlotIndex !== null && slots[deletingSlotIndex] && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-[#14141c] border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-white my-auto relative overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
                  PASSO 2 DE 2 // CONFIRMAÇÃO
                </span>
                <h3 className="text-xl font-display font-black italic uppercase text-white">
                  EXCLUIR PILOTO?
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Você está prestes a apagar o histórico de carreira de{' '}
              <strong className="text-[#e6ff55] font-bold">
                {slots[deletingSlotIndex]?.name}
              </strong>
              .
            </p>

            <div className="bg-[#070709] border border-white/10 rounded-2xl p-3.5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8e8e9c]">Categoria:</span>
                <span className="text-white font-bold uppercase">{slots[deletingSlotIndex]?.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8e8e9c]">Retrospecto:</span>
                <span className="text-[#e6ff55] font-bold">
                  {slots[deletingSlotIndex]?.careerStats.wins} Vitórias · {slots[deletingSlotIndex]?.careerStats.championships} Títulos
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-[11px] font-mono text-amber-200 leading-snug flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>O piloto ficará salvo na memória para você poder desfazer e recuperar posteriormente.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSlotIndex(null)}
                className="py-3 px-4 bg-[#1e1e28] hover:bg-[#282838] text-white font-display font-black italic uppercase rounded-2xl text-xs transition-all cursor-pointer border border-white/10"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlot}
                className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-display font-black italic uppercase rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>CONFIRMAR EXCLUSÃO</span>
              </button>
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
            className="max-w-lg w-full bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto"
          >
            <h3 className="text-2xl font-display font-black italic uppercase text-[#e6ff55] mb-1">Novo Piloto // Slot {creatingSlotId + 1}</h3>
            <p className="text-[#8e8e9c] text-xs mb-5 font-mono">Personalize os dados do piloto e configure a pintura vetorial do seu capacete.</p>

            <div className="bg-[#070709] border border-white/5 rounded-2xl p-4 mb-5 flex flex-col items-center justify-center">
              <HelmetVector 
                primaryColor={newHelmetPrimary} 
                secondaryColor={newHelmetSecondary} 
                className="w-28 h-28" 
              />
              <span className="text-[10px] font-mono text-[#8e8e9c] mt-2 uppercase">Prévia Oficial do Capacete</span>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1.5">Nome do Piloto</label>
                <input 
                  type="text" 
                  name="driverName" 
                  defaultValue="Lucas Senna" 
                  required
                  className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#e6ff55]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1.5">Nacionalidade</label>
                <select name="nationality" className="w-full bg-[#070709] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm">
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
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1.5">Cor Principal</label>
                  <div className="flex items-center gap-2 bg-[#070709] border border-white/10 rounded-xl p-2">
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
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1.5">Faixas / Detalhes</label>
                  <div className="flex items-center gap-2 bg-[#070709] border border-white/10 rounded-xl p-2">
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

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingDriver(false)}
                  className="flex-1 bg-[#1e1e28] hover:bg-[#282836] text-white font-display font-black italic uppercase py-3 rounded-full text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3 rounded-full shadow-lg shadow-[#e6ff55]/20 cursor-pointer text-sm"
                >
                  Iniciar Carreira
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* HUB / CAREER DASHBOARD (FULL DESKTOP SIDEBAR + WIDESCREEN BENTO WORKSPACE) */}
      {gameState === 'hub' && driver && (
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
          
          {/* CLAIMED MILESTONE TOAST NOTIFICATION */}
          <AnimatePresence>
            {claimedMilestoneToast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#e6ff55] text-black border-2 border-black rounded-2xl px-6 py-3.5 shadow-[0_12px_40px_rgba(230,255,85,0.4)] flex items-center gap-3.5 pointer-events-auto"
              >
                <div className="p-2 bg-black text-[#e6ff55] rounded-xl shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-black/70">
                    CONQUISTA DE CARREIRA RESGATADA!
                  </div>
                  <div className="text-sm sm:text-base font-display font-black italic uppercase text-black">
                    {claimedMilestoneToast.title}
                  </div>
                  <div className="text-xs font-mono font-extrabold text-black">
                    +${claimedMilestoneToast.money.toFixed(1)}M no Orçamento · +{claimedMilestoneToast.xp} XP de Treino
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* DESKTOP LEFT SIDEBAR NAVIGATION (VISIBLE WHEN WIDESCREEN MODE IS ACTIVE ON MD+ SCREENS) */}
          {isWidescreenMode && (
            <aside className="hidden md:flex w-64 lg:w-72 bg-[#101017] border-r border-white/5 flex-col justify-between p-5 shrink-0 select-none">
              <div className="space-y-6">
                {/* Brand Logo */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#e6ff55] text-black flex items-center justify-center font-black shadow-md shadow-[#e6ff55]/20">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg font-display font-black italic uppercase text-white leading-none">
                        APEX GP <span className="text-[#e6ff55]">26</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8e8e9c] uppercase">Desktop Pit Wall</span>
                    </div>
                  </div>
                </div>

                {/* Active Driver Mini Profile Card */}
                <div className="bg-[#14141c] border border-white/5 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                  <div className="flex items-center gap-3">
                    <HelmetVector 
                      primaryColor={driver.helmetColor} 
                      secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                      className="w-11 h-11 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-display font-black italic uppercase text-white truncate">
                        {driver.name}
                      </div>
                      <div className="text-[11px] font-mono truncate" style={{ color: currentTeam.color }}>
                        {currentTeam.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-white/5">
                    <span className="px-2 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] font-bold uppercase">
                      {driver.category}
                    </span>
                    <span className="text-[#e6ff55] font-bold">
                      Temporada {currentSeason}
                    </span>
                  </div>
                </div>

                {/* Vertical Navigation Menu */}
                <nav aria-label="Menu Desktop" className="space-y-1.5">
                  {[
                    { id: 'garagem', label: 'Garagem & Telemetria', icon: User, badge: `Etapa ${currentRaceIndex + 1}` },
                    { id: 'treino', label: 'Centro de Evolução', icon: Zap, badge: trainingPoints > 0 ? `${trainingPoints} XP` : undefined },
                    { id: 'calendario', label: '⚡ PRÓXIMA CORRIDA 🏁', icon: Play, isHero: true, badge: currentTrack.weather },
                    { 
                      id: 'patrocinio', 
                      label: 'Metas & Conquistas', 
                      icon: Briefcase, 
                      badge: claimableMilestonesCount > 0 ? `+${claimableMilestonesCount} BÔNUS` : `${(driver.seasonGoals || []).filter(g => g.isCompleted || (g.currentProgress || 0) >= g.targetValue).length}/6` 
                    },
                    { id: 'classificacao', label: 'Campeonato & Histórico', icon: BarChart2, badge: `P${currentPlayerRank}` },
                  ].map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isHero = (item as any).isHero;

                    return (
                      <button
                        key={item.id}
                        onClick={() => switchHubTab(item.id as HubTab)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-mono transition-all cursor-pointer ${
                          isHero
                            ? isActive
                              ? 'bg-[#e6ff55] text-black font-display font-black italic uppercase shadow-lg shadow-[#e6ff55]/30 ring-2 ring-[#e6ff55] text-sm'
                              : 'bg-[#1e1e2d] text-[#e6ff55] font-display font-black italic uppercase border border-[#e6ff55]/50 hover:bg-[#e6ff55] hover:text-black shadow-md'
                            : isActive
                            ? 'bg-[#e6ff55] text-black font-bold shadow-lg shadow-[#e6ff55]/15'
                            : 'text-[#8e8e9c] hover:bg-[#181822] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isHero ? 'fill-current' : ''}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isHero ? 'bg-black/20 text-black' : isActive ? 'bg-black/20 text-black' : 'bg-[#191924] text-[#e6ff55]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Quick Actions in Sidebar */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => setGameState('qualifying')}
                  className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3 rounded-2xl text-xs tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>DISPUTAR GP ({currentTrack.circuit.split(' ')[0]})</span>
                </button>

                <button
                  onClick={handleSaveAndReturnToMenu}
                  className="w-full bg-[#1e1e2d] hover:bg-[#e6ff55] hover:text-black text-[#e6ff55] font-display font-black italic uppercase py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#e6ff55]/40 shadow-sm"
                  title="Salvar e voltar ao menu de seleção de pilotos a qualquer momento"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SALVAR & MENU DE PILOTOS</span>
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full bg-[#191924] hover:bg-[#222232] text-white font-display font-black italic uppercase py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10 shadow-sm"
                  title="Abrir configurações do jogo"
                >
                  <Settings className="w-3.5 h-3.5 text-[#e6ff55]" />
                  <span>CONFIGURAÇÕES</span>
                </button>

                <button
                  onClick={() => setIsWidescreenMode(false)}
                  className="w-full py-1.5 bg-[#14141c] hover:bg-[#1e1e2a] text-[#8e8e9c] hover:text-white rounded-xl text-[10px] font-mono border border-white/5 transition-colors cursor-pointer text-center"
                  title="Visualizar no formato compacto de celular"
                >
                  📱 Modo Mobile
                </button>
              </div>
            </aside>
          )}

          {/* MAIN SCROLLABLE HUB CONTENT AREA */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 max-w-[1500px] w-full mx-auto">
            
            {/* TOP BAR & CHAMPIONSHIP PROGRESS - YOUR CAREER COLLAPSIBLE PANEL */}
            {isCareerPanelMinimized ? (
              /* MINIMIZED CAREER SUMMARY BAR */
              <div className="bg-[#14141c] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 transition-all">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <span className="text-[10px] font-display font-black italic uppercase px-2.5 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30">
                    {driver.category.toUpperCase()} · {currentTeam.name}
                  </span>
                  <h2 className="text-base sm:text-xl font-display font-black italic uppercase text-[#e6ff55] truncate">
                    YOUR CAREER // {driver.name}
                  </h2>
                  <div className="hidden md:flex items-center gap-2.5 text-xs font-mono text-[#8e8e9c] bg-[#070709] px-3 py-1 rounded-xl border border-white/5">
                    <span>Mundial: <strong className="text-white">P{currentPlayerRank} ({playerPoints}pts)</strong></span>
                    <span>·</span>
                    <span>FIA: <strong className="text-[#ff5f8f]">{calculateDriverAvg(driver.attributes)} OVR</strong></span>
                    <span>·</span>
                    <span>Saldo: <strong className="text-[#e6ff55]">${driver.money.toFixed(1)}M</strong></span>
                    <span>·</span>
                    <span>Treino: <strong className="text-emerald-400">{trainingPoints} XP</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-[#191924] hover:bg-[#242434] text-[#e6ff55] rounded-xl transition-all border border-white/10 cursor-pointer flex items-center justify-center shadow-md"
                    title="Configurações do Jogo"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveAndReturnToMenu}
                    className="px-3.5 py-1.5 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    title="Salvar e voltar ao menu de seleção de pilotos"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SALVAR & MENU</span>
                  </button>
                  <button
                    onClick={() => setIsCareerPanelMinimized(false)}
                    className="px-3.5 py-1.5 bg-[#191924] hover:bg-[#242434] text-white font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                  >
                    <span>EXPANDIR</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#e6ff55]" />
                  </button>
                </div>
              </div>
            ) : (
              /* EXPANDED ULTRA-COMPACT CAREER PANEL */
              <div className="bg-[#14141c] border border-white/5 rounded-3xl p-3 sm:p-4 shadow-xl relative overflow-hidden space-y-3">
                
                {/* TOP HEADER ROW */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HelmetVector primaryColor={driver.helmetColor} secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} className="w-7 h-7 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-xl font-display font-black italic uppercase text-[#e6ff55] leading-none tracking-tight truncate">
                          YOUR CAREER // {driver.name}
                        </h2>
                        <span className="text-[9px] font-display font-black italic uppercase px-2 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30 shrink-0">
                          {driver.category.toUpperCase()} · {currentTeam.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#8e8e9c] mt-0.5">
                        TEMPORADA {currentSeason} · ETAPA {currentRaceIndex + 1} DE {catTracks.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-1.5 bg-[#191924] hover:bg-[#242434] text-[#e6ff55] rounded-xl transition-all border border-white/10 cursor-pointer flex items-center justify-center shadow-md"
                      title="Configurações do Jogo"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveAndReturnToMenu}
                      className="px-3 py-1 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1"
                      title="Salvar progresso do piloto e voltar ao menu de seleção"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">SALVAR & MENU</span>
                    </button>
                    <button
                      onClick={() => setIsCareerPanelMinimized(true)}
                      className="px-2.5 py-1 bg-[#070709] hover:bg-[#191924] border border-white/10 hover:border-[#e6ff55] text-white rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Minimizar painel para economizar espaço"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-[#e6ff55]" />
                      <span className="hidden sm:inline font-bold text-[11px]">Minimizar</span>
                    </button>
                  </div>
                </div>

                {/* COMPACT HORIZONTAL LAYOUT: CAR ON LEFT, STATS ON RIGHT */}
                <div className="flex flex-col md:flex-row items-center gap-3">
                  
                  {/* CAR VISUAL (LEFT SIDE OF CAR PANEL) */}
                  <div className="w-full md:w-auto md:shrink-0 bg-[#070709] border border-white/10 rounded-2xl px-3 py-2 flex items-center justify-between md:justify-start gap-3 relative overflow-hidden shadow-inner group">
                    <div 
                      className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 blur-xl"
                      style={{
                        background: `radial-gradient(circle at center, ${currentTeam.color} 0%, transparent 70%)`
                      }}
                    />
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="text-left">
                        <div className="text-[9px] font-mono text-[#8e8e9c] uppercase">{currentTeam.name}</div>
                        <div className="text-[10px] font-display font-black italic text-white uppercase">{driver.category === 'f1' ? 'F1 HYBRID' : driver.category === 'f2' ? 'F2 SPEC' : driver.category === 'f3' ? 'F3 SPEC' : 'KART 125CC'}</div>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-center px-1">
                      <CategoryCarVector 
                        category={driver.category} 
                        teamColor={currentTeam.color} 
                        secondaryColor="#ffffff" 
                        helmetColor={driver.helmetColor} 
                        className="w-36 sm:w-44 h-12 sm:h-14 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] transform transition-transform duration-300 group-hover:scale-105" 
                      />
                    </div>
                  </div>

                  {/* ALL STATS (RIGHT SIDE OF CAR PANEL) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 w-full">
                    
                    {/* 1. Mundial Position */}
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#38bdf8] text-black flex items-center justify-center font-bold shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c]">Mundial</div>
                        <div className="text-xs sm:text-sm font-display font-black italic text-white leading-tight truncate">
                          P{currentPlayerRank} <span className="text-[10px] text-[#38bdf8] font-normal">({playerPoints}p)</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Média FIA */}
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#ff5f8f] text-black flex items-center justify-center font-bold shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c]">Média FIA</div>
                        <div className="text-xs sm:text-sm font-display font-black italic text-white leading-tight truncate">
                          {calculateDriverAvg(driver.attributes)} <span className="text-[10px] text-[#ff5f8f]/80 font-normal">/90</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Orçamento */}
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#e6ff55] text-black flex items-center justify-center font-bold shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c]">Orçamento</div>
                        <div className="text-xs sm:text-sm font-display font-black italic text-[#e6ff55] leading-tight truncate">
                          ${driver.money.toFixed(1)}M
                        </div>
                      </div>
                    </div>

                    {/* 4. XP Treino */}
                    <div 
                      onClick={() => switchHubTab('treino')}
                      className="bg-[#070709] hover:border-emerald-400/50 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer group/xp transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-400 text-black flex items-center justify-center font-bold shrink-0 group-hover/xp:scale-105 transition-transform">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] group-hover/xp:text-emerald-400 flex items-center gap-0.5">
                          <span>Treino XP</span>
                        </div>
                        <div className="text-xs sm:text-sm font-display font-black italic text-emerald-400 leading-tight truncate">
                          {trainingPoints} XP
                        </div>
                      </div>
                    </div>

                    {/* 5. Retrospecto */}
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c]">Retrospecto</div>
                        <div className="text-xs font-display font-black italic text-white leading-tight truncate">
                          {driver.careerStats?.wins || 0}V · {driver.careerStats?.poles || 0}P · {driver.careerStats?.podiums || 0}Pód
                        </div>
                      </div>
                    </div>

                    {/* 6. Bônus Equipe */}
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-400 text-black flex items-center justify-center font-bold shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c]">Equipe</div>
                        <div className="text-[10px] font-display font-black italic text-purple-300 leading-tight truncate" title={currentTeam.bonusType}>
                          {currentTeam.bonusType}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            <div className="relative z-10 pb-12 space-y-6 overflow-x-hidden">
              <AnimatePresence mode="wait" custom={tabDirection}>
                
                {/* TAB 1: GARAGEM (RESPONSIVE 12-COLUMN DESKTOP BENTO GRID) */}
                {activeTab === 'garagem' && (
                  <motion.div 
                    key="garagem"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className={`grid gap-6 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}
                  >
                    {/* LEFT / MAIN COLUMN ON DESKTOP (7 COLS) */}
                    <div className={`${isWidescreenMode ? 'lg:col-span-7' : ''} space-y-6`}>
                      {/* CIRCUIT TRACK MAP HERO CARD */}
                      <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 bg-dark-grid relative overflow-hidden space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono uppercase text-[#e6ff55] font-bold">
                              Próxima Corrida · Etapa {currentRaceIndex + 1} de {catTracks.length}
                            </span>
                            <h4 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white leading-tight mt-0.5">
                              {currentTrack.name} ({currentTrack.country})
                            </h4>
                            <p className="text-xs text-[#8e8e9c] font-mono">{currentTrack.circuit} · {currentTrack.profileType}</p>
                          </div>
                          {(() => {
                            const wb = getWeatherBadge(currentTrack.weather);
                            return (
                              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#1e1e28] text-white border border-white/10 flex items-center gap-1.5">
                                <span>{wb.icon}</span>
                                <span>{wb.label}</span>
                              </span>
                            );
                          })()}
                        </div>

                        {/* Vector Track Map with Glowing Yellow Path & Pink Arrow */}
                        <div className="w-full h-40 sm:h-48 flex items-center justify-center bg-black/50 rounded-2xl p-4 border border-white/5">
                          <TrackMapVector 
                            svgPath={currentTrack.svgPath} 
                            accentColor="#e6ff55" 
                            className="w-full h-full"
                            showDirectionArrow={true}
                          />
                        </div>

                        {/* Telemetry Row */}
                        <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1 text-[#8e8e9c] bg-[#070709]/60 p-3.5 rounded-2xl border border-white/5">
                          <div>
                            <div className="text-[10px] uppercase">Tempo Estimado</div>
                            <div className="text-white font-bold text-sm mt-0.5">~01h : 34m</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] uppercase">Exigência</div>
                            <div className="text-[#38bdf8] font-bold text-sm mt-0.5">
                              Retas {Math.round(currentTrack.straightWeight * 100)}% / Curvas {Math.round(currentTrack.cornerWeight * 100)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase">Distância</div>
                            <div className="text-[#e6ff55] font-bold text-sm mt-0.5">{currentTrack.laps} Voltas</div>
                          </div>
                        </div>

                        {/* Giant CTA Button to Start Qualifying / Race */}
                        <button
                          onClick={() => setGameState('qualifying')}
                          className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-4 rounded-full text-base sm:text-lg tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer text-center block"
                        >
                          DISPUTAR GP ({currentTrack.circuit})
                        </button>
                      </div>

                      {/* 5 ATTRIBUTE BENTO CARDS */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { icon: Zap, key: 'speed' as const, val: driver.attributes.speed, label: 'Velocidade', bg: 'bg-[#38bdf8]/20 text-[#38bdf8]' },
                          { icon: Flame, key: 'overtaking' as const, val: driver.attributes.overtaking, label: 'Ultrapassagem', bg: 'bg-[#e6ff55]/20 text-[#e6ff55]' },
                          { icon: Shield, key: 'defense' as const, val: driver.attributes.defense, label: 'Defesa', bg: 'bg-emerald-500/20 text-emerald-400' },
                          { icon: Activity, key: 'consistency' as const, val: driver.attributes.consistency, label: 'Consistência', bg: 'bg-[#ff5f8f]/20 text-[#ff5f8f]' },
                          { icon: Target, key: 'starts' as const, val: driver.attributes.starts, label: 'Largada', bg: 'bg-purple-500/20 text-purple-400' }
                        ].map((attr, idx) => {
                          const Icon = attr.icon;
                          const teamBonus = currentTeam.attributeBonuses?.[attr.key] || 0;
                          return (
                            <motion.div
                              key={attr.label}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.06 * idx }}
                              onClick={() => {
                                setSelectedTrainAttr(attr.key);
                                switchHubTab('treino');
                              }}
                              className="bg-[#14141c] border border-white/5 rounded-3xl p-4 space-y-1.5 hover:border-[#e6ff55]/40 transition-all shadow-md cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-xl ${attr.bg} flex items-center justify-center`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                {teamBonus > 0 && (
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                    +{teamBonus}
                                  </span>
                                )}
                              </div>
                              <div className="text-2xl font-display font-black italic text-white leading-none pt-1">
                                {attr.val}
                              </div>
                              <div className="text-[10px] font-mono text-[#8e8e9c] truncate">{attr.label}</div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT COLUMN ON DESKTOP (5 COLS): CHASSIS & HELMET */}
                    <div className={`${isWidescreenMode ? 'lg:col-span-5' : ''} space-y-6`}>
                      {/* CHASSI & CAPACETE */}
                      <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#8e8e9c]">Equipe Oficial & Bônus</span>
                            <h4 className="text-lg font-display font-black italic uppercase text-white" style={{ color: currentTeam.color }}>
                              {currentTeam.name}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              {currentTeam.bonusType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center py-4 bg-black/40 rounded-2xl border border-white/5">
                          <CategoryCarVector 
                            category={driver.category} 
                            teamColor={currentTeam.color} 
                            helmetColor={driver.helmetColor} 
                            className="w-full h-28" 
                          />
                        </div>

                        {/* Helmet Customizer */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <HelmetVector 
                              primaryColor={driver.helmetColor} 
                              secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                              className="w-10 h-10 shrink-0" 
                            />
                            <div>
                              <span className="text-xs font-mono text-white block font-bold">Pintura do Capacete</span>
                              <span className="text-[10px] font-mono text-[#8e8e9c]">Clique nas cores para personalizar</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={driver.helmetColor}
                              onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetColor: e.target.value }))}
                              className="w-8 h-8 bg-transparent cursor-pointer rounded"
                              title="Cor Principal" 
                            />
                            <input 
                              type="color" 
                              value={driver.helmetSecondaryColor || '#1e3a8a'}
                              onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetSecondaryColor: e.target.value }))}
                              className="w-8 h-8 bg-transparent cursor-pointer rounded"
                              title="Cor Secundária" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* AUTOSAVES DE INÍCIO DE ANO CHECKPOINTS CARD */}
                      <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-[#e6ff55]/20 text-[#e6ff55]">
                              <Save className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-display font-black italic uppercase text-white tracking-wider">
                                AUTOSAVES // INÍCIO DE ANO
                              </h4>
                              <span className="text-[10px] text-[#8e8e9c] font-mono">
                                Checkpoint salvo a cada novo ano
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#e6ff55] bg-[#e6ff55]/10 px-2.5 py-0.5 rounded-full border border-[#e6ff55]/20">
                            {(driver.seasonAutosaves || []).length} {(driver.seasonAutosaves || []).length === 1 ? 'ANO' : 'ANOS'}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {(driver.seasonAutosaves || []).length > 0 ? (
                            [...(driver.seasonAutosaves || [])].reverse().map((as, idx) => {
                              const tm = TEAMS.find(t => t.id === as.teamId) || TEAMS[0];
                              const avg = calculateDriverAvg(as.attributes);
                              return (
                                <div 
                                  key={idx}
                                  className="bg-[#070709] border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs font-mono"
                                >
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-display font-black italic text-[#e6ff55] text-sm">
                                        Ano {as.season}
                                      </span>
                                      <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] uppercase">
                                        {as.category.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-bold truncate" style={{ color: tm.color }}>
                                      {tm.name}
                                    </div>
                                  </div>

                                  <div className="text-right space-y-0.5 shrink-0">
                                    <div className="text-[11px] font-bold text-white">
                                      {avg} OVR · ${as.money.toFixed(1)}M
                                    </div>
                                    <div className="text-[9px] text-[#8e8e9c]">
                                      {new Date(as.savedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-[#8e8e9c] font-mono text-center py-3">
                              Nenhum autosave de temporada registrado ainda.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: TREINAMENTO (DESKTOP 2-COLUMN SPLIT: INTERACTIVE DIAL + FULL 5-ATTRIBUTE OVERVIEW) */}
                {activeTab === 'treino' && (
                  <motion.div 
                    key="treino"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-display font-black italic uppercase text-[#e6ff55] tracking-tight leading-none">
                          SET A GOAL // CENTRO DE EVOLUÇÃO
                        </h3>
                        <p className="text-xs text-[#8e8e9c] font-mono mt-1">
                          Distribua seus pontos de treino (XP) respeitando o teto regulamentar de média 90 da FIA.
                        </p>
                      </div>
                    </div>

                    <div className={`grid gap-6 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                      {/* LEFT COLUMN: INTERACTIVE BIG DIAL */}
                      <div className={`${isWidescreenMode ? 'lg:col-span-6' : ''} space-y-4`}>
                        {/* Attribute Segmented Switcher */}
                        <div className="flex items-center justify-between gap-1 p-1 bg-[#14141c] rounded-2xl border border-white/5">
                          {[
                            { key: 'speed' as const, label: 'Velocidade' },
                            { key: 'overtaking' as const, label: 'Ultrapassagem' },
                            { key: 'defense' as const, label: 'Defesa' },
                            { key: 'consistency' as const, label: 'Consistência' },
                            { key: 'starts' as const, label: 'Largada' },
                          ].map(tab => (
                            <button
                              key={tab.key}
                              onClick={() => setSelectedTrainAttr(tab.key)}
                              className={`flex-1 py-2.5 text-xs font-display font-black italic uppercase rounded-xl transition-all cursor-pointer ${
                                selectedTrainAttr === tab.key
                                  ? 'bg-[#e6ff55] text-black shadow-md'
                                  : 'text-[#8e8e9c] hover:text-white'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Central Goal / Dial Card */}
                        {(() => {
                          const attrKey = selectedTrainAttr;
                          const val = driver.attributes[attrKey];
                          const cost = getUpgradeCost(val);
                          const currentSum = driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts;
                          const isCapReached = currentSum >= 450;
                          const bonus = currentTeam.attributeBonuses?.[attrKey] || 0;
                          const effectiveVal = Math.min(99, val + bonus);
                          const currentAvg = calculateDriverAvg(driver.attributes);

                          const attrLabels = {
                            speed: 'VELOCIDADE PURA (RETAS)',
                            overtaking: 'ULTRAPASSAGEM (ATAQUE)',
                            defense: 'DEFESA DE POSIÇÃO',
                            consistency: 'CONTROLE & CHUVA',
                            starts: 'LARGADA & REAÇÃO'
                          };

                          return (
                            <div className="bg-[#14141c] border border-white/5 rounded-3xl p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
                              <div>
                                <span className="text-xs font-mono uppercase tracking-widest text-[#8e8e9c] font-bold">
                                  {attrLabels[attrKey]}
                                </span>
                                
                                <div className="flex items-center justify-center gap-8 my-3">
                                  <button
                                    onClick={() => downgradeAttribute(attrKey)}
                                    disabled={val <= 40}
                                    className="w-12 h-12 rounded-full bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-xl transition-all cursor-pointer border border-white/5"
                                    title="Reduzir para recuperar XP e liberar especialização"
                                  >
                                    ‹
                                  </button>

                                  <div className="flex flex-col items-center">
                                    <span className="text-7xl sm:text-8xl font-display font-black italic text-[#e6ff55] tracking-tighter leading-none tabular-nums">
                                      {val}
                                    </span>
                                    {bonus > 0 && (
                                      <span className="text-xs font-mono font-bold text-emerald-400 mt-1">
                                        +{bonus} {currentTeam.shortName} = {effectiveVal} na pista
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => upgradeAttribute(attrKey)}
                                    disabled={trainingPoints < cost || val >= 99 || isCapReached}
                                    className="w-12 h-12 rounded-full bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-30 disabled:cursor-not-allowed text-[#e6ff55] flex items-center justify-center font-bold text-xl transition-all cursor-pointer border border-white/5"
                                    title={isCapReached ? "Teto FIA 90 atingido! Reduza outro atributo com ‹ para liberar espaço." : "Evoluir atributo"}
                                  >
                                    ›
                                  </button>
                                </div>

                                <div className="text-xs font-mono text-[#8e8e9c]">
                                  Custo Próx. Nível: <strong className="text-white">{cost} XP</strong> · Limite Máx: 99
                                </div>
                              </div>

                              {/* Interactive Scale / Ruler Tick Marks */}
                              <div className="pt-2 pb-1 relative">
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8e9c] px-4">
                                  <span>40</span>
                                  <span>50</span>
                                  <span>60</span>
                                  <span>70</span>
                                  <span>80</span>
                                  <span>90</span>
                                  <span>99</span>
                                </div>
                                <div className="flex items-end justify-between px-4 h-6 mt-1 border-b border-white/10 pb-1">
                                  {Array.from({ length: 30 }).map((_, i) => {
                                    const tickVal = 40 + i * 2;
                                    const isNear = Math.abs(tickVal - val) <= 2;
                                    return (
                                      <div 
                                        key={i} 
                                        className={`w-0.5 rounded-full transition-all ${
                                          isNear ? 'bg-[#e6ff55] h-5' : i % 5 === 0 ? 'bg-white/40 h-3.5' : 'bg-white/10 h-2'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2 Bottom KPI Cards */}
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-[#191924] p-3.5 rounded-2xl border border-white/5 text-left flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#ff5f8f]/20 text-[#ff5f8f] flex items-center justify-center shrink-0">
                                    <Target className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-lg font-display font-black italic text-white leading-tight">
                                      {trainingPoints} XP
                                    </div>
                                    <div className="text-[10px] font-mono text-[#8e8e9c]">XP Disponível</div>
                                  </div>
                                </div>

                                <div className="bg-[#191924] p-3.5 rounded-2xl border border-white/5 text-left flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#ff5f8f]/20 text-[#ff5f8f] flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-lg font-display font-black italic text-white leading-tight">
                                      {currentAvg} / 90
                                    </div>
                                    <div className="text-[10px] font-mono text-[#8e8e9c]">Média FIA (Teto)</div>
                                  </div>
                                </div>
                              </div>

                              {(['speed', 'overtaking', 'defense', 'consistency', 'starts'] as const).some(
                                k => driver.attributes[k] > (driver.lockedAttributes?.[k] ?? driver.attributes[k])
                              ) && (
                                <button
                                  onClick={resetPendingUpgrades}
                                  className="w-full py-2.5 bg-[#191924] hover:bg-[#252535] text-amber-400 font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Desfazer gastos desta etapa (Devolver XP)</span>
                                </button>
                              )}

                              <button
                                onClick={() => switchHubTab('calendario')}
                                className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-4 rounded-full text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer block text-center"
                              >
                                CONFIRMAR EVOLUÇÃO & IR PARA ESTRATÉGIA
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {/* RIGHT COLUMN ON DESKTOP: ALL 5 ATTRIBUTES SIMULTANEOUS CONTROL TABLE */}
                      <div className={`${isWidescreenMode ? 'lg:col-span-6' : ''} bg-[#14141c] border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between`}>
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                            <div>
                              <h4 className="text-base font-display font-black italic uppercase text-white">
                                PAINEL COMPLETO DE TELEMETRIA DO PILOTO
                              </h4>
                              <p className="text-xs text-[#8e8e9c] font-mono">
                                Ajuste qualquer atributo diretamente ou clique para focar no dial
                              </p>
                            </div>
                            <span className="text-xs font-mono text-[#e6ff55] font-bold">
                              Soma: {driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts} / 450
                            </span>
                          </div>

                          <div className="space-y-3">
                            {([
                              { key: 'speed' as const, label: 'Velocidade Pura (Retas)', color: 'bg-[#38bdf8]' },
                              { key: 'overtaking' as const, label: 'Ultrapassagem (Curvas)', color: 'bg-[#e6ff55]' },
                              { key: 'defense' as const, label: 'Defesa de Posição', color: 'bg-emerald-400' },
                              { key: 'consistency' as const, label: 'Controle & Chuva', color: 'bg-[#ff5f8f]' },
                              { key: 'starts' as const, label: 'Largada & Reação', color: 'bg-purple-400' }
                            ]).map(item => {
                              const val = driver.attributes[item.key];
                              const bonus = currentTeam.attributeBonuses?.[item.key] || 0;
                              const cost = getUpgradeCost(val);
                              const currentSum = driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts;
                              const isCapReached = currentSum >= 450;

                              return (
                                <div 
                                  key={item.key}
                                  onClick={() => setSelectedTrainAttr(item.key)}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                    selectedTrainAttr === item.key
                                      ? 'bg-[#1e1e2c] border-[#e6ff55]/60'
                                      : 'bg-[#070709] border-white/5 hover:border-white/15'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <span className="text-xs font-display font-black italic uppercase text-white">
                                        {item.label}
                                      </span>
                                      {bonus > 0 && (
                                        <span className="ml-2 text-[10px] font-mono text-emerald-400 font-bold">
                                          +{bonus} Equipe
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); downgradeAttribute(item.key); }}
                                        disabled={val <= 40}
                                        className="w-7 h-7 rounded-lg bg-[#191924] hover:bg-[#282838] disabled:opacity-30 text-white font-mono font-bold text-sm flex items-center justify-center cursor-pointer border border-white/10"
                                      >
                                        -
                                      </button>
                                      <span className="text-lg font-display font-black italic text-[#e6ff55] w-10 text-center tabular-nums">
                                        {val}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); upgradeAttribute(item.key); }}
                                        disabled={trainingPoints < cost || val >= 99 || isCapReached}
                                        className="w-7 h-7 rounded-lg bg-[#e6ff55] hover:brightness-110 disabled:opacity-30 text-black font-mono font-bold text-sm flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div className="w-full h-2 bg-[#191924] rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} transition-all duration-300`} style={{ width: `${val}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 text-xs font-mono text-[#8e8e9c] flex items-center justify-between">
                          <span>Bônus ativo da <strong className="text-white">{currentTeam.name}</strong>:</span>
                          <span className="text-emerald-400 font-bold">{currentTeam.bonusType}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: METAS DE PATROCÍNIO & CONQUISTAS DE CARREIRA (MERGED WITH TOGGLE) */}
                {activeTab === 'patrocinio' && (
                  <motion.div 
                    key="patrocinio"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    {/* TOP TOGGLE SWITCH FOR METAS VS MILESTONES */}
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-[#14141c] rounded-2xl border border-white/10 shadow-lg">
                      <button
                        type="button"
                        onClick={() => setGoalsViewMode('metas')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          goalsViewMode === 'metas'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>Metas Anuais da Temporada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalsViewMode('milestones')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          goalsViewMode === 'milestones'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Conquistas & Milestones</span>
                        {claimableMilestonesCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff5f8f] text-white animate-pulse">
                            +{claimableMilestonesCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {goalsViewMode === 'metas' ? (
                      /* METAS ANUAIS SECTION */
                      <div className="space-y-4">
                        <motion.div 
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className="bg-[#14141c] border border-white/5 rounded-3xl p-5 shadow-xl"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="p-1 rounded-lg bg-[#e6ff55]/20 text-[#e6ff55]">
                                  <Briefcase className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e6ff55]">
                                  PATROCÍNIOS // METAS DE TEMPORADA
                                </span>
                              </div>
                              <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white tracking-tight">
                                METAS ANUAIS ({currentSeason})
                              </h3>
                              <p className="text-xs text-[#8e8e9c] max-w-2xl mt-0.5 leading-relaxed">
                                6 metas de temporada (3 fáceis, 2 médias e 1 difícil). Cumpra-as até o fim do campeonato para desbloquear todos os pontos de treino (XP) e bônus em dinheiro!
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Salário/GP</div>
                                <div className="text-base font-display font-black italic text-[#38bdf8] tabular-nums">
                                  +${(() => {
                                    const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                    return goals.reduce((acc, g) => acc + (g.perRaceRetainer || 0), 0).toFixed(2);
                                  })()}M
                                </div>
                              </div>
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">XP em Jogo</div>
                                <div className="text-base font-display font-black italic text-[#ff5f8f] tabular-nums">
                                  +{(() => {
                                    const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                    return goals.reduce((acc, g) => acc + g.rewardXp, 0);
                                  })()} XP
                                </div>
                              </div>
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Concluídas</div>
                                <div className="text-base font-display font-black italic text-[#e6ff55] tabular-nums">
                                  {(() => {
                                    const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                    return goals.filter(g => g.isCompleted || (g.currentProgress || 0) >= g.targetValue).length;
                                  })()}/6
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {(() => {
                          const allGoals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                          const sections = [
                            {
                              difficulty: 'facil' as const,
                              label: '3 METAS FÁCEIS',
                              tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                              badgeIcon: '🟢',
                              xpNote: '+4 a +5 XP cada',
                              gridCols: isWidescreenMode ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
                              goals: allGoals.filter(g => g.difficulty === 'facil')
                            },
                            {
                              difficulty: 'media' as const,
                              label: '2 METAS MÉDIAS',
                              tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                              badgeIcon: '🟡',
                              xpNote: '+9 XP cada',
                              gridCols: 'grid-cols-1 sm:grid-cols-2',
                              goals: allGoals.filter(g => g.difficulty === 'media')
                            },
                            {
                              difficulty: 'dificil' as const,
                              label: '1 META DIFÍCIL',
                              tagColor: 'bg-[#ff5f8f]/20 text-[#ff5f8f] border-[#ff5f8f]/30',
                              badgeIcon: '👑',
                              xpNote: '+18 XP Máximo',
                              gridCols: 'grid-cols-1',
                              goals: allGoals.filter(g => g.difficulty === 'dificil')
                            }
                          ];

                          return (
                            <div className="space-y-4">
                              {sections.map((sec, secIdx) => (
                                <motion.div
                                  key={sec.difficulty}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + secIdx * 0.08, duration: 0.35 }}
                                  className="bg-[#14141c] border border-white/5 rounded-3xl p-5 space-y-3 shadow-xl"
                                >
                                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{sec.badgeIcon}</span>
                                      <h4 className="text-xs font-display font-black italic uppercase text-white tracking-wider">
                                        {sec.label}
                                      </h4>
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase ${sec.tagColor}`}>
                                        {sec.xpNote}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-[#8e8e9c] font-mono">
                                      Validação ao fim do ano
                                    </span>
                                  </div>

                                  <div className={`grid ${sec.gridCols} gap-4`}>
                                    {sec.goals.map((goal, gIdx) => {
                                      const currentVal = goal.currentProgress || 0;
                                      const targetVal = goal.targetValue;
                                      const isDone = goal.isCompleted || currentVal >= targetVal;
                                      const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));

                                      return (
                                        <motion.div
                                          key={goal.id}
                                          initial={{ opacity: 0, scale: 0.98 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: 0.15 + gIdx * 0.05 }}
                                          className={`bg-[#191924] border-2 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all ${
                                            isDone 
                                              ? 'border-[#e6ff55] shadow-[#e6ff55]/10' 
                                              : 'border-white/5 hover:border-white/10'
                                          }`}
                                        >
                                          <div>
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2.5">
                                                <span className="text-2xl p-1.5 bg-[#070709] rounded-xl border border-white/5">
                                                  {goal.logo}
                                                </span>
                                                <div>
                                                  <h5 className="font-display font-black italic uppercase text-white text-sm leading-tight">
                                                    {goal.name}
                                                  </h5>
                                                  <span className="text-[10px] text-[#8e8e9c] uppercase font-mono">
                                                    {goal.title}
                                                  </span>
                                                </div>
                                              </div>
                                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                                                isDone 
                                                  ? 'bg-[#e6ff55]/20 text-[#e6ff55] border-[#e6ff55]/40 animate-pulse'
                                                  : 'bg-[#191924] text-[#8e8e9c] border-white/5'
                                              }`}>
                                                {isDone ? '🏆 Concluída!' : 'Em Progresso'}
                                              </span>
                                            </div>

                                            <p className="text-xs text-slate-300 leading-snug mb-3">
                                              {goal.description}
                                            </p>

                                            <div className="space-y-1.5 mb-3 bg-[#070709] p-3 rounded-xl border border-white/5">
                                              <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="text-[#8e8e9c] text-[11px]">Progresso na Temporada</span>
                                                <span className="font-bold text-[#e6ff55]">
                                                  {currentVal} / {targetVal}
                                                </span>
                                              </div>
                                              <div className="w-full bg-[#1e1e28] h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                  className={`h-full transition-all duration-500 ${isDone ? 'bg-[#e6ff55]' : 'bg-[#38bdf8]'}`}
                                                  style={{ width: `${progressPct}%` }}
                                                />
                                              </div>
                                              <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8e9c]">
                                                <span>Salário / GP: <strong className="text-white">+${goal.perRaceRetainer?.toFixed(2) || '0.10'}M</strong></span>
                                                <span className={isDone ? 'text-[#e6ff55] font-bold' : ''}>
                                                  {isDone ? '100% Batida!' : `${progressPct}%`}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                              <span className="text-[#8e8e9c]">Prêmio Final:</span>
                                              <span className="text-[#e6ff55] font-bold">+${goal.rewardMoney.toFixed(2)}M</span>
                                              <span className="text-[#8e8e9c]">·</span>
                                              <span className="text-[#ff5f8f] font-bold">+{goal.rewardXp} XP</span>
                                            </div>
                                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                              isDone ? 'bg-[#e6ff55]/20 text-[#e6ff55]' : 'bg-[#191924] text-[#8e8e9c]'
                                            }`}>
                                              {isDone ? 'BÔNUS GARANTIDO' : 'EM DISPUTA'}
                                            </span>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      /* MILESTONES & CONQUISTAS SECTION */
                      <div className="space-y-5">
                        <motion.div 
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className="bg-[#14141c] border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="p-1 rounded-lg bg-[#e6ff55]/20 text-[#e6ff55]">
                                  <Award className="w-3.5 h-3.5" />
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e6ff55]">
                                  GALERIA DE HONRA // CONQUISTAS DE CARREIRA
                                </span>
                              </div>
                              <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white tracking-tight">
                                MILESTONES & MARCOS HISTÓRICOS
                              </h3>
                              <p className="text-xs text-[#8e8e9c] max-w-2xl mt-0.5 leading-relaxed">
                                Complete objetivos lendários na sua trajetória (10 Pódios, 5 Poles, Campeonatos e mais) para desbloquear bônus únicos em dinheiro e XP de evolução.
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Desbloqueadas</div>
                                <div className="text-base font-display font-black italic text-[#e6ff55] tabular-nums">
                                  {(driver.claimedMilestones || []).length} / {CAREER_MILESTONES.length}
                                </div>
                              </div>
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Para Resgatar</div>
                                <div className="text-base font-display font-black italic text-[#ff5f8f] tabular-nums">
                                  {claimableMilestonesCount}
                                </div>
                              </div>
                              <div className="bg-[#191924] p-3 rounded-2xl border border-white/5 text-center min-w-[95px]">
                                <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Total Ganho</div>
                                <div className="text-base font-display font-black italic text-[#38bdf8] tabular-nums">
                                  ${CAREER_MILESTONES.filter(m => (driver.claimedMilestones || []).includes(m.id)).reduce((acc, m) => acc + m.rewardMoney, 0).toFixed(1)}M
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {CAREER_MILESTONES.map((m, idx) => {
                            const currentVal = getMilestoneCurrentValue(m, driver);
                            const isCompleted = currentVal >= m.targetValue;
                            const isClaimed = (driver.claimedMilestones || []).includes(m.id);
                            const canClaim = isCompleted && !isClaimed;
                            const progressPct = Math.min(100, Math.round((currentVal / m.targetValue) * 100));

                            return (
                              <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                                  isClaimed
                                    ? 'bg-[#0e0e14] border-emerald-500/20 opacity-85'
                                    : canClaim
                                    ? 'bg-[#1e1e2d] border-[#e6ff55] ring-2 ring-[#e6ff55]/30 shadow-lg shadow-[#e6ff55]/10'
                                    : 'bg-[#14141c] border-white/5 hover:border-white/15'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                                        m.categoryTag === 'Vitórias & Pódios'
                                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                          : m.categoryTag === 'Evolução & Títulos'
                                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                      }`}>
                                        {m.categoryTag}
                                      </span>
                                      {isClaimed && (
                                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                          <Check className="w-3 h-3" /> RESGATADO
                                        </span>
                                      )}
                                      {canClaim && (
                                        <span className="text-[9px] font-mono font-bold text-[#e6ff55] bg-[#e6ff55]/20 px-2 py-0.5 rounded-full border border-[#e6ff55]/40 animate-pulse">
                                          ✨ DISPONÍVEL!
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="text-base sm:text-lg font-display font-black italic uppercase text-white leading-snug">
                                      {m.title}
                                    </h4>
                                    <p className="text-xs text-[#8e8e9c] leading-relaxed">
                                      {m.description}
                                    </p>
                                  </div>

                                  <div className="bg-[#070709] px-3 py-2 rounded-2xl border border-white/10 text-right shrink-0">
                                    <div className="text-[9px] font-mono uppercase text-[#8e8e9c]">Recompensa</div>
                                    <div className="text-xs font-display font-black italic text-[#e6ff55]">
                                      +${m.rewardMoney.toFixed(1)}M
                                    </div>
                                    <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                      +{m.rewardXp} XP
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8e8e9c]">
                                    <span>Progresso: <strong className="text-white">{currentVal} / {m.targetValue}</strong></span>
                                    <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-[#8e8e9c]'}>{progressPct}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-[#070709] rounded-full overflow-hidden border border-white/5">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isClaimed ? 'bg-emerald-500' : isCompleted ? 'bg-[#e6ff55]' : 'bg-[#38bdf8]'
                                      }`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="pt-2">
                                  {canClaim ? (
                                    <button
                                      onClick={() => claimMilestoneReward(m.id)}
                                      className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3 rounded-2xl text-xs tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                      <Gift className="w-4 h-4 fill-current" />
                                      <span>RESGATAR +${m.rewardMoney.toFixed(1)}M & +{m.rewardXp} XP</span>
                                    </button>
                                  ) : isClaimed ? (
                                    <div className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                                      <Check className="w-4 h-4" />
                                      <span>BÔNUS CONQUISTADO & ADICIONADO AO SALDO</span>
                                    </div>
                                  ) : (
                                    <div className="w-full py-2.5 bg-[#070709] border border-white/5 rounded-2xl text-center text-xs font-mono text-[#8e8e9c] flex items-center justify-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>EM PROGRESSO ({currentVal}/{m.targetValue})</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: CALENDARIO, ESCOLHA DE PNEU E TRAÇADO (DESKTOP 2-COLUMN SPLIT) */}
                {activeTab === 'calendario' && (
                  <motion.div 
                    key="calendario"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className={`grid gap-6 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}
                  >
                    {/* LEFT 7 COLS: STRATEGY & TIRE SELECTION */}
                    <div className={`${isWidescreenMode ? 'lg:col-span-7' : ''} bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#e6ff55]">
                          ETAPA {currentRaceIndex + 1} DE {catTracks.length} · {driver.category.toUpperCase()}
                        </span>
                        {(() => {
                          const wb = getWeatherBadge(currentTrack.weather);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                                <span>{wb.icon}</span>
                                <span>{wb.label}</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#191924] text-[#8e8e9c] font-mono border border-white/5">
                                {currentTrack.laps} Voltas
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#070709] p-4 rounded-2xl border border-white/5">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white tracking-tight mb-0.5">
                            {currentTrack.name}
                          </h3>
                          <p className="text-[#8e8e9c] text-xs mb-2 font-mono">{currentTrack.circuit} · {currentTrack.country}</p>
                          <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{currentTrack.characteristics}</p>

                          {currentTrack.weather === 'Chuva' && (
                            <div className="mb-3 p-2.5 rounded-xl bg-blue-950/50 border border-blue-400/30 text-[11px] text-blue-200 leading-snug flex items-center gap-2">
                              <span className="text-base shrink-0">🌧️</span>
                              <div>
                                <strong className="text-blue-300">Pista Molhada!</strong> Aderência severamente reduzida. <strong>Controle & Consistência</strong> evita rodadas.
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#8e8e9c]">
                            <span>Retas: <strong className="text-[#38bdf8]">{Math.round(currentTrack.straightWeight * 100)}%</strong></span>
                            <span>·</span>
                            <span>Curvas: <strong className="text-[#ff5f8f]">{Math.round(currentTrack.cornerWeight * 100)}%</strong></span>
                            <span>·</span>
                            <span>Defesa: <strong className="text-[#e6ff55]">{Math.round(currentTrack.defenseWeight * 100)}%</strong></span>
                          </div>
                        </div>

                        <div className="bg-[#14141c] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
                          <TrackMapVector svgPath={currentTrack.svgPath} accentColor={currentTeam.color} className="w-full h-28" />
                          <span className="text-[10px] font-mono text-[#8e8e9c] uppercase mt-1">
                            {currentTrack.profileType} · {currentTrack.laps} Voltas
                          </span>
                        </div>
                      </div>

                      {/* DICA DA EQUIPE DE ENGENHARIA */}
                      {(() => {
                        const tireAdvice = getTeamTireAdvice(currentTrack);
                        return (
                          <div className="bg-[#191924] border border-white/5 rounded-2xl p-3.5 flex items-start gap-3">
                            <div className="p-2 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl shrink-0 mt-0.5">
                              <Headphones className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-display font-black italic uppercase text-[#e6ff55] tracking-wider flex items-center gap-1.5">
                                  <Radio className="w-3 h-3 text-[#e6ff55] animate-pulse" />
                                  RÁDIO DA EQUIPE // ENGENHEIRO CHEFE
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold ${tireAdvice.badgeStyle}`}>
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
                      {(() => {
                        const tireDurability = getTireDurabilityDetails(currentTrack);
                        const tireAdvice = getTeamTireAdvice(currentTrack);

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-display font-black italic uppercase text-[#8e8e9c] tracking-wider">
                                COMPOSTO DE PNEU PARA A LARGADA
                              </label>
                              <span className="text-[10px] text-[#e6ff55] font-mono">
                                Engenharia: <strong>{tireAdvice.recommendedTire}</strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {([
                                {
                                  id: 'Macio' as TireCompound,
                                  badge: 'S',
                                  color: 'border-red-500 text-red-400 bg-red-500/10',
                                  title: 'Macio (Soft)',
                                  info: tireDurability.Macio
                                },
                                {
                                  id: 'Médio' as TireCompound,
                                  badge: 'M',
                                  color: 'border-[#e6ff55] text-[#e6ff55] bg-[#e6ff55]/10',
                                  title: 'Médio (Medium)',
                                  info: tireDurability.Médio
                                },
                                {
                                  id: 'Duro' as TireCompound,
                                  badge: 'H',
                                  color: 'border-slate-200 text-white bg-slate-200/10',
                                  title: 'Duro (Hard)',
                                  info: tireDurability.Duro
                                }
                              ]).map(t => {
                                const isSelected = startingTire === t.id;
                                const isOpt = t.info.isOptimal;

                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setStartingTire(t.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                                      isSelected
                                        ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/30 shadow-lg'
                                        : isOpt
                                        ? 'bg-[#191924] border-[#e6ff55]/40 hover:bg-[#222230]'
                                        : 'bg-[#191924] border-white/5 hover:bg-[#222230]'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-black ${t.color}`}>
                                            {t.badge}
                                          </span>
                                          <span className="text-xs font-display font-black italic uppercase text-white">{t.title}</span>
                                        </div>
                                        {isOpt && (
                                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40 font-mono font-bold">
                                            ★ IDEAL
                                          </span>
                                        )}
                                      </div>

                                      <div className="bg-[#070709] px-2 py-1 rounded-xl border border-white/5 mb-1.5 flex items-center justify-between text-[10px] font-mono">
                                        <span className="text-[#8e8e9c]">Duração:</span>
                                        <span className={`font-bold ${isOpt ? 'text-[#e6ff55]' : 'text-slate-200'}`}>
                                          ~{t.info.minLaps} a {t.info.maxLaps} voltas
                                        </span>
                                      </div>

                                      <div className="text-[10px] text-slate-300 leading-tight mb-1">
                                        {t.info.paceNote}
                                      </div>
                                    </div>

                                    <div className="text-[9px] text-[#8e8e9c] font-mono mt-1 border-t border-white/5 pt-1">
                                      {t.id === 'Macio' && 'Mais aderência e ritmo inicial'}
                                      {t.id === 'Médio' && 'Equilíbrio ideal p/ 1 pit stop'}
                                      {t.id === 'Duro' && 'Máxima resistência sem paradas'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="bg-[#070709] border border-white/5 p-2.5 rounded-xl text-[10px] text-slate-300 flex items-center gap-2">
                              <span className="text-[#e6ff55] font-bold shrink-0">Estratégia {startingTire}:</span>
                              <span className="text-[#8e8e9c] text-[10px] leading-tight">
                                {tireDurability[startingTire].idealReason}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#8e8e9c] mb-1 font-bold">Ritmo Inicial de Pilotagem</label>
                          <select 
                            value={drivingStyle} 
                            onChange={(e) => setDrivingStyle(e.target.value as any)}
                            className="w-full bg-[#070709] border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs font-mono"
                          >
                            <option value="conservador">Conservador (Poupa Pneus · Menos Risco na Chuva)</option>
                            <option value="equilibrado">Equilibrado (Ritmo Normal)</option>
                            <option value="agressivo">Agressivo (Ataque, +Desgaste, +Risco)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#8e8e9c] mb-1 font-bold">Postura no Pit Stop Automático</label>
                          <select 
                            value={autoPitMode} 
                            onChange={(e) => setAutoPitMode(e.target.value as any)}
                            className="w-full bg-[#070709] border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs font-mono"
                          >
                            <option value="conservador">Conservador (3.0s Seguro · Sem Erro)</option>
                            <option value="arriscado">Arriscado (1.8s Rápido · 25% Risco)</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={startQualifying}
                        className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-4 rounded-full text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Timer className="w-5 h-5" />
                        <span>IR PARA A CLASSIFICAÇÃO ({currentTrack.laps} VOLTAS)</span>
                      </button>
                    </div>

                    {/* RIGHT 5 COLS: FULL SEASON CALENDAR LIST */}
                    <div className={`${isWidescreenMode ? 'lg:col-span-5' : ''} bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col`}>
                      <h3 className="text-sm font-display font-black italic uppercase text-[#e6ff55] tracking-wider mb-3">
                        CALENDÁRIO DA TEMPORADA ({catTracks.length} CORRIDAS)
                      </h3>
                      <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 flex-1">
                        {catTracks.map((tr, idx) => {
                          const trWb = getWeatherBadge(tr.weather);
                          return (
                            <div 
                              key={tr.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                                idx === currentRaceIndex 
                                  ? 'bg-[#1e1e2c] border-[#e6ff55] text-white shadow-md' 
                                  : idx < currentRaceIndex 
                                  ? 'bg-[#070709]/60 border-white/5 text-[#8e8e9c] line-through' 
                                  : 'bg-[#070709] border-white/5 text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5 font-display font-black italic uppercase">
                                  <span>R{idx + 1} - {tr.name}</span>
                                  <span className={`text-[9px] px-2 py-0.2 rounded-full border font-mono ${trWb.badgeClass}`}>
                                    {trWb.icon} {trWb.label}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#8e8e9c] font-mono mt-0.5">
                                  {tr.laps} voltas · {tr.profileType}
                                </div>
                              </div>
                              {idx === currentRaceIndex && (
                                <span className="text-[10px] text-[#e6ff55] font-display font-black italic uppercase px-2 py-0.5 rounded-full bg-[#e6ff55]/20 border border-[#e6ff55]/30">
                                  ATUAL
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: CLASSIFICACAO & HISTORICO DE CARREIRA (MERGED WITH TOGGLE) */}
                {activeTab === 'classificacao' && (
                  <motion.div 
                    key="classificacao"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-5"
                  >
                    {/* TOP TOGGLE SWITCH FOR CLASSIFICACAO VS HISTORICO */}
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-[#14141c] rounded-2xl border border-white/10 shadow-lg">
                      <button
                        type="button"
                        onClick={() => setChampionshipViewMode('classificacao')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          championshipViewMode === 'classificacao'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Classificação do Campeonato</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChampionshipViewMode('historico')}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          championshipViewMode === 'historico'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <History className="w-4 h-4" />
                        <span>Histórico de Temporadas</span>
                      </button>
                    </div>

                    {championshipViewMode === 'classificacao' ? (
                      /* STANDINGS SECTION (PILOTOS + CONSTRUTORES) */
                      <div className={`grid gap-6 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-display font-black italic uppercase text-white tracking-wider flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-[#e6ff55]" />
                              CAMPEONATO DE PILOTOS ({driver.category.toUpperCase()})
                            </h3>
                            <span className="text-[10px] font-mono text-[#e6ff55] font-bold">Top 3 Sobe de Categoria</span>
                          </div>
                          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 font-mono text-xs">
                            {sortedSeasonStandings.map((ds, idx) => {
                              const isTop3 = idx < 3;
                              const isPlayer = ds.driverName === driver.name;
                              return (
                                <motion.div 
                                  key={ds.driverName} 
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.25, delay: idx * 0.02 }}
                                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                                    isPlayer 
                                      ? 'bg-[#1e1e2c] border-[#e6ff55] text-white font-bold shadow-md' 
                                      : isTop3 
                                      ? 'bg-[#191924] border-[#ff5f8f]/30 text-white' 
                                      : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className={`w-6 font-bold tabular-nums ${isTop3 ? 'text-[#e6ff55]' : 'text-[#8e8e9c]'}`}>#{idx + 1}</span>
                                    <span className={isPlayer ? 'text-[#e6ff55]' : 'text-white'}>{ds.driverName}</span>
                                    {isTop3 && <span className="text-[9px] text-[#ff5f8f] uppercase hidden sm:inline font-bold">Promoção</span>}
                                  </div>
                                  <span className="text-[#e6ff55] font-bold tabular-nums">{ds.points} pts ({ds.wins}V)</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col">
                          <h3 className="text-base font-display font-black italic uppercase text-white tracking-wider mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#38bdf8]" />
                            CAMPEONATO DE CONSTRUTORES
                          </h3>
                          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 font-mono text-xs">
                            {[...constructorStandings].sort((a, b) => b.points - a.points).map((cs, idx) => {
                              const t = TEAMS.find(x => x.id === cs.teamId)!;
                              return (
                                <motion.div 
                                  key={cs.teamId} 
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.25, delay: idx * 0.02 }}
                                  className={`p-3 rounded-2xl border flex items-center justify-between ${t?.id === driver.teamId ? 'bg-[#1e1e2c] border-[#38bdf8] text-white font-bold' : 'bg-[#070709] border-white/5 text-slate-300'}`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t?.color }} />
                                    <span style={{ color: t?.color }}>#{idx + 1} {t?.name}</span>
                                  </div>
                                  <span className="text-[#38bdf8] font-bold tabular-nums">{cs.points} pts ({cs.wins}V)</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* HISTÓRICO DE CARREIRA SECTION */
                      <div className="bg-[#14141c] border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                          <div>
                            <h3 className="text-lg font-display font-black italic uppercase text-white flex items-center gap-2">
                              <History className="w-4 h-4 text-[#e6ff55]" />
                              HISTÓRICO DE CARREIRA
                            </h3>
                            <p className="text-xs text-[#8e8e9c]">
                              Registro de todas as temporadas disputadas.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">ANOS</span>
                              <strong className="text-white">{driver.careerStats.seasons}</strong>
                            </div>
                            <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">TÍTULOS</span>
                              <strong className="text-[#e6ff55]">{driver.careerStats.championships}</strong>
                            </div>
                            <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">VITÓRIAS</span>
                              <strong className="text-[#ff5f8f]">{driver.careerStats.wins}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                              <tr className="border-b border-white/5 text-[10px] uppercase text-[#8e8e9c]">
                                <th className="py-2.5 px-3">Ano</th>
                                <th className="py-2.5 px-3">Cat</th>
                                <th className="py-2.5 px-3">Equipe</th>
                                <th className="py-2.5 px-3 text-center">Vit</th>
                                <th className="py-2.5 px-3 text-center">Pts</th>
                                <th className="py-2.5 px-3 text-right">Pos Final</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {(driver.seasonHistory || []).map((entry, i) => (
                                <motion.tr 
                                  key={i} 
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="bg-[#070709] hover:bg-[#191924] transition-colors"
                                >
                                  <td className="py-3 px-3 font-bold text-white">{entry.season}</td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-full bg-[#191924] text-slate-200 uppercase text-[9px] font-bold">
                                      {entry.category.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.teamColor }}></span>
                                      <span className="font-semibold text-slate-200">{entry.teamName}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-[#e6ff55] tabular-nums">{entry.wins}</td>
                                  <td className="py-3 px-3 text-center text-slate-300 tabular-nums">{entry.points}</td>
                                  <td className="py-3 px-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      entry.finalPosition === 1
                                        ? 'bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40'
                                        : entry.finalPosition <= 3
                                        ? 'bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/40'
                                        : 'bg-[#191924] text-slate-300'
                                    }`}>
                                      {entry.finalPosition}º
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}

                              <motion.tr 
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-[#1e1e2c]"
                              >
                                <td className="py-3 px-3 font-bold text-white">
                                  {currentSeason} <span className="text-[9px] text-[#e6ff55] uppercase ml-1">(Atual)</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] uppercase text-[9px] font-bold">
                                    {driver.category.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentTeam.color }}></span>
                                    <span className="font-semibold text-white">{currentTeam.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-[#e6ff55] tabular-nums">
                                  {currentPlayerStanding?.wins ?? 0}
                                </td>
                                <td className="py-3 px-3 text-center text-slate-300 tabular-nums">
                                  {currentPlayerStanding?.points ?? 0}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className="px-2 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] font-bold text-[10px]">
                                    {currentPlayerRank}º (Ativo)
                                  </span>
                                </td>
                              </motion.tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* FLOATING CURVED PILL NAVIGATION DOCK (VISIBLE ON MOBILE OR WHEN MOBILE FRAME MODE IS ACTIVE) */}
          <nav 
            aria-label="Navegação Principal" 
            className={`${isWidescreenMode ? 'md:hidden' : ''} fixed bottom-3 left-0 right-0 w-[94%] max-w-[420px] mx-auto bg-[#14141c]/95 border border-white/15 rounded-full px-3 py-2 z-40 backdrop-blur-xl flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.85)]`}
          >
            {[
              { id: 'garagem', label: 'Garagem', icon: User },
              { id: 'treino', label: 'Treino', icon: Zap },
              { id: 'calendario', label: 'Próxima Corrida', icon: Play, isCenterHero: true },
              { id: 'patrocinio', label: 'Metas', icon: Briefcase },
              { id: 'classificacao', label: 'Campeonato', icon: BarChart2 },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (item.isCenterHero) {
                return (
                  <button
                    key={item.id}
                    onClick={() => switchHubTab(item.id as HubTab)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-display font-black italic uppercase transition-all cursor-pointer relative -translate-y-2.5 shadow-xl ${
                      isActive
                        ? 'bg-[#e6ff55] text-black ring-4 ring-[#e6ff55]/30 shadow-[#e6ff55]/40 scale-110'
                        : 'bg-[#e6ff55] text-black hover:brightness-110 shadow-[#e6ff55]/25'
                    }`}
                    title="Próxima Corrida"
                  >
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span className="text-[11px] tracking-wider leading-none">CORRIDA</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => switchHubTab(item.id as HubTab)}
                  className={`flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isActive 
                      ? 'w-10 h-10 rounded-full bg-[#242434] text-[#e6ff55] shadow-inner scale-110' 
                      : 'w-8 h-8 rounded-full text-[#8e8e9c] hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* QUALIFYING SESSION SCREEN WITH STARTING TIRE SELECTION */}
      {gameState === 'qualifying' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl w-full bg-[#14141c] border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl my-auto space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6ff55] font-bold">CLASSIFICAÇÃO OFICIAL // Q3</span>
                  {(() => {
                    const wb = getWeatherBadge(currentTrack.weather);
                    return (
                      <span className={`text-[9px] px-2 py-0.2 rounded-full border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                        <span>{wb.icon}</span>
                        <span>{wb.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <h3 className="text-xl sm:text-3xl font-display font-black italic uppercase text-white leading-tight">
                  {currentTrack.name}
                </h3>
                <p className="text-xs text-[#8e8e9c] font-mono">{currentTrack.profileType} · {currentTrack.laps} Voltas</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAndReturnToMenu}
                  className="px-3 py-1.5 bg-[#1e1e2d] hover:bg-[#e6ff55] hover:text-black text-[#e6ff55] font-display font-black italic uppercase rounded-xl text-xs transition-all cursor-pointer border border-[#e6ff55]/40 flex items-center gap-1.5 shadow-sm"
                  title="Salvar e voltar ao menu de seleção de pilotos"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SALVAR & MENU</span>
                </button>
                <div className="w-24 sm:w-32 hidden sm:block">
                  <TrackMapVector svgPath={currentTrack.svgPath} accentColor="#e6ff55" className="w-full h-14" />
                </div>
              </div>
            </div>

            {isQualifyingRunning ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#e6ff55] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-xs sm:text-sm text-[#e6ff55] font-mono animate-pulse uppercase tracking-wider">
                  Pilotos na pista marcando volta rápida...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 font-mono text-xs">
                  {qualifyingResults.map((q, idx) => (
                    <motion.div 
                      key={q.driverName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.015 }}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                        q.isPlayer 
                          ? 'bg-[#1e1e2c] border-[#e6ff55] text-white font-bold shadow-md' 
                          : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-6 font-bold tabular-nums ${idx < 3 ? 'text-[#e6ff55]' : 'text-[#8e8e9c]'}`}>P{idx + 1}</span>
                        <span className={`truncate ${q.isPlayer ? 'text-[#e6ff55]' : 'text-white'}`}>{q.driverName}</span>
                      </div>
                      <span className="text-[#e6ff55] font-bold tabular-nums shrink-0">{q.lapTime}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Dica da Equipe de Engenharia */}
                {(() => {
                  const tireAdvice = getTeamTireAdvice(currentTrack);
                  return (
                    <div className="bg-[#191924] border border-white/5 rounded-2xl p-3.5 flex items-start gap-3">
                      <div className="p-2 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl shrink-0 mt-0.5">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-display font-black italic uppercase text-[#e6ff55] tracking-wider flex items-center gap-1">
                            <Radio className="w-3 h-3 text-[#e6ff55] animate-pulse" />
                            DICA DO ENGENHEIRO
                          </span>
                          <span className={`text-[9px] px-2 py-0.2 rounded-full border font-mono font-bold ${tireAdvice.badgeStyle}`}>
                            Recomendado: {tireAdvice.recommendedTire}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">
                          "{tireAdvice.reason}"
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Confirm Starting Tire Compound right before Race Start */}
                {(() => {
                  const tireDetails = getTireDurabilityDetails(currentTrack);
                  const tireAdvice = getTeamTireAdvice(currentTrack);

                  return (
                    <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-display font-black italic uppercase text-slate-300 flex items-center gap-1.5">
                          <span>PNEU DE LARGADA:</span>
                          <span className="text-[#e6ff55] text-[10px] font-mono font-normal">
                            (Engenharia: {tireAdvice.recommendedTire})
                          </span>
                        </span>
                        <span className="text-[10px] text-[#8e8e9c] font-mono">Pit Stop auto &lt; 27%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {([
                          { 
                            id: 'Macio' as TireCompound, 
                            label: 'Macio (S)', 
                            badge: 'S', 
                            badgeColor: 'border-red-500 text-red-400 bg-red-500/10',
                            info: tireDetails.Macio 
                          },
                          { 
                            id: 'Médio' as TireCompound, 
                            label: 'Médio (M)', 
                            badge: 'M', 
                            badgeColor: 'border-[#e6ff55] text-[#e6ff55] bg-[#e6ff55]/10',
                            info: tireDetails.Médio 
                          },
                          { 
                            id: 'Duro' as TireCompound, 
                            label: 'Duro (H)', 
                            badge: 'H', 
                            badgeColor: 'border-slate-200 text-white bg-slate-200/10',
                            info: tireDetails.Duro 
                          },
                        ]).map(t => {
                          const isSelected = startingTire === t.id;
                          const isOpt = t.info.isOptimal;

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setStartingTire(t.id)}
                              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/30 text-white shadow-md'
                                  : isOpt
                                  ? 'bg-[#191924] border-[#e6ff55]/40 text-slate-300'
                                  : 'bg-[#191924] border-white/5 text-[#8e8e9c]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-mono font-bold ${t.badgeColor}`}>
                                    {t.badge}
                                  </span>
                                  <span className="text-xs font-display font-black italic uppercase leading-none">{t.label}</span>
                                </div>
                                {isOpt && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40 font-mono">
                                    ★ IDEAL
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono font-semibold text-slate-200">
                                ~{t.info.minLaps} a {t.info.maxLaps} voltas
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={startRaceFromQualifying}
                  className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-4 rounded-full text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>LARGADA OFICIAL ({currentTrack.laps} VOLTAS · PNEU {startingTire})</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* QUALIFYING SUMMARY MODAL (TOP 3 & RIVAL COMPARISON) */}
          <AnimatePresence>
            {showQualiSummaryModal && !isQualifyingRunning && qualifyingResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl overflow-y-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="max-w-2xl w-full bg-[#14141c] border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto text-white relative overflow-hidden"
                >
                  {/* Glow accent in modal background */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-[#e6ff55]/20 via-[#e6ff55]/5 to-transparent blur-2xl pointer-events-none" />

                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#e6ff55]/20 border border-[#e6ff55]/40 text-[#e6ff55] font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-[#e6ff55]" />
                          RESUMO DA CLASSIFICAÇÃO
                        </span>
                        {(() => {
                          const wb = getWeatherBadge(currentTrack.weather);
                          return (
                            <span className={`text-[9px] px-2 py-0.2 rounded-full border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                              <span>{wb.icon}</span>
                              <span>{wb.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-display font-black italic uppercase tracking-tight text-white">
                        GRELHA DE LARGADA // {currentTrack.name}
                      </h3>
                    </div>
                    <div className="w-20 h-12 hidden sm:block shrink-0">
                      <TrackMapVector svgPath={currentTrack.svgPath} accentColor="#e6ff55" className="w-full h-full" />
                    </div>
                  </div>

                  {/* Top 3 Times Showcase */}
                  <div className="space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8e9c] flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#e6ff55]" />
                        TOP 3 TEMPOS DA CLASSIFICAÇÃO
                      </span>
                      <span className="text-[10px] font-mono text-[#8e8e9c]">Q3 SESSÃO FINAL</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {qualifyingResults.slice(0, 3).map((q, idx) => {
                        const gapToPole = idx === 0 ? 'LÍDER' : `+${(q.rawTime - qualifyingResults[0].rawTime).toFixed(3)}s`;
                        const teamColor = getDriverTeamColor(q.teamId);
                        const positionStyles = idx === 0
                          ? 'bg-gradient-to-r from-[#e6ff55]/20 via-[#1e1e2c] to-[#14141c] border-[#e6ff55] shadow-lg shadow-[#e6ff55]/10'
                          : idx === 1
                          ? 'bg-gradient-to-r from-slate-300/10 via-[#1e1e2c] to-[#14141c] border-slate-300/30'
                          : 'bg-gradient-to-r from-amber-600/10 via-[#1e1e2c] to-[#14141c] border-amber-600/30';

                        const rankBadge = idx === 0
                          ? { bg: 'bg-[#e6ff55] text-black font-black', text: 'P1 - POLE' }
                          : idx === 1
                          ? { bg: 'bg-slate-300 text-black font-bold', text: 'P2' }
                          : { bg: 'bg-amber-600 text-white font-bold', text: 'P3' };

                        return (
                          <motion.div
                            key={q.driverName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 relative overflow-hidden ${positionStyles}`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-mono ${rankBadge.bg}`}>
                                {rankBadge.text}
                              </span>
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                <span className={`font-display font-black italic uppercase text-sm sm:text-base truncate ${q.isPlayer ? 'text-[#e6ff55]' : 'text-white'}`}>
                                  {q.driverName}
                                  {q.isPlayer && <span className="ml-1.5 text-[10px] font-mono text-[#e6ff55] font-normal">(VOCÊ)</span>}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <div className="text-sm sm:text-base font-bold text-[#e6ff55] tabular-nums">{q.lapTime}</div>
                              <div className="text-[10px] text-[#8e8e9c] font-semibold">{gapToPole}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rival Head-to-Head Summary Card */}
                  {(() => {
                    if (!driver) return null;
                    const rivalTargetName = driver.seasonGoals?.find(g => g.targetRivalName)?.targetRivalName 
                      || getCategoryRivals(driver.category)[0]?.name;
                    
                    const playerResult = qualifyingResults.find(q => q.isPlayer);
                    const playerPos = qualifyingResults.findIndex(q => q.isPlayer) + 1;
                    
                    const rivalResult = qualifyingResults.find(q => q.driverName === rivalTargetName) 
                      || qualifyingResults.find(q => !q.isPlayer);
                    const rivalPos = rivalResult ? qualifyingResults.findIndex(q => q.driverName === rivalResult.driverName) + 1 : 0;

                    if (!playerResult || !rivalResult) return null;

                    const timeDelta = playerResult.rawTime - rivalResult.rawTime;
                    const isPlayerFaster = timeDelta < 0;
                    const absDelta = Math.abs(timeDelta).toFixed(3);
                    const posDiff = Math.abs(playerPos - rivalPos);

                    return (
                      <div className="bg-[#070709] border border-white/10 rounded-2xl p-4 space-y-3 relative z-10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-[#ff5f8f]" />
                            DUELO DE RIVAIS // COMPARATIVO Q3
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            isPlayerFaster
                              ? 'bg-[#e6ff55]/20 text-[#e6ff55] border-[#e6ff55]/40'
                              : 'bg-[#ff5f8f]/20 text-[#ff5f8f] border-[#ff5f8f]/40'
                          }`}>
                            {isPlayerFaster ? `🔥 -${absDelta}s MAIS RÁPIDO` : `⚠️ +${absDelta}s ATRÁS DO RIVAL`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          {/* Player side */}
                          <div className={`p-3 rounded-xl border ${isPlayerFaster ? 'bg-[#1e1e2c] border-[#e6ff55]/50' : 'bg-[#14141c] border-white/5'}`}>
                            <div className="text-[10px] font-mono text-[#8e8e9c] uppercase mb-0.5">Sua Posição</div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-display font-black italic text-[#e6ff55]">P{playerPos}</span>
                              <span className="text-xs font-mono font-bold text-white tabular-nums">{playerResult.lapTime}</span>
                            </div>
                            <div className="text-xs font-bold text-white truncate mt-1">{playerResult.driverName}</div>
                          </div>

                          {/* Rival side */}
                          <div className={`p-3 rounded-xl border ${!isPlayerFaster ? 'bg-[#1e1e2c] border-[#ff5f8f]/50' : 'bg-[#14141c] border-white/5'}`}>
                            <div className="text-[10px] font-mono text-[#8e8e9c] uppercase mb-0.5">Seu Rival</div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-display font-black italic text-[#ff5f8f]">P{rivalPos}</span>
                              <span className="text-xs font-mono font-bold text-white tabular-nums">{rivalResult.lapTime}</span>
                            </div>
                            <div className="text-xs font-bold text-white truncate mt-1">{rivalResult.driverName}</div>
                          </div>
                        </div>

                        {/* Verdict text */}
                        <div className="text-xs font-mono text-center pt-1 text-slate-300">
                          {isPlayerFaster ? (
                            <span className="text-[#e6ff55]">
                              Vantagem de <strong className="font-bold">{posDiff} {posDiff === 1 ? 'posição' : 'posições'}</strong> no grid de largada em relação a {rivalResult.driverName}!
                            </span>
                          ) : (
                            <span className="text-[#ff5f8f]">
                              {rivalResult.driverName} larga <strong className="font-bold">{posDiff} {posDiff === 1 ? 'posição' : 'posições'}</strong> à frente no grid de largada.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Modal Action Button */}
                  <button
                    type="button"
                    onClick={() => setShowQualiSummaryModal(false)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e6ff55] to-[#cbe830] text-black font-display font-black italic uppercase tracking-wider text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#e6ff55]/20 flex items-center justify-center gap-2 cursor-pointer relative z-10"
                  >
                    <span>CONTINUAR PARA ESTRATÉGIA DE PNEUS</span>
                    <ChevronRight className="w-5 h-5 stroke-[3]" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* FULLSCREEN DESKTOP PIT WALL LIVE RACE VIEW (2-COLUMN WIDESCREEN MONITOR ON DESKTOP) */}
      {gameState === 'race' && driver && (
        <div className="fixed inset-0 z-50 h-screen w-screen bg-[#070709] flex flex-col justify-between p-2.5 sm:p-4 gap-2.5 overflow-hidden select-none">
          
          {/* START-LINE ANIMATION OVERLAY (GRID & LIGHTS COUNTDOWN) */}
          <AnimatePresence>
            {startLineStage !== 'none' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-[#070709]/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 overflow-y-auto select-none"
              >
                {/* TOP BAR: TRACK & SKIP BUTTON */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 max-w-5xl w-full mx-auto shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl border border-[#e6ff55]/30 shrink-0">
                      <Flag className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-[#e6ff55] font-bold uppercase tracking-widest truncate">
                        PROCEDIMENTO DE LARGADA OFICIAL FIA
                      </div>
                      <h3 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-none truncate">
                        {currentTrack.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => skipStartLineAnimation(racePositions, currentTrack)}
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#191924] hover:bg-[#252535] text-[#8e8e9c] hover:text-white font-mono text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <span>Pular Animação</span>
                    <FastForward className="w-3.5 h-3.5 text-[#e6ff55]" />
                  </button>
                </div>

                {/* CENTER GANTRY: F1 5-RED-LIGHTS BAR & ACTION HEADLINE */}
                <div className="my-auto py-3 text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full shrink-0">
                  
                  {/* F1 LIGHTS GANTRY FRAME */}
                  <div className="bg-[#14141c] border-2 border-white/15 rounded-3xl p-3.5 sm:p-6 shadow-2xl space-y-3 relative overflow-hidden">
                    <div className="text-[10px] font-mono uppercase text-[#8e8e9c] tracking-widest">
                      SEMÁFORO DE LARGADA // GANTRY LIGHTS
                    </div>

                    {/* 5 LED LIGHT PAIRS */}
                    <div className="flex items-center justify-center gap-2.5 sm:gap-6 py-1 sm:py-2">
                      {[1, 2, 3, 4, 5].map((lightNum) => {
                        const isLit = startLineStage === 'lights_count' && lightNum <= redLightsCount;
                        const isLightsOut = startLineStage === 'lights_out';

                        return (
                          <div key={lightNum} className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                isLightsOut
                                  ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_30px_#10b981] scale-110'
                                  : isLit
                                  ? 'bg-[#ff003b] border-[#ff4d6d] shadow-[0_0_35px_#ff003b] scale-110'
                                  : 'bg-[#070709] border-white/10'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 sm:w-6 sm:h-6 rounded-full ${
                                  isLightsOut
                                    ? 'bg-emerald-200'
                                    : isLit
                                    ? 'bg-red-200'
                                    : 'bg-white/5'
                                }`}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-[#8e8e9c] font-bold">
                              0{lightNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* STATUS CAPTION */}
                    <div className="h-7 sm:h-8 flex items-center justify-center">
                      {startLineStage === 'grid_intro' && (
                        <span className="text-xs sm:text-sm font-mono text-[#e6ff55] uppercase tracking-wider font-bold">
                          GRID ALINHADO · PRONTO PARA A LARGADA
                        </span>
                      )}
                      {startLineStage === 'lights_count' && (
                        <span className="text-xs sm:text-sm font-mono text-[#ff5f8f] uppercase tracking-wider font-bold animate-pulse">
                          ATENÇÃO: LUZES ACENDENDO ({redLightsCount}/5)...
                        </span>
                      )}
                      {startLineStage === 'lights_out' && (
                        <span className="text-base sm:text-2xl font-display font-black italic uppercase text-[#e6ff55] tracking-widest animate-bounce">
                          🟢 LUZES APAGADAS! LARGADA AUTÊNTICA!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTION TRIGGER BUTTON */}
                  {startLineStage === 'grid_intro' && (
                    <motion.button
                      initial={{ scale: 0.95 }}
                      animate={{ scale: [0.98, 1.02, 0.98] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      onClick={() => startLightsCountdown(racePositions, currentTrack)}
                      className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-base sm:text-lg rounded-full shadow-xl shadow-[#e6ff55]/30 cursor-pointer tracking-wider flex items-center justify-center gap-2.5 mx-auto"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>INICIAR SEQUÊNCIA DE LARGADA 🚥</span>
                    </motion.button>
                  )}
                </div>

                {/* STAGGERED 2-COLUMN STARTING GRID (DUAS FILEIRAS) */}
                <div className="max-w-4xl w-full mx-auto bg-[#14141c]/80 border border-white/10 rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden shrink-0">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3 text-xs font-mono text-[#8e8e9c]">
                    <span className="uppercase font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#ff5f8f]" />
                      GRID DE LARGADA (DUAS FILEIRAS STAGGERED)
                    </span>
                    <span>{racePositions.length} CARROS ALINHADOS</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 max-h-[38vh] sm:max-h-[42vh] overflow-y-auto pr-1 pb-6 custom-scrollbar">
                    {racePositions.map((car, idx) => {
                      const isLeftCol = idx % 2 === 0;
                      const gridPos = idx + 1;
                      const isPlayer = car.isPlayer;

                      return (
                        <motion.div
                          key={car.driverName}
                          initial={{ opacity: 0, y: 35 }}
                          animate={
                            startLineStage === 'lights_out'
                              ? { opacity: 0, y: -450, scale: 1.12 }
                              : { opacity: 1, y: 0, scale: 1 }
                          }
                          transition={
                            startLineStage === 'lights_out'
                              ? { duration: 1.1, ease: [0.32, 0, 0.67, 0], delay: (idx % 2) * 0.04 }
                              : { duration: 0.35, delay: idx * 0.04 }
                          }
                          className={`relative p-2.5 sm:p-3 rounded-2xl border transition-all ${
                            isLeftCol ? 'translate-y-0' : 'translate-y-3'
                          } ${
                            isPlayer
                              ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/40 shadow-[0_0_20px_rgba(230,255,85,0.25)]'
                              : 'bg-[#070709] border-white/10'
                          }`}
                        >
                          <div className="absolute right-2.5 bottom-0 font-display font-black italic text-3xl sm:text-5xl text-white/5 pointer-events-none select-none">
                            {gridPos < 10 ? `0${gridPos}` : gridPos}
                          </div>

                          <div className="flex items-center justify-between mb-1.5 relative z-10">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg font-display font-black italic text-xs flex items-center justify-center shrink-0 ${
                                  gridPos === 1
                                    ? 'bg-amber-400 text-black font-bold shadow-md'
                                    : gridPos <= 3
                                    ? 'bg-[#38bdf8] text-black font-bold'
                                    : isPlayer
                                    ? 'bg-[#e6ff55] text-black font-bold'
                                    : 'bg-[#191924] text-white border border-white/10'
                                }`}
                              >
                                P{gridPos}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-display font-black italic uppercase text-white truncate flex items-center gap-1.5">
                                  <span className="truncate">{car.driverName}</span>
                                  {isPlayer && (
                                    <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#e6ff55] text-black font-mono font-bold shrink-0">
                                      VOCÊ
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-[#8e8e9c]">
                                  Pneu {car.tireCompound}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Vertical Track Slot & Mini Vector Car (Facing UP) */}
                          <div className="relative z-10 py-2.5 bg-[#14141c]/95 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden min-h-[95px] sm:min-h-[115px]">
                            {/* Vertical Dashed Track Lane Marking */}
                            <div className="absolute inset-y-0 left-1/2 w-0.5 border-r border-dashed border-white/10" />

                            <div className={`transform transition-transform duration-300 ${driver.category === 'kart' ? '-rotate-90' : 'rotate-90'}`}>
                              <CategoryCarVector
                                category={driver.category}
                                teamColor={getDriverTeamColor(car.teamId)}
                                secondaryColor="#ffffff"
                                helmetColor={isPlayer ? driver.helmetColor : '#facc15'}
                                className="w-24 h-10 sm:w-32 sm:h-12 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)]"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 1. RACE HEADER BAR */}
          <div className="flex items-center justify-between gap-3 bg-[#14141c] border border-white/10 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shrink-0 shadow-xl">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
                <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-[#e6ff55] text-black font-display font-black italic uppercase shrink-0">
                  PIT WALL LIVE
                </span>
                <span className="text-sm sm:text-xl font-display font-black italic uppercase text-[#e6ff55] truncate">
                  {currentTrack.name}
                </span>
                {(() => {
                  const wb = getWeatherBadge(currentTrack.weather);
                  return (
                    <span className={`text-[9px] sm:text-xs px-2 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 shrink-0 ${wb.badgeClass}`}>
                      <span>{wb.icon}</span>
                      <span>{wb.label}</span>
                    </span>
                  );
                })()}
                <span className="text-xs text-[#8e8e9c] hidden md:inline font-mono shrink-0">· {currentTrack.profileType}</span>
              </div>
              <div className="text-[11px] sm:text-xs font-mono text-[#8e8e9c] mt-0.5 truncate">
                Retas {Math.round(currentTrack.straightWeight * 100)}% · Curvas {Math.round(currentTrack.cornerWeight * 100)}%
                {currentTrack.weather === 'Chuva' && <span className="text-blue-300 ml-2 font-bold">🌧️ Pista Molhada!</span>}
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-4 font-mono shrink-0">
              <button
                onClick={() => setSimSpeed(prev => (prev === 1 ? 2 : 1))}
                className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 transition-all shadow-md ${
                  simSpeed === 2 ? 'bg-[#e6ff55]/20 border-[#e6ff55] text-[#e6ff55]' : 'bg-[#191924] border-white/5 text-[#8e8e9c]'
                }`}
                title="Velocidade da Simulação"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{simSpeed}x</span>
              </button>

              <div className="text-right">
                <div className="text-[9px] sm:text-[10px] text-[#8e8e9c] uppercase leading-none font-mono">Posição</div>
                <div className="text-base sm:text-2xl font-display font-black italic text-white tabular-nums">P{playerRaceCar?.pos || '-'}</div>
              </div>
              <div className="w-px h-6 sm:h-7 bg-white/10"></div>
              <div className="text-right">
                <div className="text-[9px] sm:text-[10px] text-[#8e8e9c] uppercase leading-none font-mono">Voltas</div>
                <div className="text-base sm:text-2xl font-display font-black italic text-[#e6ff55] tabular-nums">{currentLap}/{currentTrack.laps}</div>
              </div>
            </div>
          </div>



          {/* 2. DESKTOP 12-COLUMN PIT WALL WORKSPACE */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT 4 COLUMNS ON DESKTOP: CIRCUIT TELEMETRY + STRATEGY DECK + MULTI-ENTRY RACE RADIO */}
            {playerRaceCar && (
              <div className="lg:col-span-4 flex flex-col gap-2.5 sm:gap-3 min-h-0 overflow-y-auto lg:overflow-visible">
                {/* Circuit Map & Player Telemetry Card */}
                <div className="bg-[#14141c] border border-white/10 rounded-2xl p-3 flex flex-col justify-between shadow-lg shrink-0">
                  <div className="flex items-center justify-between text-xs font-mono text-[#8e8e9c] mb-1">
                    <span className="uppercase font-bold text-white">GPS DO CIRCUITO</span>
                    <span>Última: <strong className="text-[#e6ff55]">{playerRaceCar.lastLapTime}</strong></span>
                  </div>
                  <div className="bg-[#070709] rounded-xl p-1.5 border border-white/5 flex items-center justify-center">
                    <TrackMapVector 
                      svgPath={currentTrack.svgPath} 
                      accentColor={currentTeam.color} 
                      isRacing={isRacing}
                      playerColor="#e6ff55"
                      className="w-full h-20 sm:h-28 lg:h-32" 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-2 text-center font-mono text-xs">
                    <div className="bg-[#070709] p-1.5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-[#8e8e9c] uppercase">Melhor Volta</div>
                      <div className="text-xs font-bold text-purple-300 tabular-nums">{playerRaceCar.bestLapTimeStr || playerRaceCar.lastLapTime}</div>
                    </div>
                    <div className="bg-[#070709] p-1.5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-[#8e8e9c] uppercase">Ultrapassagens</div>
                      <div className="text-xs font-bold text-[#38bdf8] tabular-nums">{playerRaceCar.overtakesCount || 0}</div>
                    </div>
                    <div className="bg-[#070709] p-1.5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-[#8e8e9c] uppercase">Paradas Box</div>
                      <div className="text-xs font-bold text-white tabular-nums">{playerRaceCar.pitStops} PIT</div>
                    </div>
                  </div>
                </div>

                {/* Tire Health & Pace Strategy Deck */}
                <div className="bg-[#14141c] border border-white/10 rounded-2xl p-3 flex flex-col justify-between gap-2.5 shadow-lg shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getTireBadgeStyle(playerRaceCar.tireCompound)}`}>
                          Pneu {playerRaceCar.tireCompound}
                        </span>
                        <span className="text-[#8e8e9c] text-[10px] sm:text-[11px]">Desgaste</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold ${playerRaceCar.tireHealth <= 32 ? 'text-[#ff5f8f]' : 'text-[#e6ff55]'}`}>
                        {playerRaceCar.tireHealth}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#070709] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          playerRaceCar.tireHealth > 55 ? 'bg-[#e6ff55]' : playerRaceCar.tireHealth > 30 ? 'bg-amber-400' : 'bg-[#ff5f8f]'
                        }`}
                        style={{ width: `${playerRaceCar.tireHealth}%` }}
                      />
                    </div>
                  </div>

                  {/* Driving Pace Buttons */}
                  <div className="space-y-1">
                    <div className="text-[9px] font-mono uppercase text-[#8e8e9c]">Modo de Ritmo (Motor & Pneus)</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: 'conservador', label: 'Poupar' },
                        { id: 'equilibrado', label: 'Normal' },
                        { id: 'agressivo', label: 'Ataque' }
                      ] as const).map(st => (
                        <button
                          key={st.id}
                          onClick={() => setDrivingStyle(st.id)}
                          className={`py-1.5 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer border transition-all ${
                            drivingStyle === st.id 
                              ? 'bg-[#e6ff55] text-black border-[#e6ff55] shadow-md shadow-[#e6ff55]/20' 
                              : 'bg-[#191924] border-white/5 text-[#8e8e9c] hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pit Stop Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => setAutoPitMode(prev => (prev === 'conservador' ? 'arriscado' : 'conservador'))}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer border flex items-center justify-center gap-1 transition-all ${
                        autoPitMode === 'conservador'
                          ? 'bg-[#e6ff55]/15 border-[#e6ff55]/40 text-[#e6ff55]'
                          : 'bg-[#ff5f8f]/15 border-[#ff5f8f]/40 text-[#ff5f8f]'
                      }`}
                    >
                      {autoPitMode === 'conservador' ? <Shield className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                      <span>Box: {autoPitMode === 'conservador' ? 'Seguro' : 'Rápido'}</span>
                    </button>

                    <button
                      onClick={triggerManualPitNow}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold cursor-pointer border transition-all ${
                        forcePitNextLap
                          ? 'bg-[#ff5f8f] border-white text-black font-black animate-pulse'
                          : 'bg-[#191924] border-white/10 text-white hover:border-white/20'
                      }`}
                    >
                      {forcePitNextLap ? 'Box Agendado' : 'Chamar Box Agora'}
                    </button>
                  </div>
                </div>

                {/* Desktop Live Race Radio Feed Log with Overtake Struggle Highlights */}
                <div className="hidden lg:flex flex-1 min-h-[140px] bg-[#14141c] border border-white/10 rounded-2xl p-3 flex-col shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-display font-black italic uppercase text-[#e6ff55] mb-2 shrink-0 border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 animate-pulse text-[#e6ff55]" />
                      <span>RÁDIO DA CORRIDA // FEED AO VIVO</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8e8e9c] font-normal">
                      ULTIMAS VOLTAS
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs custom-scrollbar">
                    {raceEventsLog.length > 0 ? (
                      raceEventsLog.slice(0, 8).map((ev, i) => {
                        const isOvertake = ev.type === 'overtake';
                        const isPlayer = ev.isPlayerInvolved;

                        if (isOvertake) {
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.94, x: -12 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 420, damping: 26 }}
                              className={`p-2.5 rounded-xl border relative overflow-hidden transition-all shadow-md ${
                                isPlayer
                                  ? 'bg-gradient-to-r from-[#ff003b]/30 via-[#2a1a24] to-[#14141c] border-[#e6ff55] ring-1 ring-[#e6ff55]/60 shadow-[0_0_20px_rgba(230,255,85,0.25)]'
                                  : 'bg-gradient-to-r from-amber-500/20 via-[#191924] to-[#070709] border-amber-500/50 text-white'
                              }`}
                            >
                              {/* Background ambient flame glow */}
                              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#e6ff55]/10 rounded-full blur-xl pointer-events-none" />

                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#e6ff55]">
                                  <Swords className="w-3.5 h-3.5 text-[#ff5f8f] animate-pulse" />
                                  <span>[V{ev.lap}] LUTA POR POSIÇÃO</span>
                                </div>
                                {ev.newPosition && (
                                  <span className="text-[10px] font-display font-black italic px-2 py-0.5 rounded bg-[#e6ff55] text-black shadow-sm">
                                    P{ev.newPosition}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-bold text-white leading-snug flex items-start gap-1.5">
                                <Flame className="w-4 h-4 text-[#e6ff55] shrink-0 mt-0.5" />
                                <span>{ev.description}</span>
                              </div>
                            </motion.div>
                          );
                        }

                        return (
                          <div
                            key={i}
                            className={`p-1.5 px-2.5 rounded-xl border transition-colors ${
                              i === 0
                                ? 'bg-[#1e1e2c] border-[#e6ff55]/40 text-white'
                                : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                            }`}
                          >
                            <span className="text-[#e6ff55] font-bold mr-1.5">[V{ev.lap}]</span>
                            <span>{ev.description}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[#8e8e9c] p-2 font-mono text-xs">
                        Luzes verdes! Corrida em andamento...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT 8 COLUMNS ON DESKTOP: FULL 20-CAR TIMING TOWER */}
            <div className="lg:col-span-8 flex-1 min-h-[280px] bg-[#14141c] border border-white/10 rounded-2xl p-2.5 sm:p-4 overflow-y-auto shadow-2xl flex flex-col">
              {/* Desktop Table Header */}
              <div className="hidden sm:flex items-center justify-between px-3 pb-2 mb-1.5 border-b border-white/5 text-[10px] font-mono uppercase text-[#8e8e9c] shrink-0">
                <span>Posição / Piloto / Equipe</span>
                <div className="flex items-center gap-5">
                  <span className="hidden md:inline">Melhor Volta</span>
                  <span>Paradas</span>
                  <span>Pneu & Desgaste</span>
                  <span className="w-16 text-right">Intervalo</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 font-mono">
                {racePositions.map((car) => {
                  const carTeam = TEAMS.find(t => t.id === car.teamId);
                  const tireColor = car.tireHealth > 55 ? 'bg-[#e6ff55]' : car.tireHealth > 30 ? 'bg-amber-400' : 'bg-[#ff5f8f]';
                  const posBadgeStyle = car.pos === 1 
                    ? 'bg-[#e6ff55] text-black font-black' 
                    : car.pos === 2 
                    ? 'bg-[#38bdf8] text-black font-bold' 
                    : car.pos === 3 
                    ? 'bg-[#ff5f8f] text-black font-bold' 
                    : 'bg-[#191924] text-[#8e8e9c] font-medium';

                  const isOvertakingCar = car.statusTag?.startsWith('⬆️');
                  const gapNum = parseFloat(car.gap.replace('+', '').replace('s', '')) || 0;
                  const isWheelToWheelBattle = car.pos > 1 && gapNum > 0 && gapNum <= 0.35;

                  return (
                    <motion.div 
                      key={car.driverName}
                      layout
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border flex items-center justify-between gap-2 text-xs sm:text-sm transition-all ${
                        isOvertakingCar
                          ? 'bg-gradient-to-r from-[#1e1e2c] via-[#2a1a24] to-[#14141c] border-[#e6ff55] text-white font-bold shadow-[0_0_20px_rgba(230,255,85,0.3)] ring-2 ring-[#e6ff55]/60'
                          : car.isPlayer 
                          ? 'bg-[#1e1e2c] border-[#e6ff55] text-white font-bold shadow-lg ring-1 ring-[#e6ff55]/40' 
                          : 'bg-[#070709] border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className={`w-6 h-5 sm:w-8 sm:h-7 rounded-lg flex items-center justify-center text-xs sm:text-sm shrink-0 tabular-nums ${posBadgeStyle}`}>
                          P{car.pos}
                        </span>
                        <div className="w-2 h-3.5 sm:h-4 rounded-full shrink-0" style={{ backgroundColor: carTeam?.color || '#64748b' }}></div>
                        <span className="truncate font-semibold text-white">{car.driverName}</span>
                        <span className="text-[10px] text-[#8e8e9c] hidden xl:inline truncate">
                          ({carTeam?.shortName})
                        </span>
                        {car.isPlayer && (
                          <span className="text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#e6ff55] text-black font-display font-black italic uppercase shrink-0 shadow-sm">
                            VOCÊ
                          </span>
                        )}
                        {isOvertakingCar && (
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#e6ff55] text-black shrink-0 font-display font-black italic uppercase shadow-md flex items-center gap-1"
                          >
                            <Flame className="w-3 h-3 fill-current" />
                            <span>{car.statusTag}</span>
                          </motion.span>
                        )}
                        {!isOvertakingCar && isWheelToWheelBattle && (
                          <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] shrink-0 border border-[#ff5f8f]/40 font-mono font-bold flex items-center gap-1 animate-pulse">
                            <Swords className="w-2.5 h-2.5" />
                            <span>DUELO</span>
                          </span>
                        )}
                        {!isOvertakingCar && !isWheelToWheelBattle && car.statusTag && (
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#191924] text-[#e6ff55] shrink-0 border border-white/10 font-bold">
                            {car.statusTag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 shrink-0 tabular-nums text-xs">
                        {car.bestLapTimeStr && (
                          <span className="text-[10px] sm:text-[11px] text-purple-300/90 hidden md:inline font-mono">
                            {car.bestLapTimeStr}
                          </span>
                        )}
                        {car.pitStops > 0 && (
                          <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[#191924] text-[#38bdf8] border border-white/5 hidden xs:inline font-bold">
                            {car.pitStops} PIT
                          </span>
                        )}
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold border ${getTireBadgeStyle(car.tireCompound)}`}>
                          {car.tireCompound[0]}
                        </span>
                        <div className="w-10 sm:w-20 h-1.5 sm:h-2 bg-[#070709] rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${tireColor}`} style={{ width: `${car.tireHealth}%` }}></div>
                        </div>
                        <span className="text-slate-200 font-mono font-bold w-14 sm:w-16 text-right text-xs">{car.gap}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. MOBILE / COMPACT RADIO FOOTER (HIDDEN ON LARGE DESKTOP SINCE LEFT PANEL HAS MULTI-LINE LOG) */}
          <div className="lg:hidden bg-[#14141c] border border-white/10 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-3 text-xs sm:text-sm shrink-0 shadow-xl">
            <div className="truncate text-slate-100 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#e6ff55] shrink-0 animate-pulse" />
              {raceEventsLog[0] ? (
                <>
                  <span className="text-[#e6ff55] font-mono font-bold">[V{raceEventsLog[0].lap}]</span>
                  <span className="truncate">{raceEventsLog[0].description}</span>
                </>
              ) : (
                <span className="text-[#8e8e9c]">Luzes verdes! Corrida em andamento...</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* POST-RACE RESULT MODAL WITH TOP 3 PODIUM (SEQUENTIAL REVEAL & METALLIC SHINE TROPHIES) */}
      {gameState === 'result' && postRaceResult && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/92 backdrop-blur-xl overflow-y-auto"
        >
          {/* Ambient Gold Radial Glow Effect in Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e6ff55]/15 via-black/80 to-black pointer-events-none" />

          <motion.div 
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 280, delay: 0.1 }}
            className="max-w-xl w-full bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center my-auto space-y-4 relative z-10 overflow-hidden"
          >
            {/* Header Title with Shine Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className="text-xs font-mono uppercase tracking-widest text-[#e6ff55] font-bold px-3 py-1 rounded-full bg-[#e6ff55]/10 border border-[#e6ff55]/30 inline-block mb-1 shadow-sm">
                🏆 CERIMÔNIA DO PÓDIO OFICIAL 🏆
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-black italic uppercase text-white leading-tight">
                {currentTrack.name}
              </h3>
            </motion.div>

            {/* VISUAL TOP 3 PODIUM WITH SEQUENTIAL REVEAL (3rd -> 2nd -> 1st) AND METALLIC SHINE */}
            <div className="grid grid-cols-3 gap-3 items-end pt-3 px-2">
              {/* 2nd PLACE (P2 - SILVER) - Appears 2nd at delay: 0.65s */}
              {postRaceResult.podium[1] && (
                <motion.div 
                  initial={{ opacity: 0, y: 35, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.65, type: "spring", stiffness: 220, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <Trophy className="w-7 h-7 text-[#38bdf8] filter drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] mb-1" />
                  <div className="text-xs font-display font-black italic uppercase text-white truncate max-w-full mb-0.5">
                    {postRaceResult.podium[1].driverName}
                  </div>
                  <div className="text-[10px] font-mono text-[#38bdf8] font-bold mb-2">+18 pts</div>
                  
                  {/* Silver Metallic Step Pillar */}
                  <div className="w-full h-24 bg-gradient-to-b from-[#182838] via-[#121c28] to-[#0d121b] border-t-4 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.3)] rounded-t-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {/* Metallic Sheen Sweep */}
                    <motion.div 
                      animate={{ x: ['-150%', '250%'] }} 
                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", repeatDelay: 1.0 }} 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 pointer-events-none" 
                    />
                    <span className="text-2xl font-display font-black italic text-[#38bdf8]">2º</span>
                    <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest mt-0.5">PRATA</span>
                  </div>
                </motion.div>
              )}

              {/* 1st PLACE (P1 - GOLD CHAMPION) - Appears Last at delay: 1.0s with Celebration Glow */}
              {postRaceResult.podium[0] && (
                <motion.div 
                  initial={{ opacity: 0, y: 45, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.0, type: "spring", stiffness: 200, damping: 18 }}
                  className="flex flex-col items-center relative z-10"
                >
                  <motion.div 
                    animate={{ rotate: [-3, 3, -3], scale: [1, 1.08, 1] }} 
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  >
                    <Trophy className="w-9 h-9 text-[#e6ff55] filter drop-shadow-[0_0_20px_rgba(230,255,85,0.9)] mb-1" />
                  </motion.div>
                  <div className="text-xs sm:text-sm font-display font-black italic uppercase text-[#e6ff55] truncate max-w-full mb-0.5 tracking-wide">
                    {postRaceResult.podium[0].driverName}
                  </div>
                  <div className="text-[11px] font-mono text-[#e6ff55] font-bold mb-2">+25 pts</div>
                  
                  {/* Gold Champion Step Pillar */}
                  <div className="w-full h-36 bg-gradient-to-b from-[#2e3318] via-[#1f2412] to-[#12140b] border-t-4 border-[#e6ff55] shadow-[0_0_30px_rgba(230,255,85,0.4)] rounded-t-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {/* Intense Gold Metallic Sheen Sweep */}
                    <motion.div 
                      animate={{ x: ['-150%', '250%'] }} 
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", repeatDelay: 0.6 }} 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e6ff55]/40 to-transparent transform -skew-x-12 pointer-events-none" 
                    />
                    <span className="text-3xl font-display font-black italic text-[#e6ff55] drop-shadow-[0_0_10px_rgba(230,255,85,0.5)]">1º</span>
                    <span className="text-[10px] font-mono font-bold text-[#e6ff55] uppercase tracking-widest mt-1">CAMPEÃO</span>
                  </div>
                </motion.div>
              )}

              {/* 3rd PLACE (P3 - BRONZE) - Appears 1st at delay: 0.35s */}
              {postRaceResult.podium[2] && (
                <motion.div 
                  initial={{ opacity: 0, y: 35, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 220, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <Trophy className="w-6 h-6 text-[#ff5f8f] filter drop-shadow-[0_0_10px_rgba(255,95,143,0.8)] mb-1" />
                  <div className="text-xs font-display font-black italic uppercase text-white truncate max-w-full mb-0.5">
                    {postRaceResult.podium[2].driverName}
                  </div>
                  <div className="text-[10px] font-mono text-[#ff5f8f] font-bold mb-2">+15 pts</div>
                  
                  {/* Bronze Metallic Step Pillar */}
                  <div className="w-full h-20 bg-gradient-to-b from-[#2a1a24] via-[#1a141a] to-[#100d12] border-t-4 border-[#ff5f8f] shadow-[0_0_15px_rgba(255,95,143,0.3)] rounded-t-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {/* Metallic Sheen Sweep */}
                    <motion.div 
                      animate={{ x: ['-150%', '250%'] }} 
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut", repeatDelay: 1.2 }} 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 pointer-events-none" 
                    />
                    <span className="text-xl font-display font-black italic text-[#ff5f8f]">3º</span>
                    <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest mt-0.5">BRONZE</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* EXTRA AWARDS: MELHOR VOLTA & PILOTO DO DIA (Sequential delay: 1.35s) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35, duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left font-mono"
            >
              {/* ⚡ Fastest Lap Award */}
              <div className={`p-3 rounded-2xl border ${
                postRaceResult.fastestLapBonusWon 
                  ? 'bg-[#e6ff55]/10 border-[#e6ff55]/50 ring-1 ring-[#e6ff55]/30' 
                  : 'bg-[#070709] border-white/5'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#e6ff55] font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    MELHOR VOLTA
                  </span>
                  {postRaceResult.fastestLapBonusWon && (
                    <span className="px-1.5 py-0.2 bg-[#e6ff55] text-black font-black text-[9px] rounded-full">
                      +1 PT · +2 XP
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {postRaceResult.fastestLap?.driverName || 'Piloto'}
                </div>
                <div className="text-[10px] text-[#8e8e9c]">
                  Tempo: <strong className="text-[#e6ff55]">{postRaceResult.fastestLap?.lapTime}</strong>
                  {postRaceResult.fastestLapBonusWon && <span className="text-emerald-400 ml-1">(+$0.5M)</span>}
                </div>
              </div>

              {/* 🏎️ Most Overtakes / Driver of the Day Award */}
              <div className={`p-3 rounded-2xl border ${
                postRaceResult.mostOvertakesBonusWon 
                  ? 'bg-[#ff5f8f]/10 border-[#ff5f8f]/50 ring-1 ring-[#ff5f8f]/30' 
                  : 'bg-[#070709] border-white/5'
              }`}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#ff5f8f] font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    PILOTO DO DIA
                  </span>
                  {postRaceResult.mostOvertakesBonusWon && (
                    <span className="px-1.5 py-0.2 bg-[#ff5f8f] text-black font-black text-[9px] rounded-full">
                      +2 XP EXTRA
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {postRaceResult.mostOvertakes?.driverName || 'Piloto'}
                </div>
                <div className="text-[10px] text-[#8e8e9c]">
                  Ultrapassagens: <strong className="text-white">+{postRaceResult.mostOvertakes?.count || 0}</strong>
                  {postRaceResult.mostOvertakesBonusWon && <span className="text-emerald-400 ml-1">(+$0.5M)</span>}
                </div>
              </div>
            </motion.div>

            {/* RACE STATS SUMMARY (Sequential delay: 1.5s) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="bg-[#070709] p-4 rounded-2xl border border-white/5 space-y-2 font-mono text-xs"
            >
              <div className="flex justify-between">
                <span className="text-[#8e8e9c]">Sua Posição Final:</span>
                <span className="font-bold text-white text-sm">P{postRaceResult.position} ({postRaceResult.pitStops} Pit Stop)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8e8e9c]">Pontos no Campeonato:</span>
                <span className="font-bold text-[#e6ff55]">
                  +{postRaceResult.points} pts
                  {postRaceResult.fastestLapBonusWon && <span className="text-[10px] text-[#8e8e9c] ml-1">(inclui +1 de Melhor Volta)</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8e8e9c]">Prêmio de Corrida:</span>
                <span className="font-bold text-slate-200">+${postRaceResult.prize}M · +3 XP</span>
              </div>
              {postRaceResult.totalSponsorMoney && postRaceResult.totalSponsorMoney > 0 ? (
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-[#8e8e9c]">Salário dos Patrocinadores:</span>
                  <span className="font-bold text-[#e6ff55]">
                    +${postRaceResult.totalSponsorMoney}M
                  </span>
                </div>
              ) : null}
            </motion.div>

            {/* METAS DE PATROCÍNIO ATINGIDAS (Sequential delay: 1.65s) */}
            {postRaceResult.sponsorBonuses && postRaceResult.sponsorBonuses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.65, duration: 0.4 }}
                className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 text-left font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-[#8e8e9c] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#38bdf8]" />
                    METAS DE TEMPORADA · PROGRESSO DO GP
                  </span>
                  <span className="text-[10px] text-[#e6ff55] font-bold">
                    +${postRaceResult.totalSponsorMoney || 0}M / GP
                  </span>
                </div>
                <div className="space-y-1.5">
                  {postRaceResult.sponsorBonuses.slice(0, 4).map(sb => (
                    <div 
                      key={sb.title} 
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                        sb.achieved 
                          ? 'bg-[#191924] border-[#e6ff55]/40 text-white' 
                          : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{sb.logo}</span>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{sb.name}</span>
                            <span className="text-[10px] text-[#8e8e9c] font-normal">({sb.title})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {sb.achieved ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40 font-bold text-[10px]">
                            {sb.currentProgress}/{sb.targetValue}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#191924] text-[#8e8e9c] text-[10px]">
                            {sb.currentProgress}/{sb.targetValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CONTINUE BUTTON (Sequential delay: 1.8s) */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, type: "spring", stiffness: 300, damping: 22 }}
              onClick={handleContinueSeason}
              className="w-full bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-4 rounded-full text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>CONTINUAR CAMPEONATO</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      )}


      {/* PROMOTION MODAL (ONLY UNLOCKED WHEN FINISHING TOP 3 IN THE SEASON STANDINGS) */}
      {gameState === 'promotion' && driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center my-auto space-y-4"
          >
            <div className="w-14 h-14 bg-[#e6ff55]/20 text-[#e6ff55] rounded-2xl flex items-center justify-center mx-auto border border-[#e6ff55]/30">
              <Trophy className="w-7 h-7" />
            </div>

            <span className="text-xs font-mono uppercase text-[#e6ff55] font-bold">
              {seasonEndRank}º LUGAR GERAL · TEMPORADA ARQUIVADA NO HISTÓRICO!
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white">
              {driver.category === 'f1' ? 'CAMPEONATO MUNDIAL DE F1 CONCLUÍDO!' : 'TOP 3 ALCANÇADO // PROMOÇÃO LIBERADA!'}
            </h3>
            <p className="text-[#8e8e9c] text-xs">
              {driver.category === 'f1'
                ? `Você encerrou a temporada da Fórmula 1 no Pódio Geral (${seasonEndRank}º lugar)! Escolha sua escuderia para o próximo ano.`
                : `Parabéns! Você terminou em ${seasonEndRank}º lugar na somatória das corridas e conquistou vaga na próxima categoria! Escolha sua nova equipe:`}
            </p>

            {/* Complete Season Summary Box */}
            <div className="bg-[#070709] p-4 rounded-2xl border border-white/5 text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-[#8e8e9c] font-bold uppercase tracking-wider">
                  RESUMO DA TEMPORADA {currentSeason} ({driver.category.toUpperCase()})
                </span>
                <span className="text-[10px] text-[#e6ff55] font-bold">TOP 3 CUMPRIDO!</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Pos Final</div>
                  <div className="text-sm font-display font-black italic text-[#e6ff55]">{seasonEndRank}º Lugar</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Pontos</div>
                  <div className="text-sm font-display font-black italic text-white">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Vitórias</div>
                  <div className="text-sm font-display font-black italic text-[#ff5f8f]">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Pódios</div>
                  <div className="text-sm font-display font-black italic text-[#38bdf8]">{currentPlayerStanding?.podiums || 0}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {driver.category === 'kart' && TEAMS.filter(t => t.category === 'f3').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f3', t.id)}
                  className="w-full py-3.5 px-4 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-2xl cursor-pointer text-xs flex items-center justify-between transition-all"
                >
                  <span>Subir para F3 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-[#8e8e9c]">Carro {t.carPerformance}</span>
                </button>
              ))}
              {driver.category === 'f3' && TEAMS.filter(t => t.category === 'f2').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f2', t.id)}
                  className="w-full py-3.5 px-4 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-2xl cursor-pointer text-xs flex items-center justify-between transition-all"
                >
                  <span>Subir para F2 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-[#8e8e9c]">Carro {t.carPerformance}</span>
                </button>
              ))}
              {(driver.category === 'f2' || driver.category === 'f1') && TEAMS.filter(t => t.category === 'f1').slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f1', t.id)}
                  className="w-full py-3.5 px-4 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-2xl cursor-pointer text-xs flex items-center justify-between transition-all"
                >
                  <span>Assinar F1 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-[#8e8e9c]">Carro {t.carPerformance}</span>
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
            className="max-w-md w-full bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center my-auto space-y-4"
          >
            <div className="w-14 h-14 bg-[#ff5f8f]/20 text-[#ff5f8f] rounded-2xl flex items-center justify-center mx-auto border border-[#ff5f8f]/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white">
              FIM DA TEMPORADA {currentSeason} · {seasonEndRank}º LUGAR
            </h3>
            <p className="text-[#8e8e9c] text-xs leading-relaxed">
              Como apenas o <strong>Top 3 do campeonato</strong> sobe de categoria, você disputará mais um ano na {driver.category.toUpperCase()} com seus atributos evoluídos!
            </p>

            {/* End of Season Complete Summary */}
            <div className="bg-[#070709] p-4 rounded-2xl border border-white/5 text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-[#8e8e9c] font-bold uppercase tracking-wider">
                  RESUMO DA TEMPORADA {currentSeason}
                </span>
                <span className="text-[10px] text-[#ff5f8f] font-bold">FORA DO TOP 3</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Pos Final</div>
                  <div className="text-sm font-display font-black italic text-white">{seasonEndRank}º</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Pontos</div>
                  <div className="text-sm font-display font-black italic text-[#e6ff55]">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Vitórias</div>
                  <div className="text-sm font-display font-black italic text-white">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-[#191924] p-2 rounded-xl border border-white/5">
                  <div className="text-[9px] text-[#8e8e9c] uppercase">Déficit Top 3</div>
                  <div className="text-sm font-display font-black italic text-[#ff5f8f]">
                    -{Math.max(1, thirdPlacePoints - playerPoints)} pts
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={retryCategorySeason}
              className="w-full py-4 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase rounded-full shadow-lg shadow-[#e6ff55]/20 cursor-pointer text-base tracking-wider transition-all"
            >
              INICIAR TEMPORADA {currentSeason + 1} ({driver.category.toUpperCase()})
            </button>
          </motion.div>
        </div>
      )}

      {/* SETTINGS MODAL COMPONENT */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={gameSettings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      </div>
    </div>
  );
}
