/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Dices, Volume2, VolumeX, X, HelpCircle, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface RollRequest {
  nome: string; // ex: "Acrobacia" ou "Agilidade"
  atributoNome: string; // ex: "AGI"
  atributoValor: number; // ex: 3
  bonus: number; // ex: 5
}

interface DiceRollerProps {
  request: RollRequest | null;
  onClose: () => void;
  personagemNome: string;
}

interface CustomRollConfig {
  quantidade: number;
  tipo: number; // d4, d6, d8, d10, d12, d20, d100
  modificador: number;
}

export function DiceRoller({ request, onClose, personagemNome }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [rolls, setRolls] = useState<number[]>([]);
  const [chosenIndex, setChosenIndex] = useState<number>(-1);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Custom roller state
  const [customConfig, setCustomConfig] = useState<CustomRollConfig>({
    quantidade: 1,
    tipo: 20,
    modificador: 0
  });
  const [customResult, setCustomResult] = useState<{ rolls: number[]; total: number } | null>(null);

  // Trigger roll automatically when a request arrives
  useEffect(() => {
    if (request) {
      setIsHidden(false);
      executeRoll(request);
    } else {
      // Clear results
      setRolls([]);
      setChosenIndex(-1);
      setFinalResult(null);
      setCustomResult(null);
    }
  }, [request]);

  const playCreepySound = () => {
    if (isMuted) return;
    try {
      // Create eerie synth sweep using browser Web Audio API! No local files needed!
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, ctx.currentTime); // Low pitch rumble
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 1.2);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // Audio context block safety
    }
  };

  const playDiceSound = () => {
    if (isMuted) return;
    try {
      // Click clack rattle rattle sound
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let startTime = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300 + Math.random() * 600, startTime + i * 0.15);
        gain.gain.setValueAtTime(0.08, startTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime + i * 0.15);
        osc.stop(startTime + i * 0.15 + 0.1);
      }
    } catch (e) {}
  };

  const executeRoll = async (req: RollRequest) => {
    setIsRolling(true);
    playCreepySound();
    setCustomResult(null);

    // Paranormal rules:
    // If attribute >= 1: roll amount = attribute, keep highest
    // If attribute == 0: roll 2, keep lowest
    // If attribute < 0: roll 3, keep lowest
    const attrVal = req.atributoValor;
    let numDice = attrVal;
    let takingLowest = false;

    if (attrVal === 0) {
      numDice = 2;
      takingLowest = true;
    } else if (attrVal < 0) {
      numDice = 3;
      takingLowest = true;
    }

    let currentRolls: number[] = [];
    const rollDuration = 1000;
    const intervalTime = 70;
    const startTime = Date.now();

    // Sound repeating
    const soundInterval = setInterval(() => {
      playDiceSound();
    }, 200);

    // Spin animation emulation
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const mockRolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * 20) + 1);
        setRolls(mockRolls);

        if (Date.now() - startTime > rollDuration) {
          clearInterval(interval);
          clearInterval(soundInterval);

          // Calculate final roll
          const finalRolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * 20) + 1);
          setRolls(finalRolls);

          let selectedIdx = 0;
          if (takingLowest) {
            // Keep lowest
            let minVal = finalRolls[0];
            for (let i = 1; i < finalRolls.length; i++) {
              if (finalRolls[i] < minVal) {
                minVal = finalRolls[i];
                selectedIdx = i;
              }
            }
          } else {
            // Keep highest
            let maxVal = finalRolls[0];
            for (let i = 1; i < finalRolls.length; i++) {
              if (finalRolls[i] > maxVal) {
                maxVal = finalRolls[i];
                selectedIdx = i;
              }
            }
          }

          setChosenIndex(selectedIdx);
          const chosenDieVal = finalRolls[selectedIdx];
          setFinalResult(chosenDieVal + req.bonus);
          setIsRolling(false);
          resolve();
        }
      }, intervalTime);
    });
  };

  const executeCustomRoll = () => {
    setIsRolling(true);
    playDiceSound();
    setRolls([]);
    setChosenIndex(-1);
    setFinalResult(null);

    const { quantidade, tipo, modificador } = customConfig;
    const rollDuration = 800;
    const intervalTime = 60;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const mockRolls = Array.from({ length: quantidade }, () => Math.floor(Math.random() * tipo) + 1);
      const mockTotal = mockRolls.reduce((acc, v) => acc + v, 0) + modificador;
      setCustomResult({ rolls: mockRolls, total: mockTotal });

      if (Date.now() - startTime > rollDuration) {
        clearInterval(interval);
        const finalRolls = Array.from({ length: quantidade }, () => Math.floor(Math.random() * tipo) + 1);
        const finalTotal = finalRolls.reduce((acc, v) => acc + v, 0) + modificador;
        setCustomResult({ rolls: finalRolls, total: finalTotal });
        setIsRolling(false);
      }
    }, intervalTime);
  };

  // Get Paranormal Result Narrative
  const getNarrativeFeedback = () => {
    if (finalResult === null || !request) return null;
    const chosenDie = rolls[chosenIndex];
    const isLowestRule = request.atributoValor <= 0;

    if (chosenDie === 20) {
      return {
        rating: "CRÍTICO PARANORMAL! 🩸",
        desc: "O Outro Lado responde com fúria. A membrana se rompe e o sucesso é absoluto (Dano Crítico ou efeito esmagador)!",
        color: "text-paranormal-red animate-pulse",
        icon: <ShieldAlert className="w-5 h-5 text-paranormal-red" />
      };
    }
    if (chosenDie === 1) {
      return {
        rating: "DESASTRE DO OUTRO LADO! 💀",
        desc: "Uma perturbação catastrófica na Realidade ocorre. A membrana treme diante do seu erro trágico...",
        color: "text-neutral-500",
        icon: <AlertTriangle className="w-5 h-5 text-neutral-500" />
      };
    }
    if (isLowestRule) {
      if (finalResult >= 15) {
        return {
          rating: "Sucesso Contra o Destino! 👁️",
          desc: "Mesmo despreparado, uma sorte mórbida assiste suas mãos. Um feito formidável.",
          color: "text-paranormal-gold",
          icon: <Sparkles className="w-5 h-5 text-paranormal-gold" />
        };
      }
      if (finalResult >= 10) {
        return {
          rating: "Esforço Penoso",
          desc: "Você alcança seu objetivo, mas de forma deselegante, barulhenta ou deixando vestígios óbvios.",
          color: "text-amber-500",
          icon: <HelpCircle className="w-5 h-5 text-amber-500" />
        };
      }
      return {
        rating: "O Medo Paralisa... 🩸",
        desc: "Sua falta de aptidão atrai olhares famintos na névoa. Fracasso severo.",
        color: "text-red-800",
        icon: <AlertTriangle className="w-5 h-5 text-red-800" />
      };
    } else {
      if (finalResult >= 20) {
        return {
          rating: "SUCESSO EXTREMO! 👁️",
          desc: "Incrível! Sua maestria brilha intensamente na escuridão. O mistério é totalmente revelado.",
          color: "text-paranormal-gold font-bold",
          icon: <Sparkles className="w-5 h-5 text-paranormal-gold" />
        };
      }
      if (finalResult >= 15) {
        return {
          rating: "Sucesso Sólido",
          desc: "Você realiza o ato com destreza militar. A investigação avança sem contratempos.",
          color: "text-green-500",
          icon: <Sparkles className="w-4 h-4 text-green-500" />
        };
      }
      if (finalResult >= 10) {
        return {
          rating: "Sucesso Parcial ⚠️",
          desc: "Conseguiu! Porém, o mestre pode exigir um preço (perda de Sanidade, tempo extra ou ruído alto).",
          color: "text-amber-500",
          icon: <HelpCircle className="w-4 h-4 text-amber-500" />
        };
      }
      return {
        rating: "Fracasso Sombrio",
        desc: "O pânico se infiltra em sua mente. Falha crítica do teste. Você precisará de outra alternativa furtiva.",
        color: "text-neutral-500",
        icon: <AlertTriangle className="w-4 h-4 text-neutral-500" />
      };
    }
  };

  const narrative = getNarrativeFeedback();

  if (isHidden) {
    return (
      <button
        id="reopen-terminal-btn"
        onClick={() => setIsHidden(false)}
        className="fixed bottom-4 right-4 z-50 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 p-3 rounded-none flex items-center gap-2 cursor-pointer shadow-lg text-red-500 font-mono text-[10px] tracking-wider uppercase"
        title="Abrir Terminal de Dados"
      >
        <Dices className="w-4 h-4 text-red-500 animate-pulse" />
        <span>Abrir Dados 🩸</span>
      </button>
    );
  }

  return (
    <div id="dice-roller-container" className="fixed bottom-4 right-4 z-50 max-w-sm w-full outline-none">
      <div className="bg-zinc-955 border border-zinc-800 rounded-none shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-red-500" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-300 uppercase">TERMINAL_OCULTISTA // ROLO</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            <button
              id="audio-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-none text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title={isMuted ? "Ativar Áudio Oculto" : "Mutar Áudio Oculto"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              id="close-roller-btn"
              onClick={() => {
                if (request) onClose();
                setIsHidden(true);
              }}
              className="p-1 rounded-none text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition cursor-pointer"
              title="Ocultar Terminal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Panel body */}
        <div className="p-4 flex-1">
          {request ? (
            /* Active Character Sheet Roll */
            <div id="character-roll-view" className="space-y-4">
              <div className="text-center font-mono">
                <span className="text-[9px] uppercase text-zinc-550 block font-bold tracking-widest">{personagemNome}</span>
                <h4 className="text-xs text-white mt-1 uppercase font-black tracking-wider">
                  Roll_Procedimento: {request.nome}
                </h4>
                <div className="inline-block mt-2 bg-black/40 font-mono text-[9px] uppercase text-zinc-400 rounded-none px-2.5 py-1 border border-zinc-850">
                  REF: {request.atributoValor <= 0 ? `${request.atributoValor === 0 ? "2" : "3"}d20 MÍNIMO_REDUZIDO` : `${request.atributoValor}d20 MÁXIMO`} 
                  {request.bonus !== 0 ? ` + ${request.bonus} BÔNUS` : ""}
                </div>
              </div>

              {/* Rolling Display Area */}
              <div className="py-4 flex justify-center items-center gap-3 select-none">
                {rolls.map((dieResult, idx) => {
                  const isChosen = idx === chosenIndex && !isRolling;
                  const isDiscarded = idx !== chosenIndex && chosenIndex !== -1 && !isRolling;

                  return (
                    <motion.div
                      id={`die-${idx}`}
                      key={idx}
                      animate={isRolling ? { rotate: [0, 360, 720], scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.9, ease: "easeInOut" }}
                      className={`relative w-12 h-12 rounded-none flex flex-col items-center justify-center border font-mono font-bold text-lg cursor-default transition-all duration-300 ${
                        isRolling
                          ? "bg-zinc-900 border-zinc-800 text-zinc-500"
                          : isChosen
                          ? "bg-red-950/40 border-red-800 text-red-400 scale-110 shadow-[0_0_12px_rgba(239,68,68,0.2)] font-black"
                          : isDiscarded
                          ? "bg-black border-zinc-900 text-zinc-700 line-through opacity-40 scale-90"
                          : "bg-zinc-900 border-zinc-850 text-zinc-300"
                      }`}
                    >
                      {dieResult}
                      <span className="text-[7px] absolute bottom-0.5 font-mono opacity-50 uppercase tracking-[0.05em] text-center w-full">
                        d20
                      </span>
                      {isChosen && (
                        <div className="absolute -top-1.5 -right-1.5 bg-red-900 text-white text-[6px] font-bold font-mono rounded-none px-1 py-0.5 uppercase shadow">
                          PEAK
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Total Calculation breakdown */}
              {finalResult !== null && !isRolling && (
                <div id="roll-outcome-card" className="bg-black/40 p-3 rounded-none border border-zinc-850 text-center space-y-1.5">
                  <div className="text-[10px] text-zinc-440 font-mono uppercase">
                    Cálculo: {rolls[chosenIndex]} (MANTIDO) {request.bonus >= 0 ? `+ ${request.bonus}` : `- ${Math.abs(request.bonus)}`} (BÔNUS)
                  </div>
                  <div className="text-xl font-mono text-zinc-100 font-bold uppercase tracking-wide">
                    RESULTADO: <span className="text-red-500 font-black text-2xl">{finalResult}</span>
                  </div>

                  {narrative && (
                    <div className="pt-2 border-t border-zinc-850 flex flex-col items-center">
                      <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${narrative.color}`}>
                        {narrative.icon}
                        <span>{narrative.rating}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">{narrative.desc}</p>
                    </div>
                  )}

                  <div className="pt-3">
                    <button
                      id="reroll-btn"
                      onClick={() => executeRoll(request)}
                      disabled={isRolling}
                      className="w-full bg-zinc-900 hover:bg-zinc-850 text-[10px] py-1.5 font-mono font-bold uppercase rounded-none border border-zinc-800 text-zinc-300 transition cursor-pointer"
                    >
                      REP_ROLO // NOVAMENTE 🩸
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* General Custom Roll Menu */
            <div id="general-custom-roller" className="space-y-4">
              <span className="text-[9px] uppercase text-zinc-400 tracking-widest font-bold block text-center font-mono">
                SISTEMA_DADOS // MANUAL
              </span>

              {/* Controls */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Dados</label>
                  <input
                    id="custom-qty"
                    type="number"
                    min="1"
                    max="20"
                    value={customConfig.quantidade}
                    onChange={(e) => setCustomConfig({ ...customConfig, quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="bg-black border border-zinc-850 text-zinc-300 rounded-none p-1.5 text-center font-semibold focus:outline-none focus:border-red-900"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Tipo</label>
                  <select
                    id="custom-type"
                    value={customConfig.tipo}
                    onChange={(e) => setCustomConfig({ ...customConfig, tipo: parseInt(e.target.value) || 20 })}
                    className="bg-black border border-zinc-850 text-zinc-350 rounded-none p-1.5 focus:outline-none focus:border-red-900 text-[10px]"
                  >
                    <option value="4">d4</option>
                    <option value="6">d6</option>
                    <option value="8">d8</option>
                    <option value="10">d10</option>
                    <option value="12">d12</option>
                    <option value="20">d20</option>
                    <option value="100">d100</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Bônus</label>
                  <input
                    id="custom-mod"
                    type="number"
                    value={customConfig.modificador}
                    onChange={(e) => setCustomConfig({ ...customConfig, modificador: parseInt(e.target.value) || 0 })}
                    className="bg-black border border-zinc-850 text-zinc-300 rounded-none p-1.5 text-center font-semibold focus:outline-none focus:border-red-900"
                  />
                </div>
              </div>

              <button
                id="roll-custom-btn"
                onClick={executeCustomRoll}
                disabled={isRolling}
                className="w-full bg-red-950 hover:bg-red-900 disabled:bg-zinc-900 text-red-200 font-mono uppercase tracking-widest text-[9px] py-2 rounded-none font-bold border border-red-900 cursor-pointer transition"
              >
                {isRolling ? "SINALIZANDO_RITUAIS..." : "CONJURAR_ROLO_DADOS 🩸"}
              </button>

              {/* Custom Roll Results */}
              {customResult && !isRolling && (
                <div className="bg-black/40 p-3 rounded-none border border-zinc-850 text-center space-y-2">
                  <div className="text-[9px] text-zinc-500 font-bold uppercase font-mono">
                    ROLO: {customConfig.quantidade}d{customConfig.tipo} {customConfig.modificador !== 0 ? `+ (${customConfig.modificador})` : ""}
                  </div>
                  
                  {/* Rolled numbers cloud */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                    {customResult.rolls.map((val, i) => (
                      <span key={i} className="bg-black border border-zinc-850 px-2 py-0.5 rounded-none font-mono text-[10px] text-zinc-400">
                        {val}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm font-mono text-zinc-300">
                    TOTAL: <span className="text-amber-500 font-bold text-base">{customResult.total}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footnotes */}
        <div className="p-2 bg-zinc-950 border-t border-zinc-855 text-center">
          <span className="text-[7px] font-mono uppercase text-zinc-650 tracking-widest block">
            CUSTOS_OPERACIONAIS_SISTEMA • MEMBRANA_OK
          </span>
        </div>
      </div>
    </div>
  );
}
