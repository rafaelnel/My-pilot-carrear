import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Volume2, VolumeX, Monitor, Smartphone, FastForward, ShieldAlert, Bell, Check, X, Save } from 'lucide-react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
}) => {
  const [tempSettings, setTempSettings] = useState<GameSettings>(settings);

  // Sync draft state whenever modal opens or active settings change
  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSaveAndExit = () => {
    onSave(tempSettings);
  };

  const handleExitWithoutSaving = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="max-w-xl w-full max-h-[96vh] bg-[#14141c] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3.5 my-auto text-white relative overflow-hidden"
          >
            {/* Background Accent Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-[#e6ff55]/20 via-[#e6ff55]/5 to-transparent blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 relative z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#e6ff55] text-black shadow-lg shadow-[#e6ff55]/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#e6ff55] tracking-widest uppercase block">
                    PAINEL DE PREFERÊNCIAS
                  </span>
                  <h3 className="text-lg sm:text-xl font-display font-black italic uppercase tracking-tight text-white leading-none">
                    CONFIGURAÇÕES
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExitWithoutSaving}
                className="p-1.5 rounded-xl bg-[#070709] border border-white/10 text-[#8e8e9c] hover:text-white hover:border-white/20 transition-all cursor-pointer"
                title="Fechar (Sair)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Config Options Body */}
            <div className="space-y-2.5 relative z-10 flex-1 min-h-0 overflow-y-auto pr-0.5">
              
              {/* 1. Áudio e Efeitos Sonoros */}
              <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tempSettings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#e6ff55]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#8e8e9c]" />
                    )}
                    <span className="text-xs font-display font-black italic uppercase text-white tracking-wide">
                      Efeitos Sonoros & Áudio
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                    }
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                      tempSettings.soundEnabled
                        ? 'bg-[#e6ff55]/20 border-[#e6ff55] text-[#e6ff55]'
                        : 'bg-[#191924] border-white/10 text-[#8e8e9c]'
                    }`}
                  >
                    {tempSettings.soundEnabled ? 'ATIVADO' : 'DESATIVADO'}
                  </button>
                </div>

                {tempSettings.soundEnabled && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8e9c]">
                      <span>Volume dos Motores e SFX</span>
                      <span className="font-bold text-[#e6ff55]">{tempSettings.soundVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={tempSettings.soundVolume}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          soundVolume: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#e6ff55] cursor-pointer bg-[#191924] rounded-lg h-1.5"
                    />
                  </div>
                )}
              </div>

              {/* 2. Modo de Exibição de Tela */}
              <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
                <span className="text-xs font-display font-black italic uppercase text-white tracking-wide block">
                  Modo de Layout da Interface
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTempSettings((prev) => ({ ...prev, isWidescreenMode: true }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      tempSettings.isWidescreenMode
                        ? 'bg-[#1e1e2c] border-[#e6ff55] text-white ring-1 ring-[#e6ff55]/30'
                        : 'bg-[#191924] border-white/5 text-[#8e8e9c] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Monitor className="w-3.5 h-3.5 text-[#e6ff55]" />
                      <span className="text-[11px] font-bold font-mono">Widescreen</span>
                    </div>
                    <span className="text-[9px] text-[#8e8e9c] leading-tight">
                      Grade expandida multi-colunas para telas grandes
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTempSettings((prev) => ({ ...prev, isWidescreenMode: false }))
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !tempSettings.isWidescreenMode
                        ? 'bg-[#1e1e2c] border-[#e6ff55] text-white ring-1 ring-[#e6ff55]/30'
                        : 'bg-[#191924] border-white/5 text-[#8e8e9c] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span className="text-[11px] font-bold font-mono">Mobile / Vertical</span>
                    </div>
                    <span className="text-[9px] text-[#8e8e9c] leading-tight">
                      Coluna única otimizada para smartphones
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Simulação & Dificuldade */}
              <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FastForward className="w-3.5 h-3.5 text-[#e6ff55]" />
                  <span className="text-xs font-display font-black italic uppercase text-white tracking-wide">
                    Simulação & Dificuldade dos Rivais
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-mono text-[#8e8e9c] mb-1 font-bold">
                      Velocidade Padrão da Corrida
                    </label>
                    <select
                      value={tempSettings.simulationSpeed}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          simulationSpeed: Number(e.target.value) as 1 | 2,
                        }))
                      }
                      className="w-full bg-[#191924] border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-[11px] font-mono focus:outline-none focus:border-[#e6ff55]"
                    >
                      <option value={1}>1x Velocidade Normal</option>
                      <option value={2}>2x Velocidade Acelerada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-[#8e8e9c] mb-1 font-bold">
                      Ritmo dos Adversários IA
                    </label>
                    <select
                      value={tempSettings.aiDifficulty}
                      onChange={(e) =>
                        setTempSettings((prev) => ({
                          ...prev,
                          aiDifficulty: e.target.value as 'Normal' | 'Desafiador' | 'Hardcore',
                        }))
                      }
                      className="w-full bg-[#191924] border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-[11px] font-mono focus:outline-none focus:border-[#e6ff55]"
                    >
                      <option value="Normal">Normal (Equilibrado)</option>
                      <option value="Desafiador">Desafiador (+2% Ritmo IA)</option>
                      <option value="Hardcore">Hardcore (+5% Ritmo IA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Notificações de Autosave */}
              <div className="bg-[#070709] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-[#191924] border border-white/5 text-[#e6ff55] shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-display font-black italic uppercase text-white block truncate">
                      Alertas de Autosave no Início do Ano
                    </span>
                    <span className="text-[9px] font-mono text-[#8e8e9c] block truncate">
                      Avisar quando um backup automático for gerado
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTempSettings((prev) => ({
                      ...prev,
                      autosaveNotifications: !prev.autosaveNotifications,
                    }))
                  }
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer border shrink-0 ${
                    tempSettings.autosaveNotifications
                      ? 'bg-[#e6ff55]/20 border-[#e6ff55] text-[#e6ff55]'
                      : 'bg-[#191924] border-white/10 text-[#8e8e9c]'
                  }`}
                >
                  {tempSettings.autosaveNotifications ? 'SIM' : 'NÃO'}
                </button>
              </div>

            </div>

            {/* Modal Footer with "Sair" and "Salvar e Sair" Buttons */}
            <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2.5 relative z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitWithoutSaving}
                className="py-2.5 px-4 rounded-2xl bg-[#191924] hover:bg-[#242434] text-white font-display font-black italic uppercase text-xs tracking-wider border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <X className="w-4 h-4 text-[#ff5f8f]" />
                <span>SAIR</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndExit}
                className="py-2.5 px-4 rounded-2xl bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#e6ff55]/20"
              >
                <Save className="w-4 h-4 fill-current" />
                <span>SALVAR E SAIR</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
