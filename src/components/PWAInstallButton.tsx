import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2, WifiOff, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isOnline, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios'>(() =>
    isIOS ? 'ios' : 'android'
  );

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setActivePlatformTab(isIOS ? 'ios' : 'android');
      setShowGuideModal(true);
    }
  };

  if (variant === 'settings') {
    return (
      <>
        <div className="bg-[#070709] border border-[#e6ff55]/30 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#e6ff55]/15 border border-[#e6ff55]/30 text-[#e6ff55] shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-black italic uppercase text-white truncate">
                  Aplicativo Mobile (PWA)
                </span>
                {isInstalled && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 uppercase">
                    Instalado
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#8e8e9c] block leading-snug">
                {isInstalled
                  ? 'Você já está rodando o Apex GP instalado como app em tela cheia e com suporte offline.'
                  : 'Instale o jogo na tela inicial do seu celular (Android ou iPhone) para jogar em tela cheia e offline.'}
              </span>
            </div>
          </div>

          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-[#e6ff55]/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'INSTALAR AGORA' : 'INSTALAR NO CELULAR'}</span>
            </button>
          )}
        </div>

        {showGuideModal && (
          <PWAInstallModal
            isInstallable={isInstallable}
            isAndroid={isAndroid}
            activePlatformTab={activePlatformTab}
            setActivePlatformTab={setActivePlatformTab}
            onDirectInstall={promptInstall}
            onClose={() => setShowGuideModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {!isOnline && (
        <div
          className="min-h-[38px] px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0"
          title="Modo Offline Ativo — Seus pilotos permanecem salvos no cache local do aparelho"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">MODO OFFLINE</span>
        </div>
      )}

      {!isInstalled && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="min-h-[38px] px-3 py-1.5 bg-[#e6ff55]/15 hover:bg-[#e6ff55] text-[#e6ff55] hover:text-black border border-[#e6ff55]/50 rounded-xl text-[11px] font-display font-black italic uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0 relative z-20"
          title="Instalar o Apex GP na tela inicial do seu celular ou computador"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>INSTALAR APP</span>
        </button>
      )}

      {showGuideModal && (
        <PWAInstallModal
          isInstallable={isInstallable}
          isAndroid={isAndroid}
          activePlatformTab={activePlatformTab}
          setActivePlatformTab={setActivePlatformTab}
          onDirectInstall={promptInstall}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
};

interface PWAInstallModalProps {
  isInstallable: boolean;
  isAndroid: boolean;
  activePlatformTab: 'android' | 'ios';
  setActivePlatformTab: (tab: 'android' | 'ios') => void;
  onDirectInstall: () => Promise<boolean>;
  onClose: () => void;
}

const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isInstallable,
  activePlatformTab,
  setActivePlatformTab,
  onDirectInstall,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#14141c] border border-white/15 p-5 shadow-2xl text-white space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-[#e6ff55]/20 via-[#e6ff55]/5 to-transparent blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e6ff55] text-black shadow-lg shadow-[#e6ff55]/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#e6ff55] tracking-widest uppercase block">
                PROGRESSIVE WEB APP // OFFLINE READY
              </span>
              <h3 className="text-lg font-display font-black italic uppercase text-white leading-none">
                INSTALAR NO CELULAR
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#070709] border border-white/10 text-[#8e8e9c] hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direct Install CTA if supported by browser */}
        {isInstallable && (
          <div className="bg-[#e6ff55]/10 border border-[#e6ff55]/40 rounded-2xl p-3.5 space-y-2.5 relative z-10">
            <div className="text-xs font-mono text-white">
              Seu navegador suporta instalação direta com 1 toque:
            </div>
            <button
              type="button"
              onClick={async () => {
                const ok = await onDirectInstall();
                if (ok) onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#e6ff55] hover:brightness-110 text-black font-display font-black italic uppercase text-xs sm:text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#e6ff55]/20"
            >
              <Download className="w-4 h-4" />
              <span>INSTALAR APLICATIVO AGORA</span>
            </button>
          </div>
        )}

        {/* Platform Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#070709] p-1 rounded-2xl border border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => setActivePlatformTab('android')}
            className={`py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer ${
              activePlatformTab === 'android'
                ? 'bg-[#e6ff55] text-black shadow'
                : 'text-[#8e8e9c] hover:text-white'
            }`}
          >
            🤖 Android / Chrome
          </button>
          <button
            type="button"
            onClick={() => setActivePlatformTab('ios')}
            className={`py-2 px-3 rounded-xl text-xs font-display font-black italic uppercase transition-all cursor-pointer ${
              activePlatformTab === 'ios'
                ? 'bg-[#38bdf8] text-black shadow'
                : 'text-[#8e8e9c] hover:text-white'
            }`}
          >
            🍎 iPhone / iPad (iOS)
          </button>
        </div>

        {/* Step-by-step Instructions */}
        {activePlatformTab === 'android' ? (
          <div className="space-y-2.5 text-xs font-mono text-slate-200 relative z-10">
            <div className="flex items-start gap-3 rounded-2xl bg-[#070709] border border-white/10 p-3">
              <div className="p-1.5 rounded-xl bg-[#e6ff55]/15 text-[#e6ff55] shrink-0 mt-0.5">
                <MoreVertical className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block mb-0.5">1. Abra o menu do navegador</strong>
                <span className="text-[#8e8e9c] text-[11px] leading-relaxed">
                  No Google Chrome ou Samsung Internet, toque no ícone de <strong className="text-white">3 pontos (⋮)</strong> no canto superior ou inferior.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-[#070709] border border-white/10 p-3">
              <div className="p-1.5 rounded-xl bg-[#e6ff55]/15 text-[#e6ff55] shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block mb-0.5">2. Selecione &quot;Instalar aplicativo&quot;</strong>
                <span className="text-[#8e8e9c] text-[11px] leading-relaxed">
                  Toque em <strong className="text-[#e6ff55]">&quot;Instalar aplicativo&quot;</strong> ou <strong className="text-white">&quot;Adicionar à tela inicial&quot;</strong> e confirme.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs font-mono text-slate-200 relative z-10">
            <div className="flex items-start gap-3 rounded-2xl bg-[#070709] border border-white/10 p-3">
              <div className="p-1.5 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] shrink-0 mt-0.5">
                <Share className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block mb-0.5">1. Toque em Compartilhar no Safari</strong>
                <span className="text-[#8e8e9c] text-[11px] leading-relaxed">
                  Na barra inferior do Safari no iPhone/iPad, toque no botão <strong className="text-white">Compartilhar</strong> (quadrado com seta para cima).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-[#070709] border border-white/10 p-3">
              <div className="p-1.5 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] shrink-0 mt-0.5">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block mb-0.5">2. Adicionar à Tela de Início</strong>
                <span className="text-[#8e8e9c] text-[11px] leading-relaxed">
                  Role as opções para baixo, toque em <strong className="text-[#38bdf8]">&quot;Adicionar à Tela de Início&quot;</strong> e confirme em <strong className="text-white">Adicionar</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Footer */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center gap-2 text-[10px] font-mono text-emerald-200 relative z-10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Funciona em <strong>tela cheia sem barras do navegador</strong>, carrega instantaneamente offline e mantém seus 4 pilotos salvos no cache do aparelho.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#191924] hover:bg-[#242434] text-white font-display font-black italic uppercase text-xs tracking-wider border border-white/10 transition-all cursor-pointer relative z-10"
        >
          ENTENDI
        </button>
      </div>
    </div>
  );
};
