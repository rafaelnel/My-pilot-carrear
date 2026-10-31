import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Zap, Award, Play, ChevronRight, Activity, 
  ArrowUpRight, RotateCcw, Newspaper, Timer, User, Calendar, BarChart2, 
  PlusCircle, Trash2, Palette, Wrench, Shield, Flame, AlertTriangle, History, FastForward,
  Target, CheckCircle2, CloudRain, Cloud, Sun, Briefcase, Radio, Headphones, DollarSign, Sparkles, Flag, ChevronUp, ChevronDown,
  Crown, Gift, Lock, Check, Save, LogOut, Settings, Swords, TrendingUp, ShieldAlert, Volume2, VolumeX, HelpCircle
} from 'lucide-react';
import { 
  Driver, Track, DriverStanding, ConstructorStanding, RaceEvent, 
  QualifyingResult, MotorsportCategory, LiveRaceCar, RivalDriver, TireCompound, SeasonHistoryEntry,
  WeatherCondition, SponsorContract, CareerMilestone, SeasonAutosave, GameSettings, RaceMode
} from './types';
import { TEAMS, TRACKS, REAL_F1_DRIVERS, REAL_F2_DRIVERS, REAL_F3_DRIVERS, KART_RIVAL_DRIVERS, SPONSOR_CONTRACTS, CAREER_MILESTONES, getTeamTireAdvice, getTireDurabilityDetails, getInitialSeasonGoals } from './data/gameData';
import { HelmetVector, CategoryCarVector, TrackMapVector } from './components/MotorsportVectors';
import { SettingsModal } from './components/SettingsModal';
import { NewDriverTutorialModal } from './components/NewDriverTutorialModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { startLineAudio } from './utils/startLineAudio';
import {
  SLOTS_CACHE_KEY,
  loadSlotsFromLocalCache,
  saveSlotsToBrowserCache,
  recoverSlotsFromBrowserCacheIfNeeded,
  requestPersistentBrowserCache
} from './utils/browserCache';

const STORAGE_KEY = SLOTS_CACHE_KEY;
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

const getInitialSlots = (): (Driver | null)[] => loadSlotsFromLocalCache();

export default function App() {
  const [slots, setSlots] = useState<(Driver | null)[]>(getInitialSlots);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isCreatingDriver, setIsCreatingDriver] = useState<boolean>(false);
  const [creatingSlotId, setCreatingSlotId] = useState<number>(0);

  // Settings State & Modal Handler
  const [gameSettings, setGameSettings] = useState<GameSettings>(getInitialSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Live preview states during creation
  const [newHelmetPrimary, setNewHelmetPrimary] = useState<string>('#e10600');
  const [newHelmetSecondary, setNewHelmetSecondary] = useState<string>('#1e3a8a');
  const [newDriverRaceMode, setNewDriverRaceMode] = useState<RaceMode>('rapido');

  const [gameState, setGameState] = useState<'title' | 'hub' | 'qualifying' | 'race' | 'result' | 'promotion' | 'season_failed'>('title');
  const HUB_TAB_ORDER = ['garagem', 'treino', 'calendario', 'patrocinio', 'classificacao'] as const;
  type HubTab = typeof HUB_TAB_ORDER[number];
  const [activeTab, setActiveTab] = useState<HubTab>('garagem');
  const [garageViewMode, setGarageViewMode] = useState<'pista_atributos' | 'equipe_saves'>('pista_atributos');
  const [calendarViewMode, setCalendarViewMode] = useState<'preparacao' | 'etapas'>('preparacao');
  const [championshipViewMode, setChampionshipViewMode] = useState<'pilotos' | 'construtores' | 'historico'>('pilotos');
  const [goalsViewMode, setGoalsViewMode] = useState<'metas' | 'milestones'>('metas');
  const [qualiViewMode, setQualiViewMode] = useState<'estrategia' | 'grid20'>('estrategia');
  const [raceLeftTab, setRaceLeftTab] = useState<'comandos' | 'radio'>('comandos');
  const [raceTowerCols, setRaceTowerCols] = useState<1 | 2>(2);
  const [resultViewMode, setResultViewMode] = useState<'podio' | 'financas_metas'>('podio');
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
      setGarageViewMode('pista_atributos');
    } else if (HUB_TAB_ORDER.includes(nextTab as HubTab)) {
      targetTab = nextTab as HubTab;
      if (nextTab === 'classificacao') setChampionshipViewMode('pilotos');
      if (nextTab === 'patrocinio') setGoalsViewMode('metas');
      if (nextTab === 'calendario') setCalendarViewMode('preparacao');
      if (nextTab === 'garagem') setGarageViewMode('pista_atributos');
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
  const [nextPitTire, setNextPitTire] = useState<TireCompound>('Duro');
  const [raceMode, setRaceMode] = useState<RaceMode>(() => {
    try {
      const saved = localStorage.getItem('apex_gp_race_mode_v1');
      if (saved === 'estrategico' || saved === 'rapido') return saved;
    } catch (e) {
      console.error('Failed to load raceMode', e);
    }
    return 'rapido';
  });
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
  const [isCareerPanelMinimized, setIsCareerPanelMinimized] = useState<boolean>(true);
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

  const toggleQuickSound = () => {
    setGameSettings((prev) => {
      const nextEnabled = !prev.soundEnabled;
      const updated = { ...prev, soundEnabled: nextEnabled };
      if (!nextEnabled) {
        startLineAudio.stopAll();
      } else if (startLineStage === 'grid_intro') {
        startLineAudio.startGridIdle(updated.soundVolume, driver?.category || 'f1');
      }
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save sound toggle', e);
      }
      return updated;
    });
  };

  const startLightsCountdown = (initialCars: LiveRaceCar[], track: Track) => {
    setStartLineStage('lights_count');
    setRedLightsCount(1);

    if (gameSettings.soundEnabled) {
      startLineAudio.playRedLightStep(1, gameSettings.soundVolume, driver?.category || 'f1');
    }

    if (lightsTimerRef.current) {
      clearInterval(lightsTimerRef.current);
      clearTimeout(lightsTimerRef.current);
    }

    let count = 1;
    const interval = setInterval(() => {
      count += 1;
      if (count <= 5) {
        setRedLightsCount(count);
        if (gameSettings.soundEnabled) {
          startLineAudio.playRedLightStep(count, gameSettings.soundVolume, driver?.category || 'f1');
        }
      } else {
        clearInterval(interval);
        const randomHold = 550 + Math.random() * 500;
        lightsTimerRef.current = setTimeout(() => {
          setRedLightsCount(0);
          setStartLineStage('lights_out');

          if (gameSettings.soundEnabled) {
            startLineAudio.playLightsOutAcceleration(gameSettings.soundVolume, driver?.category || 'f1');
          }

          lightsTimerRef.current = setTimeout(() => {
            startLineAudio.stopAll();
            setStartLineStage('none');
            runLiveRaceSimulation(initialCars, track);
          }, 1650);
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
    startLineAudio.stopAll();
    setStartLineStage('none');
    setRedLightsCount(0);
    runLiveRaceSimulation(initialCars, track);
  };

  // Refs for real-time race loop access
  const autoPitModeRef = useRef<'conservador' | 'arriscado'>('conservador');
  const forcePitRef = useRef<boolean>(false);
  const drivingStyleRef = useRef<'conservador' | 'equilibrado' | 'agressivo'>('equilibrado');
  const simSpeedRef = useRef<1 | 2>(1);
  const nextPitTireRef = useRef<TireCompound>('Duro');
  const raceModeRef = useRef<RaceMode>(raceMode);
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

  useEffect(() => {
    nextPitTireRef.current = nextPitTire;
  }, [nextPitTire]);

  useEffect(() => {
    raceModeRef.current = raceMode;
    try {
      localStorage.setItem('apex_gp_race_mode_v1', raceMode);
    } catch (e) {
      console.error('Failed to save raceMode', e);
    }
  }, [raceMode]);

  const handleSelectStartingTire = (compound: TireCompound) => {
    setStartingTire(compound);
    // Also set a smart default for the next pit stop tire
    if (compound === 'Chuva Leve' || compound === 'Chuva Pesada') {
      setNextPitTire(compound);
      nextPitTireRef.current = compound;
    } else if (compound === 'Macio') {
      setNextPitTire('Médio');
      nextPitTireRef.current = 'Médio';
    } else if (compound === 'Médio') {
      setNextPitTire('Duro');
      nextPitTireRef.current = 'Duro';
    } else {
      setNextPitTire('Médio');
      nextPitTireRef.current = 'Médio';
    }
  };

  const handleSelectNextPitTire = (compound: TireCompound) => {
    setNextPitTire(compound);
    nextPitTireRef.current = compound;
  };

  const handleToggleRaceMode = (mode?: RaceMode) => {
    if (gameState === 'race' || isRacing || startLineStage !== 'none') {
      triggerSaveToast('🔒 O modo de corrida não pode ser alterado durante a corrida! Altere no Paddock após a bandeirada.', 'autosave');
      return;
    }
    setRaceMode(prev => {
      const next = mode ?? (prev === 'rapido' ? 'estrategico' : 'rapido');
      raceModeRef.current = next;
      if (selectedSlotIndex !== null) {
        setSlots(prevSlots => {
          const copy = [...prevSlots];
          if (copy[selectedSlotIndex]) {
            copy[selectedSlotIndex] = {
              ...copy[selectedSlotIndex]!,
              raceMode: next,
              lastSaved: new Date().toISOString()
            };
          }
          return copy;
        });
      }
      if (next === 'estrategico') {
        triggerSaveToast('🧠 MODO ESTRATÉGICO: Corridas de 1 a 2 min e paradas oficiais (1-2 pits)!', 'autosave');
      } else {
        triggerSaveToast('⚡ MODO RÁPIDO: Simulação acelerada ativada!', 'autosave');
      }
      return next;
    });
  };

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

  // Auto-set recommended starting tire and next pit tire when track changes
  useEffect(() => {
    if (!driver) return;
    const catTrks = TRACKS.filter(t => t.category === driver.category);
    const trk = catTrks[currentRaceIndex] || catTrks[0];
    if (!trk) return;
    if (trk.weather === 'Chuva Leve') {
      setStartingTire('Chuva Leve');
      setNextPitTire('Chuva Leve');
      nextPitTireRef.current = 'Chuva Leve';
    } else if (trk.weather === 'Chuva Pesada' || trk.weather === 'Chuva') {
      setStartingTire('Chuva Pesada');
      setNextPitTire('Chuva Pesada');
      nextPitTireRef.current = 'Chuva Pesada';
    } else {
      const advice = getTeamTireAdvice(trk);
      setStartingTire(advice.recommendedTire);
      const nextDefault: TireCompound = advice.recommendedTire === 'Duro' ? 'Médio' : 'Duro';
      setNextPitTire(nextDefault);
      nextPitTireRef.current = nextDefault;
    }
  }, [currentRaceIndex, driver?.category, selectedSlotIndex]);

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

  // Request persistent browser cache and recover from CacheStorage / IndexedDB if localStorage was cleared
  useEffect(() => {
    void requestPersistentBrowserCache();
    let mounted = true;
    recoverSlotsFromBrowserCacheIfNeeded(slots).then(recovered => {
      if (mounted && recovered) {
        setSlots(recovered);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist all driver slots automatically into Browser Cache (localStorage + CacheStorage + IndexedDB)
  useEffect(() => {
    saveSlotsToBrowserCache(slots);
  }, [slots]);

  // Automatically keep the active slot synchronized in cache whenever season, race index, XP, or standings change
  useEffect(() => {
    if (selectedSlotIndex === null) return;
    setSlots(prevSlots => {
      const current = prevSlots[selectedSlotIndex];
      if (!current) return prevSlots;
      const sameSeason = current.currentSeason === currentSeason;
      const sameRace = current.currentRaceIndex === currentRaceIndex;
      const sameXp = current.trainingPoints === trainingPoints;
      const sameDriverStandings = current.savedDriverStandings === driverStandings;
      const sameConstructorStandings = current.savedConstructorStandings === constructorStandings;

      if (sameSeason && sameRace && sameXp && sameDriverStandings && sameConstructorStandings) {
        return prevSlots;
      }

      const copy = [...prevSlots];
      copy[selectedSlotIndex] = {
        ...current,
        currentSeason,
        currentRaceIndex,
        trainingPoints,
        savedDriverStandings: driverStandings,
        savedConstructorStandings: constructorStandings,
        lastSaved: new Date().toISOString()
      };
      return copy;
    });
  }, [selectedSlotIndex, currentSeason, currentRaceIndex, trainingPoints, driverStandings, constructorStandings]);

  // Flush browser cache when tab is hidden or closed
  useEffect(() => {
    const flushCache = () => {
      saveSlotsToBrowserCache(slots);
    };
    window.addEventListener('beforeunload', flushCache);
    document.addEventListener('visibilitychange', flushCache);
    return () => {
      window.removeEventListener('beforeunload', flushCache);
      document.removeEventListener('visibilitychange', flushCache);
    };
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
    if (chosen.raceMode === 'rapido' || chosen.raceMode === 'estrategico') {
      setRaceMode(chosen.raceMode);
      raceModeRef.current = chosen.raceMode;
    }
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
      triggerSaveToast('⚠️ Todos os slots estão ocupados. Apague ou libere um slot para restaurar.', 'autosave');
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
            raceMode,
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
      raceMode: newDriverRaceMode,
      lastSaved: new Date().toISOString()
    };

    setRaceMode(newDriverRaceMode);
    raceModeRef.current = newDriverRaceMode;

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
    setIsTutorialOpen(true);
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
          raceMode: updated.raceMode ?? copy[selectedSlotIndex]?.raceMode ?? raceMode,
          savedDriverStandings: updated.savedDriverStandings ?? driverStandings,
          savedConstructorStandings: updated.savedConstructorStandings ?? constructorStandings,
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
      const isLightRain = track.weather === 'Chuva Leve';
      const isHeavyRain = track.weather === 'Chuva Pesada' || track.weather === 'Chuva';
      const isWet = isLightRain || isHeavyRain;
      const weatherBaseDelta = isHeavyRain ? 5.2 : isLightRain ? 3.4 : track.weather === 'Nublado' ? 0.35 : 0;
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
      setQualiViewMode('estrategia');
      setShowQualiSummaryModal(false);

      if (results[0]?.isPlayer) {
        updateActiveDriver(prev => ({
          ...prev,
          careerStats: { ...prev.careerStats, poles: prev.careerStats.poles + 1 }
        }));
      }
    }, 1000);
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
    setRaceLeftTab('comandos');
    setResultViewMode('podio');
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

    const isLightRain = track.weather === 'Chuva Leve';
    const isHeavyRain = track.weather === 'Chuva Pesada' || track.weather === 'Chuva';
    const details = getTireDurabilityDetails(track);
    const optimalDryCompound: TireCompound = details.Duro.isOptimal ? 'Duro' : details.Macio.isOptimal ? 'Macio' : 'Médio';
    const aiCompounds: TireCompound[] = isLightRain
      ? ['Chuva Leve', 'Chuva Leve', 'Chuva Leve', 'Chuva Pesada']
      : isHeavyRain
      ? ['Chuva Pesada', 'Chuva Pesada', 'Chuva Pesada', 'Chuva Leve']
      : [optimalDryCompound, optimalDryCompound, 'Médio', optimalDryCompound === 'Duro' ? 'Médio' : 'Macio'];

    const initialCars: LiveRaceCar[] = qResults.map((q, idx) => {
      const stats = getDriverCombatStats(q.driverName, q.teamId);
      const startGap = idx * 0.42;
      const aiTire = aiCompounds[(idx + Math.floor(Math.random() * 2)) % aiCompounds.length];
      // Todo carro quando entra em uma corrida tem 1% de chance de dar falha no motor
      const hasEngineFailure = Math.random() < 0.01;
      const failLap = hasEngineFailure
        ? Math.max(2, Math.min(track.laps, Math.floor(Math.random() * Math.max(1, track.laps - 1)) + 2))
        : undefined;

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
        statusTag: undefined,
        dnf: false,
        dnfReason: undefined,
        willFailEngineLap: failLap,
        aggressiveRainLaps: 0
      };
    });

    setRacePositions(initialCars);
    setStartLineStage('grid_intro');
    setRedLightsCount(0);
    if (gameSettings.soundEnabled) {
      startLineAudio.startGridIdle(gameSettings.soundVolume, driver.category);
    }
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
        const isStrategicMode = raceModeRef.current === 'estrategico';
        const isLightRain = track.weather === 'Chuva Leve';
        const isHeavyRain = track.weather === 'Chuva Pesada' || track.weather === 'Chuva';
        const isRain = isLightRain || isHeavyRain;
        const isCloudy = track.weather === 'Nublado';

        // 1. Update each car's engine reliability, tire wear, pit stops, wrong-tire delays, skids, and lap pace
        cars.forEach(car => {
          car.prevPos = car.pos;
          car.inPit = false;

          // If car already retired (DNF), keep its DNF state and skip lap calculation
          if (car.dnf) {
            car.lastLapTime = 'ABANDONO';
            car.statusTag = car.dnfReason === 'Falha no Motor' ? '🔥 MOTOR (DNF)' : '💥 ACIDENTE (DNF)';
            return;
          }

          car.statusTag = undefined;

          // MODO ESTRATÉGICO: 1% de chance por carro na corrida de sofrer Falha no Motor
          if (isStrategicMode && car.willFailEngineLap && lap === car.willFailEngineLap) {
            car.dnf = true;
            car.dnfReason = 'Falha no Motor';
            car.statusTag = '🔥 MOTOR (DNF)';
            car.lastLapTime = 'ABANDONO';
            car.cumulativeTime = 900000 - lap * 100 + car.pos;
            lapEvents.push({
              lap,
              description: `🔥 FALHA NO MOTOR (1%)! O motor de ${car.driverName} estourou em plena volta ${lap} — abandono imediato!`,
              type: 'incident',
              isPlayerInvolved: car.isPlayer,
              intensity: 'extreme'
            });
            return;
          }

          const isPlayer = car.isPlayer;
          // In rain, AI occasionally pushes aggressively as well
          const style = isPlayer ? drivingStyleRef.current : 'equilibrado';
          const wearStyleMult = style === 'agressivo' ? 1.18 : style === 'conservador' ? 0.84 : 1.0;

          // Track consecutive laps driving in Aggressive Mode in the rain
          if (isRain && style === 'agressivo') {
            car.aggressiveRainLaps = (car.aggressiveRainLaps || 0) + 1;
          } else {
            car.aggressiveRainLaps = Math.max(0, (car.aggressiveRainLaps || 0) - 1);
          }

          // Calibrated wear so a full race has 1 to 2 pit stops like an official GP!
          let compoundWearMult = 1.0;
          if (car.tireCompound === 'Macio') {
            compoundWearMult = isStrategicMode ? 1.22 : 1.32;
          } else if (car.tireCompound === 'Médio') {
            compoundWearMult = isStrategicMode ? 0.94 : 1.02;
          } else if (car.tireCompound === 'Duro') {
            compoundWearMult = isStrategicMode ? 0.72 : 0.74;
          } else if (car.tireCompound === 'Chuva Leve') {
            compoundWearMult = isLightRain ? 0.92 : isHeavyRain ? 1.12 : 1.75; // Overheats on dry track
          } else if (car.tireCompound === 'Chuva Pesada') {
            compoundWearMult = isHeavyRain ? 0.88 : isLightRain ? 1.18 : 1.95; // Melts on dry track
          }

          // Track-dependent abrasion impact on dry tires
          if (!isRain) {
            if (track.tireAbrasion >= 1.08) {
              if (car.tireCompound === 'Macio') compoundWearMult *= 1.16;
              if (car.tireCompound === 'Duro') compoundWearMult *= 0.88;
            } else if (track.tireAbrasion <= 0.98) {
              if (car.tireCompound === 'Macio') compoundWearMult *= 0.86;
              if (car.tireCompound === 'Duro') compoundWearMult *= 1.08;
            }
          }

          // Automatic Pit Stop Trigger when tire health drops below 25% (and at least 2 laps left)
          const needsAutoPit = car.tireHealth <= 25 && remainingLaps >= 2;
          const playerForcedPit = isPlayer && forcePitRef.current && remainingLaps >= 1;

          let pitPenaltySeconds = 0;

          if (isPlayer && (needsAutoPit || playerForcedPit)) {
            forcePitRef.current = false;
            setForcePitNextLap(false);
            car.pitStops += 1;
            car.inPit = true;
            car.aggressiveRainLaps = 0;

            // Player equips the exact tire compound selected in the live Pit Wall (nextPitTireRef.current)
            const nextCompound: TireCompound = nextPitTireRef.current;
            const shortCode = getTireShortCode(nextCompound);

            if (autoPitModeRef.current === 'conservador') {
              pitPenaltySeconds = 3.0;
              car.tireHealth = 100;
              car.tireCompound = nextCompound;
              car.statusTag = `🔧 BOX ${shortCode} (3.0s)`;
              lapEvents.push({
                lap,
                description: `🔧 Pit Stop Seguro (3.0s): ${car.driverName} colocou pneus ${nextCompound} novos!`,
                type: 'pit'
              });
            } else {
              // Risky Automatic Pit Stop: 75% chance of fast 1.8s stop, 25% chance of 5.0s wheel gun delay
              if (Math.random() < 0.75) {
                pitPenaltySeconds = 1.8;
                car.tireHealth = 100;
                car.tireCompound = nextCompound;
                car.statusTag = `⚡ BOX ${shortCode} (1.8s)`;
                lapEvents.push({
                  lap,
                  description: `⚡ Box Relâmpago (1.8s)! ${car.driverName} voltou de pneus ${nextCompound}!`,
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
            if (isLightRain) {
              car.tireCompound = 'Chuva Leve';
            } else if (isHeavyRain) {
              car.tireCompound = 'Chuva Pesada';
            } else {
              car.tireCompound = remainingLaps <= totalLaps * 0.36 ? 'Macio' : (car.tireCompound === 'Macio' ? 'Duro' : 'Médio');
            }
            car.statusTag = `🔧 BOX (${pitPenaltySeconds}s)`;
            if (car.pos <= 5) {
              lapEvents.push({
                lap,
                description: `🔧 ${car.driverName} (P${car.pos}) fez parada no box para pneus ${car.tireCompound} (${pitPenaltySeconds}s).`,
                type: 'pit'
              });
            }
          } else {
            // Normal tire wear on track
            const jitter = 0.93 + Math.random() * 0.14;
            const wearAmount = baseWearUnit * track.tireAbrasion * wearStyleMult * compoundWearMult * jitter;
            car.tireHealth = Math.max(5, Math.round(car.tireHealth - wearAmount));
          }

          // In rain, straight speeds contribute less while cornering & consistency (car.cornerStat) dominate
          const straightWeight = isRain ? track.straightWeight * 0.65 : track.straightWeight;
          const cornerWeight = isRain ? track.cornerWeight * 1.35 : track.cornerWeight;

          const trackSkill =
            car.speedStat * straightWeight +
            car.cornerStat * cornerWeight +
            car.defenseStat * track.defenseWeight +
            car.carPerf * 0.35;

          const styleBonus = style === 'agressivo' ? 2.2 : style === 'conservador' ? -1.5 : 0;

          // Tire compound speed & wet weather matching physics
          let compoundSpeedBonus = 0;
          const isDryCompound = car.tireCompound === 'Macio' || car.tireCompound === 'Médio' || car.tireCompound === 'Duro';
          const isWetCompound = car.tireCompound === 'Chuva Leve' || car.tireCompound === 'Chuva Pesada';
          const isSlickInRain = isRain && isDryCompound;
          const isWetInDry = !isRain && isWetCompound;
          const isMismatchedWet =
            (isLightRain && car.tireCompound === 'Chuva Pesada') ||
            (isHeavyRain && car.tireCompound === 'Chuva Leve');

          // Wrong tire time delay (retardo no tempo por pneu errado no Modo Estratégico)
          let wrongTireDelay = 0;

          if (isLightRain) {
            if (car.tireCompound === 'Chuva Leve') {
              compoundSpeedBonus = 4.2;
            } else if (car.tireCompound === 'Chuva Pesada') {
              compoundSpeedBonus = 1.2;
              if (isStrategicMode) wrongTireDelay = 1.8;
            } else {
              compoundSpeedBonus = -5.5;
              if (isStrategicMode) wrongTireDelay = 4.4;
            }
          } else if (isHeavyRain) {
            if (car.tireCompound === 'Chuva Pesada') {
              compoundSpeedBonus = 4.8;
            } else if (car.tireCompound === 'Chuva Leve') {
              compoundSpeedBonus = 0.6;
              if (isStrategicMode) wrongTireDelay = 2.4;
            } else {
              compoundSpeedBonus = -8.5;
              if (isStrategicMode) wrongTireDelay = 6.8;
            }
          } else {
            // Dry / Cloudy track
            if (car.tireCompound === 'Macio') {
              compoundSpeedBonus = track.tireAbrasion <= 0.98 ? 4.3 : track.tireAbrasion >= 1.08 ? 1.8 : 3.2;
            } else if (car.tireCompound === 'Médio') {
              compoundSpeedBonus = 1.6;
            } else if (car.tireCompound === 'Duro') {
              compoundSpeedBonus = track.tireAbrasion >= 1.08 ? 1.5 : track.tireAbrasion <= 0.98 ? -1.0 : 0.2;
            } else {
              // Using rain tires on dry asphalt: slow and overheats
              compoundSpeedBonus = -4.2;
              if (isStrategicMode) wrongTireDelay = 3.8;
            }
          }

          if (isStrategicMode && (isSlickInRain || isWetInDry) && !car.inPit) {
            car.statusTag = '⚠️ PNEU ERRADO';
          }

          const wearCritMult = track.tireAbrasion >= 1.08 ? 0.20 : 0.12;
          const tireWearPenalty = car.tireHealth < 40 ? (40 - car.tireHealth) * wearCritMult : (100 - car.tireHealth) * 0.015;

          const wetControlBonus = isRain ? ((car.cornerStat - 60) * 0.09) : 0;
          const weatherGripLoss = isHeavyRain ? 5.0 : isLightRain ? 3.2 : isCloudy ? 0.4 : 0;

          // Skidding (Derrapagem) & Skid-Induced Accidents:
          // - In Strategic Mode: wrong tires (dry in rain, rain in dry, mismatched rain) and prolonged Aggressive Mode in rain cause skids (derrapagem), and a skid can cause an accident (DNF)!
          let spinPenalty = 0;
          if (!car.inPit) {
            if (isStrategicMode) {
              let skidChance = 0;

              if (isRain) {
                skidChance += Math.max(0.01, (85 - car.cornerStat) * 0.002);
              }

              // Wrong tire compound skid risk
              if (isSlickInRain) {
                skidChance += isHeavyRain ? 0.36 : 0.25;
              } else if (isWetInDry) {
                skidChance += 0.14;
              } else if (isMismatchedWet) {
                skidChance += isHeavyRain ? 0.14 : 0.07;
              }

              // Andar muito no modo agressivo na chuva pode causar derrapagem
              if (isRain && style === 'agressivo') {
                const aggLaps = car.aggressiveRainLaps || 1;
                skidChance += aggLaps === 1 ? 0.06 : aggLaps === 2 ? 0.18 : 0.32;
              } else if (style === 'conservador') {
                skidChance *= 0.55;
              }

              if (car.tireHealth < 35) {
                skidChance += 0.05;
              }

              if (skidChance > 0 && Math.random() < skidChance) {
                // A skid (derrapagem) occurred! Check if the skid causes an Accident (uma derrapagem pode causar acidente)
                const accidentFromSkidChance = isSlickInRain
                  ? (isHeavyRain ? 0.35 : 0.26)
                  : (isWetInDry || isMismatchedWet)
                  ? 0.22
                  : 0.20;

                const causeText = isSlickInRain
                  ? `pneu seco (${car.tireCompound}) na chuva`
                  : isWetInDry
                  ? `pneu de chuva (${car.tireCompound}) no seco`
                  : isRain && (car.aggressiveRainLaps || 0) >= 2
                  ? `muito tempo no modo agressivo na chuva`
                  : isMismatchedWet
                  ? `pneu ${car.tireCompound} inadequado`
                  : `pista escorregadia`;

                if (Math.random() < accidentFromSkidChance) {
                  // Skid leads to a Race Accident (DNF)
                  car.dnf = true;
                  car.dnfReason = 'Acidente (Derrapagem)';
                  car.statusTag = '💥 ACIDENTE (DNF)';
                  car.lastLapTime = 'ABANDONO';
                  car.cumulativeTime = 900000 - lap * 100 + car.pos;
                  lapEvents.push({
                    lap,
                    description: `💥 ACIDENTE APÓS DERRAPAGEM! ${car.driverName} derrapou (${causeText}) e bateu na barreira — abandono!`,
                    type: 'incident',
                    isPlayerInvolved: car.isPlayer,
                    intensity: 'extreme'
                  });
                  return;
                } else {
                  // Skid causes heavy time delay (Derrapagem)
                  spinPenalty = Number((4.0 + Math.random() * 3.2).toFixed(1));
                  car.statusTag = '🌀 DERRAPOU!';
                  if (car.isPlayer || car.pos <= 8) {
                    lapEvents.push({
                      lap,
                      description: `🌀 DERRAPAGEM! ${car.driverName} derrapou (${causeText}) e perdeu +${spinPenalty}s!`,
                      type: 'incident',
                      isPlayerInvolved: car.isPlayer,
                      intensity: 'intense'
                    });
                  }
                }
              }
            } else if (isRain) {
              // Fast mode standard rain spin
              let spinChance = Math.max(0.012, (85 - car.cornerStat) * 0.003);
              if (isDryCompound) {
                spinChance *= isHeavyRain ? 3.2 : 2.4;
              } else if (isHeavyRain && car.tireCompound === 'Chuva Leve') {
                spinChance *= 1.45;
              } else {
                spinChance *= 0.65;
              }
              if (style === 'agressivo') spinChance *= 1.5;
              if (style === 'conservador') spinChance *= 0.45;
              if (car.tireHealth < 35) spinChance *= 1.35;

              if (Math.random() < spinChance) {
                spinPenalty = Number((3.8 + Math.random() * 2.8).toFixed(1));
                car.statusTag = '🌀 RODOU!';
                if (car.isPlayer || car.pos <= 6) {
                  lapEvents.push({
                    lap,
                    description: `🌀 RODADA NA CHUVA! ${car.driverName} escorregou no asfalto molhado e perdeu ${spinPenalty}s!`,
                    type: 'incident'
                  });
                }
              }
            }
          }

          const lapDelta =
            Math.max(0, (135 - (trackSkill + styleBonus + compoundSpeedBonus + wetControlBonus)) * 0.065) +
            tireWearPenalty +
            pitPenaltySeconds +
            spinPenalty +
            wrongTireDelay +
            weatherGripLoss +
            (Math.random() * 0.38);
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

        // 2. Single-pass Head-to-Head Overtaking, Reduced Rain Overtaking, & Overtake Accident Risk (5% Dry / 10% Rain)
        const activeCars = cars.filter(c => !c.dnf);
        const retiredCars = cars.filter(c => c.dnf);

        // Sort active cars by their previous track position first so we can resolve on-track battles cleanly
        activeCars.sort((a, b) => a.prevPos - b.prevPos);
        const battledThisLap = new Set<string>();

        for (let i = 0; i < activeCars.length - 1; i++) {
          const leader = activeCars[i];
          const attacker = activeCars[i + 1];
          if (!leader || !attacker || leader.dnf || attacker.dnf) continue;
          if (leader.inPit || attacker.inPit) continue;
          if (battledThisLap.has(attacker.driverName)) continue;

          const leaderTime = leader.cumulativeTime ?? 0;
          const attackerTime = attacker.cumulativeTime ?? 0;

          // Attacker caught up to leader on track and is attempting an overtake
          if (attackerTime < leaderTime) {
            battledThisLap.add(attacker.driverName);

            const attackPower =
              attacker.speedStat * track.straightWeight +
              attacker.cornerStat * track.cornerWeight +
              attacker.carPerf * 0.3 +
              (attacker.tireHealth - leader.tireHealth) * 0.22;

            // A quantidade de ultrapassagem reduz na chuva (maior dificuldade de visão/spray e linha única molhada)
            const rainDefenseBonus = isRain ? (isHeavyRain ? 8.2 : 5.5) : 0;
            const defensePower =
              leader.defenseStat * (0.45 + track.defenseWeight) +
              leader.cornerStat * (track.cornerWeight * 0.5) +
              leader.carPerf * 0.3 +
              1.4 +
              rainDefenseBonus;

            const wetSprayBlocked = isRain && Math.random() < (isHeavyRain ? 0.50 : 0.36);

            if (wetSprayBlocked || attackPower + (Math.random() * 10 - 4) <= defensePower) {
              // Defender holds position!
              attacker.cumulativeTime = Number((leaderTime + (isRain ? 0.32 : 0.22)).toFixed(3));
              if (leader.isPlayer || attacker.isPlayer || leader.pos <= 4) {
                leader.statusTag = leader.statusTag || '🛡️ DEF';
              }
            } else {
              // Overtake executes! In Modo Estratégico: 5% risk of accident in dry, 10% risk in rain!
              if (isStrategicMode) {
                const overtakeAccidentRisk = isRain ? 0.10 : 0.05;
                if (Math.random() < overtakeAccidentRisk) {
                  // Overtake Accident triggered!
                  if (Math.random() < 0.45) {
                    // Terminal crash (DNF) during overtake
                    attacker.dnf = true;
                    attacker.dnfReason = 'Acidente (Ultrapassagem)';
                    attacker.statusTag = '💥 ACIDENTE ULTRAP.';
                    attacker.lastLapTime = 'ABANDONO';
                    attacker.cumulativeTime = 900000 - lap * 100 + attacker.prevPos;
                    lapEvents.push({
                      lap,
                      description: `💥 ACIDENTE NA ULTRAPASSAGEM (${isRain ? '10% Chuva' : '5% Seco'})! ${attacker.driverName} bateu forte ao tentar passar ${leader.driverName} e abandonou!`,
                      type: 'incident',
                      isPlayerInvolved: attacker.isPlayer || leader.isPlayer,
                      intensity: 'extreme'
                    });
                  } else {
                    // Heavy wheel-to-wheel collision penalty
                    const collisionLoss = Number((7.0 + Math.random() * 3.5).toFixed(1));
                    attacker.cumulativeTime = Number((leaderTime + collisionLoss).toFixed(3));
                    attacker.statusTag = '💥 TOQUE ULTRAP.';
                    leader.cumulativeTime = Number((leaderTime + 1.1).toFixed(3));
                    lapEvents.push({
                      lap,
                      description: `💥 ACIDENTE NA ULTRAPASSAGEM (${isRain ? '10% Chuva' : '5% Seco'})! ${attacker.driverName} tocou com ${leader.driverName} tentando ultrapassar e perdeu +${collisionLoss}s!`,
                      type: 'incident',
                      isPlayerInvolved: attacker.isPlayer || leader.isPlayer,
                      intensity: 'extreme'
                    });
                  }
                }
              }
            }
          }
        }

        // Pure deterministic sort by cumulativeTime (active cars first, DNF cars at bottom)
        const finalActive = cars.filter(c => !c.dnf).sort((a, b) => (a.cumulativeTime ?? 0) - (b.cumulativeTime ?? 0));
        const finalRetired = cars.filter(c => c.dnf).sort((a, b) => (a.cumulativeTime ?? 0) - (b.cumulativeTime ?? 0));
        cars = [...finalActive, ...finalRetired];

        // 3. Update positions, gaps, and record overtake badges/logs
        if (cars.length === 0) return;
        const leaderTime = cars[0]?.cumulativeTime ?? 0;
        cars.forEach((car, idx) => {
          if (!car) return;
          const newPos = idx + 1;
          const posDiff = car.prevPos - newPos;
          car.pos = newPos;

          if (car.dnf) {
            car.gap = car.dnfReason === 'Falha no Motor' ? 'OUT (MOTOR)' : 'OUT (ACIDENTE)';
            return;
          }

          car.gap = idx === 0 ? 'LÍDER' : `+${Math.max(0.2, (car.cumulativeTime ?? 0) - leaderTime).toFixed(1)}s`;

          if (!car.inPit && posDiff > 0) {
            car.overtakesCount = (car.overtakesCount || 0) + posDiff;
            if (!car.statusTag || !car.statusTag.startsWith('💥')) {
              car.statusTag = `⬆️+${posDiff}`;
            }
            const overtakenCar = cars[idx + 1];
            const isPlayerAttacker = car.isPlayer;
            const isPlayerDefender = overtakenCar?.isPlayer;

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
          } else if (!car.inPit && posDiff < 0 && !car.statusTag) {
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

        // If player suffered DNF, fast-forward remaining laps (160ms/lap) so the race finishes quickly
        const getLapDelay = () => {
          const pCar = cars.find(c => c.isPlayer);
          if (pCar?.dnf) {
            return 160;
          }
          if (raceModeRef.current === 'estrategico') {
            const targetTotalMs = simSpeedRef.current === 2 ? 64000 : 92000;
            return Math.max(900, Math.min(4800, Math.round(targetTotalMs / totalLaps)));
          }
          return simSpeedRef.current === 2 ? 380 : 750;
        };

        raceIntervalRef.current = setTimeout(stepLap, getLapDelay());
      } else {
        finishRaceActions(cars, track);
      }
    };

    const initialDelay = raceModeRef.current === 'estrategico'
      ? Math.max(900, Math.min(4800, Math.round((simSpeedRef.current === 2 ? 64000 : 92000) / totalLaps)))
      : 750;
    raceIntervalRef.current = setTimeout(stepLap, initialDelay);
  };

  const finishRaceActions = (finalCars: LiveRaceCar[], track: Track) => {
    if (!driver) return;
    setIsRacing(false);

    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const playerEntry = finalCars.find(c => c.isPlayer) || finalCars[0];
    const position = playerEntry.pos;
    const isPlayerDnf = Boolean(playerEntry.dnf);

    // 1. Determine Fastest Lap of the race across all cars
    const fastestLapCar = [...finalCars].sort((a, b) => a.bestLapSeconds - b.bestLapSeconds)[0] || playerEntry;
    const isPlayerFastestLap = !isPlayerDnf && fastestLapCar.isPlayer && position <= 10;
    const extraFastestLapPoints = isPlayerFastestLap ? 1 : 0;

    // 2. Determine Driver with Most Overtakes (Piloto do Dia)
    const mostOvertakesCar = [...finalCars].sort((a, b) => (b.overtakesCount || 0) - (a.overtakesCount || 0))[0] || playerEntry;
    const maxOvertakesCount = mostOvertakesCar.overtakesCount || 0;
    const isPlayerMostOvertakes = !isPlayerDnf && playerEntry.isPlayer && (playerEntry.overtakesCount || 0) === maxOvertakesCount && maxOvertakesCount > 0;

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

    const basePointsWon = !isPlayerDnf && position <= 10 ? pointsTable[position - 1] : 0;
    const pointsWon = basePointsWon + extraFastestLapPoints;
    const prizeWon = Number((((!isPlayerDnf && position === 1) ? 1.8 : (!isPlayerDnf && position <= 3) ? 1.0 : (!isPlayerDnf && position <= 10) ? 0.4 : 0.1) + extraBonusMoney).toFixed(2));
    const repGain = isPlayerDnf ? 0 : position === 1 ? 12 : position <= 3 ? 8 : position <= 10 ? 4 : 1;

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

      if (!isPlayerDnf) {
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
        wins: prev.careerStats.wins + (!isPlayerDnf && position === 1 ? 1 : 0),
        podiums: prev.careerStats.podiums + (!isPlayerDnf && position <= 3 ? 1 : 0),
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
        const finishCar = finishIdx !== -1 ? finalCars[finishIdx] : undefined;
        const finishPos = finishIdx !== -1 ? finishIdx + 1 : 99;
        const isCarDnf = Boolean(finishCar?.dnf);
        let pts = !isCarDnf && finishPos <= 10 ? pointsTable[finishPos - 1] : 0;
        if (!isCarDnf && ds.driverName === fastestLapCar.driverName && finishPos <= 10) {
          pts += 1;
        }
        const win = !isCarDnf && finishPos === 1 ? 1 : 0;
        const pod = !isCarDnf && finishPos <= 3 ? 1 : 0;

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

  const getTireShortCode = (compound: TireCompound) => {
    if (compound === 'Macio') return 'S';
    if (compound === 'Médio') return 'M';
    if (compound === 'Duro') return 'H';
    if (compound === 'Chuva Leve') return 'CL';
    return 'CP';
  };

  const getTireBadgeStyle = (compound: TireCompound) => {
    if (compound === 'Macio') return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (compound === 'Médio') return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    if (compound === 'Duro') return 'bg-slate-200/20 text-white border-slate-300/60';
    if (compound === 'Chuva Leve') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
  };

  const getWeatherBadge = (weather: WeatherCondition) => {
    if (weather === 'Chuva Leve') {
      return {
        label: 'Chuva Leve',
        icon: '🌦️',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        hint: 'Pista úmida! Obrigatório pneu de Chuva Leve (CL) para evitar aquaplanagem.'
      };
    }
    if (weather === 'Chuva Pesada' || weather === 'Chuva') {
      return {
        label: 'Chuva Pesada',
        icon: '🌧️',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        hint: 'Tempestade! Obrigatório pneu de Chuva Pesada (CP) para drenar a pista.'
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

  const renderRaceModeToggle = () => {
    const isLockedDuringRace = gameState === 'race' || isRacing || startLineStage !== 'none';

    if (isLockedDuringRace) {
      return (
        <button
          type="button"
          onClick={() => handleToggleRaceMode()}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-display font-black italic uppercase flex items-center gap-1.5 shrink-0 cursor-not-allowed select-none ${
            raceMode === 'estrategico'
              ? 'bg-[#38bdf8]/15 border-[#38bdf8]/40 text-[#38bdf8]'
              : 'bg-[#e6ff55]/15 border-[#e6ff55]/40 text-[#e6ff55]'
          }`}
          title="O modo de corrida não pode ser mudado durante a corrida. Altere no Paddock antes da largada."
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          {raceMode === 'estrategico' ? (
            <>
              <Timer className="w-3.5 h-3.5 shrink-0" />
              <span>Modo Estratégico (Fixo na Corrida)</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Modo Rápido (Fixo na Corrida)</span>
            </>
          )}
        </button>
      );
    }

    return (
      <div
        className="flex items-center bg-[#070709] p-1 rounded-xl border border-white/15 shadow-md shrink-0 relative z-30"
        title="Alternar entre Modo Rápido e Modo Estratégico (pode ser alterado antes da corrida; fica travado durante a corrida)"
      >
        <button
          type="button"
          onClick={() => handleToggleRaceMode('rapido')}
          className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-display font-black italic uppercase transition-all cursor-pointer flex items-center gap-1 ${
            raceMode === 'rapido'
              ? 'bg-[#e6ff55] text-black shadow'
              : 'text-[#8e8e9c] hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 shrink-0" />
          <span>Modo Rápido</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggleRaceMode('estrategico')}
          className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-display font-black italic uppercase transition-all cursor-pointer flex items-center gap-1 ${
            raceMode === 'estrategico'
              ? 'bg-[#38bdf8] text-black shadow'
              : 'text-[#8e8e9c] hover:text-white'
          }`}
        >
          <Timer className="w-3 h-3 shrink-0" />
          <span>Modo Estratégico</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden text-[#f1f1f4] font-sans selection:bg-[#e6ff55] selection:text-black flex flex-col relative ${
        isWidescreenMode
          ? 'bg-[#070709] w-full'
          : 'bg-[#ebfa91] items-center justify-center sm:p-2'
      }`}
    >
      {/* GLOBAL SAVE / AUTOSAVE NOTIFICATION TOAST */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.92 }}
            className={`fixed top-3 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border flex items-center gap-2.5 backdrop-blur-xl ${
              saveToast.type === 'autosave'
                ? 'bg-[#14141c] text-[#e6ff55] border-[#e6ff55]/50'
                : 'bg-[#e6ff55] text-black border-black font-bold'
            }`}
          >
            <div className={`p-1 rounded-xl ${saveToast.type === 'autosave' ? 'bg-[#e6ff55]/20 text-[#e6ff55]' : 'bg-black text-[#e6ff55]'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-display font-black italic uppercase tracking-wide">
              {saveToast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top Floating View Toggle when in Compact Mobile Frame Mode */}
      {!isWidescreenMode && (
        <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-1 px-2 text-xs font-mono shrink-0">
          <span className="text-[#070709] font-black italic tracking-wide uppercase font-display text-xs">
            APEX GP // MOBILE FRAME
          </span>
          <button
            onClick={() => setIsWidescreenMode(true)}
            className="px-2.5 py-0.5 bg-[#070709] text-[#e6ff55] rounded-full text-[10px] font-bold tracking-tight hover:brightness-125 transition-all cursor-pointer shadow"
          >
            🖥️ Alternar p/ Versão Desktop
          </button>
        </div>
      )}

      {/* Main Application Shell: Full-Viewport Desktop Workspace vs Smartphone Frame */}
      <div 
        className={`w-full flex-1 min-h-0 flex flex-col relative overflow-hidden transition-all duration-300 ${
          isWidescreenMode
            ? 'h-full bg-[#070709]'
            : 'sm:max-w-[420px] h-full sm:max-h-[94vh] bg-[#070709] sm:rounded-[36px] sm:border-[6px] sm:border-[#181822] sm:shadow-[0_25px_80px_rgba(0,0,0,0.6)] pb-14'
        }`}
      >
        {/* iOS Status Bar ONLY when in Mobile Frame Mode */}
        {!isWidescreenMode && (
          <div className="flex items-center justify-between px-5 pt-2 pb-1 text-white text-xs select-none z-30 shrink-0">
            <span className="font-semibold tracking-tight text-[11px] font-mono">9:41</span>
            <div className="w-20 h-3.5 bg-[#14141c] rounded-full mx-auto hidden sm:block border border-white/5 shadow-inner"></div>
            <div className="flex items-center gap-1.5 opacity-90 font-mono text-[10px]">
              <span className="font-bold">5G</span>
              <div className="w-4 h-2 border border-white/60 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-[#e6ff55] rounded-2xs"></div>
              </div>
            </div>
          </div>
        )}

        {/* TITLE SCREEN / SAVE SLOTS SELECTOR (DESKTOP WIDESCREEN & MOBILE RESPONSIVE) */}
        {gameState === 'title' && !isCreatingDriver && (
          <div className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-4 lg:px-7 lg:py-3.5 max-w-[1440px] w-full mx-auto overflow-hidden gap-2">
            <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 overflow-hidden">
              {/* Top Brand Navbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 shrink-0 relative z-20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e6ff55] text-black flex items-center justify-center shadow-lg shadow-[#e6ff55]/20 shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-display font-black italic text-white tracking-tight uppercase leading-none">
                      APEX GP <span className="text-[#e6ff55]">// CAREER HUB</span>
                    </h1>
                    <p className="text-[10px] text-[#8e8e9c] font-mono hidden sm:block mt-0.5">
                      Selecione um slot abaixo para continuar sua carreira ou criar um novo piloto
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {renderRaceModeToggle()}

                  <PWAInstallButton variant="header" />

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="min-h-[38px] px-3 py-1.5 bg-[#14141c] hover:bg-[#1e1e2a] text-[#e6ff55] border border-white/10 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm relative z-20"
                    title="Abrir Configurações do Jogo"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#e6ff55]" />
                    <span>CONFIGURAÇÕES</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWidescreenMode(prev => !prev)}
                    className="min-h-[38px] px-3 py-1.5 bg-[#14141c] hover:bg-[#1e1e2a] text-[#e6ff55] border border-white/10 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 relative z-20"
                  >
                    <span>{isWidescreenMode ? '📱 Modo Mobile' : '🖥️ Modo Desktop'}</span>
                  </button>
                </div>
              </div>

              {/* RECOVERY BANNER FOR LAST DELETED DRIVER */}
              {lastDeletedDriverSlot && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#14141c] border border-[#e6ff55]/40 rounded-2xl p-2 px-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl w-full shrink-0 relative z-20"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-xl bg-[#e6ff55]/20 text-[#e6ff55] shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono font-bold text-[#e6ff55] uppercase tracking-wider">
                        ÚLTIMO PILOTO EXCLUÍDO
                      </div>
                      <div className="text-xs font-display font-black italic uppercase text-white truncate">
                        {lastDeletedDriverSlot.driver.name} ({lastDeletedDriverSlot.driver.category.toUpperCase()} · {lastDeletedDriverSlot.driver.careerStats?.wins || 0} Vitórias)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestoreLastDeletedDriver}
                    className="min-h-[40px] px-3.5 py-1.5 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0 relative z-30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>DESFAZER & RECUPERAR PILOTO</span>
                  </button>
                </motion.div>
              )}

              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-display font-black italic uppercase text-[#e6ff55] leading-tight">
                    SELECIONE SEU PILOTO // 4 SLOTS DE CARREIRA
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[9px] sm:text-[10px] font-mono font-bold text-emerald-300 uppercase">
                    <Save className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Salvos no Cache deste Navegador</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8e8e9c] hidden md:inline">
                  Cada navegador mantém seus próprios pilotos salvos automaticamente em cache local
                </span>
              </div>

              {/* 4 Slots Grid: Adaptive height so buttons are ALWAYS huge and never clipped */}
              <div className={`flex-1 min-h-0 grid gap-2.5 sm:gap-3 ${isWidescreenMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
                {slots.map((slot, index) => {
                  const slotTeam = slot ? (TEAMS.find(t => t.id === slot.teamId) || TEAMS[0]) : null;
                  const slotAvg = slot ? calculateDriverAvg(slot.attributes) : 0;
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => {
                        if (slot) {
                          selectDriverSlot(index);
                        } else {
                          setCreatingSlotId(index);
                          setNewDriverRaceMode(raceMode);
                          setIsCreatingDriver(true);
                        }
                      }}
                      className="relative bg-[#14141c] border-2 border-white/10 hover:border-[#e6ff55] rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between shadow-xl transition-all group min-h-0 cursor-pointer select-none overflow-hidden"
                    >
                      {slot && slotTeam ? (
                        <>
                          {/* Top & Middle Content: Flex-1 min-h-0 so it adapts without ever pushing the button off-card */}
                          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between gap-1.5 overflow-hidden">
                            {/* Slot Header */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-1 shrink-0">
                              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#e6ff55] uppercase">
                                SLOT 0{index + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                                    slot.raceMode === 'estrategico'
                                      ? 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30'
                                      : 'bg-[#e6ff55]/15 text-[#e6ff55] border-[#e6ff55]/30'
                                  }`}
                                >
                                  {slot.raceMode === 'estrategico' ? '🧠 ESTRAT.' : '⚡ RÁPIDO'}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-white border border-white/10">
                                  OVR {slotAvg}
                                </span>
                                <span className="text-[9px] font-display font-black italic px-2 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30 uppercase">
                                  {slot.category.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Driver Identity */}
                            <div className="flex items-center gap-2 shrink-0">
                              <HelmetVector 
                                primaryColor={slot.helmetColor} 
                                secondaryColor={slot.helmetSecondaryColor || '#1e3a8a'} 
                                className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 drop-shadow-lg" 
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-base font-display font-black italic uppercase text-white truncate leading-tight">
                                  {slot.name}
                                </div>
                                <div className="text-[9px] sm:text-[10px] text-[#8e8e9c] font-mono truncate">
                                  {slot.nationality}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-bold truncate" style={{ color: slotTeam.color }}>
                                  {slotTeam.name}
                                </div>
                              </div>
                            </div>

                            {/* Car Preview inside Card (Only shown on lg+ 4-col widescreen where cards are tall) */}
                            {isWidescreenMode && (
                              <div className="hidden lg:flex flex-1 min-h-[38px] max-h-[68px] bg-[#070709] rounded-xl px-2 py-1 border border-white/5 items-center justify-center overflow-hidden">
                                <CategoryCarVector 
                                  category={slot.category} 
                                  teamColor={slotTeam.color} 
                                  helmetColor={slot.helmetColor} 
                                  className="w-full h-full max-h-12 object-contain" 
                                />
                              </div>
                            )}

                            {/* Mini Career Stats */}
                            <div className="grid grid-cols-3 gap-1 text-center font-mono bg-[#070709]/80 p-1.5 rounded-xl border border-white/5 shrink-0">
                              <div>
                                <div className="text-[8px] text-[#8e8e9c] uppercase">Títulos</div>
                                <div className="text-[10px] sm:text-xs font-bold text-[#e6ff55]">{slot.careerStats.championships}</div>
                              </div>
                              <div>
                                <div className="text-[8px] text-[#8e8e9c] uppercase">Vitórias</div>
                                <div className="text-[10px] sm:text-xs font-bold text-white">{slot.careerStats.wins}</div>
                              </div>
                              <div>
                                <div className="text-[8px] text-[#8e8e9c] uppercase">Saldo</div>
                                <div className="text-[10px] sm:text-xs font-bold text-[#38bdf8]">${slot.money.toFixed(1)}M</div>
                              </div>
                            </div>
                          </div>

                          {/* LARGE UNOBSTRUCTED ACTION BUTTONS */}
                          <div className="flex items-center gap-2 pt-2 mt-1.5 border-t border-white/5 shrink-0 relative z-30 pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectDriverSlot(index);
                              }}
                              className="flex-1 min-h-[44px] sm:min-h-[48px] bg-[#e6ff55] hover:brightness-110 active:scale-[0.98] text-black font-display font-black italic uppercase py-2.5 px-3 rounded-xl text-xs sm:text-sm tracking-wider transition-all cursor-pointer shadow-lg shadow-[#e6ff55]/20 flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                              <span className="truncate">JOGAR</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(index);
                              }}
                              className="min-h-[44px] sm:min-h-[48px] min-w-[44px] sm:min-w-[48px] bg-[#1e1e28] hover:bg-red-600 hover:text-white active:scale-[0.98] text-slate-300 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center border border-white/10"
                              title="Excluir Carreira"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 min-h-0 flex flex-col justify-between text-center gap-2 relative z-10">
                          <div className="flex items-center justify-between border-b border-white/5 pb-1 shrink-0">
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#8e8e9c] uppercase">
                              SLOT 0{index + 1}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-[#8e8e9c]">
                              LIVRE
                            </span>
                          </div>

                          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1.5 py-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#191924] border border-dashed border-white/20 flex items-center justify-center text-[#e6ff55] group-hover:border-[#e6ff55] group-hover:scale-105 transition-all shrink-0">
                              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-display font-black italic uppercase text-white">
                                SLOT 0{index + 1} DISPONÍVEL
                              </div>
                              <div className="text-[10px] font-mono text-[#8e8e9c] hidden sm:block">
                                Inicie uma nova carreira no Kart
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreatingSlotId(index);
                              setNewDriverRaceMode(raceMode);
                              setIsCreatingDriver(true);
                            }}
                            className="w-full min-h-[44px] sm:min-h-[48px] bg-[#1e1e28] group-hover:bg-[#e6ff55] group-hover:text-black hover:brightness-110 active:scale-[0.98] text-[#e6ff55] font-display font-black italic uppercase py-2.5 px-3 rounded-xl text-xs sm:text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-[#e6ff55]/30 shrink-0 relative z-30 pointer-events-auto shadow-md"
                          >
                            <PlusCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">CRIAR PILOTO</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-1 text-[10px] text-[#8e8e9c] font-mono shrink-0">
              APEX GP MOTORSPORT · TEMPORADA OFICIAL 2026 · DESKTOP & MOBILE EDITION
            </div>
          </div>
        )}

      {/* STEP 2: DRIVER DELETION CONFIRMATION MODAL */}
      {deletingSlotIndex !== null && slots[deletingSlotIndex] && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-hidden">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full max-h-[95vh] bg-[#14141c] border border-red-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 text-white my-auto relative overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-2.5">
              <div className="p-2 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-400">
                  PASSO 2 DE 2 // CONFIRMAÇÃO
                </span>
                <h3 className="text-lg font-display font-black italic uppercase text-white leading-tight">
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

            <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-1.5 font-mono text-xs">
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

            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[10px] font-mono text-amber-200 leading-snug flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>O piloto ficará salvo na memória para você poder desfazer e recuperar posteriormente.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 relative z-30">
              <button
                type="button"
                onClick={() => setDeletingSlotIndex(null)}
                className="min-h-[48px] py-2.5 px-4 bg-[#1e1e28] hover:bg-[#282838] text-white font-display font-black italic uppercase rounded-2xl text-xs sm:text-sm transition-all cursor-pointer border border-white/10"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlot}
                className="min-h-[48px] py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-display font-black italic uppercase rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>EXCLUIR</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DRIVER CREATION MODAL */}
      {isCreatingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full max-h-[96vh] bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl my-auto overflow-hidden flex flex-col justify-between gap-3"
          >
            <div>
              <h3 className="text-xl font-display font-black italic uppercase text-[#e6ff55] mb-0.5">Novo Piloto // Slot {creatingSlotId + 1}</h3>
              <p className="text-[#8e8e9c] text-[11px] mb-2.5 font-mono">Personalize os dados do piloto e configure a pintura vetorial do seu capacete.</p>

              <div className="bg-[#070709] border border-white/5 rounded-2xl p-2.5 flex items-center justify-center gap-4">
                <HelmetVector 
                  primaryColor={newHelmetPrimary} 
                  secondaryColor={newHelmetSecondary} 
                  className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" 
                />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-[#e6ff55] uppercase block font-bold">Prévia Oficial do Capacete</span>
                  <span className="text-[11px] font-mono text-[#8e8e9c]">Escolha as cores abaixo para personalizar</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1">Nome do Piloto</label>
                <input 
                  type="text" 
                  name="driverName" 
                  defaultValue="Lucas Senna" 
                  required
                  className="w-full min-h-[42px] bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-[#e6ff55]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1">Nacionalidade</label>
                <select name="nationality" className="w-full min-h-[42px] bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm">
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1">Cor Principal</label>
                  <label className="flex items-center gap-2 bg-[#070709] border border-white/10 hover:border-[#e6ff55] rounded-xl p-2 cursor-pointer">
                    <input 
                      type="color" 
                      value={newHelmetPrimary}
                      onChange={(e) => setNewHelmetPrimary(e.target.value)}
                      className="w-8 h-7 bg-transparent cursor-pointer rounded" 
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{newHelmetPrimary}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#8e8e9c] mb-1">Faixas / Detalhes</label>
                  <label className="flex items-center gap-2 bg-[#070709] border border-white/10 hover:border-[#e6ff55] rounded-xl p-2 cursor-pointer">
                    <input 
                      type="color" 
                      value={newHelmetSecondary}
                      onChange={(e) => setNewHelmetSecondary(e.target.value)}
                      className="w-8 h-7 bg-transparent cursor-pointer rounded" 
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">{newHelmetSecondary}</span>
                  </label>
                </div>
              </div>

              {/* RACE MODE SELECTION PRESENTED AT THE START OF CAREER */}
              <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#e6ff55]">
                    Modo de Corrida Inicial (Escolha para sua Carreira)
                  </label>
                  <span className="text-[9px] font-mono text-[#8e8e9c] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#ff5f8f]" />
                    <span>Fixo durante a corrida</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDriverRaceMode('rapido')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      newDriverRaceMode === 'rapido'
                        ? 'bg-[#e6ff55]/15 border-[#e6ff55] ring-2 ring-[#e6ff55]/35 text-white shadow-md'
                        : 'bg-[#14141c] border-white/10 text-[#8e8e9c] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-display font-black italic uppercase flex items-center gap-1 text-[#e6ff55]">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>Modo Rápido</span>
                      </span>
                      {newDriverRaceMode === 'rapido' && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#e6ff55] text-black">
                          ESCOLHIDO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 mt-1 leading-snug">
                      Corridas aceleradas (~20s) e paradas automáticas &lt; 25%.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDriverRaceMode('estrategico')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      newDriverRaceMode === 'estrategico'
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8] ring-2 ring-[#38bdf8]/35 text-white shadow-md'
                        : 'bg-[#14141c] border-white/10 text-[#8e8e9c] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-display font-black italic uppercase flex items-center gap-1 text-[#38bdf8]">
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        <span>Modo Estratégico</span>
                      </span>
                      {newDriverRaceMode === 'estrategico' && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#38bdf8] text-black">
                          ESCOLHIDO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 mt-1 leading-snug">
                      1 a 2 min, 1-2 paradas oficiais, pneus de chuva e riscos reais.
                    </p>
                  </button>
                </div>

                <p className="text-[10px] font-mono text-[#8e8e9c] leading-tight">
                  💡 Pode ser alterado depois no Paddock ou antes da largada. Não pode ser alterado durante a corrida.
                </p>
              </div>

              <div className="flex gap-2.5 pt-1 relative z-30">
                <button
                  type="button"
                  onClick={() => setIsCreatingDriver(false)}
                  className="flex-1 min-h-[46px] bg-[#1e1e28] hover:bg-[#282836] text-white font-display font-black italic uppercase py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[46px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-2.5 rounded-xl shadow-lg shadow-[#e6ff55]/20 cursor-pointer text-xs sm:text-sm"
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
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#e6ff55] text-black border-2 border-black rounded-2xl px-5 py-2.5 shadow-[0_12px_40px_rgba(230,255,85,0.4)] flex items-center gap-3 pointer-events-auto"
              >
                <div className="p-1.5 bg-black text-[#e6ff55] rounded-xl shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-black/70">
                    CONQUISTA DE CARREIRA RESGATADA!
                  </div>
                  <div className="text-xs sm:text-sm font-display font-black italic uppercase text-black">
                    {claimedMilestoneToast.title}
                  </div>
                  <div className="text-[11px] font-mono font-extrabold text-black">
                    +${claimedMilestoneToast.money.toFixed(1)}M no Orçamento · +{claimedMilestoneToast.xp} XP de Treino
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* DESKTOP LEFT SIDEBAR NAVIGATION (VISIBLE WHEN WIDESCREEN MODE IS ACTIVE ON MD+ SCREENS) */}
          {isWidescreenMode && (
            <aside className="hidden md:flex w-56 lg:w-64 bg-[#101017] border-r border-white/5 flex-col justify-between p-3.5 shrink-0 select-none overflow-hidden">
              <div className="space-y-3.5 min-h-0">
                {/* Brand Logo */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#e6ff55] text-black flex items-center justify-center font-black shadow-md shadow-[#e6ff55]/20 shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-display font-black italic uppercase text-white leading-none">
                        APEX GP <span className="text-[#e6ff55]">26</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#8e8e9c] uppercase">Desktop Pit Wall</span>
                    </div>
                  </div>
                </div>

                {/* Active Driver Mini Profile Card */}
                <div className="bg-[#14141c] border border-white/5 rounded-2xl p-2.5 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <HelmetVector 
                      primaryColor={driver.helmetColor} 
                      secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                      className="w-9 h-9 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-display font-black italic uppercase text-white truncate">
                        {driver.name}
                      </div>
                      <div className="text-[10px] font-mono truncate" style={{ color: currentTeam.color }}>
                        {currentTeam.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono pt-1.5 border-t border-white/5">
                    <span className="px-2 py-0.2 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] font-bold uppercase">
                      {driver.category}
                    </span>
                    <span className="text-[#e6ff55] font-bold">
                      Temporada {currentSeason}
                    </span>
                  </div>
                </div>

                {/* Vertical Navigation Menu */}
                <nav aria-label="Menu Desktop" className="space-y-1">
                  {[
                    { id: 'garagem', label: 'Garagem & Telemetria', icon: User, badge: `Etapa ${currentRaceIndex + 1}` },
                    { id: 'treino', label: 'Centro de Evolução', icon: Zap, badge: trainingPoints > 0 ? `${trainingPoints} XP` : undefined },
                    { id: 'calendario', label: 'PRÓXIMA CORRIDA 🏁', icon: Calendar, isHero: true, badge: currentTrack.weather },
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
                        type="button"
                        onClick={() => switchHubTab(item.id as HubTab)}
                        className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer relative z-20 ${
                          isHero
                            ? isActive
                              ? 'bg-[#e6ff55] text-black font-display font-black italic uppercase shadow-lg shadow-[#e6ff55]/30 ring-2 ring-[#e6ff55]'
                              : 'bg-[#191924] text-[#8e8e9c] hover:bg-[#1e1e2d] hover:text-white font-display font-black italic uppercase border border-white/10 shadow-sm'
                            : isActive
                            ? 'bg-[#e6ff55] text-black font-bold shadow-lg shadow-[#e6ff55]/15'
                            : 'text-[#8e8e9c] hover:bg-[#181822] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isActive ? 'bg-black/20 text-black' : 'bg-[#191924] text-[#e6ff55]'
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
              <div className="space-y-2 pt-3 border-t border-white/5 shrink-0 relative z-20">
                <button
                  type="button"
                  onClick={startQualifying}
                  className="w-full min-h-[44px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-2.5 px-3 rounded-xl text-xs tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span className="truncate">DISPUTAR GP ({currentTrack.circuit.split(' ')[0]})</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndReturnToMenu}
                  className="w-full min-h-[40px] bg-[#1e1e2d] hover:bg-[#e6ff55] hover:text-black text-[#e6ff55] font-display font-black italic uppercase py-2 px-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#e6ff55]/40 shadow-sm"
                  title="Salvar e voltar ao menu de seleção de pilotos a qualquer momento"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>SALVAR & MENU</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full min-h-[38px] bg-[#191924] hover:bg-[#222232] text-white font-display font-black italic uppercase py-2 rounded-xl text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 shadow-sm"
                    title="Abrir configurações do jogo"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#e6ff55]" />
                    <span>CONFIG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWidescreenMode(false)}
                    className="w-full min-h-[38px] py-2 bg-[#14141c] hover:bg-[#1e1e2a] text-[#8e8e9c] hover:text-white rounded-xl text-[11px] font-mono border border-white/5 transition-colors cursor-pointer text-center"
                    title="Visualizar no formato compacto de celular"
                  >
                    📱 Mobile
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* MAIN HUB CONTENT AREA (SINGLE VIEWPORT NO-SCROLL WORKSPACE) */}
          <div className={`flex-1 min-h-0 flex flex-col p-2.5 sm:p-3.5 lg:px-5 lg:py-3 overflow-hidden gap-2.5 max-w-[1560px] w-full mx-auto ${!isWidescreenMode ? 'pb-16' : 'pb-16 md:pb-3'}`}>
            
            {/* TOP BAR & CHAMPIONSHIP PROGRESS - YOUR CAREER COLLAPSIBLE PANEL */}
            {isCareerPanelMinimized ? (
              /* MINIMIZED CAREER SUMMARY BAR (DEFAULT FOR MAXIMUM WORKSPACE HEIGHT) */
              <div className="bg-[#14141c] border border-white/10 rounded-2xl px-3.5 py-2 shadow-xl flex flex-wrap items-center justify-between gap-2 transition-all shrink-0 relative z-20">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <HelmetVector primaryColor={driver.helmetColor} secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} className="w-7 h-7 shrink-0" />
                  <span className="text-[10px] font-display font-black italic uppercase px-2.5 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30 shrink-0">
                    {driver.category.toUpperCase()} · {currentTeam.name}
                  </span>
                  <h2 className="text-sm sm:text-base font-display font-black italic uppercase text-[#e6ff55] truncate">
                    {driver.name}
                  </h2>
                  <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono text-[#8e8e9c] bg-[#070709] px-3 py-1 rounded-xl border border-white/5">
                    <span>Mundial: <strong className="text-white">P{currentPlayerRank} ({playerPoints}pts)</strong></span>
                    <span>·</span>
                    <span>Média FIA: <strong className="text-[#ff5f8f]">{calculateDriverAvg(driver.attributes)}/90</strong></span>
                    <span>·</span>
                    <span>Saldo: <strong className="text-[#e6ff55]">${driver.money.toFixed(1)}M</strong></span>
                    <span>·</span>
                    <span>Treino: <strong className="text-emerald-400">{trainingPoints} XP</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {renderRaceModeToggle()}

                  <PWAInstallButton variant="header" />

                  <button
                    type="button"
                    onClick={() => setIsTutorialOpen(true)}
                    className="min-h-[38px] px-3 py-1.5 bg-[#191924] hover:bg-[#242434] text-[#e6ff55] font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-[#e6ff55]/30"
                    title="Abrir tutorial rápido de como o jogo funciona"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">TUTORIAL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCareerPanelMinimized(false)}
                    className="min-h-[38px] px-3 py-1.5 bg-[#191924] hover:bg-[#242434] text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                  >
                    <span>RESUMO & CARRO</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#e6ff55]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="min-h-[38px] px-2.5 py-1.5 bg-[#191924] hover:bg-[#242434] text-[#e6ff55] rounded-xl transition-all border border-white/10 cursor-pointer flex items-center justify-center shadow-md"
                    title="Configurações do Jogo"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndReturnToMenu}
                    className="min-h-[38px] px-3 py-1.5 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    title="Salvar e voltar ao menu de seleção de pilotos"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">SALVAR & MENU</span>
                  </button>
                </div>
              </div>
            ) : (
              /* EXPANDED CAREER PANEL */
              <div className="bg-[#14141c] border border-white/10 rounded-2xl p-3 sm:px-4 sm:py-3 shadow-xl relative z-20 overflow-hidden space-y-2.5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HelmetVector primaryColor={driver.helmetColor} secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} className="w-7 h-7 shrink-0" />
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-display font-black italic uppercase text-[#e6ff55] leading-none tracking-tight truncate">
                        CARREIRA // {driver.name}
                      </h2>
                      <span className="text-[10px] font-display font-black italic uppercase px-2.5 py-0.5 rounded-full bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/30 shrink-0">
                        {driver.category.toUpperCase()} · {currentTeam.name}
                      </span>
                      <span className="text-xs font-mono text-[#8e8e9c] hidden sm:inline">
                        · ANO {currentSeason} · ETAPA {currentRaceIndex + 1}/{catTracks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {renderRaceModeToggle()}

                    <button
                      type="button"
                      onClick={() => setIsCareerPanelMinimized(true)}
                      className="min-h-[38px] px-3 py-1.5 bg-[#070709] hover:bg-[#191924] border border-white/10 hover:border-[#e6ff55] text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-[#e6ff55]" />
                      <span>OCULTAR PAINEL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="min-h-[38px] px-2.5 py-1.5 bg-[#191924] hover:bg-[#242434] text-[#e6ff55] rounded-xl transition-all border border-white/10 cursor-pointer flex items-center justify-center shadow-md"
                      title="Configurações do Jogo"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndReturnToMenu}
                      className="min-h-[38px] px-3 py-1.5 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">SALVAR & MENU</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-2.5">
                  <div className="w-full md:w-auto md:shrink-0 bg-[#070709] border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between md:justify-start gap-3 relative overflow-hidden">
                    <div className="text-left">
                      <div className="text-[9px] font-mono text-[#8e8e9c] uppercase">{currentTeam.name}</div>
                      <div className="text-xs font-display font-black italic text-white uppercase">{driver.category.toUpperCase()} SPEC</div>
                    </div>
                    <CategoryCarVector 
                      category={driver.category} 
                      teamColor={currentTeam.color} 
                      secondaryColor="#ffffff" 
                      helmetColor={driver.helmetColor} 
                      className="w-28 sm:w-32 h-9 sm:h-10 object-contain" 
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1 w-full">
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#38bdf8] text-black flex items-center justify-center font-bold shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Mundial</div>
                        <div className="text-xs font-display font-black italic text-white truncate">
                          P{currentPlayerRank} <span className="text-[10px] text-[#38bdf8] font-normal">({playerPoints}p)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#ff5f8f] text-black flex items-center justify-center font-bold shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Média FIA</div>
                        <div className="text-xs font-display font-black italic text-white truncate">
                          {calculateDriverAvg(driver.attributes)} <span className="text-[10px] text-[#ff5f8f]">/90</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#e6ff55] text-black flex items-center justify-center font-bold shrink-0">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Saldo</div>
                        <div className="text-xs font-display font-black italic text-[#e6ff55] truncate">
                          ${driver.money.toFixed(1)}M
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => switchHubTab('treino')}
                      className="bg-[#070709] hover:border-emerald-400/50 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer transition-colors min-w-0 text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-400 text-black flex items-center justify-center font-bold shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Treino</div>
                        <div className="text-xs font-display font-black italic text-emerald-400 truncate">
                          {trainingPoints} XP
                        </div>
                      </div>
                    </button>

                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Carreira</div>
                        <div className="text-xs font-display font-black italic text-white truncate">
                          {driver.careerStats?.wins || 0}V · {driver.careerStats?.podiums || 0}Pd
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-400 text-black flex items-center justify-center font-bold shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-mono text-[#8e8e9c] leading-none">Bônus</div>
                        <div className="text-[11px] font-display font-black italic text-purple-300 truncate">
                          {currentTeam.bonusType}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait" custom={tabDirection}>
                
                {/* TAB 1: GARAGEM (2-IN-1 PAGE TOGGLE FOR ZERO OVERLAP & LARGE BUTTONS) */}
                {activeTab === 'garagem' && (
                  <motion.div 
                    key="garagem"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden"
                  >
                    {/* INTERNAL 2-IN-1 TOGGLE BAR */}
                    <div className="flex items-center justify-between gap-2 bg-[#14141c] border border-white/10 rounded-2xl p-1.5 shadow-lg shrink-0 relative z-20">
                      <button
                        type="button"
                        onClick={() => setGarageViewMode('pista_atributos')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          garageViewMode === 'pista_atributos'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Flag className="w-4 h-4" />
                        <span>Próximo GP & Atributos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGarageViewMode('equipe_saves')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          garageViewMode === 'equipe_saves'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Chassi & Capacete</span>
                      </button>
                    </div>

                    {garageViewMode === 'pista_atributos' ? (
                      /* SUB-PAGE 1: PRÓXIMA PISTA + TELEMETRIA DO PILOTO NA HORIZONTAL */
                      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                        {/* TOP SECTION: CIRCUIT TRACK HERO */}
                        <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-3.5 sm:p-4 bg-dark-grid relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 items-center shadow-xl">
                          {/* Track Info + Vector Map */}
                          <div className="lg:col-span-7 flex flex-col justify-between h-full min-h-0 gap-2">
                            <div className="flex items-center justify-between gap-2 shrink-0">
                              <div className="min-w-0">
                                <span className="text-[11px] font-mono uppercase text-[#e6ff55] font-bold block">
                                  Etapa {currentRaceIndex + 1} de {catTracks.length} · {driver.category.toUpperCase()}
                                </span>
                                <h4 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-tight truncate">
                                  {currentTrack.name} ({currentTrack.country})
                                </h4>
                                <p className="text-xs text-[#8e8e9c] font-mono truncate">{currentTrack.circuit} · {currentTrack.profileType}</p>
                              </div>
                              {(() => {
                                const wb = getWeatherBadge(currentTrack.weather);
                                return (
                                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-[#1e1e28] text-white border border-white/10 flex items-center gap-1.5 shrink-0">
                                    <span>{wb.icon}</span>
                                    <span>{wb.label}</span>
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="w-full flex-1 min-h-[75px] flex items-center justify-center bg-black/50 rounded-2xl p-2.5 border border-white/5">
                              <TrackMapVector 
                                svgPath={currentTrack.svgPath} 
                                accentColor="#e6ff55" 
                                className="w-full h-full max-h-[125px]"
                                showDirectionArrow={true}
                              />
                            </div>
                          </div>

                          {/* Track Stats + Quick Race Actions */}
                          <div className="lg:col-span-5 flex flex-col justify-between h-full gap-2.5">
                            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#8e8e9c] bg-[#070709]/90 p-3 rounded-xl border border-white/5">
                              <div>
                                <div className="text-[10px] uppercase">Exigência Retas</div>
                                <div className="text-[#38bdf8] font-bold text-sm mt-0.5">{Math.round(currentTrack.straightWeight * 100)}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-[10px] uppercase">Exigência Curvas</div>
                                <div className="text-[#ff5f8f] font-bold text-sm mt-0.5">{Math.round(currentTrack.cornerWeight * 100)}%</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase">Extensão</div>
                                <div className="text-[#e6ff55] font-bold text-sm mt-0.5">{currentTrack.laps} Voltas</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 relative z-20">
                              <button
                                type="button"
                                onClick={() => switchHubTab('calendario')}
                                className="w-full min-h-[44px] bg-[#191924] hover:bg-[#242434] text-white font-display font-black italic uppercase py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider transition-all border border-white/10 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Calendar className="w-4 h-4 text-[#e6ff55]" />
                                <span>ESTRATÉGIA & PNEUS</span>
                              </button>
                              <button
                                type="button"
                                onClick={startQualifying}
                                className="w-full min-h-[46px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Play className="w-4 h-4 fill-current" />
                                <span>DISPUTAR GP AGORA</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM SECTION: TELEMETRIA DO PILOTO NA HORIZONTAL (5 COLUNAS, SEM BOTÃO DE ABRIR CENTRO DE TREINAMENTO) */}
                        <div className="bg-[#14141c] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-xl shrink-0">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-display font-black italic uppercase text-white">
                                TELEMETRIA DO PILOTO
                              </h4>
                              <span className="text-[11px] font-mono text-[#8e8e9c] hidden sm:inline">
                                · Toque em qualquer atributo para evoluir
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#e6ff55]/15 text-[#e6ff55] font-mono text-xs font-bold border border-[#e6ff55]/30 shrink-0">
                              {trainingPoints} XP Disponível
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {[
                              { icon: Zap, key: 'speed' as const, val: driver.attributes.speed, label: 'Velocidade', bar: 'bg-[#38bdf8]', badge: 'bg-[#38bdf8]/20 text-[#38bdf8]' },
                              { icon: Flame, key: 'overtaking' as const, val: driver.attributes.overtaking, label: 'Ultrapassagem', bar: 'bg-[#e6ff55]', badge: 'bg-[#e6ff55]/20 text-[#e6ff55]' },
                              { icon: Shield, key: 'defense' as const, val: driver.attributes.defense, label: 'Defesa', bar: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
                              { icon: Activity, key: 'consistency' as const, val: driver.attributes.consistency, label: 'Controle & Chuva', bar: 'bg-[#ff5f8f]', badge: 'bg-[#ff5f8f]/20 text-[#ff5f8f]' },
                              { icon: Target, key: 'starts' as const, val: driver.attributes.starts, label: 'Largada', bar: 'bg-purple-400', badge: 'bg-purple-500/20 text-purple-400' }
                            ].map((attr) => {
                              const Icon = attr.icon;
                              const teamBonus = currentTeam.attributeBonuses?.[attr.key] || 0;
                              return (
                                <button
                                  key={attr.key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTrainAttr(attr.key);
                                    switchHubTab('treino');
                                  }}
                                  className="bg-[#070709] hover:bg-[#191924] border border-white/5 hover:border-[#e6ff55]/50 rounded-xl p-3 flex flex-col justify-between gap-2 transition-all cursor-pointer text-left relative z-20"
                                >
                                  <div className="flex items-center justify-between gap-2 w-full">
                                    <div className={`w-7 h-7 rounded-lg ${attr.badge} flex items-center justify-center shrink-0`}>
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {teamBonus > 0 && (
                                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                          +{teamBonus}
                                        </span>
                                      )}
                                      <span className="text-xl font-display font-black italic text-[#e6ff55] tabular-nums leading-none">
                                        {attr.val}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="w-full">
                                    <span className="text-[11px] font-display font-black italic uppercase text-white truncate block">
                                      {attr.label}
                                    </span>
                                    <div className="w-full h-1.5 bg-[#191924] rounded-full overflow-hidden mt-1.5">
                                      <div className={`h-full ${attr.bar}`} style={{ width: `${attr.val}%` }} />
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* SUB-PAGE 2: CHASSI & CAPACETE (SEM SLOTS E AUTOSAVES DE TEMPORADA) */
                      <div className={`flex-1 min-h-0 grid gap-3 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} overflow-hidden`}>
                        {/* LEFT 7 COLS: CHASSI & ESCUDERIA OFICIAL */}
                        <div className={`${isWidescreenMode ? 'lg:col-span-7' : ''} bg-[#14141c] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-xl min-h-0`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono uppercase text-[#8e8e9c] block">Chassi Oficial & Escuderia</span>
                              <h4 className="text-xl sm:text-2xl font-display font-black italic uppercase truncate" style={{ color: currentTeam.color }}>
                                {currentTeam.name}
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shrink-0">
                              {currentTeam.bonusType}
                            </span>
                          </div>

                          <div className="flex-1 min-h-[120px] flex items-center justify-center p-5 bg-black/50 rounded-2xl border border-white/5">
                            <CategoryCarVector 
                              category={driver.category} 
                              teamColor={currentTeam.color} 
                              helmetColor={driver.helmetColor} 
                              className="w-full h-28 sm:h-36" 
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono bg-[#070709] p-3 rounded-2xl border border-white/5">
                            <div>
                              <span className="text-[10px] text-[#8e8e9c] uppercase block">Categoria</span>
                              <strong className="text-white uppercase">{driver.category}</strong>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] text-[#8e8e9c] uppercase block">Acerto Base</span>
                              <strong className="text-[#38bdf8]">{currentTeam.bonusType}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-[#8e8e9c] uppercase block">Temporada</span>
                              <strong className="text-[#e6ff55]">Ano {currentSeason}</strong>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT 5 COLS: PINTURA & PERSONALIZAÇÃO DO CAPACETE */}
                        <div className={`${isWidescreenMode ? 'lg:col-span-5' : ''} bg-[#14141c] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-xl min-h-0`}>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#8e8e9c] block">Identidade Visual na Pista</span>
                            <h4 className="text-lg sm:text-xl font-display font-black italic uppercase text-white">
                              PINTURA DO CAPACETE
                            </h4>
                          </div>

                          <div className="flex-1 min-h-[110px] bg-black/50 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center gap-2">
                            <HelmetVector 
                              primaryColor={driver.helmetColor} 
                              secondaryColor={driver.helmetSecondaryColor || '#1e3a8a'} 
                              className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" 
                            />
                            <span className="text-[11px] font-mono text-[#8e8e9c]">
                              Piloto: <strong className="text-white">{driver.name}</strong>
                            </span>
                          </div>

                          {/* Helmet Customizer with Large Click Targets */}
                          <div className="grid grid-cols-2 gap-3 relative z-20 shrink-0">
                            <label className="min-h-[52px] flex items-center justify-between gap-2.5 bg-[#070709] px-3.5 py-2.5 rounded-2xl border border-white/10 cursor-pointer hover:border-[#e6ff55] transition-colors">
                              <div className="min-w-0">
                                <span className="text-xs font-display font-black italic uppercase text-white block">Cor Principal</span>
                                <span className="text-[10px] font-mono text-[#8e8e9c] uppercase">{driver.helmetColor}</span>
                              </div>
                              <input 
                                type="color" 
                                value={driver.helmetColor}
                                onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetColor: e.target.value }))}
                                className="w-9 h-9 bg-transparent cursor-pointer rounded shrink-0"
                                title="Cor Principal" 
                              />
                            </label>
                            <label className="min-h-[52px] flex items-center justify-between gap-2.5 bg-[#070709] px-3.5 py-2.5 rounded-2xl border border-white/10 cursor-pointer hover:border-[#e6ff55] transition-colors">
                              <div className="min-w-0">
                                <span className="text-xs font-display font-black italic uppercase text-white block">Cor Secundária</span>
                                <span className="text-[10px] font-mono text-[#8e8e9c] uppercase">{driver.helmetSecondaryColor || '#1e3a8a'}</span>
                              </div>
                              <input 
                                type="color" 
                                value={driver.helmetSecondaryColor || '#1e3a8a'}
                                onChange={(e) => updateActiveDriver(prev => ({ ...prev, helmetSecondaryColor: e.target.value }))}
                                className="w-9 h-9 bg-transparent cursor-pointer rounded shrink-0"
                                title="Cor Secundária" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 2: TREINAMENTO (5 ATRIBUTOS NA HORIZONTAL EM AJUSTES RÁPIDOS) */}
                {activeTab === 'treino' && (
                  <motion.div 
                    key="treino"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden"
                  >
                    {/* COMPACT TOP HEADER BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#14141c] border border-white/10 rounded-2xl px-4 py-2.5 shadow-lg shrink-0">
                      <div>
                        <h3 className="text-base sm:text-lg font-display font-black italic uppercase text-[#e6ff55] leading-none">
                          CENTRO DE EVOLUÇÃO DO PILOTO
                        </h3>
                        <p className="text-[11px] text-[#8e8e9c] font-mono mt-0.5">
                          Distribua XP entre seus atributos respeitando o teto regulamentar de média 90 da FIA.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                          XP Disponível: {trainingPoints} XP
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-[#ff5f8f]/15 text-[#ff5f8f] border border-[#ff5f8f]/30 font-bold">
                          Média FIA: {calculateDriverAvg(driver.attributes)} / 90
                        </span>
                      </div>
                    </div>

                    {/* TOP FOCUS DIAL PANEL (COMPACT HORIZONTAL) */}
                    {(() => {
                      const attrKey = selectedTrainAttr;
                      const val = driver.attributes[attrKey];
                      const cost = getUpgradeCost(val);
                      const currentSum = driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts;
                      const isCapReached = currentSum >= 450;
                      const bonus = currentTeam.attributeBonuses?.[attrKey] || 0;
                      const effectiveVal = Math.min(99, val + bonus);

                      const attrLabels = {
                        speed: 'VELOCIDADE EM RETAS',
                        overtaking: 'ULTRAPASSAGEM (ATAQUE)',
                        defense: 'DEFESA DE POSIÇÃO',
                        consistency: 'CONTROLE & CHUVA',
                        starts: 'LARGADA & REAÇÃO'
                      };

                      return (
                        <div className="bg-[#14141c] border border-white/5 rounded-2xl p-3.5 sm:px-5 shadow-xl shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center relative z-20">
                          {/* Attribute Selector Pills */}
                          <div className="lg:col-span-4 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8e8e9c] block">
                              Foco Selecionado: <strong className="text-[#e6ff55]">{attrLabels[attrKey]}</strong>
                            </span>
                            <div className="grid grid-cols-5 gap-1 p-1 bg-[#070709] rounded-xl border border-white/5">
                              {[
                                { key: 'speed' as const, label: 'Vel.' },
                                { key: 'overtaking' as const, label: 'Ultrap.' },
                                { key: 'defense' as const, label: 'Defesa' },
                                { key: 'consistency' as const, label: 'Chuva' },
                                { key: 'starts' as const, label: 'Largada' },
                              ].map(tab => (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() => setSelectedTrainAttr(tab.key)}
                                  className={`min-h-[36px] py-1.5 text-[11px] font-display font-black italic uppercase rounded-lg transition-all cursor-pointer truncate px-1 ${
                                    selectedTrainAttr === tab.key
                                      ? 'bg-[#e6ff55] text-black shadow-md'
                                      : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Center Dial Controls */}
                          <div className="lg:col-span-4 flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={() => downgradeAttribute(attrKey)}
                              disabled={val <= 40}
                              className="w-12 h-12 rounded-2xl bg-[#1e1e28] hover:bg-[#282836] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center font-bold text-xl transition-all cursor-pointer border border-white/10 shadow-md"
                              title="Reduzir atributo"
                            >
                              −
                            </button>

                            <div className="flex flex-col items-center min-w-[100px]">
                              <span className="text-4xl sm:text-5xl font-display font-black italic text-[#e6ff55] tracking-tighter leading-none tabular-nums">
                                {val}
                              </span>
                              <span className="text-[10px] font-mono text-[#8e8e9c] mt-1">
                                Custo: <strong className="text-[#e6ff55]">{cost} XP</strong>
                                {bonus > 0 ? ` · +${bonus} Eq. (${effectiveVal})` : ''}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => upgradeAttribute(attrKey)}
                              disabled={trainingPoints < cost || val >= 99 || isCapReached}
                              className="w-12 h-12 rounded-2xl bg-[#e6ff55] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed text-black flex items-center justify-center font-bold text-xl transition-all cursor-pointer shadow-lg shadow-[#e6ff55]/20"
                              title={isCapReached ? "Teto FIA 90 atingido!" : "Evoluir atributo"}
                            >
                              +
                            </button>
                          </div>

                          {/* Right Actions */}
                          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2">
                            {(['speed', 'overtaking', 'defense', 'consistency', 'starts'] as const).some(
                              k => driver.attributes[k] > (driver.lockedAttributes?.[k] ?? driver.attributes[k])
                            ) && (
                              <button
                                type="button"
                                onClick={resetPendingUpgrades}
                                className="w-full min-h-[38px] py-2 px-3 bg-[#191924] hover:bg-[#252535] text-amber-400 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-400/30"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Desfazer gastos desta etapa</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => switchHubTab('calendario')}
                              className="w-full min-h-[42px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-[#e6ff55]/20 cursor-pointer block text-center"
                            >
                              CONFIRMAR & IR PARA ESTRATÉGIA
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* BOTTOM SECTION: AJUSTE RÁPIDO DOS 5 ATRIBUTOS NA HORIZONTAL (5 COLUNAS LADO A LADO) */}
                    <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 overflow-y-auto lg:overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                        <h4 className="text-xs sm:text-sm font-display font-black italic uppercase text-white">
                          AJUSTE RÁPIDO DOS 5 ATRIBUTOS (HORIZONTAL)
                        </h4>
                        <span className="text-xs font-mono text-[#e6ff55] font-bold shrink-0">
                          Soma Total: {driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts} / 450
                        </span>
                      </div>

                      <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {([
                          { icon: Zap, key: 'speed' as const, label: 'Velocidade em Retas', shortLabel: 'Velocidade', color: 'bg-[#38bdf8]', badge: 'bg-[#38bdf8]/20 text-[#38bdf8]' },
                          { icon: Flame, key: 'overtaking' as const, label: 'Ultrapassagem', shortLabel: 'Ultrapassagem', color: 'bg-[#e6ff55]', badge: 'bg-[#e6ff55]/20 text-[#e6ff55]' },
                          { icon: Shield, key: 'defense' as const, label: 'Defesa de Posição', shortLabel: 'Defesa', color: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
                          { icon: Activity, key: 'consistency' as const, label: 'Controle & Chuva', shortLabel: 'Controle & Chuva', color: 'bg-[#ff5f8f]', badge: 'bg-[#ff5f8f]/20 text-[#ff5f8f]' },
                          { icon: Target, key: 'starts' as const, label: 'Largada & Reação', shortLabel: 'Largada', color: 'bg-purple-400', badge: 'bg-purple-500/20 text-purple-400' }
                        ]).map(item => {
                          const Icon = item.icon;
                          const val = driver.attributes[item.key];
                          const bonus = currentTeam.attributeBonuses?.[item.key] || 0;
                          const cost = getUpgradeCost(val);
                          const currentSum = driver.attributes.speed + driver.attributes.overtaking + driver.attributes.defense + driver.attributes.consistency + driver.attributes.starts;
                          const isCapReached = currentSum >= 450;

                          return (
                            <div 
                              key={item.key}
                              onClick={() => setSelectedTrainAttr(item.key)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                selectedTrainAttr === item.key
                                  ? 'bg-[#1e1e2c] border-[#e6ff55] ring-1 ring-[#e6ff55]/40 shadow-lg'
                                  : 'bg-[#070709] border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className={`w-8 h-8 rounded-xl ${item.badge} flex items-center justify-center shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  {bonus > 0 ? (
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg font-bold shrink-0">
                                      +{bonus} Eq.
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-[#8e8e9c]">
                                      {cost} XP
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <span className="text-xs font-display font-black italic uppercase text-white block leading-tight">
                                    {item.shortLabel}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#8e8e9c] block mt-0.5">
                                    Custo próx.: {cost} XP
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-center">
                                  <span className="text-3xl font-display font-black italic text-[#e6ff55] tabular-nums leading-none">
                                    {val}
                                  </span>
                                </div>

                                <div className="w-full h-2 bg-[#191924] rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} transition-all duration-300`} style={{ width: `${val}%` }} />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 relative z-20">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); downgradeAttribute(item.key); }}
                                    disabled={val <= 40}
                                    className="min-h-[40px] rounded-xl bg-[#191924] hover:bg-[#282838] disabled:opacity-30 text-white font-mono font-bold text-lg flex items-center justify-center cursor-pointer border border-white/10"
                                  >
                                    −
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); upgradeAttribute(item.key); }}
                                    disabled={trainingPoints < cost || val >= 99 || isCapReached}
                                    className="min-h-[40px] rounded-xl bg-[#e6ff55] hover:brightness-110 disabled:opacity-30 text-black font-mono font-bold text-lg flex items-center justify-center cursor-pointer shadow-md"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: METAS DE PATROCÍNIO & CONQUISTAS DE CARREIRA (ROLAGEM INTERNA SOMENTE NA LISTA, CARDS AMPLOS E COMPLETOS) */}
                {activeTab === 'patrocinio' && (
                  <motion.div 
                    key="patrocinio"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden"
                  >
                    {/* TOP TOGGLE SWITCH + SUMMARY KPI BAR COMBINED (FIXO FORA DA ROLAGEM) */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 bg-[#14141c] border border-white/10 rounded-2xl p-2 shadow-lg shrink-0 relative z-20">
                      <div className="flex items-center gap-2 bg-[#070709] p-1 rounded-xl border border-white/5 flex-1">
                        <button
                          type="button"
                          onClick={() => setGoalsViewMode('metas')}
                          className={`flex-1 min-h-[42px] py-2 px-3 rounded-lg text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            goalsViewMode === 'metas'
                              ? 'bg-[#e6ff55] text-black shadow-md'
                              : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>Metas da Temporada ({currentSeason})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoalsViewMode('milestones')}
                          className={`flex-1 min-h-[42px] py-2 px-3 rounded-lg text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            goalsViewMode === 'milestones'
                              ? 'bg-[#e6ff55] text-black shadow-md'
                              : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          <span>Marcos de Carreira</span>
                          {claimableMilestonesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff5f8f] text-white animate-pulse">
                              +{claimableMilestonesCount}
                            </span>
                          )}
                        </button>
                      </div>

                      {goalsViewMode === 'metas' ? (
                        <div className="grid grid-cols-3 gap-2 shrink-0">
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Salário/GP</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#38bdf8] tabular-nums">
                              +${(() => {
                                const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                return goals.reduce((acc, g) => acc + (g.perRaceRetainer || 0), 0).toFixed(2);
                              })()}M
                            </div>
                          </div>
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">XP Final</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#ff5f8f] tabular-nums">
                              +{(() => {
                                const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                return goals.reduce((acc, g) => acc + g.rewardXp, 0);
                              })()} XP
                            </div>
                          </div>
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Concluídas</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#e6ff55] tabular-nums">
                              {(() => {
                                const goals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                                return goals.filter(g => g.isCompleted || (g.currentProgress || 0) >= g.targetValue).length;
                              })()}/6
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 shrink-0">
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Concluídas</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#e6ff55] tabular-nums">
                              {(driver.claimedMilestones || []).length} / {CAREER_MILESTONES.length}
                            </div>
                          </div>
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Disponíveis</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#ff5f8f] tabular-nums">
                              {claimableMilestonesCount}
                            </div>
                          </div>
                          <div className="bg-[#191924] px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <div className="text-[9px] text-[#8e8e9c] font-mono uppercase">Bônus Ganho</div>
                            <div className="text-xs sm:text-sm font-display font-black italic text-[#38bdf8] tabular-nums">
                              ${CAREER_MILESTONES.filter(m => (driver.claimedMilestones || []).includes(m.id)).reduce((acc, m) => acc + m.rewardMoney, 0).toFixed(1)}M
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {goalsViewMode === 'metas' ? (
                      /* LISTA INTERNA ROLÁVEL DE METAS ANUAIS (CARDS ESPAÇADOS COM TEXTOS COMPLETOS) */
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 pb-3 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                        {(() => {
                          const allGoals = driver.seasonGoals && driver.seasonGoals.length === 6 ? driver.seasonGoals : getInitialSeasonGoals();
                          return allGoals.map((goal, gIdx) => {
                            const currentVal = goal.currentProgress || 0;
                            const targetVal = goal.targetValue;
                            const isDone = goal.isCompleted || currentVal >= targetVal;
                            const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));
                            const diffMeta = goal.difficulty === 'facil'
                              ? { label: '🟢 Fácil', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
                              : goal.difficulty === 'media'
                              ? { label: '🟡 Média', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
                              : { label: '👑 Difícil', cls: 'bg-[#ff5f8f]/20 text-[#ff5f8f] border-[#ff5f8f]/30' };

                            return (
                              <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: gIdx * 0.03 }}
                                className={`bg-[#14141c] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-lg relative ${
                                  isDone 
                                    ? 'border-[#e6ff55] shadow-[#e6ff55]/10' 
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="text-2xl p-2.5 bg-[#070709] rounded-xl border border-white/5 shrink-0">
                                        {goal.logo}
                                      </span>
                                      <div className="min-w-0">
                                        <h5 className="font-display font-black italic uppercase text-white text-sm sm:text-base leading-snug">
                                          {goal.name}
                                        </h5>
                                        <span className="text-xs text-[#e6ff55] uppercase font-mono font-bold block mt-0.5">
                                          {goal.title}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${diffMeta.cls}`}>
                                      {diffMeta.label}
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                    {goal.description}
                                  </p>

                                  <div className="space-y-1.5 bg-[#070709] p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between text-xs font-mono">
                                      <span className="text-[#8e8e9c]">Progresso na Temporada</span>
                                      <span className="font-bold text-[#e6ff55]">
                                        {currentVal} / {targetVal} ({progressPct}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-[#1e1e28] h-2 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 ${isDone ? 'bg-[#e6ff55]' : 'bg-[#38bdf8]'}`}
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
                                  <span className="text-[#8e8e9c]">
                                    Fixo por GP: <strong className="text-[#38bdf8]">+${goal.perRaceRetainer?.toFixed(2) || '0.10'}M</strong>
                                  </span>
                                  <div className="flex items-center gap-2 bg-[#070709] px-3 py-1.5 rounded-xl border border-white/5">
                                    <span className="text-[#e6ff55] font-bold">Bônus: +${goal.rewardMoney.toFixed(2)}M</span>
                                    <span className="text-[#8e8e9c]">·</span>
                                    <span className="text-[#ff5f8f] font-bold">+{goal.rewardXp} XP</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      /* LISTA INTERNA ROLÁVEL DE MARCOS DE CARREIRA (CARDS AMPLOS E TEXTOS COMPLETOS) */
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 pb-3 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                        {CAREER_MILESTONES.map((m, idx) => {
                          const currentVal = getMilestoneCurrentValue(m, driver);
                          const isCompleted = currentVal >= m.targetValue;
                          const isClaimed = (driver.claimedMilestones || []).includes(m.id);
                          const canClaim = isCompleted && !isClaimed;
                          const progressPct = Math.min(100, Math.round((currentVal / m.targetValue) * 100));

                          return (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 relative ${
                                isClaimed
                                  ? 'bg-[#0e0e14] border-emerald-500/20 opacity-85'
                                  : canClaim
                                  ? 'bg-[#1e1e2d] border-[#e6ff55] ring-2 ring-[#e6ff55]/30 shadow-lg shadow-[#e6ff55]/10'
                                  : 'bg-[#14141c] border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                                    {m.categoryTag}
                                  </span>
                                  <span className="text-xs sm:text-sm font-display font-black italic text-[#e6ff55] bg-[#070709] px-3 py-1 rounded-xl border border-white/5">
                                    +${m.rewardMoney.toFixed(1)}M · +{m.rewardXp} XP
                                  </span>
                                </div>

                                <h4 className="text-sm sm:text-base font-display font-black italic uppercase text-white leading-snug">
                                  {m.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                  {m.description}
                                </p>
                              </div>

                              <div className="space-y-3 shrink-0 relative z-20">
                                <div className="space-y-1.5 bg-[#070709] p-3 rounded-xl border border-white/5">
                                  <div className="flex items-center justify-between text-xs font-mono text-[#8e8e9c]">
                                    <span>Progresso: <strong className="text-white">{currentVal} / {m.targetValue}</strong></span>
                                    <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-[#e6ff55] font-bold'}>{progressPct}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-[#14141c] rounded-full overflow-hidden border border-white/5">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isClaimed ? 'bg-emerald-500' : isCompleted ? 'bg-[#e6ff55]' : 'bg-[#38bdf8]'
                                      }`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>

                                {canClaim ? (
                                  <button
                                    type="button"
                                    onClick={() => claimMilestoneReward(m.id)}
                                    className="w-full min-h-[44px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    <Gift className="w-4 h-4 fill-current" />
                                    <span>RESGATAR BÔNUS AGORA</span>
                                  </button>
                                ) : isClaimed ? (
                                  <div className="w-full min-h-[42px] py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" />
                                    <span>CONQUISTA RESGATADA</span>
                                  </div>
                                ) : (
                                  <div className="w-full min-h-[42px] py-2 bg-[#070709] border border-white/5 rounded-xl text-center text-xs font-mono text-[#8e8e9c] flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    <span>EM PROGRESSO</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: CORRIDA & CALENDÁRIO (ROLAGEM NORMAL EM PREPARAÇÃO & BOTÃO DE INICIAR CORRIDA NO COMEÇO) */}
                {activeTab === 'calendario' && (
                  <motion.div 
                    key="calendario"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden"
                  >
                    {/* INTERNAL 2-IN-1 TOGGLE BAR */}
                    <div className="flex items-center justify-between gap-2 bg-[#14141c] border border-white/10 rounded-2xl p-1.5 shadow-lg shrink-0 relative z-20">
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('preparacao')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          calendarViewMode === 'preparacao'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Flame className="w-4 h-4" />
                        <span>Preparação & Estratégia (Etapa {currentRaceIndex + 1})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('etapas')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          calendarViewMode === 'etapas'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Calendário Completo ({catTracks.length} Etapas)</span>
                      </button>
                    </div>

                    {calendarViewMode === 'preparacao' ? (
                      /* SUB-PAGE 1: PREPARAÇÃO & ESTRATÉGIA COM BOTÃO DE INICIAR CORRIDA NO COMEÇO E ROLAGEM NORMAL */
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 pb-4 flex flex-col gap-3.5">
                        {/* TOP CTA: BOTÃO DE INICIAR CORRIDA LOGO NO COMEÇO */}
                        <div className="bg-[#14141c] border border-[#e6ff55]/40 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 relative z-20">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/30">
                                Etapa {currentRaceIndex + 1}/{catTracks.length} · {currentTrack.name}
                              </span>
                              <span className="text-xs font-mono text-[#8e8e9c]">
                                Pneu: <strong className="text-white">{startingTire}</strong> · Ritmo: <strong className="text-white uppercase">{drivingStyle}</strong> · Pit: <strong className="text-white uppercase">{autoPitMode}</strong>
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-display font-black italic uppercase text-white mt-1">
                              TUDO PRONTO NO BOX PARA A LARGADA ({currentTrack.laps} VOLTAS)
                            </h4>
                          </div>

                          <button 
                            type="button"
                            onClick={startQualifying}
                            className="min-h-[52px] px-6 py-3 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase rounded-2xl text-sm sm:text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/25 flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
                          >
                            <Play className="w-5 h-5 fill-current" />
                            <span>INICIAR CORRIDA ({currentTrack.laps} VOLTAS)</span>
                          </button>
                        </div>

                        <div className={`grid gap-3.5 ${isWidescreenMode ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
                          {/* LEFT 5 COLS: TRACK OVERVIEW & ENGINEER TIP */}
                          <div className={`${isWidescreenMode ? 'lg:col-span-5' : ''} bg-[#14141c] border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-3.5 shadow-xl`}>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] uppercase font-mono font-bold text-[#e6ff55]">
                                  ETAPA {currentRaceIndex + 1} DE {catTracks.length} · {driver.category.toUpperCase()}
                                </span>
                                {(() => {
                                  const wb = getWeatherBadge(currentTrack.weather);
                                  return (
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                                      <span>{wb.icon}</span>
                                      <span>{wb.label}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                              <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white tracking-tight">
                                {currentTrack.name}
                              </h3>
                              <p className="text-[#8e8e9c] text-xs font-mono">{currentTrack.circuit} · {currentTrack.country}</p>
                            </div>

                            <div className="min-h-[120px] bg-[#070709] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                              <TrackMapVector svgPath={currentTrack.svgPath} accentColor={currentTeam.color} className="w-full h-28 sm:h-32" />
                              <div className="flex flex-wrap justify-center gap-3 text-xs font-mono text-[#8e8e9c] mt-3">
                                <span>Retas: <strong className="text-[#38bdf8]">{Math.round(currentTrack.straightWeight * 100)}%</strong></span>
                                <span>·</span>
                                <span>Curvas: <strong className="text-[#ff5f8f]">{Math.round(currentTrack.cornerWeight * 100)}%</strong></span>
                                <span>·</span>
                                <span>Voltas: <strong className="text-[#e6ff55]">{currentTrack.laps}v</strong></span>
                              </div>
                            </div>

                            {(() => {
                              const tireAdvice = getTeamTireAdvice(currentTrack);
                              return (
                                <div className="bg-[#191924] border border-white/5 rounded-2xl p-3.5 flex items-center gap-3 shrink-0">
                                  <div className="p-2.5 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl shrink-0">
                                    <Headphones className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="text-[10px] font-display font-black italic uppercase text-[#e6ff55]">
                                        ENGENHEIRO CHEFE
                                      </span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${tireAdvice.badgeStyle}`}>
                                        Ideal: Pneu {tireAdvice.recommendedTire}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                      "{tireAdvice.reason}"
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* RIGHT 7 COLS: LARGE TIRE BUTTONS + PACE & PIT TOGGLES */}
                          <div className={`${isWidescreenMode ? 'lg:col-span-7' : ''} bg-[#14141c] border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xl relative z-20`}>
                            {/* 1. TIRE COMPOUND SELECTION (SECO + CHUVA LEVE & PESADA) */}
                            {(() => {
                              const tireDurability = getTireDurabilityDetails(currentTrack);
                              const allTires: {
                                id: TireCompound;
                                badge: string;
                                color: string;
                                title: string;
                                info: typeof tireDurability.Macio;
                              }[] = [
                                {
                                  id: 'Macio',
                                  badge: 'S',
                                  color: 'border-red-500 text-red-400 bg-red-500/10',
                                  title: 'Macio',
                                  info: tireDurability.Macio
                                },
                                {
                                  id: 'Médio',
                                  badge: 'M',
                                  color: 'border-[#e6ff55] text-[#e6ff55] bg-[#e6ff55]/10',
                                  title: 'Médio',
                                  info: tireDurability.Médio
                                },
                                {
                                  id: 'Duro',
                                  badge: 'H',
                                  color: 'border-slate-200 text-white bg-slate-200/10',
                                  title: 'Duro',
                                  info: tireDurability.Duro
                                },
                                {
                                  id: 'Chuva Leve',
                                  badge: 'CL',
                                  color: 'border-emerald-400 text-emerald-300 bg-emerald-500/15',
                                  title: 'Chuva Leve',
                                  info: tireDurability['Chuva Leve']
                                },
                                {
                                  id: 'Chuva Pesada',
                                  badge: 'CP',
                                  color: 'border-blue-400 text-blue-300 bg-blue-500/15',
                                  title: 'Chuva Pesada',
                                  info: tireDurability['Chuva Pesada']
                                }
                              ];

                              return (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <span className="text-xs font-display font-black italic uppercase text-white tracking-wider">
                                      1. PNEU DE LARGADA (SECO & CHUVA LEVE / PESADA)
                                    </span>
                                    <span className="text-[11px] font-mono text-[#8e8e9c]">
                                      {raceMode === 'estrategico' ? 'Modo Estratégico (1-2 min · 1-2 paradas)' : 'Modo Rápido · Troca auto < 25%'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {allTires.map(t => {
                                      const isSelected = startingTire === t.id;
                                      const isOpt = t.info.isOptimal;

                                      return (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() => handleSelectStartingTire(t.id)}
                                          className={`min-h-[90px] p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            isSelected
                                              ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/40 shadow-lg'
                                              : isOpt
                                              ? 'bg-[#191924] border-[#e6ff55]/40 hover:bg-[#222230]'
                                              : 'bg-[#191924] border-white/10 hover:bg-[#222230]'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-black shrink-0 ${t.color}`}>
                                              {t.badge}
                                            </span>
                                            {isOpt && (
                                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40 font-mono font-bold shrink-0">
                                                ★ IDEAL
                                              </span>
                                            )}
                                          </div>

                                          <div className="mt-1">
                                            <div className="text-xs font-display font-black italic uppercase text-white leading-tight">
                                              {t.title}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-300 font-bold mt-0.5">
                                              ~{t.info.minLaps}-{t.info.maxLaps}v
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Pre-select Next Pit Stop Tire */}
                                  <div className="bg-[#070709] p-2.5 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[11px] font-mono text-[#8e8e9c]">
                                      Pneu programado p/ 1º Pit Stop (pode mudar durante a corrida):
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {allTires.map(t => (
                                        <button
                                          key={`next-${t.id}`}
                                          type="button"
                                          onClick={() => handleSelectNextPitTire(t.id)}
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-all ${
                                            nextPitTire === t.id
                                              ? 'bg-[#e6ff55] text-black border-[#e6ff55]'
                                              : 'bg-[#14141c] text-slate-300 border-white/10 hover:border-white/30'
                                          }`}
                                        >
                                          {t.title}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 2. DRIVING PACE & PIT MODE LARGE BUTTON TOGGLES */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                                <span className="block text-[11px] font-display font-black italic uppercase text-slate-300">
                                  2. RITMO INICIAL DE PILOTAGEM
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                  {([
                                    { id: 'conservador', label: 'Poupar' },
                                    { id: 'equilibrado', label: 'Normal' },
                                    { id: 'agressivo', label: 'Ataque' }
                                  ] as const).map(st => (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => setDrivingStyle(st.id)}
                                      className={`min-h-[42px] py-2 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer border transition-all ${
                                        drivingStyle === st.id
                                          ? 'bg-[#e6ff55] text-black border-[#e6ff55] shadow-md'
                                          : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:text-white'
                                      }`}
                                    >
                                      {st.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                                <span className="block text-[11px] font-display font-black italic uppercase text-slate-300">
                                  3. POSTURA NO PIT STOP
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                  {([
                                    { id: 'conservador', label: 'Seguro (3.0s)' },
                                    { id: 'arriscado', label: 'Rápido (1.8s)' }
                                  ] as const).map(pm => (
                                    <button
                                      key={pm.id}
                                      type="button"
                                      onClick={() => setAutoPitMode(pm.id)}
                                      className={`min-h-[42px] py-2 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer border transition-all ${
                                        autoPitMode === pm.id
                                          ? 'bg-[#e6ff55] text-black border-[#e6ff55] shadow-md'
                                          : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:text-white'
                                      }`}
                                    >
                                      {pm.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* SUB-PAGE 2: CALENDÁRIO COMPLETO DAS 10 ETAPAS (5x2 SPACIOUS GRID) */
                      <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-3 overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                          <div>
                            <h3 className="text-sm sm:text-base font-display font-black italic uppercase text-[#e6ff55]">
                              CALENDÁRIO OFICIAL DA TEMPORADA ({catTracks.length} ETAPAS)
                            </h3>
                            <p className="text-xs font-mono text-[#8e8e9c]">
                              Apenas os 3 primeiros do campeonato ao final das {catTracks.length} etapas sobem de categoria.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCalendarViewMode('preparacao')}
                            className="min-h-[38px] px-3.5 py-1.5 bg-[#e6ff55] text-black font-display font-black italic uppercase text-xs rounded-xl cursor-pointer shrink-0"
                          >
                            Voltar p/ Estratégia
                          </button>
                        </div>

                        <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-5 gap-2.5 overflow-y-auto lg:overflow-hidden">
                          {catTracks.map((tr, idx) => {
                            const trWb = getWeatherBadge(tr.weather);
                            const isCurrent = idx === currentRaceIndex;
                            const isPast = idx < currentRaceIndex;
                            return (
                              <div 
                                key={tr.id}
                                className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                                  isCurrent 
                                    ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/30 text-white shadow-lg' 
                                    : isPast 
                                    ? 'bg-[#070709]/60 border-white/5 text-[#8e8e9c] opacity-70' 
                                    : 'bg-[#070709] border-white/5 text-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-mono font-bold text-[#e6ff55]">
                                      ETAPA {idx + 1}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono shrink-0 ${trWb.badgeClass}`}>
                                      {trWb.icon} {trWb.label}
                                    </span>
                                  </div>
                                  <h4 className="font-display font-black italic uppercase text-sm text-white truncate">
                                    {tr.name}
                                  </h4>
                                  <p className="text-[11px] font-mono text-[#8e8e9c] truncate">{tr.circuit}</p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-white/5 mt-2">
                                  <span className="text-slate-300 font-bold">{tr.laps} Voltas</span>
                                  {isCurrent ? (
                                    <span className="text-[10px] text-black font-display font-black italic uppercase px-2 py-0.5 rounded-full bg-[#e6ff55]">
                                      ATUAL
                                    </span>
                                  ) : isPast ? (
                                    <span className="text-[10px] text-emerald-400 font-mono">✓ CONCLUÍDA</span>
                                  ) : (
                                    <span className="text-[10px] text-[#8e8e9c]">FUTURA</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 5: CLASSIFICAÇÃO (3-WAY TOGGLE: PILOTOS / CONSTRUTORES / HISTÓRICO) */}
                {activeTab === 'classificacao' && (
                  <motion.div 
                    key="classificacao"
                    custom={tabDirection}
                    variants={hubTabSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden"
                  >
                    {/* TOP 3-WAY TOGGLE SWITCH */}
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-[#14141c] rounded-2xl border border-white/10 shadow-lg shrink-0 relative z-20">
                      <button
                        type="button"
                        onClick={() => setChampionshipViewMode('pilotos')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          championshipViewMode === 'pilotos'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Pilotos (20)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChampionshipViewMode('construtores')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          championshipViewMode === 'construtores'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Construtores (10)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setChampionshipViewMode('historico')}
                        className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          championshipViewMode === 'historico'
                            ? 'bg-[#e6ff55] text-black shadow-md'
                            : 'text-[#8e8e9c] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <History className="w-4 h-4" />
                        <span>Histórico de Carreira</span>
                      </button>
                    </div>

                    {championshipViewMode === 'pilotos' ? (
                      /* SUB-PAGE 1: 20 PILOTOS EM GRADE 4x5 LARGURA TOTAL SEM ROLAGEM */
                      <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-2.5 overflow-hidden">
                        <div className="flex items-center justify-between shrink-0">
                          <h3 className="text-sm sm:text-base font-display font-black italic uppercase text-white tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-[#e6ff55]" />
                            MUNDIAL DE PILOTOS ({driver.category.toUpperCase()} · TEMPORADA {currentSeason})
                          </h3>
                          <span className="text-xs font-mono text-[#e6ff55] font-bold px-3 py-1 rounded-full bg-[#e6ff55]/10 border border-[#e6ff55]/30">
                            Zona de Promoção: Top 3
                          </span>
                        </div>
                        <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-4 gap-2 overflow-y-auto lg:overflow-hidden font-mono text-xs content-between">
                          {sortedSeasonStandings.map((ds, idx) => {
                            const isTop3 = idx < 3;
                            const isPlayer = ds.driverName === driver.name;
                            const tm = TEAMS.find(t => t.id === ds.teamId);
                            return (
                              <div 
                                key={ds.driverName} 
                                className={`px-3 py-2 rounded-xl border flex items-center justify-between transition-all ${
                                  isPlayer 
                                    ? 'bg-[#1e1e2c] border-[#e6ff55] ring-1 ring-[#e6ff55]/40 text-white font-bold shadow-md' 
                                    : isTop3 
                                    ? 'bg-[#191924] border-[#ff5f8f]/40 text-white' 
                                    : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-6 font-bold tabular-nums shrink-0 ${isTop3 ? 'text-[#e6ff55]' : 'text-[#8e8e9c]'}`}>
                                    #{idx + 1}
                                  </span>
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tm?.color || '#38bdf8' }} />
                                  <span className={`truncate ${isPlayer ? 'text-[#e6ff55]' : 'text-white'}`}>{ds.driverName}</span>
                                </div>
                                <span className="text-[#e6ff55] font-bold tabular-nums shrink-0 ml-2">
                                  {ds.points}p <span className="text-[10px] text-[#8e8e9c]">({ds.wins}V)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : championshipViewMode === 'construtores' ? (
                      /* SUB-PAGE 2: 10 CONSTRUTORES EM GRADE 2x5 ESPAÇADA */
                      <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col justify-between gap-2.5 overflow-hidden">
                        <div className="flex items-center justify-between shrink-0">
                          <h3 className="text-sm sm:text-base font-display font-black italic uppercase text-white tracking-wider flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#38bdf8]" />
                            MUNDIAL DE CONSTRUTORES ({driver.category.toUpperCase()})
                          </h3>
                          <span className="text-xs font-mono text-[#38bdf8] font-bold">
                            Sua Equipe: {currentTeam.name}
                          </span>
                        </div>
                        <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto lg:overflow-hidden font-mono text-xs content-between">
                          {[...constructorStandings].sort((a, b) => b.points - a.points).map((cs, idx) => {
                            const t = TEAMS.find(x => x.id === cs.teamId)!;
                            const isPlayerTeam = t?.id === driver.teamId;
                            return (
                              <div 
                                key={cs.teamId} 
                                className={`px-4 py-3 rounded-2xl border flex items-center justify-between ${
                                  isPlayerTeam
                                    ? 'bg-[#1e1e2c] border-[#38bdf8] ring-1 ring-[#38bdf8]/40 text-white font-bold shadow-md'
                                    : 'bg-[#070709] border-white/5 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm font-display font-black italic text-[#8e8e9c] w-6">#{idx + 1}</span>
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t?.color }} />
                                  <div className="min-w-0">
                                    <span className="text-sm font-display font-black italic uppercase truncate block" style={{ color: t?.color }}>
                                      {t?.name}
                                    </span>
                                    <span className="text-[10px] text-[#8e8e9c] block">{t?.bonusType}</span>
                                  </div>
                                </div>
                                <span className="text-[#38bdf8] text-sm font-bold tabular-nums shrink-0 ml-2">
                                  {cs.points} pts ({cs.wins}V)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* SUB-PAGE 3: HISTÓRICO DE CARREIRA */
                      <div className="flex-1 min-h-0 bg-[#14141c] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-2 shrink-0">
                          <div>
                            <h3 className="text-sm sm:text-base font-display font-black italic uppercase text-white flex items-center gap-2">
                              <History className="w-4 h-4 text-[#e6ff55]" />
                              HISTÓRICO DE TEMPORADAS
                            </h3>
                            <p className="text-xs text-[#8e8e9c]">
                              Registro oficial de todas as temporadas disputadas.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <div className="bg-[#191924] px-3 py-1 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">ANOS</span>
                              <strong className="text-white">{driver.careerStats.seasons}</strong>
                            </div>
                            <div className="bg-[#191924] px-3 py-1 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">TÍTULOS</span>
                              <strong className="text-[#e6ff55]">{driver.careerStats.championships}</strong>
                            </div>
                            <div className="bg-[#191924] px-3 py-1 rounded-xl border border-white/5 text-center">
                              <span className="text-[9px] text-[#8e8e9c] block">VITÓRIAS</span>
                              <strong className="text-[#ff5f8f]">{driver.careerStats.wins}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead className="sticky top-0 bg-[#14141c]">
                              <tr className="border-b border-white/5 text-[10px] uppercase text-[#8e8e9c]">
                                <th className="py-2 px-3">Ano</th>
                                <th className="py-2 px-3">Cat</th>
                                <th className="py-2 px-3">Equipe</th>
                                <th className="py-2 px-3 text-center">Vit</th>
                                <th className="py-2 px-3 text-center">Pts</th>
                                <th className="py-2 px-3 text-right">Pos Final</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {(driver.seasonHistory || []).map((entry, i) => (
                                <tr key={i} className="bg-[#070709] hover:bg-[#191924] transition-colors">
                                  <td className="py-2.5 px-3 font-bold text-white">{entry.season}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-full bg-[#191924] text-slate-200 uppercase text-[10px] font-bold">
                                      {entry.category.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.teamColor }}></span>
                                      <span className="font-semibold text-slate-200">{entry.teamName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold text-[#e6ff55] tabular-nums">{entry.wins}</td>
                                  <td className="py-2.5 px-3 text-center text-slate-300 tabular-nums">{entry.points}</td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                      entry.finalPosition === 1
                                        ? 'bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40'
                                        : entry.finalPosition <= 3
                                        ? 'bg-[#ff5f8f]/20 text-[#ff5f8f] border border-[#ff5f8f]/40'
                                        : 'bg-[#191924] text-slate-300'
                                    }`}>
                                      {entry.finalPosition}º
                                    </span>
                                  </td>
                                </tr>
                              ))}

                              <tr className="bg-[#1e1e2c]">
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {currentSeason} <span className="text-[10px] text-[#e6ff55] uppercase ml-1">(Atual)</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] uppercase text-[10px] font-bold">
                                    {driver.category.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentTeam.color }}></span>
                                    <span className="font-semibold text-white">{currentTeam.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-[#e6ff55] tabular-nums">
                                  {currentPlayerStanding?.wins ?? 0}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-300 tabular-nums">
                                  {currentPlayerStanding?.points ?? 0}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] font-bold text-[10px]">
                                    {currentPlayerRank}º (Ativo)
                                  </span>
                                </td>
                              </tr>
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
            className={`${isWidescreenMode ? 'md:hidden' : ''} fixed bottom-2.5 left-0 right-0 w-[94%] max-w-[420px] mx-auto bg-[#14141c]/95 border border-white/15 rounded-full px-3 py-2 z-40 backdrop-blur-xl flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.85)]`}
          >
            {[
              { id: 'garagem', label: 'Garagem', icon: User },
              { id: 'treino', label: 'Treino', icon: Zap },
              { id: 'calendario', label: 'Próxima Corrida', icon: Calendar, isCenterHero: true },
              { id: 'patrocinio', label: 'Metas', icon: Briefcase },
              { id: 'classificacao', label: 'Campeonato', icon: BarChart2 },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (item.isCenterHero) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchHubTab(item.id as HubTab)}
                    className={`min-h-[42px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full font-display font-black italic uppercase transition-all cursor-pointer relative -translate-y-2 shadow-xl ${
                      isActive
                        ? 'bg-[#e6ff55] text-black ring-4 ring-[#e6ff55]/30 shadow-[#e6ff55]/40 scale-105'
                        : 'bg-[#191924] text-[#8e8e9c] border border-white/10 hover:text-white hover:border-white/20'
                    }`}
                    title="Próxima Corrida"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="text-xs tracking-wider leading-none">CORRIDA</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchHubTab(item.id as HubTab)}
                  className={`flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isActive 
                      ? 'w-10 h-10 rounded-full bg-[#e6ff55] text-black shadow-lg shadow-[#e6ff55]/30 scale-105' 
                      : 'w-10 h-10 rounded-full text-[#8e8e9c] hover:text-white'
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

      {/* QUALIFYING SESSION SCREEN WITH 2-IN-1 TOGGLE (ESTRATÉGIA & TOP 3 vs GRID COMPLETO 20 PILOTOS) */}
      {gameState === 'qualifying' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/92 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl w-full max-h-[96vh] bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3 overflow-hidden"
          >
            {/* TOP HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/5 shrink-0 relative z-20">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6ff55] font-bold">CLASSIFICAÇÃO OFICIAL // Q3</span>
                  {(() => {
                    const wb = getWeatherBadge(currentTrack.weather);
                    return (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${wb.badgeClass}`}>
                        <span>{wb.icon}</span>
                        <span>{wb.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="flex items-baseline gap-2.5">
                  <h3 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-tight truncate">
                    {currentTrack.name}
                  </h3>
                  <p className="text-xs text-[#8e8e9c] font-mono shrink-0">{currentTrack.laps} Voltas</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {renderRaceModeToggle()}

                {!isQualifyingRunning && (
                  <div className="flex items-center gap-1 bg-[#070709] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setQualiViewMode('estrategia')}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                        qualiViewMode === 'estrategia'
                          ? 'bg-[#e6ff55] text-black shadow-md'
                          : 'text-[#8e8e9c] hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Estratégia & Pneus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQualiViewMode('grid20')}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-display font-black italic uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                        qualiViewMode === 'grid20'
                          ? 'bg-[#e6ff55] text-black shadow-md'
                          : 'text-[#8e8e9c] hover:text-white'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Grid Q3 (20)</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveAndReturnToMenu}
                  className="min-h-[38px] px-3 py-1.5 bg-[#1e1e2d] hover:bg-[#e6ff55] hover:text-black text-[#e6ff55] font-display font-black italic uppercase rounded-xl text-xs transition-all cursor-pointer border border-[#e6ff55]/40 flex items-center gap-1.5 shadow-sm"
                  title="Salvar e voltar ao menu de seleção de pilotos"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SALVAR & MENU</span>
                </button>
              </div>
            </div>

            {isQualifyingRunning ? (
              <div className="py-12 text-center space-y-3 my-auto">
                <div className="w-10 h-10 border-3 border-[#e6ff55] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-sm text-[#e6ff55] font-mono animate-pulse uppercase tracking-wider">
                  Pilotos na pista marcando volta rápida no Q3...
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-3 overflow-hidden relative z-20">
                {qualiViewMode === 'estrategia' ? (
                  /* SUB-PAGE 1: SUA LARGADA & TOP 3 + DICA DO ENGENHEIRO & PNEUS (SEM SOBREPOSIÇÃO) */
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                      {/* LEFT 5 COLS: SUA LARGADA EM DESTAQUE + TOP 3 DO GRID */}
                      <div className="lg:col-span-5 flex flex-col gap-3">
                        <div className="bg-[#070709] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between gap-3 h-full shadow-lg">
                          {/* Player Starting Position & Rival Highlight at Top so it is never covered */}
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
                            const isPlayerFaster = playerResult.rawTime < rivalResult.rawTime;

                            return (
                              <div className="grid grid-cols-2 gap-2.5 pb-2.5 border-b border-white/10 shrink-0">
                                <div className={`p-3 rounded-xl border ${isPlayerFaster ? 'bg-[#1e1e2c] border-[#e6ff55]' : 'bg-[#14141c] border-[#e6ff55]/40'}`}>
                                  <div className="text-[10px] font-mono text-[#e6ff55] uppercase font-bold">Sua Largada</div>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-2xl font-display font-black italic text-[#e6ff55]">P{playerPos}</span>
                                    <span className="text-xs font-mono font-bold text-white">{playerResult.lapTime}</span>
                                  </div>
                                  <div className="text-xs font-bold text-white truncate mt-0.5">{playerResult.driverName}</div>
                                </div>

                                <div className={`p-3 rounded-xl border ${!isPlayerFaster ? 'bg-[#1e1e2c] border-[#ff5f8f]' : 'bg-[#14141c] border-white/10'}`}>
                                  <div className="text-[10px] font-mono text-[#ff5f8f] uppercase font-bold">Rival Direto</div>
                                  <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-2xl font-display font-black italic text-[#ff5f8f]">P{rivalPos}</span>
                                    <span className="text-xs font-mono font-bold text-white">{rivalResult.lapTime}</span>
                                  </div>
                                  <div className="text-xs font-bold text-white truncate mt-0.5">{rivalResult.driverName}</div>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-2 flex-1 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-display font-black italic uppercase text-[#e6ff55] flex items-center gap-1.5">
                                <Crown className="w-4 h-4" />
                                TOP 3 DO GRID DE LARGADA
                              </span>
                              <button
                                type="button"
                                onClick={() => setQualiViewMode('grid20')}
                                className="text-[11px] font-mono text-[#38bdf8] hover:underline cursor-pointer"
                              >
                                Ver todos os 20 →
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {qualifyingResults.slice(0, 3).map((q, idx) => {
                                const gapToPole = idx === 0 ? 'POLE' : `+${(q.rawTime - qualifyingResults[0].rawTime).toFixed(3)}s`;
                                const teamColor = getDriverTeamColor(q.teamId);
                                return (
                                  <div
                                    key={q.driverName}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                      q.isPlayer
                                        ? 'bg-[#1e1e2c] border-[#e6ff55] text-white'
                                        : 'bg-[#14141c] border-white/5 text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                        idx === 0 ? 'bg-[#e6ff55] text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-600 text-white'
                                      }`}>
                                        P{idx + 1}
                                      </span>
                                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                                      <span className="font-display font-black italic uppercase text-xs sm:text-sm truncate">
                                        {q.driverName} {q.isPlayer && '(VOCÊ)'}
                                      </span>
                                    </div>
                                    <div className="text-right font-mono shrink-0">
                                      <div className="text-xs font-bold text-[#e6ff55] tabular-nums">{q.lapTime}</div>
                                      <div className="text-[10px] text-[#8e8e9c]">{gapToPole}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT 7 COLS: ENGINEER ADVICE + LARGE TIRE SELECTOR BUTTONS + PACE TOGGLES */}
                      <div className="lg:col-span-7 flex flex-col justify-between gap-3">
                        {(() => {
                          const tireAdvice = getTeamTireAdvice(currentTrack);
                          return (
                            <div className="bg-[#191924] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 shrink-0 shadow-md">
                              <div className="p-2.5 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl shrink-0">
                                <Headphones className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <span className="text-xs font-display font-black italic uppercase text-[#e6ff55]">
                                    DICA DO ENGENHEIRO DE PISTA
                                  </span>
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${tireAdvice.badgeStyle}`}>
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

                        {(() => {
                          const tireDetails = getTireDurabilityDetails(currentTrack);
                          return (
                            <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/10 space-y-3 flex-1 flex flex-col justify-between shadow-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-display font-black italic uppercase text-white">
                                  SELECIONE O PNEU DE LARGADA (SECO & CHUVA)
                                </span>
                                <span className="text-xs text-[#8e8e9c] font-mono">
                                  Próx. Box: <strong className="text-[#e6ff55]">{nextPitTire}</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {([
                                  { 
                                    id: 'Macio' as TireCompound, 
                                    label: 'Macio', 
                                    badge: 'S', 
                                    badgeColor: 'border-red-500 text-red-400 bg-red-500/10',
                                    info: tireDetails.Macio 
                                  },
                                  { 
                                    id: 'Médio' as TireCompound, 
                                    label: 'Médio', 
                                    badge: 'M', 
                                    badgeColor: 'border-[#e6ff55] text-[#e6ff55] bg-[#e6ff55]/10',
                                    info: tireDetails.Médio 
                                  },
                                  { 
                                    id: 'Duro' as TireCompound, 
                                    label: 'Duro', 
                                    badge: 'H', 
                                    badgeColor: 'border-slate-200 text-white bg-slate-200/10',
                                    info: tireDetails.Duro 
                                  },
                                  { 
                                    id: 'Chuva Leve' as TireCompound, 
                                    label: 'Chuva Leve', 
                                    badge: 'CL', 
                                    badgeColor: 'border-emerald-400 text-emerald-300 bg-emerald-500/15',
                                    info: tireDetails['Chuva Leve'] 
                                  },
                                  { 
                                    id: 'Chuva Pesada' as TireCompound, 
                                    label: 'Chuva Pesada', 
                                    badge: 'CP', 
                                    badgeColor: 'border-blue-400 text-blue-300 bg-blue-500/15',
                                    info: tireDetails['Chuva Pesada'] 
                                  },
                                ]).map(t => {
                                  const isSelected = startingTire === t.id;
                                  const isOpt = t.info.isOptimal;

                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleSelectStartingTire(t.id)}
                                      className={`min-h-[82px] p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                                        isSelected
                                          ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/40 text-white shadow-lg'
                                          : isOpt
                                          ? 'bg-[#191924] border-[#e6ff55]/40 text-slate-200 hover:bg-[#222230]'
                                          : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:bg-[#222230]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold shrink-0 ${t.badgeColor}`}>
                                          {t.badge}
                                        </span>
                                        {isOpt && (
                                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#e6ff55]/20 text-[#e6ff55] border border-[#e6ff55]/40 font-mono font-bold">
                                            ★ IDEAL
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1">
                                        <div className="text-xs font-display font-black italic uppercase leading-tight">{t.label}</div>
                                        <div className="text-[10px] font-mono font-bold text-slate-300 mt-0.5">
                                          ~{t.info.minLaps}-{t.info.maxLaps}v
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Quick Pace & Pit Stop Buttons */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <div className="grid grid-cols-3 gap-1 bg-[#14141c] p-1 rounded-xl border border-white/5">
                                  {([
                                    { id: 'conservador', label: 'Poupar' },
                                    { id: 'equilibrado', label: 'Normal' },
                                    { id: 'agressivo', label: 'Ataque' }
                                  ] as const).map(st => (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => setDrivingStyle(st.id)}
                                      className={`min-h-[36px] py-1.5 rounded-lg text-[11px] font-display font-black italic uppercase cursor-pointer transition-all ${
                                        drivingStyle === st.id
                                          ? 'bg-[#e6ff55] text-black shadow'
                                          : 'text-[#8e8e9c] hover:text-white'
                                      }`}
                                    >
                                      {st.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-1 bg-[#14141c] p-1 rounded-xl border border-white/5">
                                  {([
                                    { id: 'conservador', label: 'Box 3.0s' },
                                    { id: 'arriscado', label: 'Box 1.8s' }
                                  ] as const).map(pm => (
                                    <button
                                      key={pm.id}
                                      type="button"
                                      onClick={() => setAutoPitMode(pm.id)}
                                      className={`min-h-[36px] py-1.5 rounded-lg text-[11px] font-display font-black italic uppercase cursor-pointer transition-all ${
                                        autoPitMode === pm.id
                                          ? 'bg-[#e6ff55] text-black shadow'
                                          : 'text-[#8e8e9c] hover:text-white'
                                      }`}
                                    >
                                      {pm.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SUB-PAGE 2: GRID COMPLETO DE 20 PILOTOS EM 4 COLUNAS ESPAÇADAS */
                  <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs flex-1 content-between overflow-y-auto sm:overflow-hidden">
                      {qualifyingResults.map((q, idx) => (
                        <div 
                          key={q.driverName}
                          className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all min-w-0 ${
                            q.isPlayer 
                              ? 'bg-[#1e1e2c] border-[#e6ff55] ring-1 ring-[#e6ff55]/40 text-white font-bold shadow-md' 
                              : 'bg-[#070709] border-white/5 text-[#8e8e9c]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 font-bold tabular-nums shrink-0 ${idx < 3 ? 'text-[#e6ff55]' : 'text-[#8e8e9c]'}`}>P{idx + 1}</span>
                            <span className={`truncate ${q.isPlayer ? 'text-[#e6ff55]' : 'text-white'}`}>{q.driverName}</span>
                          </div>
                          <span className="text-[#e6ff55] font-bold tabular-nums shrink-0 text-[11px]">{q.lapTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={startRaceFromQualifying}
                  className="w-full min-h-[50px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3 rounded-2xl text-sm sm:text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/25 cursor-pointer flex items-center justify-center gap-2 shrink-0 relative z-20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ALINHAR NO GRID E LARGAR ({currentTrack.laps} VOLTAS · PNEU {startingTire})</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* FULLSCREEN DESKTOP PIT WALL LIVE RACE VIEW */}
      {gameState === 'race' && driver && (
        <div className="fixed inset-0 z-50 h-screen max-h-screen w-screen bg-[#070709] flex flex-col justify-between p-2.5 sm:p-3.5 gap-2.5 overflow-hidden select-none">
          
          {/* START-LINE ANIMATION OVERLAY (VERTICAL SCROLLABLE ASPHALT TRACK & CARS LAUNCHING UPWARDS) */}
          <AnimatePresence>
            {startLineStage !== 'none' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] h-screen max-h-screen bg-[#070709]/95 backdrop-blur-xl flex flex-col overflow-y-auto select-none custom-scrollbar"
              >
                {/* STICKY HEADER + FIA 5-RED-LIGHTS GANTRY */}
                <div className="sticky top-0 z-40 bg-[#070709]/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 shadow-2xl space-y-2.5 shrink-0">
                  {/* TOP BAR: TRACK & SKIP BUTTON */}
                  <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-[#e6ff55]/20 text-[#e6ff55] rounded-xl border border-[#e6ff55]/30 shrink-0">
                        <Flag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-[#e6ff55] font-bold uppercase tracking-widest truncate">
                          PROCEDIMENTO DE LARGADA OFICIAL FIA // GRID VERTICAL
                        </div>
                        <h3 className="text-base sm:text-xl font-display font-black italic uppercase text-white leading-none truncate">
                          {currentTrack.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14141c] border border-white/10 text-[11px] font-mono text-[#8e8e9c]">
                        <span>Sua Posição:</span>
                        <strong className="text-[#e6ff55]">P{playerRaceCar?.pos || '-'}</strong>
                        <span>·</span>
                        <span>Pneu {startingTire}</span>
                      </span>

                      <button
                        type="button"
                        onClick={toggleQuickSound}
                        className={`min-h-[42px] px-3 py-2 font-mono text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          gameSettings.soundEnabled
                            ? 'bg-[#191924] hover:bg-[#252535] text-[#e6ff55] border-[#e6ff55]/40'
                            : 'bg-[#14141c] hover:bg-[#1e1e2a] text-[#8e8e9c] border-white/10'
                        }`}
                        title={gameSettings.soundEnabled ? 'Desativar som da largada' : 'Ativar som do motor e semáforo'}
                      >
                        {gameSettings.soundEnabled ? (
                          <>
                            <Volume2 className="w-4 h-4 text-[#e6ff55]" />
                            <span className="hidden sm:inline">Som Motor ON</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-4 h-4 text-[#8e8e9c]" />
                            <span className="hidden sm:inline">Som OFF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => skipStartLineAnimation(racePositions, currentTrack)}
                        className="min-h-[42px] px-4 py-2 bg-[#191924] hover:bg-[#252535] text-white font-mono text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-md"
                      >
                        <span>Pular Animação</span>
                        <FastForward className="w-4 h-4 text-[#e6ff55]" />
                      </button>
                    </div>
                  </div>

                  {/* CENTER GANTRY: F1 5-RED-LIGHTS BAR + ACTION BUTTON INSIDE GANTRY */}
                  <div className="max-w-3xl mx-auto w-full">
                    <div className="bg-[#14141c] border-2 border-white/15 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
                      <div className="flex flex-col items-center sm:items-start gap-1.5">
                        <div className="text-[10px] font-mono uppercase text-[#8e8e9c] tracking-widest flex items-center gap-2">
                          <span>SEMÁFORO DE LARGADA // FIA GANTRY</span>
                          {gameSettings.soundEnabled && (
                            <span className="text-[#e6ff55] font-bold">
                              {startLineStage === 'lights_out'
                                ? '· 🔊 ACELERAÇÃO MÁXIMA (12.800 RPM)'
                                : startLineStage === 'lights_count'
                                ? `· 🔊 GIRO SUBINDO (${4500 + redLightsCount * 1450} RPM)`
                                : '· 🔊 MOTOR EM MARCHA LENTA'}
                            </span>
                          )}
                        </div>
                        {/* 5 LED LIGHT PAIRS */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          {[1, 2, 3, 4, 5].map((lightNum) => {
                            const isLit = startLineStage === 'lights_count' && lightNum <= redLightsCount;
                            const isLightsOut = startLineStage === 'lights_out';

                            return (
                              <div
                                key={lightNum}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  isLightsOut
                                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_25px_#10b981] scale-105'
                                    : isLit
                                    ? 'bg-[#ff003b] border-[#ff4d6d] shadow-[0_0_28px_#ff003b] scale-105'
                                    : 'bg-[#070709] border-white/10'
                                }`}
                              >
                                <div
                                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                                    isLightsOut ? 'bg-emerald-200' : isLit ? 'bg-red-200' : 'bg-white/5'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col items-center sm:items-end justify-center w-full sm:w-auto">
                        {startLineStage === 'grid_intro' && (
                          <button
                            type="button"
                            onClick={() => startLightsCountdown(racePositions, currentTrack)}
                            className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs sm:text-sm rounded-2xl shadow-xl shadow-[#e6ff55]/30 cursor-pointer tracking-wider flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>ACENDER LUZES E LARGAR 🚥</span>
                          </button>
                        )}
                        {startLineStage === 'lights_count' && (
                          <span className="text-xs sm:text-sm font-mono text-[#ff5f8f] uppercase tracking-wider font-bold animate-pulse py-2">
                            ATENÇÃO: LUZES ACENDENDO ({redLightsCount}/5)...
                          </span>
                        )}
                        {startLineStage === 'lights_out' && (
                          <span className="text-sm sm:text-lg font-display font-black italic uppercase text-[#e6ff55] tracking-widest py-2">
                            🟢 LUZES APAGADAS! LARGADA!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SCROLLABLE VERTICAL ASPHALT STRAIGHT & 2x2 STAGGERED STARTING GRID */}
                <div className="max-w-3xl w-full mx-auto px-2 sm:px-6 pt-3 pb-16 flex-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8e8e9c] mb-2 px-1">
                    <span className="uppercase font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ff5f8f]" />
                      RETA DE LARGADA // ROLE PARA VER OS 20 CARROS NO GRID
                    </span>
                    <span className="text-[#e6ff55] font-bold">↑ Sentido da Largada</span>
                  </div>

                  {/* VERTICAL TRACK SURFACE */}
                  <div className="relative bg-[#111218] border-x-4 border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.85)] py-8 px-6 sm:px-14">
                    {/* LEFT RED/WHITE CURB (ZEBRA FIXA NA PISTA) */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-3 sm:w-4 pointer-events-none opacity-85"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ef4444 0px, #ef4444 24px, #f8fafc 24px, #f8fafc 48px)'
                      }}
                    />

                    {/* RIGHT RED/WHITE CURB (ZEBRA FIXA NA PISTA) */}
                    <div
                      className="absolute top-0 bottom-0 right-0 w-3 sm:w-4 pointer-events-none opacity-85"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ef4444 0px, #ef4444 24px, #f8fafc 24px, #f8fafc 48px)'
                      }}
                    />

                    {/* VERTICAL CENTER DASHED TRACK LINE */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/15 pointer-events-none" />

                    {/* CHECKERED START LINE AT THE TOP OF THE ASPHALT */}
                    <div className="relative z-10 mb-8">
                      <div
                        className="w-full h-5 rounded-md border border-white/25 shadow-md"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 16px, #09090d 16px, #09090d 32px)'
                        }}
                      />
                      <div className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/60 mt-1 font-bold">
                        LINHA DE LARGADA // START LINE
                      </div>
                    </div>

                    {/* 2-COLUMN STAGGERED VERTICAL GRID (STATIONARY SLOTS, ONLY CARS ACCELERATE SMOOTHLY UPWARDS) */}
                    <div className="relative z-20 grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-5 overflow-visible">
                      {racePositions.map((car, idx) => {
                        const gridPos = idx + 1;
                        const isPlayer = car.isPlayer;
                        const isRightColumn = idx % 2 === 1;
                        const teamColor = getDriverTeamColor(car.teamId);
                        // Progressive realistic launch distance & reaction delay for each car
                        const launchDistance = -880 - (20 - idx) * 18;
                        const launchDelay = idx * 0.025;
                        const lateralLineWeave = isRightColumn ? -4 : 4;

                        return (
                          <div
                            key={car.driverName}
                            className={`flex flex-col items-center overflow-visible ${isRightColumn ? 'mt-8 sm:mt-12' : ''}`}
                          >
                            {/* FIA PAINTED STARTING BOX TOP LINE (STATIONARY ON ASPHALT) */}
                            <div
                              className={`w-full max-w-[190px] h-3 border-t-4 border-x-2 rounded-t-sm mb-1 transition-colors ${
                                isPlayer
                                  ? 'border-[#e6ff55] shadow-[0_-4px_15px_rgba(230,255,85,0.45)]'
                                  : gridPos === 1
                                  ? 'border-amber-400/80'
                                  : 'border-white/35'
                              }`}
                            />

                            {/* STATIONARY GRID SLOT HUD (STAYS ON ASPHALT WHILE ONLY THE CAR LAUNCHES UPWARDS) */}
                            <div
                              className={`w-full max-w-[190px] rounded-2xl p-2.5 border flex flex-col items-center gap-2 relative overflow-visible transition-colors ${
                                isPlayer
                                  ? 'bg-[#1a1c28]/85 border-[#e6ff55]/70 ring-1 ring-[#e6ff55]/30 shadow-[0_0_24px_rgba(230,255,85,0.18)]'
                                  : 'bg-[#090a0f]/80 border-white/10'
                              }`}
                            >
                              {/* POSITION & TIRE TOP TAGS (STATIONARY) */}
                              <div className="w-full flex items-center justify-between gap-1 relative z-10">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-display font-black italic text-xs ${
                                    gridPos === 1
                                      ? 'bg-amber-400 text-black font-bold'
                                      : gridPos <= 3
                                      ? 'bg-[#38bdf8] text-black font-bold'
                                      : isPlayer
                                      ? 'bg-[#e6ff55] text-black font-bold'
                                      : 'bg-[#191924] text-white border border-white/10'
                                  }`}
                                >
                                  P{gridPos}
                                </span>

                                {isPlayer && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#e6ff55] text-black font-display font-black italic uppercase">
                                    VOCÊ
                                  </span>
                                )}

                                <span
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${getTireBadgeStyle(
                                    car.tireCompound
                                  )}`}
                                >
                                  {getTireShortCode(car.tireCompound)}
                                </span>
                              </div>

                              {/* TIRE MARKS LEFT IN THE SLOT + ANIMATED CAR LAUNCHING SMOOTHLY UPWARDS */}
                              <div className="relative h-28 sm:h-32 w-full flex items-center justify-center overflow-visible my-1">
                                {/* Subtle painted slot number watermark on asphalt when car leaves */}
                                <span className="text-2xl font-display font-black italic text-white/10 select-none pointer-events-none">
                                  P{gridPos}
                                </span>

                                {/* ONLY THE CAR + EXHAUST TRAIL ACCELERATES UPWARDS */}
                                <motion.div
                                  initial={{ y: 14, opacity: 0 }}
                                  animate={
                                    startLineStage === 'lights_out'
                                      ? {
                                          y: [0, -14, -75, -240, -540, launchDistance],
                                          x: [0, lateralLineWeave * 0.4, lateralLineWeave, lateralLineWeave * 0.5, 0, 0],
                                          scale: [1, 1.02, 1.04, 1.03, 1.01, 1],
                                          opacity: 1
                                        }
                                      : startLineStage === 'lights_count'
                                      ? {
                                          y: [0, -1.2, 0],
                                          x: [0, 0.5, -0.5, 0],
                                          scale: 1,
                                          opacity: 1
                                        }
                                      : {
                                          y: 0,
                                          x: 0,
                                          scale: 1,
                                          opacity: 1
                                        }
                                  }
                                  transition={
                                    startLineStage === 'lights_out'
                                      ? {
                                          duration: 1.52,
                                          delay: launchDelay,
                                          ease: [0.35, 0, 0.12, 1],
                                          times: [0, 0.12, 0.28, 0.52, 0.78, 1]
                                        }
                                      : startLineStage === 'lights_count'
                                      ? {
                                          duration: 0.16,
                                          repeat: Infinity,
                                          ease: 'linear'
                                        }
                                      : {
                                          duration: 0.4,
                                          delay: idx * 0.018,
                                          ease: 'easeOut'
                                        }
                                  }
                                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-visible"
                                >
                                  <div
                                    className={`w-28 sm:w-32 h-14 sm:h-16 flex items-center justify-center shrink-0 ${
                                      driver.category === 'kart' ? '-rotate-90' : 'rotate-90'
                                    }`}
                                  >
                                    <CategoryCarVector
                                      category={driver.category}
                                      teamColor={teamColor}
                                      secondaryColor="#ffffff"
                                      helmetColor={isPlayer ? driver.helmetColor : '#facc15'}
                                      className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]"
                                    />
                                  </div>

                                  {/* TIRE SMOKE / LAUNCH FLAME TRAIL FOLLOWING THE CAR */}
                                  {startLineStage === 'lights_out' && (
                                    <motion.div
                                      initial={{ opacity: 0, scaleY: 0.5 }}
                                      animate={{ opacity: [0.85, 0.35, 0], scaleY: [1, 2.4, 3], y: [10, 32, 48] }}
                                      transition={{ duration: 0.65, repeat: Infinity }}
                                      className="absolute -bottom-5 w-7 h-12 rounded-full bg-gradient-to-b from-[#e6ff55]/60 via-orange-500/35 to-transparent blur-md pointer-events-none"
                                    />
                                  )}
                                </motion.div>
                              </div>

                              {/* DRIVER NAME FOOTER (STATIONARY ON GRID BOX) */}
                              <div className="w-full text-center border-t border-white/10 pt-1.5 relative z-10">
                                <div
                                  className={`text-xs font-display font-black italic uppercase truncate ${
                                    isPlayer ? 'text-[#e6ff55]' : 'text-white'
                                  }`}
                                >
                                  {car.driverName}
                                </div>
                                <div className="text-[10px] font-mono text-[#8e8e9c] truncate">
                                  Pneu {car.tireCompound}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 1. RACE HEADER BAR + 2-PAGE VIEW SWITCHER (PÁGINA 1: COMANDOS & PISTA | PÁGINA 2: CLASSIFICAÇÃO AO VIVO) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#14141c] border border-white/10 rounded-2xl px-3.5 py-2 shrink-0 shadow-xl relative z-20">
            <div className="min-w-0 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#e6ff55] text-black font-display font-black italic uppercase shrink-0">
                PIT WALL AO VIVO
              </span>
              <span className="text-base sm:text-xl font-display font-black italic uppercase text-[#e6ff55] truncate">
                {currentTrack.name}
              </span>
              {(() => {
                const wb = getWeatherBadge(currentTrack.weather);
                return (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 shrink-0 ${wb.badgeClass}`}>
                    <span>{wb.icon}</span>
                    <span>{wb.label}</span>
                  </span>
                );
              })()}
            </div>

            {/* 2-PAGE TOGGLE BAR (PÁGINA 1: COMANDOS & PISTA | PÁGINA 2: CLASSIFICAÇÃO AO VIVO) */}
            <div className="flex items-center gap-1.5 bg-[#070709] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setRaceLeftTab('comandos')}
                className={`min-h-[38px] py-1.5 px-3.5 rounded-lg text-xs font-display font-black italic uppercase cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  raceLeftTab === 'comandos'
                    ? 'bg-[#e6ff55] text-black shadow-md'
                    : 'text-[#8e8e9c] hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>1. Comandos & Pista</span>
              </button>
              <button
                type="button"
                onClick={() => setRaceLeftTab('radio')}
                className={`min-h-[38px] py-1.5 px-3.5 rounded-lg text-xs font-display font-black italic uppercase cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  raceLeftTab === 'radio'
                    ? 'bg-[#e6ff55] text-black shadow-md'
                    : 'text-[#8e8e9c] hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>2. Classificação (20 Carros)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 font-mono shrink-0">
              {renderRaceModeToggle()}

              <button
                type="button"
                onClick={() => setSimSpeed(prev => (prev === 1 ? 2 : 1))}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer flex items-center gap-1.5 transition-all shadow-md ${
                  simSpeed === 2 ? 'bg-[#e6ff55] border-[#e6ff55] text-black' : 'bg-[#191924] border-white/15 text-white hover:border-[#e6ff55]'
                }`}
                title="Alternar Velocidade da Corrida (1x / 2x)"
              >
                <FastForward className="w-4 h-4" />
                <span>{simSpeed}x</span>
              </button>

              <div className="text-right">
                <div className="text-[9px] text-[#8e8e9c] uppercase leading-none font-mono">Posição</div>
                <div className="text-base sm:text-xl font-display font-black italic text-white tabular-nums leading-tight">P{playerRaceCar?.pos || '-'}</div>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="text-right">
                <div className="text-[9px] text-[#8e8e9c] uppercase leading-none font-mono">Voltas</div>
                <div className="text-base sm:text-xl font-display font-black italic text-[#e6ff55] tabular-nums leading-tight">{currentLap}/{currentTrack.laps}</div>
              </div>
            </div>
          </div>

          {/* 2. PIT WALL TWO-PAGE WORKSPACE (SEM RÁDIO, CLASSIFICAÇÃO NA SEGUNDA PÁGINA) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {raceLeftTab === 'comandos' && playerRaceCar ? (
              /* PÁGINA 1: COMANDOS DE ESTRATÉGIA, BOX & TELEMETRIA DE PISTA EM TELA CHEIA */
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-y-auto lg:overflow-hidden">
                {/* LEFT 6 COLUMNS: GPS DO CIRCUITO & TELEMETRIA DO PILOTO */}
                <div className="lg:col-span-6 bg-[#14141c] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-mono text-[#8e8e9c]">
                    <span className="uppercase font-display font-black italic text-sm text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#e6ff55]" />
                      GPS DO CIRCUITO & TELEMETRIA AO VIVO
                    </span>
                    <span>Última Volta: <strong className={playerRaceCar.dnf ? 'text-[#ff5f8f]' : 'text-[#e6ff55]'}>{playerRaceCar.lastLapTime}</strong></span>
                  </div>

                  <div className="flex-1 min-h-[125px] bg-[#070709] rounded-2xl p-3.5 border border-white/5 flex flex-col items-center justify-center gap-2.5">
                    <TrackMapVector 
                      svgPath={currentTrack.svgPath} 
                      accentColor={currentTeam.color} 
                      isRacing={isRacing && !playerRaceCar.dnf}
                      playerColor={playerRaceCar.dnf ? '#ff5f8f' : '#e6ff55'}
                      className="w-full h-24 sm:h-32" 
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono text-[#8e8e9c]">
                      <span>Posição Atual: <strong className="text-[#e6ff55]">P{playerRaceCar.pos}</strong></span>
                      <span>·</span>
                      <span>Diferença p/ Líder: <strong className={playerRaceCar.dnf ? 'text-[#ff5f8f]' : 'text-white'}>{playerRaceCar.gap}</strong></span>
                      {playerRaceCar.statusTag && (
                        <>
                          <span>·</span>
                          <span className={`px-2 py-0.5 rounded-full border font-bold ${
                            playerRaceCar.dnf || playerRaceCar.statusTag.includes('💥') || playerRaceCar.statusTag.includes('🌀') || playerRaceCar.statusTag.includes('⚠️')
                              ? 'bg-[#ff5f8f]/20 text-[#ff5f8f] border-[#ff5f8f]/40'
                              : 'bg-[#191924] text-[#e6ff55] border-white/10'
                          }`}>
                            {playerRaceCar.statusTag}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* LIVE TELEMETRY INCIDENT / EVENT BANNER */}
                  {raceEventsLog[0] && (
                    <div className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 shrink-0 ${
                      raceEventsLog[0].type === 'incident'
                        ? 'bg-[#ff5f8f]/15 border-[#ff5f8f]/40 text-rose-200'
                        : raceEventsLog[0].type === 'overtake'
                        ? 'bg-[#e6ff55]/15 border-[#e6ff55]/40 text-[#e6ff55]'
                        : 'bg-[#070709] border-white/10 text-slate-300'
                    }`}>
                      <span className="font-bold shrink-0 uppercase text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                        V.{raceEventsLog[0].lap}
                      </span>
                      <span className="truncate font-semibold">{raceEventsLog[0].description}</span>
                    </div>
                  )}

                  {/* STRATEGIC MODE RISK RADAR (SHOWN WHEN MODO ESTRATÉGICO IS ACTIVE) */}
                  {raceMode === 'estrategico' && (() => {
                    const isLightRain = currentTrack.weather === 'Chuva Leve';
                    const isHeavyRain = currentTrack.weather === 'Chuva Pesada' || currentTrack.weather === 'Chuva';
                    const isRain = isLightRain || isHeavyRain;
                    const isDryTire = playerRaceCar.tireCompound === 'Macio' || playerRaceCar.tireCompound === 'Médio' || playerRaceCar.tireCompound === 'Duro';
                    const isWetTire = playerRaceCar.tireCompound === 'Chuva Leve' || playerRaceCar.tireCompound === 'Chuva Pesada';
                    const hasWrongTire = (isRain && isDryTire) || (!isRain && isWetTire) || (isLightRain && playerRaceCar.tireCompound === 'Chuva Pesada') || (isHeavyRain && playerRaceCar.tireCompound === 'Chuva Leve');
                    const isAggressiveInRain = isRain && drivingStyle === 'agressivo';

                    return (
                      <div className="bg-[#070709] p-2.5 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono shrink-0">
                        <div className={`p-1.5 rounded-lg border ${hasWrongTire ? 'bg-[#ff5f8f]/15 border-[#ff5f8f]/50 text-[#ff5f8f]' : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'}`}>
                          <div className="uppercase opacity-75">Pneu x Clima</div>
                          <div className="font-bold truncate">{hasWrongTire ? '⚠️ ERRADO (Derrap./Retardo)' : '✅ Ideal p/ Pista'}</div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${isRain ? 'bg-blue-500/15 border-blue-400/40 text-blue-300' : 'bg-[#14141c] border-white/10 text-slate-300'}`}>
                          <div className="uppercase opacity-75">Risco Ultrapassagem</div>
                          <div className="font-bold truncate">{isRain ? '10% Acid. · Menos Ultrap.' : '5% Risco Acidente'}</div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${isAggressiveInRain ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-[#14141c] border-white/10 text-slate-300'}`}>
                          <div className="uppercase opacity-75">Ritmo na Chuva</div>
                          <div className="font-bold truncate">{isAggressiveInRain ? `⚠️ Ataque (${playerRaceCar.aggressiveRainLaps || 1}v) Derrap.!` : 'Estável'}</div>
                        </div>
                        <div className="p-1.5 rounded-lg border bg-[#14141c] border-white/10 text-slate-300">
                          <div className="uppercase opacity-75">Motor (Grid)</div>
                          <div className="font-bold truncate">1% Chance Falha</div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs shrink-0">
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8e8e9c] uppercase">Sua Posição</div>
                      <div className="text-base font-display font-black italic text-[#e6ff55] tabular-nums mt-0.5">P{playerRaceCar.pos}</div>
                    </div>
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8e8e9c] uppercase">Melhor Volta</div>
                      <div className="text-xs sm:text-sm font-bold text-purple-300 tabular-nums mt-1">{playerRaceCar.bestLapTimeStr || playerRaceCar.lastLapTime}</div>
                    </div>
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8e8e9c] uppercase">Ultrapassagens</div>
                      <div className="text-sm font-bold text-[#38bdf8] tabular-nums mt-0.5">{playerRaceCar.overtakesCount || 0}</div>
                    </div>
                    <div className="bg-[#070709] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[#8e8e9c] uppercase">Paradas Box</div>
                      <div className="text-sm font-bold text-white tabular-nums mt-0.5">{playerRaceCar.pitStops} PIT</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRaceLeftTab('radio')}
                    className="w-full min-h-[40px] py-2 bg-[#191924] hover:bg-[#252535] text-[#e6ff55] font-display font-black italic uppercase text-xs rounded-xl border border-[#e6ff55]/30 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Ver Página 2: Classificação Ao Vivo dos 20 Carros →</span>
                  </button>
                </div>

                {/* RIGHT 6 COLUMNS: CENTRAL DE ESTRATÉGIA, TROCA DE PNEU AO VIVO, RITMO & CHAMADA DE BOX */}
                <div className="lg:col-span-6 bg-[#14141c] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-xs sm:text-sm font-display font-black italic uppercase text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#e6ff55]" />
                      ESTRATEGISTA DE PIT WALL & TROCA DE PNEUS
                    </span>
                    <span className="text-xs font-mono text-[#8e8e9c]">
                      {raceMode === 'estrategico' ? 'Modo Estratégico (1-2m)' : 'Modo Rápido'} · V.{currentLap}/{currentTrack.laps}
                    </span>
                  </div>

                  {/* Current Tire Health Bar */}
                  <div className="bg-[#070709] p-3 rounded-2xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getTireBadgeStyle(playerRaceCar.tireCompound)}`}>
                          Pneu Atual: {playerRaceCar.tireCompound} ({getTireShortCode(playerRaceCar.tireCompound)})
                        </span>
                        <span className="text-[#8e8e9c] hidden sm:inline">· Troca auto &lt; 25%</span>
                      </div>
                      <span className={`text-sm sm:text-base font-bold ${playerRaceCar.tireHealth <= 30 ? 'text-[#ff5f8f]' : 'text-[#e6ff55]'}`}>
                        {playerRaceCar.tireHealth}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#14141c] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          playerRaceCar.tireHealth > 55 ? 'bg-[#e6ff55]' : playerRaceCar.tireHealth > 30 ? 'bg-amber-400' : 'bg-[#ff5f8f]'
                        }`}
                        style={{ width: `${playerRaceCar.tireHealth}%` }}
                      />
                    </div>
                  </div>

                  {/* LIVE IN-RACE NEXT PIT STOP TIRE SELECTOR (ALL 5 COMPOUNDS: MACIO, MÉDIO, DURO, CHUVA LEVE, CHUVA PESADA) */}
                  <div className="bg-[#070709] p-3 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-display font-black italic uppercase text-xs">
                        SELECIONAR PNEU PARA O PRÓXIMO PIT STOP:
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getTireBadgeStyle(nextPitTire)}`}>
                        Próx. Box: {nextPitTire}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {([
                        { id: 'Macio' as TireCompound, label: 'Macio', code: 'S', style: 'border-red-500/50 text-red-400' },
                        { id: 'Médio' as TireCompound, label: 'Médio', code: 'M', style: 'border-[#e6ff55]/50 text-[#e6ff55]' },
                        { id: 'Duro' as TireCompound, label: 'Duro', code: 'H', style: 'border-slate-300/50 text-white' },
                        { id: 'Chuva Leve' as TireCompound, label: 'Chuva L.', code: 'CL', style: 'border-emerald-400/50 text-emerald-300' },
                        { id: 'Chuva Pesada' as TireCompound, label: 'Chuva P.', code: 'CP', style: 'border-blue-400/50 text-blue-300' },
                      ]).map(t => {
                        const isSelectedNext = nextPitTire === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectNextPitTire(t.id)}
                            className={`min-h-[54px] p-1.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isSelectedNext
                                ? 'bg-[#1e1e2c] border-[#e6ff55] ring-2 ring-[#e6ff55]/40 text-white shadow-md scale-[1.02]'
                                : 'bg-[#14141c] border-white/10 text-[#8e8e9c] hover:text-white hover:bg-[#191924]'
                            }`}
                          >
                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded border ${t.style}`}>
                              {t.code}
                            </span>
                            <span className="text-[10px] font-display font-black italic uppercase leading-tight truncate max-w-full">
                              {t.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Driving Pace Buttons */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono uppercase text-[#8e8e9c] font-bold">
                      RITMO DE PILOTAGEM (MOTOR & PNEUS)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'conservador', label: 'Poupar' },
                        { id: 'equilibrado', label: 'Normal' },
                        { id: 'agressivo', label: 'Ataque' }
                      ] as const).map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setDrivingStyle(st.id)}
                          className={`min-h-[42px] py-2 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer border transition-all ${
                            drivingStyle === st.id 
                              ? 'bg-[#e6ff55] text-black border-[#e6ff55] shadow-md shadow-[#e6ff55]/20' 
                              : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pit Stop Mode & Manual Pit Call */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoPitMode('conservador')}
                        className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-mono font-bold cursor-pointer border flex items-center justify-center gap-2 transition-all ${
                          autoPitMode === 'conservador'
                            ? 'bg-[#e6ff55]/20 border-[#e6ff55] text-[#e6ff55]'
                            : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:text-white'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Box Seguro (3.0s)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAutoPitMode('arriscado')}
                        className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-mono font-bold cursor-pointer border flex items-center justify-center gap-2 transition-all ${
                          autoPitMode === 'arriscado'
                            ? 'bg-[#ff5f8f]/20 border-[#ff5f8f] text-[#ff5f8f]'
                            : 'bg-[#191924] border-white/10 text-[#8e8e9c] hover:text-white'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Box Rápido (1.8s)</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={triggerManualPitNow}
                      disabled={Boolean(playerRaceCar.dnf)}
                      className={`w-full min-h-[48px] py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-display font-black italic uppercase cursor-pointer border transition-all flex items-center justify-center gap-2 ${
                        playerRaceCar.dnf
                          ? 'bg-[#ff5f8f]/20 border-[#ff5f8f]/50 text-[#ff5f8f] cursor-not-allowed'
                          : forcePitNextLap
                          ? 'bg-[#ff5f8f] border-white text-black animate-pulse shadow-lg shadow-[#ff5f8f]/30'
                          : 'bg-[#1e1e2d] hover:bg-[#e6ff55] hover:text-black border-[#e6ff55]/50 text-[#e6ff55]'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span>
                        {playerRaceCar.dnf
                          ? `FORA DA PROVA (${playerRaceCar.dnfReason?.toUpperCase() || 'ABANDONO'})`
                          : forcePitNextLap
                          ? `BOX AGENDADO P/ PRÓX. VOLTA → ${nextPitTire.toUpperCase()} (CANCELAR)`
                          : `CHAMAR BOX NA PRÓX. VOLTA (COLOCAR ${nextPitTire.toUpperCase()})`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* PÁGINA 2: CLASSIFICAÇÃO AO VIVO DOS 20 CARROS EM TELA CHEIA */
              <div className="flex-1 min-h-0 bg-[#14141c] border border-white/10 rounded-2xl p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5 shrink-0 relative z-20">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="w-4 h-4 text-[#e6ff55] shrink-0" />
                    <span className="text-xs sm:text-sm font-display font-black italic uppercase text-white truncate">
                      CLASSIFICAÇÃO AO VIVO (20 CARROS)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#070709] p-1 rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRaceTowerCols(2)}
                        className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                          raceTowerCols === 2 ? 'bg-[#e6ff55] text-black' : 'text-[#8e8e9c] hover:text-white'
                        }`}
                      >
                        2 Colunas (Amplo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRaceTowerCols(1)}
                        className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                          raceTowerCols === 1 ? 'bg-[#e6ff55] text-black' : 'text-[#8e8e9c] hover:text-white'
                        }`}
                      >
                        Lista Vertical
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRaceLeftTab('comandos')}
                      className="min-h-[34px] px-3 py-1 bg-[#191924] hover:bg-[#252535] text-[#e6ff55] font-display font-black italic uppercase text-xs rounded-xl border border-[#e6ff55]/30 cursor-pointer shrink-0"
                    >
                      ← Voltar p/ Comandos
                    </button>
                  </div>
                </div>

                <div className={`flex-1 min-h-0 grid ${raceTowerCols === 2 ? 'grid-cols-1 md:grid-cols-2 gap-1.5 content-between' : 'grid-cols-1 gap-1'} overflow-y-auto font-mono custom-scrollbar pr-0.5`}>
                  {racePositions.map((car) => {
                    const carTeam = TEAMS.find(t => t.id === car.teamId);
                    const tireColor = car.tireHealth > 55 ? 'bg-[#e6ff55]' : car.tireHealth > 30 ? 'bg-amber-400' : 'bg-[#ff5f8f]';
                    const posBadgeStyle = car.dnf
                      ? 'bg-[#ff5f8f]/25 text-[#ff5f8f] font-bold'
                      : car.pos === 1 
                      ? 'bg-[#e6ff55] text-black font-black' 
                      : car.pos === 2 
                      ? 'bg-[#38bdf8] text-black font-bold' 
                      : car.pos === 3 
                      ? 'bg-[#ff5f8f] text-black font-bold' 
                      : 'bg-[#191924] text-[#8e8e9c] font-medium';

                    const isOvertakingCar = car.statusTag?.startsWith('⬆️');

                    return (
                      <div 
                        key={car.driverName}
                        className={`px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all min-h-0 ${
                          car.dnf
                            ? 'bg-[#1a0f16]/80 border-[#ff5f8f]/40 text-rose-200 opacity-85'
                            : isOvertakingCar
                            ? 'bg-gradient-to-r from-[#1e1e2c] via-[#2a1a24] to-[#14141c] border-[#e6ff55] text-white font-bold'
                            : car.isPlayer 
                            ? 'bg-[#1e1e2c] border-[#e6ff55] text-white font-bold ring-1 ring-[#e6ff55]/40' 
                            : 'bg-[#070709] border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-7 h-5 rounded-md flex items-center justify-center text-xs shrink-0 tabular-nums ${posBadgeStyle}`}>
                            {car.dnf ? 'OUT' : `P${car.pos}`}
                          </span>
                          <div className="w-2 h-3.5 rounded-full shrink-0" style={{ backgroundColor: carTeam?.color || '#64748b' }}></div>
                          <span className={`truncate font-semibold ${car.isPlayer ? 'text-[#e6ff55]' : 'text-white'}`}>
                            {car.driverName}
                          </span>
                          {car.isPlayer && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#e6ff55] text-black font-display font-black italic uppercase shrink-0">
                              VOCÊ
                            </span>
                          )}
                          {car.statusTag && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full shrink-0 border font-bold ${
                              car.dnf || car.statusTag.includes('💥') || car.statusTag.includes('🌀') || car.statusTag.includes('⚠️')
                                ? 'bg-[#ff5f8f]/20 text-[#ff5f8f] border-[#ff5f8f]/40'
                                : 'bg-[#191924] text-[#e6ff55] border-white/10'
                            }`}>
                              {car.statusTag}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 tabular-nums text-xs">
                          {car.pitStops > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#191924] text-[#38bdf8] font-bold">
                              {car.pitStops}P
                            </span>
                          )}
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${getTireBadgeStyle(car.tireCompound)}`}>
                            {getTireShortCode(car.tireCompound)}
                          </span>
                          <div className="w-12 h-2 bg-[#14141c] rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full ${tireColor}`} style={{ width: `${car.tireHealth}%` }}></div>
                          </div>
                          <span className={`font-mono font-bold w-16 text-right text-xs ${car.dnf ? 'text-[#ff5f8f]' : 'text-slate-200'}`}>{car.gap}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* POST-RACE RESULT MODAL WITH 2-IN-1 TOGGLE (PÓDIO & DESTAQUES vs FINANÇAS & METAS) */}
      {gameState === 'result' && postRaceResult && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/92 backdrop-blur-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e6ff55]/15 via-black/80 to-black pointer-events-none" />

          <motion.div 
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="max-w-2xl w-full max-h-[96vh] bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center my-auto flex flex-col justify-between gap-3 relative z-10 overflow-hidden"
          >
            {/* Header + 2-in-1 Sub-View Toggle */}
            <div className="space-y-2.5 shrink-0 relative z-20">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e6ff55] font-bold px-3 py-0.5 rounded-full bg-[#e6ff55]/10 border border-[#e6ff55]/30 inline-block mb-1">
                  🏆 RESULTADO OFICIAL DO GP 🏆
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black italic uppercase text-white leading-tight truncate">
                  {currentTrack.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 bg-[#070709] p-1.5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setResultViewMode('podio')}
                  className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    resultViewMode === 'podio'
                      ? 'bg-[#e6ff55] text-black shadow-md'
                      : 'text-[#8e8e9c] hover:text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Pódio & Destaques</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResultViewMode('financas_metas')}
                  className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    resultViewMode === 'financas_metas'
                      ? 'bg-[#e6ff55] text-black shadow-md'
                      : 'text-[#8e8e9c] hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Premiação & Metas ({postRaceResult.sponsorBonuses?.filter(s => s.achieved).length || 0}/6)</span>
                </button>
              </div>
            </div>

            {resultViewMode === 'podio' ? (
              /* SUB-PAGE 1: PODIUM CEREMONY + AWARDS + SUMMARY */
              <div className="space-y-3 my-auto">
                <div className="grid grid-cols-3 gap-3 items-end pt-2 px-2">
                  {/* 2nd PLACE */}
                  {postRaceResult.podium[1] && (
                    <div className="flex flex-col items-center">
                      <Trophy className="w-5 h-5 text-[#38bdf8] mb-1" />
                      <div className="text-xs font-display font-black italic uppercase text-white truncate max-w-full">
                        {postRaceResult.podium[1].driverName}
                      </div>
                      <div className="text-[10px] font-mono text-[#38bdf8] font-bold mb-1">+18 pts</div>
                      <div className="w-full h-16 bg-gradient-to-b from-[#182838] to-[#0d121b] border-t-4 border-[#38bdf8] rounded-t-xl flex flex-col items-center justify-center p-2">
                        <span className="text-lg font-display font-black italic text-[#38bdf8]">2º</span>
                      </div>
                    </div>
                  )}

                  {/* 1st PLACE */}
                  {postRaceResult.podium[0] && (
                    <div className="flex flex-col items-center">
                      <Trophy className="w-6 h-6 text-[#e6ff55] mb-1" />
                      <div className="text-xs sm:text-sm font-display font-black italic uppercase text-[#e6ff55] truncate max-w-full">
                        {postRaceResult.podium[0].driverName}
                      </div>
                      <div className="text-[11px] font-mono text-[#e6ff55] font-bold mb-1">+25 pts</div>
                      <div className="w-full h-24 bg-gradient-to-b from-[#2e3318] to-[#12140b] border-t-4 border-[#e6ff55] rounded-t-xl flex flex-col items-center justify-center p-2">
                        <span className="text-2xl font-display font-black italic text-[#e6ff55]">1º</span>
                        <span className="text-[9px] font-mono font-bold text-[#e6ff55] uppercase">VENCEDOR</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd PLACE */}
                  {postRaceResult.podium[2] && (
                    <div className="flex flex-col items-center">
                      <Trophy className="w-5 h-5 text-[#ff5f8f] mb-1" />
                      <div className="text-xs font-display font-black italic uppercase text-white truncate max-w-full">
                        {postRaceResult.podium[2].driverName}
                      </div>
                      <div className="text-[10px] font-mono text-[#ff5f8f] font-bold mb-1">+15 pts</div>
                      <div className="w-full h-14 bg-gradient-to-b from-[#2a1a24] to-[#100d12] border-t-4 border-[#ff5f8f] rounded-t-xl flex flex-col items-center justify-center p-2">
                        <span className="text-base font-display font-black italic text-[#ff5f8f]">3º</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fastest Lap & Driver of the Day */}
                <div className="grid grid-cols-2 gap-2.5 text-left font-mono">
                  <div className={`p-3 rounded-2xl border ${
                    postRaceResult.fastestLapBonusWon ? 'bg-[#e6ff55]/10 border-[#e6ff55]/50' : 'bg-[#070709] border-white/5'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-[#e6ff55] font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> MELHOR VOLTA
                      </span>
                      {postRaceResult.fastestLapBonusWon && (
                        <span className="px-2 py-0.5 bg-[#e6ff55] text-black font-black text-[9px] rounded-full">+1 PT · +2 XP</span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{postRaceResult.fastestLap?.driverName}</div>
                    <div className="text-[11px] text-[#8e8e9c]">Tempo: <strong className="text-[#e6ff55]">{postRaceResult.fastestLap?.lapTime}</strong></div>
                  </div>

                  <div className={`p-3 rounded-2xl border ${
                    postRaceResult.mostOvertakesBonusWon ? 'bg-[#ff5f8f]/10 border-[#ff5f8f]/50' : 'bg-[#070709] border-white/5'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-[#ff5f8f] font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> PILOTO DO DIA
                      </span>
                      {postRaceResult.mostOvertakesBonusWon && (
                        <span className="px-2 py-0.5 bg-[#ff5f8f] text-black font-black text-[9px] rounded-full">+2 XP EXTRA</span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{postRaceResult.mostOvertakes?.driverName}</div>
                    <div className="text-[11px] text-[#8e8e9c]">Ultrapassagens: <strong className="text-white">+{postRaceResult.mostOvertakes?.count || 0}</strong></div>
                  </div>
                </div>

                {/* Quick Player Result Bar */}
                <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-[#8e8e9c] uppercase">Sua Chegada</div>
                    <div className="text-base font-display font-black italic text-white">P{postRaceResult.position} ({postRaceResult.pitStops} Pit)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8e8e9c] uppercase">Pontos Ganhos</div>
                    <div className="text-base font-display font-black italic text-[#e6ff55]">+{postRaceResult.points} pts</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#8e8e9c] uppercase">Ganhos do GP</div>
                    <div className="text-base font-display font-black italic text-emerald-400">
                      +${(postRaceResult.prize + (postRaceResult.totalSponsorMoney || 0)).toFixed(2)}M
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SUB-PAGE 2: FINANCIAL BREAKDOWN & ALL 6 SEASON GOALS */
              <div className="space-y-3 my-auto text-left font-mono">
                <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8e8e9c]">Prêmio Oficial de Corrida (P{postRaceResult.position}):</span>
                    <span className="font-bold text-white">+${postRaceResult.prize.toFixed(2)}M · +3 XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8e8e9c]">Salário Fixo de Patrocinadores no GP:</span>
                    <span className="font-bold text-[#e6ff55]">+${(postRaceResult.totalSponsorMoney || 0).toFixed(2)}M</span>
                  </div>
                </div>

                {postRaceResult.sponsorBonuses && postRaceResult.sponsorBonuses.length > 0 && (
                  <div className="bg-[#070709] p-3.5 rounded-2xl border border-white/5 space-y-2">
                    <div className="text-[11px] font-bold text-[#8e8e9c] uppercase">
                      PROGRESSO DAS 6 METAS DA TEMPORADA
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {postRaceResult.sponsorBonuses.map(sb => (
                        <div 
                          key={sb.title} 
                          className={`p-2 px-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                            sb.achieved 
                              ? 'bg-[#191924] border-[#e6ff55]/40 text-white' 
                              : 'bg-[#14141c] border-white/5 text-[#8e8e9c]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{sb.logo}</span>
                            <span className="font-bold truncate">{sb.name}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-black/40 text-[#e6ff55] shrink-0">
                            {sb.currentProgress}/{sb.targetValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTINUE BUTTON (LARGE HIT AREA) */}
            <button
              type="button"
              onClick={handleContinueSeason}
              className="w-full min-h-[50px] bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase py-3.5 rounded-2xl text-sm sm:text-base tracking-wider transition-all shadow-lg shadow-[#e6ff55]/25 cursor-pointer flex items-center justify-center gap-2 shrink-0 relative z-20"
            >
              <span>CONTINUAR CAMPEONATO</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}


      {/* PROMOTION MODAL (ONLY UNLOCKED WHEN FINISHING TOP 3 IN THE SEASON STANDINGS) */}
      {gameState === 'promotion' && driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full max-h-[96vh] bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl text-center my-auto space-y-3 overflow-hidden"
          >
            <div className="w-11 h-11 bg-[#e6ff55]/20 text-[#e6ff55] rounded-2xl flex items-center justify-center mx-auto border border-[#e6ff55]/30">
              <Trophy className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#e6ff55] font-bold">
                {seasonEndRank}º LUGAR GERAL · TEMPORADA ARQUIVADA NO HISTÓRICO!
              </span>
              <h3 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-tight">
                {driver.category === 'f1' ? 'CAMPEONATO MUNDIAL DE F1 CONCLUÍDO!' : 'TOP 3 ALCANÇADO // PROMOÇÃO LIBERADA!'}
              </h3>
              <p className="text-[#8e8e9c] text-xs">
                {driver.category === 'f1'
                  ? `Você encerrou a temporada da Fórmula 1 no Pódio Geral (${seasonEndRank}º lugar)! Escolha sua escuderia para o próximo ano.`
                  : `Parabéns! Você terminou em ${seasonEndRank}º lugar na somatória das corridas e conquistou vaga na próxima categoria! Escolha sua nova equipe:`}
              </p>
            </div>

            {/* Complete Season Summary Box */}
            <div className="bg-[#070709] p-3 rounded-2xl border border-white/5 text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-[#8e8e9c] font-bold uppercase tracking-wider">
                  RESUMO DA TEMPORADA {currentSeason} ({driver.category.toUpperCase()})
                </span>
                <span className="text-[10px] text-[#e6ff55] font-bold">TOP 3 CUMPRIDO!</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Pos Final</div>
                  <div className="text-xs font-display font-black italic text-[#e6ff55]">{seasonEndRank}º Lugar</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Pontos</div>
                  <div className="text-xs font-display font-black italic text-white">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Vitórias</div>
                  <div className="text-xs font-display font-black italic text-[#ff5f8f]">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Pódios</div>
                  <div className="text-xs font-display font-black italic text-[#38bdf8]">{currentPlayerStanding?.podiums || 0}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {driver.category === 'kart' && TEAMS.filter(t => t.category === 'f3').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f3', t.id)}
                  className="w-full py-2.5 px-3.5 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-xl cursor-pointer text-xs flex items-center justify-between transition-all"
                >
                  <span>Subir para F3 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-[#8e8e9c]">Carro {t.carPerformance}</span>
                </button>
              ))}
              {driver.category === 'f3' && TEAMS.filter(t => t.category === 'f2').map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f2', t.id)}
                  className="w-full py-2.5 px-3.5 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-xl cursor-pointer text-xs flex items-center justify-between transition-all"
                >
                  <span>Subir para F2 · <strong style={{ color: t.color }}>{t.name}</strong></span>
                  <span className="font-mono text-[#8e8e9c]">Carro {t.carPerformance}</span>
                </button>
              ))}
              {(driver.category === 'f2' || driver.category === 'f1') && TEAMS.filter(t => t.category === 'f1').slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => promoteCategory('f1', t.id)}
                  className="w-full py-2.5 px-3.5 bg-[#191924] hover:bg-[#222230] border border-white/5 text-white font-display font-black italic uppercase rounded-xl cursor-pointer text-xs flex items-center justify-between transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full max-h-[96vh] bg-[#14141c] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl text-center my-auto space-y-3 overflow-hidden"
          >
            <div className="w-11 h-11 bg-[#ff5f8f]/20 text-[#ff5f8f] rounded-2xl flex items-center justify-center mx-auto border border-[#ff5f8f]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-tight">
              FIM DA TEMPORADA {currentSeason} · {seasonEndRank}º LUGAR
            </h3>
            <p className="text-[#8e8e9c] text-xs leading-relaxed">
              Como apenas o <strong>Top 3 do campeonato</strong> sobe de categoria, você disputará mais um ano na {driver.category.toUpperCase()} com seus atributos evoluídos!
            </p>

            {/* End of Season Complete Summary */}
            <div className="bg-[#070709] p-3 rounded-2xl border border-white/5 text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-[#8e8e9c] font-bold uppercase tracking-wider">
                  RESUMO DA TEMPORADA {currentSeason}
                </span>
                <span className="text-[10px] text-[#ff5f8f] font-bold">FORA DO TOP 3</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Pos Final</div>
                  <div className="text-xs font-display font-black italic text-white">{seasonEndRank}º</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Pontos</div>
                  <div className="text-xs font-display font-black italic text-[#e6ff55]">{currentPlayerStanding?.points || 0} pts</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Vitórias</div>
                  <div className="text-xs font-display font-black italic text-white">{currentPlayerStanding?.wins || 0}V</div>
                </div>
                <div className="bg-[#191924] p-1.5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-[#8e8e9c] uppercase">Déficit Top 3</div>
                  <div className="text-xs font-display font-black italic text-[#ff5f8f]">
                    -{Math.max(1, thirdPlacePoints - playerPoints)} pts
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={retryCategorySeason}
              className="w-full py-3 bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase rounded-full shadow-lg shadow-[#e6ff55]/20 cursor-pointer text-sm sm:text-base tracking-wider transition-all"
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

      {/* NEW DRIVER BRIEF TUTORIAL MODAL (OPENS AUTOMATICALLY WHEN CREATING A NEW DRIVER, SKIPPABLE ANYTIME) */}
      <NewDriverTutorialModal
        isOpen={isTutorialOpen}
        driverName={driver?.name || 'Piloto'}
        raceMode={raceMode}
        onSelectRaceMode={(mode) => handleToggleRaceMode(mode)}
        onClose={() => setIsTutorialOpen(false)}
      />

      </div>
    </div>
  );
}
