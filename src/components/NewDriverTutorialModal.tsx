import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Zap,
  Flag,
  CloudRain,
  ChevronRight,
  ChevronLeft,
  FastForward,
  CheckCircle2,
  ShieldAlert,
  Timer,
  Wrench,
  Award,
  Lock
} from 'lucide-react';
import { RaceMode } from '../types';

interface NewDriverTutorialModalProps {
  isOpen: boolean;
  driverName: string;
  raceMode?: RaceMode;
  onSelectRaceMode?: (mode: RaceMode) => void;
  onClose: () => void;
}

interface TutorialStep {
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  highlights: {
    title: string;
    desc: string;
    tag: string;
    color: string;
  }[];
  proTip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    badge: 'PASSO 1 DE 4 // PLANO DE CARREIRA',
    title: 'DO KART RUMO À FÓRMULA 1',
    subtitle:
      'Sua jornada começa no Kart. Dispute cada temporada completa e termine no Top 3 do Campeonato para destravar contratos nas categorias superiores.',
    icon: <Trophy className="w-6 h-6 text-[#e6ff55]" />,
    highlights: [
      {
        title: 'Escada de Categorias (Kart ➔ F3 ➔ F2 ➔ F1)',
        desc: 'Terminando entre os 3 primeiros da classificação geral ao fim do ano, você recebe propostas reais de equipes da categoria acima.',
        tag: 'TOP 3 PROMOVE',
        color: 'text-[#e6ff55] border-[#e6ff55]/40 bg-[#e6ff55]/10',
      },
      {
        title: 'Metas da Temporada & Marcos Históricos',
        desc: 'Cumpra objetivos de vitórias, pódios e poles para receber bônus em milhões ($M) e XP extra de evolução.',
        tag: 'PATROCÍNIOS',
        color: 'text-[#38bdf8] border-[#38bdf8]/40 bg-[#38bdf8]/10',
      },
    ],
    proTip:
      'Dica do Engenheiro: Se terminar fora do Top 3, você disputa uma nova temporada na mesma categoria mantendo todos os seus atributos evoluídos!',
  },
  {
    badge: 'PASSO 2 DE 4 // TELEMETRIA & EVOLUÇÃO',
    title: 'TREINE SEUS 5 ATRIBUTOS DE PILOTO',
    subtitle:
      'Use Pontos de Treino (XP) e Saldo ($M) para aprimorar sua pilotagem na Garagem ou no Centro de Evolução antes da Classificação.',
    icon: <Zap className="w-6 h-6 text-[#38bdf8]" />,
    highlights: [
      {
        title: 'Os 5 Pilares de Performance',
        desc: 'Velocidade (retas), Ultrapassagem (ataque), Defesa (segurar posição), Consistência (curvas e chuva) e Largada (reação no semáforo).',
        tag: '5 ATRIBUTOS',
        color: 'text-[#38bdf8] border-[#38bdf8]/40 bg-[#38bdf8]/10',
      },
      {
        title: 'Teto Técnico da FIA (Média Máx. 90)',
        desc: 'A média dos 5 atributos tem limite de 90 pontos. Você pode especializar um atributo até 100 reduzindo outro caso queira ajustar seu estilo.',
        tag: 'LIMITE FIA 90',
        color: 'text-[#ff5f8f] border-[#ff5f8f]/40 bg-[#ff5f8f]/10',
      },
    ],
    proTip:
      'Dica do Engenheiro: Ao iniciar o Treino Classificatório, seus atributos ficam travados pelo Parque Fechado até o fim da corrida.',
  },
  {
    badge: 'PASSO 3 DE 4 // CLIMA, PNEUS & MODOS DE CORRIDA',
    title: 'MODO RÁPIDO VS. MODO ESTRATÉGICO',
    subtitle:
      'Você escolhe seu modo no início da carreira e pode alterá-lo no Paddock ou antes da largada. Durante a corrida em andamento, o modo fica travado.',
    icon: <CloudRain className="w-6 h-6 text-emerald-400" />,
    highlights: [
      {
        title: 'Compostos de Seco e de Chuva',
        desc: 'No seco, escolha entre Macio (rápido), Médio ou Duro (durável). Na chuva, use Chuva Leve (CL) ou Chuva Pesada (CP) conforme o clima da pista.',
        tag: '5 PNEUS',
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      },
      {
        title: 'Riscos Reais no Modo Estratégico (1 a 2 min)',
        desc: 'Pneu errado na chuva ou abusar do modo Agressivo na pista molhada causa atraso, derrapagens e risco de acidente. Ultrapassagens têm 5% de risco no seco (10% na chuva) e todo carro tem 1% de chance de falha no motor.',
        tag: 'REALISMO',
        color: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
      },
    ],
    proTip:
      'Regra FIA: O Modo Rápido ou Estratégico só pode ser alterado fora da corrida (no Paddock ou pré-corrida). Uma vez dada a largada, o modo não pode ser mudado até a bandeirada!',
  },
  {
    badge: 'PASSO 4 DE 4 // SEMÁFORO FIA & PIT WALL AO VIVO',
    title: 'LARGADA IMERSIVA E COMANDO DE CORRIDA',
    subtitle:
      'Assista aos carros alinhados no grid vertical, ouça os motores subindo o giro nas 5 luzes vermelhas e comande seu ritmo volta a volta.',
    icon: <Flag className="w-6 h-6 text-[#ff5f8f]" />,
    highlights: [
      {
        title: 'Procedimento de Largada com Áudio Contextual',
        desc: 'Ao acender as 5 luzes da FIA, o giro do motor sobe progressivamente até a aceleração total ao apagar das luzes. Você também pode pular a animação se preferir.',
        tag: 'SEMÁFORO FIA',
        color: 'text-[#e6ff55] border-[#e6ff55]/40 bg-[#e6ff55]/10',
      },
      {
        title: 'Ritmo de Pilotagem & Chamada Manual de Box',
        desc: 'Alterne ao vivo entre Poupar Pneu, Equilibrado e Ataque Total, escolha o pneu do próximo pit stop e chame o Box na próxima volta quando quiser.',
        tag: 'PIT WALL LIVE',
        color: 'text-[#ff5f8f] border-[#ff5f8f]/40 bg-[#ff5f8f]/10',
      },
    ],
    proTip:
      'Tudo pronto! Escolha seu composto inicial, confira a previsão do tempo e acelere rumo ao título mundial!',
  },
];

export const NewDriverTutorialModal: React.FC<NewDriverTutorialModalProps> = ({
  isOpen,
  driverName,
  raceMode = 'rapido',
  onSelectRaceMode,
  onClose,
}) => {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const current = TUTORIAL_STEPS[step];
  const isLastStep = step === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 12 }}
          className="max-w-xl w-full bg-[#14141c] border-2 border-[#e6ff55]/40 rounded-3xl p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.9)] my-auto flex flex-col justify-between gap-4 relative overflow-hidden"
        >
          {/* TOP HEADER WITH WELCOME & PROMINENT SKIP BUTTON */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-[#070709] border border-white/10 shrink-0">
                {current.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e6ff55] truncate">
                  BEM-VINDO À CARREIRA, {driverName.toUpperCase()}!
                </div>
                <div className="text-[11px] font-mono text-[#8e8e9c] truncate">
                  {current.badge}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#191924] hover:bg-[#ff5f8f] hover:text-black text-[#f1f1f4] font-mono text-xs font-bold border border-white/15 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Fechar e pular o tutorial imediatamente"
            >
              <span>Pular Tutorial</span>
              <FastForward className="w-3.5 h-3.5 text-[#e6ff55] group-hover:text-black" />
            </button>
          </div>

          {/* STEP PROGRESS BAR */}
          <div className="grid grid-cols-4 gap-2">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === step
                    ? 'bg-[#e6ff55] shadow-[0_0_12px_rgba(230,255,85,0.6)]'
                    : idx < step
                    ? 'bg-[#e6ff55]/45'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={`Ir para etapa ${idx + 1} do tutorial`}
              />
            ))}
          </div>

          {/* MAIN STEP CONTENT */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg sm:text-2xl font-display font-black italic uppercase text-white leading-tight">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8e8e9c] mt-1 leading-relaxed">
                {current.subtitle}
              </p>
            </div>

            <div className="space-y-2.5">
              {current.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#070709] border border-white/10 rounded-2xl p-3 sm:p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-display font-black italic uppercase text-white">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${item.color}`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs font-mono text-[#8e8e9c] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {step === 2 && onSelectRaceMode && (
              <div className="bg-[#070709] border border-[#e6ff55]/30 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#e6ff55]">
                    Escolha seu Modo Atual (Alterável no Paddock · Fixo na Corrida)
                  </span>
                  <span className="text-[10px] font-mono text-[#8e8e9c] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#ff5f8f]" />
                    <span>Travado após largada</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectRaceMode('rapido')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      raceMode === 'rapido'
                        ? 'bg-[#e6ff55]/15 border-[#e6ff55] ring-1 ring-[#e6ff55]/40 text-white'
                        : 'bg-[#14141c] border-white/10 text-[#8e8e9c] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-display font-black italic uppercase flex items-center gap-1 text-[#e6ff55]">
                        <Zap className="w-3.5 h-3.5" />
                        Modo Rápido
                      </span>
                      {raceMode === 'rapido' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#e6ff55] text-black">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 mt-1">
                      Corridas rápidas (~20s) e paradas automáticas &lt; 25%.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRaceMode('estrategico')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      raceMode === 'estrategico'
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8] ring-1 ring-[#38bdf8]/40 text-white'
                        : 'bg-[#14141c] border-white/10 text-[#8e8e9c] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-display font-black italic uppercase flex items-center gap-1 text-[#38bdf8]">
                        <Timer className="w-3.5 h-3.5" />
                        Modo Estratégico
                      </span>
                      {raceMode === 'estrategico' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#38bdf8] text-black">
                          ATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-slate-300 mt-1">
                      1 a 2 min, 1-2 paradas oficiais, chuva leve/pesada e riscos reais.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* ENGINEER PRO-TIP BOX */}
            <div className="bg-[#191924] border border-[#e6ff55]/30 rounded-2xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#e6ff55] shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono text-slate-200 leading-relaxed">
                {current.proTip}
              </p>
            </div>
          </div>

          {/* FOOTER NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/10">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#191924] hover:bg-[#232332] text-white font-mono text-xs font-bold border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#191924] hover:bg-[#232332] text-[#8e8e9c] hover:text-white font-mono text-xs font-bold border border-white/10 transition-all cursor-pointer"
              >
                Pular Tutorial
              </button>
            )}

            <div className="flex items-center gap-2">
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(TUTORIAL_STEPS.length - 1, s + 1))}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs sm:text-sm tracking-wider shadow-lg shadow-[#e6ff55]/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Próximo ({step + 1}/{TUTORIAL_STEPS.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs sm:text-sm tracking-wider shadow-lg shadow-[#e6ff55]/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Começar Carreira!</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
