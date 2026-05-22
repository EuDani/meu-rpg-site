/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Personagem, AtributoKey, Pericia, Ataque, HabilidadeRitual, ItemInventario } from "../types";
import { RichTextEditor } from "./RichTextEditor";
import { RollRequest } from "./DiceRoller";
import {
  Save,
  ArrowLeft,
  Lock,
  Unlock,
  Heart,
  Flame,
  Brain,
  Shield,
  Plus,
  Trash2,
  Upload,
  Dices,
  Check,
  BookOpen,
  Scroll,
  ShoppingBag,
  UserCheck,
  AlertCircle,
  Eye,
  Skull,
  Award,
  Sparkle
} from "lucide-react";
import { CLASSES, ORIGENS, PATENTES } from "../data";

interface CharacterSheetProps {
  character: Personagem;
  viewOnly: boolean;
  onSave: (updatedChar: Personagem) => void;
  onBack: () => void;
  isMestre: boolean;
  onTriggerRoll: (request: RollRequest) => void;
}

export function CharacterSheet({
  character: initialCharacter,
  viewOnly: initialViewOnly,
  onSave,
  onBack,
  isMestre,
  onTriggerRoll
}: CharacterSheetProps) {
  // Local state of character being edited
  const [char, setChar] = useState<Personagem>({ ...initialCharacter });
  
  // Safety lock state - defaults to true (locked) to prevent accidental click edits.
  // Note: if initialViewOnly is true, they can never unlock
  const [isLocked, setIsLocked] = useState(!isMestre && !initialViewOnly ? true : false);

  // Responsive active tab state
  const [activeTab, setActiveTab] = useState<"combate" | "pericias" | "habilidades" | "rituais" | "mochila" | "historico">("combate");

  // Expanded card tracking
  const [expandedAbilityId, setExpandedAbilityId] = useState<string | null>(null);
  const [expandedRitualId, setExpandedRitualId] = useState<string | null>(null);

  // Custom confirmation modal action
  const [confirmAction, setConfirmAction] = useState<{
    type: "ritual" | "habilidade" | "inventario" | "toggle_lock" | "delete_ability" | "delete_ritual" | "delete_item" | "add_ability_wizard" | "add_ritual_wizard" | "add_item_wizard";
    data?: any;
  } | null>(null);

  // Temporary wizard form states for the creation popups
  const [wizardName, setWizardName] = useState("");
  const [wizardCusto, setWizardCusto] = useState("1 PE");
  const [wizardElemento, setWizardElemento] = useState("Morte");
  const [wizardDescricao, setWizardDescricao] = useState("");
  const [wizardCategoria, setWizardCategoria] = useState("Livre");
  const [wizardEspacos, setWizardEspacos] = useState(1);

  // Helper to trace if HabilidadeRitual is a ritual
  const isRitual = (item: HabilidadeRitual) => {
    if (item.tipo) return item.tipo === "ritual";
    return item.nome.toLowerCase().includes("ritual") || item.nome.toLowerCase().includes("rito") || item.id.startsWith("rit");
  };

  // Attack builder temporary state
  const [newAttack, setNewAttack] = useState({
    nome: "",
    teste: "",
    dano: "",
    critico: "",
    alcance: "",
    especial: ""
  });

  // Unique key counter increments
  const keyCounter = useRef(Date.now());

  // Handle avatar upload converting to Base64
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setChar((prev) => ({
        ...prev,
        avatarUrl: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Quick stat adjusters
  const adjustStat = (field: "pv" | "pe" | "san", delta: number) => {
    setChar((prev) => {
      const stats = prev[field];
      const newVal = Math.max(0, Math.min(stats.max, stats.atual + delta));
      return {
        ...prev,
        [field]: { ...stats, atual: newVal }
      };
    });
  };

  const adjustMaxStat = (field: "pv" | "pe" | "san", delta: number) => {
    setChar((prev) => {
      const stats = prev[field];
      const newMax = Math.max(1, stats.max + delta);
      const newAtual = Math.min(newMax, stats.atual);
      return {
        ...prev,
        [field]: { atual: newAtual, max: newMax }
      };
    });
  };

  // Change attribute values
  const adjustAttribute = (key: AtributoKey, delta: number) => {
    setChar((prev) => {
      const updatedAttrs = { ...prev.atributos };
      updatedAttrs[key] = Math.max(-2, Math.min(6, updatedAttrs[key] + delta));
      
      // Auto recalculate defense if agility changes
      let updatedDef = prev.defesa;
      if (key === "AGI") {
        const value = updatedAttrs.AGI;
        updatedDef = {
          ...updatedDef,
          agi: value,
          total: updatedDef.base + value + updatedDef.equip + updatedDef.outros
        };
      }

      return {
        ...prev,
        atributos: updatedAttrs,
        defesa: updatedDef
      };
    });
  };

  // Trigger Roll Action helper
  const handleRollAttribute = (key: AtributoKey, nameOverride?: string) => {
    onTriggerRoll({
      nome: nameOverride || `Atributo ${key}`,
      atributoNome: key,
      atributoValor: char.atributos[key],
      bonus: 0
    });
  };

  const handleRollPericia = (p: Pericia) => {
    const attrVal = char.atributos[p.atributo];
    const totalBonus = (p.treinada ? 5 : 0) + p.outros;
    onTriggerRoll({
      nome: p.nome,
      atributoNome: p.atributo,
      atributoValor: attrVal,
      bonus: totalBonus
    });
  };

  const handleRollAttack = (atk: Ataque) => {
    // General roll with AGI or FOR
    const isLuta = atk.teste.toLowerCase().includes("luta") || atk.teste.toLowerCase().includes("for");
    const primaryAttr: AtributoKey = isLuta ? "FOR" : "AGI";
    const attrVal = char.atributos[primaryAttr];
    
    // Parse bonus from "FOR + 5" or "AGI + 5" or "Pontaria + 5"
    let parsedBonus = 0;
    const match = atk.teste.match(/\+\s*(\d+)/);
    if (match) {
      parsedBonus = parseInt(match[1]) || 0;
    }

    onTriggerRoll({
      nome: `Ataque: ${atk.nome}`,
      atributoNome: primaryAttr,
      atributoValor: attrVal,
      bonus: parsedBonus
    });
  };

  // Defense manual modifiers
  const adjustDefenseSegment = (field: "equip" | "outros" | "base", delta: number) => {
    setChar((prev) => {
      const updatedDef = { ...prev.defesa };
      updatedDef[field] = Math.max(0, updatedDef[field] + delta);
      updatedDef.total = updatedDef.base + updatedDef.agi + updatedDef.equip + updatedDef.outros;
      return {
        ...prev,
        defesa: updatedDef
      };
    });
  };

  // Skill management
  const handleTogglePericiaTreinada = (idx: number) => {
    setChar((prev) => {
      const updated = [...prev.pericias];
      const p = updated[idx];
      updated[idx] = { ...p, treinada: !p.treinada };
      return { ...prev, pericias: updated };
    });
  };

  const handleAdjustPericiaOutros = (idx: number, delta: number) => {
    setChar((prev) => {
      const updated = [...prev.pericias];
      const p = updated[idx];
      updated[idx] = { ...p, outros: Math.max(-10, Math.min(30, p.outros + delta)) };
      return { ...prev, pericias: updated };
    });
  };

  // Item inventory managers
  const handleAddItem = (nome: string, categoria: string, espacos: number) => {
    if (!nome.trim()) return;
    setChar((prev) => {
      const newItem: ItemInventario = {
        id: "item-" + (keyCounter.current++),
        nome: nome.trim(),
        categoria,
        espacos: Math.max(0, espacos)
      };
      return {
        ...prev,
        inventario: {
          ...prev.inventario,
          itens: [...prev.inventario.itens, newItem]
        }
      };
    });
  };

  const handleRemoveItem = (id: string) => {
    setChar((prev) => ({
      ...prev,
      inventario: {
        ...prev.inventario,
        itens: prev.inventario.itens.filter((item) => item.id !== id)
      }
    }));
  };

  // Attacks helper manager
  const handleAddAttackLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttack.nome.trim()) return;
    setChar((prev) => ({
      ...prev,
      ataques: [
        ...prev.ataques,
        {
          id: "atk-" + (keyCounter.current++),
          nome: newAttack.nome.trim(),
          teste: newAttack.teste || "AGI + 0",
          dano: newAttack.dano || "1d6",
          critico: newAttack.critico || "20/x2",
          alcance: newAttack.alcance || "Curto",
          especial: newAttack.especial || ""
        }
      ]
    }));
    setNewAttack({ nome: "", teste: "", dano: "", critico: "", alcance: "", especial: "" });
  };

  const handleRemoveAttack = (id: string) => {
    setChar((prev) => ({
      ...prev,
      ataques: prev.ataques.filter((atk) => atk.id !== id)
    }));
  };

  // Abilities and spells
  const handleAddAbility = () => {
    setChar((prev) => {
      const newHab: HabilidadeRitual = {
        id: "hab-" + (keyCounter.current++),
        nome: "Habilidade Não Formada",
        custo: "1 PE",
        pagina: "",
        descricao: "<p>Insira a descrição em Rich Text...</p>"
      };
      return {
        ...prev,
        habilidadesRituais: [...prev.habilidadesRituais, newHab]
      };
    });
  };

  const handleUpdateAbilityDesc = (id: string, text: string) => {
    setChar((prev) => ({
      ...prev,
      habilidadesRituais: prev.habilidadesRituais.map((hab) =>
        hab.id === id ? { ...hab, descricao: text } : hab
      )
    }));
  };

  const handleUpdateAbilityHeader = (id: string, field: "nome" | "custo" | "pagina", val: string) => {
    setChar((prev) => ({
      ...prev,
      habilidadesRituais: prev.habilidadesRituais.map((hab) =>
        hab.id === id ? { ...hab, [field]: val } : hab
      )
    }));
  };

  const handleRemoveAbility = (id: string) => {
    setChar((prev) => ({
      ...prev,
      habilidadesRituais: prev.habilidadesRituais.filter((hab) => hab.id !== id)
    }));
  };

  // Inventory space helper calculators
  const currentSlots = char.inventario.itens.reduce((acc, current) => acc + current.espacos, 0);
  const isCargaExcedida = currentSlots > char.inventario.cargaMaxima;

  // Global save trigger
  const handleGlobalSave = () => {
    onSave(char);
  };

  return (
    <div id="character-sheet-root" className="max-w-6xl mx-auto px-2 md:px-4 py-4 font-sans pb-40">
      
      {/* Upper Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-zinc-950/90 p-4 rounded-xl border border-zinc-805/85 shadow-[0_4px_25px_rgba(0,0,0,0.85)] backdrop-blur-md">
        <button
          id="sheet-back-btn"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-mono tracking-wider uppercase cursor-pointer transition select-none hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> RETORNAR_OPERACAO
        </button>

        {/* Locked vs Unlocked Toggle */}
        <div className="flex items-center gap-3 font-mono">
          {!initialViewOnly ? (
            <button
              id="sheet-lock-btn"
              onClick={() => setConfirmAction({ type: "toggle_lock", data: !isLocked })}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-[10px] uppercase font-bold border transition duration-150 cursor-pointer select-none ${
                isLocked
                  ? "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-700"
                  : "bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-950/40 hover:border-red-500/50"
              }`}
            >
              {isLocked ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>MODO_SEGURO : ATIVO</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Unlock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>EDICAO_LIVRE : MODIFICAR</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[10px] uppercase font-bold tracking-widest bg-black border border-zinc-800 px-4 py-2 rounded-lg text-zinc-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-650 inline-block"></span>
              MODO_VISUALIZADOR_TATICO
            </span>
          )}

          <button
            id="sheet-save-btn"
            onClick={handleGlobalSave}
            title="Salvar Ficha"
            className="flex items-center gap-1.5 bg-paranormal-crimson hover:bg-red-700 text-red-100 border border-paranormal-red text-[10px] font-mono font-bold px-4.5 py-2 rounded-lg transition uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(234,56,56,0.25)] hover:shadow-[0_0_20px_rgba(234,56,56,0.4)]"
          >
            <Save className="w-3.5 h-3.5" /> CONFIRMAR_GRAVACAO
          </button>
        </div>
      </div>

      {/* Basic Dossier Card header */}
      <section id="basics" className="bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black border border-neutral-800 hover:border-neutral-700/60 rounded-xl p-6 mb-8 text-left relative overflow-hidden transition-all duration-350 shadow-2xl backdrop-blur-sm">
        {/* Grungy backdrop label */}
        <div className="absolute top-3 right-5 font-mono text-[9px] text-zinc-600 opacity-40 select-none">
          SYSTEM_MEMBRANE_RECON • ORDO_REALITAS
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {/* Avatar Upload Frame with technical brackets */}
          <div className="relative w-28 h-28 mx-auto lg:mx-0 rounded-lg overflow-hidden bg-zinc-950 border border-neutral-800 group shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <img
              src={char.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
              alt={char.nome}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover grayscale opacity-65 group-hover:opacity-90 transition-all duration-350 ease-in-out scale-100 group-hover:scale-105"
            />
            
            {/* HUD Corner Tech Lines */}
            <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 border-t border-l border-red-500/60 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 border-t border-r border-red-500/60 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 border-b border-l border-red-500/60 pointer-events-none" />
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-b border-r border-red-500/60 pointer-events-none" />
            <div className="absolute top-2 left-2 bg-red-500/15 text-red-400 text-[6px] tracking-widest px-1 font-bold font-mono rounded opacity-50 uppercase">SYS_RCON</div>

            {(!isLocked || isMestre) && !initialViewOnly && (
              <button
                id="upload-avatar-trigger"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"
              >
                <Upload className="w-4 h-4 text-red-500 mb-1" />
                <span className="text-[7px] text-zinc-350 font-bold uppercase tracking-widest">Trocar Imagem</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Core dossier parameters block */}
          <div className="flex-1 w-full space-y-3">
            {/* Row 1: Name and NEX */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-850 pb-2">
              <div>
                {isLocked ? (
                  <h2 className="font-sans text-xl md:text-2xl font-black text-white tracking-wider uppercase">
                    {char.nome}
                  </h2>
                ) : (
                  <input
                    id="edit-char-nome"
                    type="text"
                    value={char.nome}
                    onChange={(e) => setChar({ ...char, nome: e.target.value })}
                    className="bg-black text-white text-xl font-bold font-mono border-b border-red-900/60 focus:outline-none focus:border-red-500 w-full"
                    placeholder="Nome do Personagem"
                  />
                )}
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                  Membro da Ordo Realitas investigado por: {char.jogador || "Mestre"}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[10px] uppercase text-zinc-400">Exposição [NEX]:</span>
                <div className="px-3 py-1 bg-red-950/20 border border-red-900/60 text-red-400 rounded-none font-bold text-base">
                  {isLocked ? (
                    <span>NEX {char.nex}%</span>
                  ) : (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-[9px]">NEX</span>
                      <input
                        id="edit-char-nex"
                        type="number"
                        min="0"
                        max="99"
                        value={char.nex}
                        onChange={(e) => setChar({ ...char, nex: parseInt(e.target.value) || 0 })}
                        className="bg-black text-center text-xs font-bold w-10 text-red-400 border border-transparent border-b-red-800 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Inputs or info blocks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Origem</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.origem}</p>
                ) : (
                  <select
                    id="edit-char-origem"
                    value={char.origem}
                    onChange={(e) => setChar({ ...char, origem: e.target.value })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 w-full text-[11px]"
                  >
                    {ORIGENS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Classe</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.classe}</p>
                ) : (
                  <select
                    id="edit-char-classe"
                    value={char.classe}
                    onChange={(e) => setChar({ ...char, classe: e.target.value })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 w-full text-[11px]"
                  >
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Patente</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.patente}</p>
                ) : (
                  <select
                    id="edit-char-patente"
                    value={char.patente}
                    onChange={(e) => setChar({ ...char, patente: e.target.value })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 w-full text-[11px]"
                  >
                    {PATENTES.map((pt) => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Deslocamento</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.deslocamento}</p>
                ) : (
                  <input
                    id="edit-char-desl"
                    type="text"
                    value={char.deslocamento}
                    onChange={(e) => setChar({ ...char, deslocamento: e.target.value })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 text-[11px] w-full focus:outline-none focus:border-red-900/65"
                  />
                )}
              </div>
            </div>

            {/* Row 3: Prestige and Effort Cap */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1 font-mono">
              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">PE Máximo por Rodada</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.peRodada} PE</p>
                ) : (
                  <input
                    id="edit-char-peround"
                    type="number"
                    value={char.peRodada}
                    onChange={(e) => setChar({ ...char, peRodada: parseInt(e.target.value) || 1 })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 text-[11px] w-full focus:outline-none focus:border-red-900/65"
                  />
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Pontos de Prestígio</span>
                {isLocked ? (
                  <p className="text-zinc-300 font-semibold text-xs">{char.prestigio} pts</p>
                ) : (
                  <input
                    id="edit-char-prestigio"
                    type="number"
                    value={char.prestigio}
                    onChange={(e) => setChar({ ...char, prestigio: parseInt(e.target.value) || 0 })}
                    className="bg-black border border-zinc-800 text-zinc-350 rounded-none p-1 text-[11px] w-full focus:outline-none focus:border-red-900/65"
                  />
                )}
              </div>

              {!isLocked && (
                <div className="space-y-0.5 col-span-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px]">Nome do Jogador / Condutor</span>
                  <input
                    id="edit-char-jogador"
                    type="text"
                    value={char.jogador}
                    onChange={(e) => setChar({ ...char, jogador: e.target.value })}
                    className="bg-black border border-zinc-800 text-zinc-300 rounded-none p-1 text-[11px] w-full focus:outline-none focus:border-red-900/65"
                    placeholder="Nome do condutor"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs list for mobile styling and adaptive clean display */}
      <div className="flex border-b border-neutral-800/80 mb-8 overflow-x-auto text-nowrap gap-2 font-mono pb-px">
        <button
          id="tab-combate-btn"
          onClick={() => setActiveTab("combate")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "combate"
              ? "border-paranormal-red text-red-400 bg-red-950/10 shadow-[inset_0_-8px_15px_-10px_#dc2626]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-red-500" /> Atributos e Combate
        </button>
        <button
          id="tab-pericias-btn"
          onClick={() => setActiveTab("pericias")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "pericias"
              ? "border-amber-600 text-amber-500 bg-amber-950/10 shadow-[inset_0_-8px_15px_-10px_#d97706]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <Dices className="w-3.5 h-3.5 text-amber-500" /> Perícias (28)
        </button>
        <button
          id="tab-habilidades-btn"
          onClick={() => setActiveTab("habilidades")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "habilidades"
              ? "border-amber-500 text-amber-400 bg-amber-950/10 shadow-[inset_0_-8px_15px_-10px_#f59e0b]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" /> Habilidades
        </button>
        <button
          id="tab-rituais-btn"
          onClick={() => setActiveTab("rituais")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "rituais"
              ? "border-cyan-600 text-cyan-400 bg-cyan-950/10 shadow-[inset_0_-8px_15px_-10px_#0891b2]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <Sparkle className="w-3.5 h-3.5 text-cyan-400" /> Rituais
        </button>
        <button
          id="tab-mochila-btn"
          onClick={() => setActiveTab("mochila")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "mochila"
              ? "border-teal-600 text-teal-400 bg-teal-950/10 shadow-[inset_0_-8px_15px_-10px_#0d9488]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-teal-400" /> Mochila
        </button>
        <button
          id="tab-historico-btn"
          onClick={() => setActiveTab("historico")}
          className={`flex items-center gap-2.5 py-3.5 px-5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-200 cursor-pointer rounded-t-xl ${
            activeTab === "historico"
              ? "border-purple-600 text-purple-400 bg-purple-950/10 shadow-[inset_0_-8px_15px_-10px_#800080]"
              : "border-transparent text-zinc-500 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Biografia
        </button>
      </div>

      {/* TAB CONTENT: COMBAT & STATS */}
      {activeTab === "combate" && (
        <div id="tab-combate-content" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quick Stats: PV, PE, SAN sidebar on desktop */}
          <div className="lg:col-span-5 space-y-6">
               {/* The golden three quick bars with rapid increment buttons */}
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/90 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-paranormal-red" />
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-850 pb-2.5 text-left flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-650 animate-pulse"></span>
                  Monitoramento de Sinais Vitais
                </span>
                <span className="text-[8px] text-zinc-500">MEMBRANA_STABLE : 1.0</span>
              </h3>

              {/* PONTOS DE VIDA (PV) */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between font-mono items-center">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 uppercase tracking-widest">
                    <Heart className={`w-3.5 h-3.5 fill-current text-red-650 ${char.pv.atual < char.pv.max * 0.35 ? 'animate-bounce' : ''}`} />
                    Pontos de Vida (PV)
                  </span>
                  <div className="flex items-center gap-2">
                    {char.pv.atual < char.pv.max * 0.35 && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-red-950/60 border border-red-800 text-red-400 font-bold uppercase tracking-widest rounded animate-pulse">CRÍTICO</span>
                    )}
                    <span className="text-white font-extrabold font-mono text-sm leading-none">
                      {char.pv.atual} <span className="text-neutral-600 font-normal">/</span> {char.pv.max}
                    </span>
                  </div>
                </div>
                {/* Large horizontal bar */}
                <div className="w-full h-3 bg-black/80 rounded-full border border-neutral-800 overflow-hidden relative p-0.5">
                  <div
                    className="bg-gradient-to-r from-red-650 to-red-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#dc2626]"
                    style={{ width: `${Math.min(100, Math.max(0, (char.pv.atual / char.pv.max) * 100))}%` }}
                  />
                </div>
                {/* Alter buttons */}
                <div className="flex gap-1 items-center pt-1 justify-between font-mono">
                  <div className="flex gap-1.5">
                    <button
                      id="pv-dec-5"
                      onClick={() => adjustStat("pv", -5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-red-450 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-red-500/30 cursor-pointer"
                      title="Perder 5 PV"
                    >
                      -5
                    </button>
                    <button
                      id="pv-dec-1"
                      onClick={() => adjustStat("pv", -1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-red-450 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-red-500/30 cursor-pointer"
                      title="Perder 1 PV"
                    >
                      -1
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      id="pv-inc-1"
                      onClick={() => adjustStat("pv", 1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Efetuar Cura 1 PV"
                    >
                      +1
                    </button>
                    <button
                      id="pv-inc-5"
                      onClick={() => adjustStat("pv", 5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Efetuar Cura 5 PV"
                    >
                      +5
                    </button>
                  </div>
                  {!isLocked && (
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-neutral-800 text-[9px]">
                      <button id="pv-max-dec" type="button" onClick={() => adjustMaxStat("pv", -2)} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                      <span className="text-zinc-400">Max</span>
                      <button id="pv-max-inc" type="button" onClick={() => adjustMaxStat("pv", 2)} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                    </div>
                  )}
                </div>
              </div>

              {/* SANIDADE (SAN) */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between font-mono items-center">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    <Brain className={`w-3.5 h-3.5 fill-current text-cyan-500 ${char.san.atual < char.san.max * 0.30 ? 'animate-pulse' : ''}`} />
                    Sanidade (SAN)
                  </span>
                  <div className="flex items-center gap-2">
                    {char.san.atual < char.san.max * 0.30 && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-cyan-950/60 border border-cyan-800 text-cyan-400 font-bold uppercase tracking-widest rounded animate-pulse">PERTURBADO</span>
                    )}
                    <span className="text-white font-extrabold font-mono text-sm leading-none">
                      {char.san.atual} <span className="text-neutral-600 font-normal">/</span> {char.san.max}
                    </span>
                  </div>
                </div>
                {/* Large horizontal bar */}
                <div className="w-full h-3 bg-black/80 rounded-full border border-neutral-800 overflow-hidden relative p-0.5">
                  <div
                    className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#06b6d4]"
                    style={{ width: `${Math.min(100, Math.max(0, (char.san.atual / char.san.max) * 100))}%` }}
                  />
                </div>
                {/* Alter buttons */}
                <div className="flex gap-1 items-center pt-1 justify-between font-mono">
                  <div className="flex gap-1.5">
                    <button
                      id="san-dec-5"
                      onClick={() => adjustStat("san", -5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-cyan-405 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-cyan-500/30 cursor-pointer"
                      title="Perder 5 Sanidade"
                    >
                      -5
                    </button>
                    <button
                      id="san-dec-1"
                      onClick={() => adjustStat("san", -1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-cyan-405 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-cyan-500/30 cursor-pointer"
                      title="Perder 1 Sanidade"
                    >
                      -1
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      id="san-inc-1"
                      onClick={() => adjustStat("san", 1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Recuperar 1 Sanidade"
                    >
                      +1
                    </button>
                    <button
                      id="san-inc-5"
                      onClick={() => adjustStat("san", 5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Recuperar 5 Sanidade"
                    >
                      +5
                    </button>
                  </div>
                  {!isLocked && (
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-neutral-800 text-[9px]">
                      <button id="san-max-dec" type="button" onClick={() => adjustMaxStat("san", -5)} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                      <span className="text-zinc-400">Max</span>
                      <button id="san-max-inc" type="button" onClick={() => adjustMaxStat("san", 5)} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                    </div>
                  )}
                </div>
              </div>

              {/* PONTOS DE ESFORÇO (PE) */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between font-mono items-center">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest">
                    <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                    Pontos de Esforço (PE)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold font-mono text-sm leading-none">
                      {char.pe.atual} <span className="text-neutral-600 font-normal">/</span> {char.pe.max}
                    </span>
                  </div>
                </div>
                {/* Large horizontal bar */}
                <div className="w-full h-3 bg-black/80 rounded-full border border-neutral-800 overflow-hidden relative p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#f59e0b]"
                    style={{ width: `${Math.min(100, Math.max(0, (char.pe.atual / char.pe.max) * 100))}%` }}
                  />
                </div>
                {/* Alter buttons */}
                <div className="flex gap-1 items-center pt-1 justify-between font-mono">
                  <div className="flex gap-1.5">
                    <button
                      id="pe-dec-5"
                      onClick={() => adjustStat("pe", -5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-amber-500 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-amber-500/30 cursor-pointer"
                      title="Gastar 5 PE"
                    >
                      -5
                    </button>
                    <button
                      id="pe-dec-1"
                      onClick={() => adjustStat("pe", -1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-amber-500 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-amber-500/30 cursor-pointer"
                      title="Gastar 1 PE (Ritual/Poder)"
                    >
                      -1
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      id="pe-inc-1"
                      onClick={() => adjustStat("pe", 1)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-3 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Restaurar 1 PE"
                    >
                      +1
                    </button>
                    <button
                      id="pe-inc-5"
                      onClick={() => adjustStat("pe", 5)}
                      className="bg-zinc-900/95 border border-neutral-800 hover:bg-neutral-800 text-emerald-400 hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition hover:border-emerald-500/30 cursor-pointer"
                      title="Restaurar 5 PE"
                    >
                      +5
                    </button>
                  </div>
                  {!isLocked && (
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-neutral-800 text-[9px]">
                      <button id="pe-max-dec" type="button" onClick={() => adjustMaxStat("pe", -2)} className="text-zinc-500 hover:text-white px-1 font-bold">-</button>
                      <span className="text-zinc-400">Max</span>
                      <button id="pe-max-inc" type="button" onClick={() => adjustMaxStat("pe", 2)} className="text-zinc-500 hover:text-white px-1 font-bold">+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DEFESA CALCULATION BOX */}
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-none p-5 text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  Cálculo de Defesa Geral
                </h3>
              </div>

              <div className="flex items-center gap-4 justify-between bg-black/30 p-4 rounded-none border border-zinc-850">
                <div className="font-mono space-y-1">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Fórmula de Sobrevivência</div>
                  <div className="text-xs text-neutral-305 text-nowrap">
                    10 (Base) + {char.defesa.agi} (AGI) + {char.defesa.equip} (Equip) + {char.defesa.outros} (Outros)
                  </div>
                </div>
                <div className="text-center bg-paranormal-red/10 border border-paranormal-red rounded-lg py-2 px-4 shadow-[0_0_10px_rgba(234,56,56,0.15)]">
                  <span className="text-[8px] uppercase tracking-wider block font-bold text-neutral-400">Total</span>
                  <span className="text-2xl font-mono font-bold text-white">{char.defesa.total}</span>
                </div>
              </div>

              {/* Defense adjustable parameters under unlocked view */}
              {!isLocked && (
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 space-y-1">
                    <span className="text-[9px] text-neutral-500">EQUIP</span>
                    <div className="flex justify-center items-center gap-2">
                      <button id="def-equip-dec" type="button" onClick={() => adjustDefenseSegment("equip", -1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">-</button>
                      <span className="text-white font-semibold text-xs">{char.defesa.equip}</span>
                      <button id="def-equip-inc" type="button" onClick={() => adjustDefenseSegment("equip", 1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">+</button>
                    </div>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 space-y-1">
                    <span className="text-[9px] text-neutral-500">OUTROS</span>
                    <div className="flex justify-center items-center gap-2">
                      <button id="def-other-dec" type="button" onClick={() => adjustDefenseSegment("outros", -1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">-</button>
                      <span className="text-white font-semibold text-xs">{char.defesa.outros}</span>
                      <button id="def-other-inc" type="button" onClick={() => adjustDefenseSegment("outros", 1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">+</button>
                    </div>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-800 space-y-1">
                    <span className="text-[9px] text-neutral-500">BASE</span>
                    <div className="flex justify-center items-center gap-2">
                      <button id="def-base-dec" type="button" onClick={() => adjustDefenseSegment("base", -1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">-</button>
                      <span className="text-white font-semibold text-xs">{char.defesa.base}</span>
                      <button id="def-base-inc" type="button" onClick={() => adjustDefenseSegment("base", 1)} className="text-neutral-400 hover:text-white font-bold h-5 w-5 bg-neutral-800 hover:bg-neutral-750 font-serif leading-none rounded">+</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Text descriptions of defenses & resistances */}
              <div className="space-y-3.5 pt-2 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Proteção Equipada</span>
                  {isLocked ? (
                    <p className="p-2.5 bg-black/40 border border-neutral-900 rounded font-mono text-neutral-300 min-h-[34px]">
                      {char.protecao || "Nenhuma proteção relatada."}
                    </p>
                  ) : (
                    <input
                      id="edit-char-protecao"
                      type="text"
                      value={char.protecao}
                      placeholder="ex: Colete Leve"
                      onChange={(e) => setChar({ ...char, protecao: e.target.value })}
                      className="bg-black border border-neutral-800 text-neutral-200 rounded p-2 text-xs font-mono w-full focus:outline-none focus:border-paranormal-red"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">Resistências Ocultas / Danos</span>
                  {isLocked ? (
                    <p className="p-2.5 bg-black/40 border border-neutral-900 rounded font-mono text-neutral-300 min-h-[34px]">
                      {char.resistencias || "Nenhuma resistência relatada."}
                    </p>
                  ) : (
                    <input
                      id="edit-char-res"
                      type="text"
                      value={char.resistencias}
                      placeholder="ex: Conhecimento 5, Sangue 2"
                      onChange={(e) => setChar({ ...char, resistencias: e.target.value })}
                      className="bg-black border border-neutral-800 text-neutral-200 rounded p-2 text-xs font-mono w-full focus:outline-none focus:border-paranormal-red"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Core circular attributes layout on left */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Pentagon/Circular visual representation */}
            <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-paranormal-border/50 pb-2 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-paranormal-red" />
                  <h3 className="font-horror text-sm tracking-widest text-neutral-300">
                    Selo de Atributos Paranormais
                  </h3>
                </div>
                {isLocked && (
                  <span className="text-[10px] bg-paranormal-red/10 text-paranormal-red px-2 py-0.5 rounded border border-paranormal-red/30 animate-pulse font-bold uppercase tracking-wider">
                    Modo Rolar Ativo 🩸
                  </span>
                )}
              </div>

              {/* Attribute wheel/grid wrapper */}
              <div className="relative w-full max-w-sm aspect-square flex items-center justify-center py-6 select-none">
                {/* Visual Occult seal spinning backdrop */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.16] animate-[spin_100s_linear_infinite]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3 2" />
                  <circle cx="50" cy="50" r="40" stroke="#ef4444" strokeWidth="0.25" />
                  <path d="M50 10 L28 82 L85 38 L15 38 L72 82 Z" stroke="#ef4444" strokeWidth="0.75" />
                  <circle cx="50" cy="50" r="18" stroke="#ef4444" strokeWidth="0.3" strokeDasharray="1 1" />
                </svg>

                <div className="absolute inset-0 m-auto w-52 h-52 rounded-full border border-dashed border-neutral-900/50 flex items-center justify-center opacity-70 pointer-events-none">
                  <div className="w-36 h-36 rounded-full border border-neutral-950 border-double flex flex-col items-center justify-center p-4">
                     <Skull className="w-11 h-11 text-neutral-950/40" />
                     <span className="typewriter-font text-[6px] text-neutral-800 tracking-widest block uppercase mt-1">Ordo Realitas</span>
                  </div>
                </div>

                {/* Grid layout for responsive attributes - standard bento shape or wheel */}
                {/* Positioned exactly like standard sheet pentagon */}
                <div className="grid grid-cols-12 gap-4 w-full h-full relative z-10 font-mono text-center">
                  
                  {/* AGILIDADE - TOP CENTER CARD */}
                  <div className="col-span-12 flex justify-center pb-2">
                    <div 
                      onClick={() => isLocked && handleRollAttribute("AGI", "Agilidade (AGI)")}
                      className={`w-36 p-2 rounded-xl border flex flex-col items-center justify-between transition relative shadow-xl backdrop-blur-sm ${
                        isLocked 
                          ? "bg-zinc-950/90 hover:bg-red-955/10 border-neutral-800 hover:border-paranormal-red cursor-pointer hover:scale-105 active:scale-95" 
                          : "bg-black border-neutral-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5"><Sparkle className="w-2.5 h-2.5 text-zinc-500" /> Agilidade</span>
                      <span className="text-3xl font-bold text-white my-0.5">{char.atributos.AGI}</span>
                      
                      {/* Interactive pip dots matching active rule */}
                      <div className="flex gap-1 mb-1.5 justify-center">
                        {char.atributos.AGI > 0 ? (
                          Array.from({ length: char.atributos.AGI }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-650 shadow-[0_0_6px_#ef4444] animate-pulse inline-block" />
                          ))
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                          </>
                        )}
                      </div>

                      <span className="text-[9px] uppercase font-bold text-paranormal-gold tracking-widest bg-neutral-900/85 border border-neutral-850 px-2 py-0.5 rounded-full">AGI</span>
                      
                      {/* +/- handles under unlocked */}
                      {!isLocked && (
                        <div className="flex gap-2.5 mt-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <button id="agi-dec" type="button" onClick={() => adjustAttribute("AGI", -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                          <span className="text-[10px] text-neutral-500 block uppercase">Alterar</span>
                          <button id="agi-inc" type="button" onClick={() => adjustAttribute("AGI", 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FORÇA (Left upper middle) */}
                  <div className="col-span-6 flex justify-start pl-2">
                    <div 
                      onClick={() => isLocked && handleRollAttribute("FOR", "Força (FOR)")}
                      className={`w-36 p-2 rounded-xl border flex flex-col items-center justify-between transition relative shadow-xl backdrop-blur-sm ${
                        isLocked 
                          ? "bg-zinc-950/90 hover:bg-red-955/10 border-neutral-800 hover:border-paranormal-red cursor-pointer hover:scale-105 active:scale-95" 
                          : "bg-black border-neutral-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5"><Flame className="w-2.5 h-2.5 text-zinc-500" /> Força</span>
                      <span className="text-3xl font-bold text-white my-0.5">{char.atributos.FOR}</span>
                      
                      {/* Interactive pip dots matching active rule */}
                      <div className="flex gap-1 mb-1.5 justify-center">
                        {char.atributos.FOR > 0 ? (
                          Array.from({ length: char.atributos.FOR }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-650 shadow-[0_0_6px_#ef4444] animate-pulse inline-block" />
                          ))
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                          </>
                        )}
                      </div>

                      <span className="text-[9px] uppercase font-bold text-paranormal-gold tracking-widest bg-neutral-900/85 border border-neutral-850 px-2 py-0.5 rounded-full">FOR</span>
                      
                      {!isLocked && (
                        <div className="flex gap-2.5 mt-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <button id="for-dec" type="button" onClick={() => adjustAttribute("FOR", -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                          <span className="text-[10px] text-neutral-500 block uppercase">Alterar</span>
                          <button id="for-inc" type="button" onClick={() => adjustAttribute("FOR", 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INTELECTO (Right upper middle) */}
                  <div className="col-span-6 flex justify-end pr-2">
                    <div 
                      onClick={() => isLocked && handleRollAttribute("INT", "Intelecto (INT)")}
                      className={`w-36 p-2 rounded-xl border flex flex-col items-center justify-between transition relative shadow-xl backdrop-blur-sm ${
                        isLocked 
                          ? "bg-zinc-950/90 hover:bg-red-955/10 border-neutral-800 hover:border-paranormal-red cursor-pointer hover:scale-105 active:scale-95" 
                          : "bg-black border-neutral-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5"><Brain className="w-2.5 h-2.5 text-zinc-500" /> Intelecto</span>
                      <span className="text-3xl font-bold text-white my-0.5">{char.atributos.INT}</span>
                      
                      {/* Interactive pip dots matching active rule */}
                      <div className="flex gap-1 mb-1.5 justify-center">
                        {char.atributos.INT > 0 ? (
                          Array.from({ length: char.atributos.INT }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-650 shadow-[0_0_6px_#ef4444] animate-pulse inline-block" />
                          ))
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                          </>
                        )}
                      </div>

                      <span className="text-[9px] uppercase font-bold text-paranormal-gold tracking-widest bg-neutral-900/85 border border-neutral-850 px-2 py-0.5 rounded-full">INT</span>
                      
                      {!isLocked && (
                        <div className="flex gap-2.5 mt-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <button id="int-dec" type="button" onClick={() => adjustAttribute("INT", -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                          <span className="text-[10px] text-neutral-500 block uppercase">Alterar</span>
                          <button id="int-inc" type="button" onClick={() => adjustAttribute("INT", 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRESENÇA (Left lower middle) */}
                  <div className="col-span-6 flex justify-start pl-2 pt-2">
                    <div 
                      onClick={() => isLocked && handleRollAttribute("PRE", "Presença (PRE)")}
                      className={`w-36 p-2 rounded-xl border flex flex-col items-center justify-between transition relative shadow-xl backdrop-blur-sm ${
                        isLocked 
                          ? "bg-zinc-950/90 hover:bg-red-955/10 border-neutral-800 hover:border-paranormal-red cursor-pointer hover:scale-105 active:scale-95" 
                          : "bg-black border-neutral-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5"><Eye className="w-2.5 h-2.5 text-zinc-500" /> Presença</span>
                      <span className="text-3xl font-bold text-white my-0.5">{char.atributos.PRE}</span>
                      
                      {/* Interactive pip dots matching active rule */}
                      <div className="flex gap-1 mb-1.5 justify-center">
                        {char.atributos.PRE > 0 ? (
                          Array.from({ length: char.atributos.PRE }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-650 shadow-[0_0_6px_#ef4444] animate-pulse inline-block" />
                          ))
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                          </>
                        )}
                      </div>

                      <span className="text-[9px] uppercase font-bold text-paranormal-gold tracking-widest bg-neutral-900/85 border border-neutral-850 px-2 py-0.5 rounded-full">PRE</span>
                      
                      {!isLocked && (
                        <div className="flex gap-2.5 mt-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <button id="pre-dec" type="button" onClick={() => adjustAttribute("PRE", -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                          <span className="text-[10px] text-neutral-500 block uppercase">Alterar</span>
                          <button id="pre-inc" type="button" onClick={() => adjustAttribute("PRE", 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VIGOR (Right lower middle) */}
                  <div className="col-span-6 flex justify-end pr-2 pt-2">
                    <div 
                      onClick={() => isLocked && handleRollAttribute("VIG", "Vigor (VIG)")}
                      className={`w-36 p-2 rounded-xl border flex flex-col items-center justify-between transition relative shadow-xl backdrop-blur-sm ${
                        isLocked 
                          ? "bg-zinc-950/90 hover:bg-red-955/10 border-neutral-800 hover:border-paranormal-red cursor-pointer hover:scale-105 active:scale-95" 
                          : "bg-black border-neutral-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-1.5"><Shield className="w-2.5 h-2.5 text-zinc-500" /> Vigor</span>
                      <span className="text-3xl font-bold text-white my-0.5">{char.atributos.VIG}</span>
                      
                      {/* Interactive pip dots matching active rule */}
                      <div className="flex gap-1 mb-1.5 justify-center">
                        {char.atributos.VIG > 0 ? (
                          Array.from({ length: char.atributos.VIG }).map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-650 shadow-[0_0_6px_#ef4444] animate-pulse inline-block" />
                          ))
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full border border-neutral-700 inline-block" />
                          </>
                        )}
                      </div>

                      <span className="text-[9px] uppercase font-bold text-paranormal-gold tracking-widest bg-neutral-900/85 border border-neutral-850 px-2 py-0.5 rounded-full">VIG</span>
                      
                      {!isLocked && (
                        <div className="flex gap-2.5 mt-2 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          <button id="vig-dec" type="button" onClick={() => adjustAttribute("VIG", -1)} className="text-neutral-400 hover:text-white font-bold text-xs">-</button>
                          <span className="text-[10px] text-neutral-500 block uppercase">Alterar</span>
                          <button id="vig-inc" type="button" onClick={() => adjustAttribute("VIG", 1)} className="text-neutral-400 hover:text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
              <p className="text-[10px] text-neutral-500 mt-2 italic text-center max-w-sm">
                No Ordem Paranormal, você joga d20s correspondentes ao valor do atributo e se agarra ao maior resultado. Se o atributo for zero, rola 2 d20s e se resigna ao menor.
              </p>
            </div>

            {/* WEAPONS & ATTACKS REVOLVER TABLE */}
            <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 text-left flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-paranormal-red" />
                    <h3 className="font-horror text-sm tracking-widest text-neutral-300">
                    Ataques e Investidas de Combate
                    </h3>
                  </div>
                  {isLocked && (
                    <span className="text-[10px] bg-red-950/40 text-paranormal-red border border-paranormal-red/20 rounded px-1.5 py-0.5 font-bold uppercase">
                      Clique em Teste para Rolar 🧪
                    </span>
                  )}
                </div>

                {/* Grid list representing table */}
                <div id="attacks-rows" className="space-y-3.5 mb-6">
                  {char.ataques.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic p-3 text-center border border-dashed border-neutral-800 rounded bg-black/20">
                      Nenhum ataque ou arma de inquisição reportado nesta ficha técnica.
                    </p>
                  ) : (
                    char.ataques.map((atk) => (
                      <div
                        id={`atk-row-${atk.id}`}
                        key={atk.id}
                        className="bg-black/80 border border-neutral-900 rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-3 relative hover:border-neutral-700 transition"
                      >
                        {/* Remove button only when unlocked */}
                        {!isLocked && (
                          <button
                            id={`del-atk-${atk.id}`}
                            type="button"
                            onClick={() => handleRemoveAttack(atk.id)}
                            className="absolute top-1.5 right-1.5 text-neutral-600 hover:text-paranormal-red p-1 rounded transition"
                            title="Remover Arma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="md:col-span-4 text-left">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-bold block">Arma / Golpe</span>
                          <span className="text-xs font-bold text-white font-mono">{atk.nome}</span>
                        </div>

                        <div className="md:col-span-3 text-left">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-bold block mb-0.5">Teste</span>
                          {isLocked ? (
                            <button
                              id={`roll-atk-${atk.id}`}
                              onClick={() => handleRollAttack(atk)}
                              className="bg-paranormal-crimson/15 hover:bg-paranormal-red text-paranormal-red hover:text-white px-2.5 py-1 text-[10px] border border-paranormal-red/30 hover:border-transparent font-mono rounded font-bold cursor-pointer transition flex items-center gap-1.5"
                            >
                              <Dices className="w-3" /> {atk.teste}
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-300 font-mono block p-1">{atk.teste}</span>
                          )}
                        </div>

                        <div className="md:col-span-2 text-left font-mono">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-bold block">Dano</span>
                          <span className="text-xs text-red-500 font-bold">{atk.dano}</span>
                        </div>

                        <div className="md:col-span-3 text-left font-mono">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500 block">Crítico / Alcance</span>
                          <span className="text-[10px] text-neutral-400 block">{atk.critico} • {atk.alcance}</span>
                        </div>

                        {atk.especial && (
                          <div className="col-span-12 pt-1 border-t border-neutral-900 text-[10px] text-left text-neutral-400 italic">
                            Especial: <span className="font-semibold">{atk.especial}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Attack Form in unlocked mode */}
              {!isLocked && (
                <form onSubmit={handleAddAttackLocal} className="bg-black/60 p-3 rounded-lg border border-neutral-900 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  <div className="col-span-2 text-left">
                    <input
                      id="net-atk-nome"
                      type="text"
                      required
                      placeholder="Nome ex: Fuzil FAL"
                      value={newAttack.nome}
                      onChange={(e) => setNewAttack({ ...newAttack, nome: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                  <div className="text-left">
                    <input
                      id="net-atk-teste"
                      type="text"
                      placeholder="Teste ex: AGI + 5"
                      value={newAttack.teste}
                      onChange={(e) => setNewAttack({ ...newAttack, teste: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                  <div className="text-left">
                    <input
                      id="net-atk-dano"
                      type="text"
                      placeholder="Dano ex: 2d10"
                      value={newAttack.dano}
                      onChange={(e) => setNewAttack({ ...newAttack, dano: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                  <div className="text-left">
                    <input
                      id="net-atk-critico"
                      type="text"
                      placeholder="Crítico"
                      value={newAttack.critico}
                      onChange={(e) => setNewAttack({ ...newAttack, critico: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <button
                      id="add-atk-local-btn"
                      type="submit"
                      className="w-full bg-paranormal-crimson hover:bg-paranormal-red text-white py-1 rounded font-serif text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                      Anotar Arma
                    </button>
                  </div>
                  <div className="col-span-2 md:col-span-3 text-left">
                    <input
                      id="net-atk-alcance"
                      type="text"
                      placeholder="Alcance"
                      value={newAttack.alcance}
                      onChange={(e) => setNewAttack({ ...newAttack, alcance: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-3 text-left">
                    <input
                      id="net-atk-especial"
                      type="text"
                      placeholder="Especial"
                      value={newAttack.especial}
                      onChange={(e) => setNewAttack({ ...newAttack, especial: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded p-1 w-full text-[11px] font-mono outline-none"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: SKILLS (PERÍCIAS) */}
      {activeTab === "pericias" && (
        <div id="tab-pericias-content" className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-3 mb-6">
            <div className="space-y-0.5">
              <h2 className="font-horror text-lg tracking-widest text-white uppercase">Dossiê de Perícias (28)</h2>
              <p className="text-xs text-neutral-500 font-medium">Bônus Total = (Treinada ? +5 : 0) + Outros Equipamentos / Bônus</p>
            </div>
            {isLocked && (
              <span className="text-xs font-bold text-paranormal-red bg-paranormal-red/10 border border-paranormal-red/20 px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 uppercase font-mono self-start md:self-auto">
                <Dices className="w-3.5 h-3.5 animate-bounce" /> Clique em Rolar para disparar dados! 🩸
              </span>
            )}
          </div>

          {/* Grungy responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {char.pericias.map((p, idx) => {
              const totalBonus = (p.treinada ? 5 : 0) + p.outros;
              const isTrainedClass = p.treinada ? "text-paranormal-gold" : "text-neutral-505";

              return (
                <div
                  id={`skill-row-${p.nome}`}
                  key={p.nome}
                  className="bg-black/50 hover:bg-black border border-neutral-900 hover:border-neutral-800 rounded-lg p-2.5 flex items-center justify-between gap-2.5 transition group"
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox trained */}
                    {isLocked ? (
                      <div className={`text-xs ${p.treinada ? "text-paranormal-gold" : "text-neutral-700"}`} title={p.treinada ? "Treinada (+5)" : "Não Treinada"}>
                        <UserCheck className={`w-4 h-4 ${p.treinada ? "opacity-100" : "opacity-20"}`} />
                      </div>
                    ) : (
                      <input
                        id={`skill-check-${p.nome}`}
                        type="checkbox"
                        checked={p.treinada}
                        onChange={() => handleTogglePericiaTreinada(idx)}
                        className="w-4 h-4 rounded border-neutral-800 accent-paranormal-red cursor-pointer"
                        title="Marcar como Treinada (+5)"
                      />
                    )}

                    <div className="text-left font-mono">
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-white leading-tight">
                        {p.nome}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-bold block leading-none mt-0.5">
                        Relacionado: <span className="text-neutral-400 font-semibold">{p.atributo}</span>
                      </span>
                    </div>
                  </div>

                  {/* Calculations and trigger roll */}
                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono pr-1 border-r border-neutral-900">
                      <span className="text-[8px] uppercase tracking-wider text-neutral-550 block font-bold">Bônus</span>
                      {isLocked ? (
                        <span className="text-xs font-bold text-paranormal-gold font-mono block">
                          {totalBonus >= 0 ? `+${totalBonus}` : totalBonus}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-white">
                          <button id={`skill-bonus-dec-${idx}`} type="button" onClick={() => handleAdjustPericiaOutros(idx, -1)} className="text-neutral-500 hover:text-white px-1 leading-none font-sans font-bold">-</button>
                          <span className="font-bold text-neutral-300 min-w-[14px] text-center">{p.outros}</span>
                          <button id={`skill-bonus-inc-${idx}`} type="button" onClick={() => handleAdjustPericiaOutros(idx, 1)} className="text-neutral-500 hover:text-white px-1 leading-none font-sans font-bold">+</button>
                        </div>
                      )}
                    </div>

                    {isLocked ? (
                      <button
                        id={`skill-roll-btn-${p.nome}`}
                        onClick={() => handleRollPericia(p)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-paranormal-red hover:bg-paranormal-red/10 text-neutral-30s hover:text-white rounded px-2 py-1 text-[10px] font-bold font-serif leading-none uppercase flex items-center gap-1 transition cursor-pointer"
                        title={`Disparar teste de ${p.nome}`}
                      >
                        <Dices className="w-3 text-paranormal-red" /> Rolar
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-600 block uppercase p-1">Completo</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: HABILIDADES */}
      {activeTab === "habilidades" && (
        <div id="tab-habilidades-content" className="space-y-4 text-left">
          <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-300 uppercase">
                  Habilidades de Classe & Origem
                </h3>
              </div>
              
              {!isLocked && (
                <button
                  id="add-habilidade-btn"
                  type="button"
                  onClick={() => {
                    setWizardName("");
                    setWizardCusto("1 PE");
                    setWizardDescricao("");
                    setConfirmAction({ type: "add_ability_wizard" });
                  }}
                  className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" /> Adicionar Habilidade
                </button>
              )}
            </div>

            {/* Grid layout for Abilities Cards */}
            <div id="abilities-box-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {char.habilidadesRituais.filter(hab => !isRitual(hab)).length === 0 ? (
                <p className="col-span-full text-xs text-neutral-500 italic text-center p-8 border border-dashed border-neutral-800 rounded bg-black/10">
                  Nenhuma habilidade singular cadastrada para este agente. Destrave a ficha para registrar.
                </p>
              ) : (
                char.habilidadesRituais.filter(hab => !isRitual(hab)).map((hab) => {
                  return (
                    <div
                      id={`ability-card-${hab.id}`}
                      key={hab.id}
                      className="bg-zinc-950/80 border border-neutral-800/80 rounded-2xl p-5 space-y-4 relative hover:border-amber-500/35 transition duration-300 flex flex-col justify-between shadow-lg overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-550" />
                      
                      {/* Card Header area */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-left w-full">
                            {isLocked ? (
                              <h4 className="font-horror text-sm tracking-widest text-amber-500 uppercase font-bold">
                                {hab.nome || "Habilidade Sem Nome"}
                              </h4>
                            ) : (
                              <input
                                type="text"
                                value={hab.nome}
                                onChange={(e) => handleUpdateAbilityHeader(hab.id, "nome", e.target.value)}
                                className="bg-black/90 font-horror text-xs text-amber-500 border border-neutral-800 px-2 py-1 rounded focus:outline-none focus:border-amber-500 uppercase w-full"
                                placeholder="Nome da habilidade"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            {!isLocked && (
                              <button
                                id={`del-ability-${hab.id}`}
                                type="button"
                                onClick={() => setConfirmAction({ type: "delete_ability", data: { id: hab.id, nome: hab.nome } })}
                                className="text-neutral-600 hover:text-paranormal-red p-1 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                                title="Remover Habilidade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-neutral-900/60 text-[10px] font-mono text-neutral-400 flex items-center justify-between bg-black/35 p-2.5 border border-neutral-900/80 rounded-xl">
                          <div>
                            <span className="text-zinc-[500] uppercase text-[8px] font-bold block mb-0.5 tracking-widest">Custo de Ativação</span>
                            {isLocked ? (
                              <span className="font-semibold text-amber-500 font-mono text-xs">{hab.custo || "0 PE"}</span>
                            ) : (
                              <input
                                id={`edit-ability-cost-${hab.id}`}
                                type="text"
                                onClick={(e) => e.stopPropagation()}
                                value={hab.custo}
                                onChange={(e) => handleUpdateAbilityHeader(hab.id, "custo", e.target.value)}
                                className="bg-black border border-neutral-850 text-amber-500 px-2.5 py-0.5 mt-0.5 rounded outline-none w-28 text-[11px] font-bold"
                                placeholder="Ex: 1 PE"
                              />
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-[500] uppercase text-[8px] font-bold block mb-0.5 tracking-widest">Tipo</span>
                            <span className="text-[10px] bg-amber-550/10 text-amber-500 border border-amber-550/30 px-2 py-0.5 rounded-full font-bold">HABILIDADE</span>
                          </div>
                        </div>
                      </div>

                      {/* Full-width description editor, permanently visible */}
                      <div className="pt-2 border-t border-neutral-900/40 text-xs text-neutral-300">
                        <RichTextEditor
                          id={`ability-body-${hab.id}`}
                          value={hab.descricao}
                          onChange={(text) => handleUpdateAbilityDesc(hab.id, text)}
                          placeholder="Fórmula ou descrição detalhada da habilidade..."
                          readOnly={isLocked}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: RITUAIS */}
        {activeTab === "rituais" && (
        <div id="tab-rituais-content" className="space-y-4 text-left">
          <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-300 uppercase">
                  Manifestações e Rituais Ocultistas
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-neutral-850 rounded">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">DT Rituais:</span>
                  {isLocked ? (
                    <span className="text-xs font-mono font-bold text-paranormal-gold">{char.dtRituais || "10"}</span>
                  ) : (
                    <input
                      id="edit-dt-rituais"
                      type="text"
                      value={char.dtRituais}
                      onChange={(e) => setChar({ ...char, dtRituais: e.target.value })}
                      placeholder="DT"
                      className="bg-black text-center text-xs font-bold text-paranormal-gold w-8 border-b border-paranormal-gold outline-none"
                    />
                  )}
                </div>

                {!isLocked && (
                  <button
                    id="add-ritual-btn"
                    type="button"
                    onClick={() => {
                      setWizardName("");
                      setWizardCusto("1 PE");
                      setWizardElemento("Morte");
                      setWizardDescricao("");
                      setConfirmAction({ type: "add_ritual_wizard" });
                    }}
                    className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/40 text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" /> Adicionar Ritual
                  </button>
                )}
              </div>
            </div>

            {/* Grid layout for Ritual Cards */}
            <div id="rituals-box-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {char.habilidadesRituais.filter(isRitual).length === 0 ? (
                <p className="col-span-full text-xs text-neutral-500 italic text-center p-8 border border-dashed border-neutral-800 rounded bg-black/10">
                  Nenhum ritual sob possessão deste agente. Destrave a ficha para registrar.
                </p>
              ) : (
                char.habilidadesRituais.filter(isRitual).map((hab) => {
                  // Helper color mapping for paranormal elements
                  const getElementColors = (elem: string) => {
                    const e = (elem || "").toLowerCase();
                    if (e === "sangue") return { text: "text-red-500", border: "border-red-900/50 hover:border-red-500/40", bg: "bg-red-550/10", tagBg: "bg-red-950/30 text-red-400 border-red-900/40", accent: "bg-red-600" };
                    if (e === "energia") return { text: "text-amber-400", border: "border-amber-900/50 hover:border-amber-400/40", bg: "bg-amber-400/10", tagBg: "bg-amber-950/30 text-amber-400 border-amber-900/40", accent: "bg-amber-500" };
                    if (e === "conhecimento") return { text: "text-yellow-550", border: "border-yellow-900/50 hover:border-yellow-550/40", bg: "bg-yellow-550/10", tagBg: "bg-yellow-950/30 text-yellow-550 border-yellow-900/40", accent: "bg-yellow-600" };
                    if (e === "medo") return { text: "text-violet-400", border: "border-purple-900/50 hover:border-purple-500/40", bg: "bg-purple-900/10", tagBg: "bg-purple-950/30 text-violet-400 border-purple-900/40", accent: "bg-violet-600" };
                    return { text: "text-neutral-400", border: "border-neutral-800 hover:border-cyan-500/30", bg: "bg-neutral-900/20", tagBg: "bg-neutral-950/30 text-neutral-400 border-neutral-800", accent: "bg-neutral-600" }; // Morte
                  };

                  const colors = getElementColors(hab.elemento || "Morte");

                  return (
                    <div
                      id={`ritual-card-${hab.id}`}
                      key={hab.id}
                      className={`bg-zinc-950/90 border rounded-2xl p-5 space-y-4 relative transition duration-355 flex flex-col justify-between shadow-xl overflow-hidden ${colors.border}`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${colors.accent}`} />
                      
                      {/* Card Header area */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="text-left w-full">
                            {isLocked ? (
                              <h4 className="font-horror text-sm tracking-widest text-cyan-400 uppercase font-bold text-left">
                                {hab.nome || "Ritual Ocultista"}
                              </h4>
                            ) : (
                              <input
                                type="text"
                                value={hab.nome}
                                onChange={(e) => handleUpdateAbilityHeader(hab.id, "nome", e.target.value)}
                                className="bg-black/90 font-horror text-xs text-cyan-400 border border-neutral-800 px-2 py-1 rounded focus:outline-none focus:border-cyan-500 uppercase w-full"
                                placeholder="Nome do ritual"
                              />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 font-mono">
                            {!isLocked && (
                              <button
                                id={`del-ritual-${hab.id}`}
                                type="button"
                                onClick={() => setConfirmAction({ type: "delete_ritual", data: { id: hab.id, nome: hab.nome } })}
                                className="text-neutral-600 hover:text-paranormal-red p-1 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                                title="Remover Ritual"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-neutral-900/60 text-[10px] font-mono text-neutral-400 bg-black/35 p-2.5 border border-neutral-900/80 rounded-xl">
                          <div>
                            <span className="text-zinc-[500] uppercase text-[8px] font-bold block mb-0.5 tracking-widest font-mono">Custo Ativação</span>
                            {isLocked ? (
                              <span className="font-semibold text-neutral-350 font-mono text-xs">{hab.custo || "1 PE"}</span>
                            ) : (
                              <input
                                id={`edit-ritual-cost-${hab.id}`}
                                type="text"
                                onClick={(e) => e.stopPropagation()}
                                value={hab.custo}
                                onChange={(e) => handleUpdateAbilityHeader(hab.id, "custo", e.target.value)}
                                className="bg-black border border-neutral-850 text-neutral-200 px-2 py-0.5 mt-0.5 rounded outline-none w-20 text-[10px] font-semibold"
                                placeholder="Ex: 2 PE"
                              />
                            )}
                          </div>
                          
                          <div>
                            <span className="text-zinc-[500] uppercase text-[8px] font-bold block mb-0.5 tracking-widest font-mono">Elemento</span>
                            {isLocked ? (
                              <span className={`font-semibold font-mono text-xs ${colors.text}`}>
                                {hab.elemento === "Morte" && "💀 "}
                                {hab.elemento === "Sangue" && "🩸 "}
                                {hab.elemento === "Energia" && "⚡ "}
                                {hab.elemento === "Conhecimento" && "👁️ "}
                                {hab.elemento === "Medo" && "🌀 "}
                                {hab.elemento || "Morte"}
                              </span>
                            ) : (
                              <select
                                id={`edit-ritual-element-${hab.id}`}
                                onClick={(e) => e.stopPropagation()}
                                value={hab.elemento || "Morte"}
                                onChange={(e) => {
                                  setChar((prev) => ({
                                    ...prev,
                                    habilidadesRituais: prev.habilidadesRituais.map((item) =>
                                      item.id === hab.id ? { ...item, elemento: e.target.value } : item
                                    )
                                  }));
                                }}
                                className="bg-black border border-neutral-850 text-neutral-200 px-2 py-0.5 mt-0.5 rounded outline-none w-24 text-[10px] font-bold"
                              >
                                <option value="Morte">💀 Morte</option>
                                <option value="Sangue">🩸 Sangue</option>
                                <option value="Energia">⚡ Energia</option>
                                <option value="Conhecimento">👁️ Conhecimento</option>
                                <option value="Medo">🌀 Medo</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Full-width descriptions, no accordion hidden tabs */}
                      <div className="pt-2 border-t border-neutral-900/40 text-xs text-neutral-300">
                        <RichTextEditor
                          id={`ritual-body-${hab.id}`}
                          value={hab.descricao}
                          onChange={(text) => handleUpdateAbilityDesc(hab.id, text)}
                          placeholder="Transcrição das palavras, runas e efeito de conjuração..."
                          readOnly={isLocked}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MOCHILA */}
      {activeTab === "mochila" && (
        <div id="tab-mochila-content" className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          {/* Statistics and item addition column */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-teal-400" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-300 uppercase">
                  Gerenciar Mochila
                </h3>
              </div>

              {/* Dynamic load status indicators */}
              <div className="space-y-1.5 p-3 rounded-lg border border-neutral-950 bg-black/40 text-xs">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-neutral-400 uppercase font-semibold text-[10px]">Carga de Espaços</span>
                  <span className={`font-bold ${isCargaExcedida ? "text-paranormal-red animate-pulse" : "text-white"}`}>
                    {currentSlots} / {char.inventario.cargaMaxima} Espaços
                  </span>
                </div>

                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition duration-300 ${isCargaExcedida ? "bg-paranormal-red animate-pulse" : "bg-teal-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, (currentSlots / char.inventario.cargaMaxima) * 100))}%` }}
                  />
                </div>

                {isCargaExcedida && (
                  <div className="flex items-center gap-1 text-[9px] text-paranormal-red font-semibold uppercase animate-pulse pt-1 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-paranormal-red" />
                    <span>Carga Excedida (-3m Deslocamento, penalidade em Agilidade/Força)</span>
                  </div>
                )}
              </div>

              {/* Weight limit custom adjust indicators under unlocked view */}
              {!isLocked && (
                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[8px]">Limite Carga Máxima</span>
                    <input
                      id="edit-carga"
                      type="number"
                      value={char.inventario.cargaMaxima}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value) || 5;
                        setChar((prev) => ({
                          ...prev,
                          inventario: { ...prev.inventario, cargaMaxima: Math.max(1, parsed) }
                        }));
                      }}
                      className="bg-black border border-neutral-800 text-neutral-200 text-xs p-1.5 rounded outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[8px]">Limite de Crédito</span>
                    <input
                      id="edit-credito"
                      type="text"
                      value={char.inventario.limiteCredito}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChar((prev) => ({
                          ...prev,
                          inventario: { ...prev.inventario, limiteCredito: val }
                        }));
                      }}
                      className="bg-black border border-neutral-800 text-neutral-200 text-xs p-1.5 rounded outline-none"
                      placeholder="Baixo, Médio, Rico"
                    />
                  </div>
                </div>
              )}

              {/* Add Inventory Item trigger */}
              {!isLocked ? (
                <button
                  id="add-item-btn-click"
                  type="button"
                  onClick={() => {
                    setWizardName("");
                    setWizardCategoria("Livre");
                    setWizardEspacos(1);
                    setConfirmAction({ type: "add_item_wizard" });
                  }}
                  className="w-full bg-teal-950 hover:bg-teal-900 text-teal-400 border border-teal-800/80 font-mono font-bold uppercase rounded py-2.5 tracking-wider transition cursor-pointer text-center text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-teal-400 animate-pulse" /> Adicionar Equipamento 🎒
                </button>
              ) : (
                <div className="p-3 bg-black/40 border border-neutral-900 font-mono text-[10px] text-zinc-500">
                  ⚠️ DESBLOQUEIE A FICHA PARA ADICIONAR ITENS OU EDITAR OS LIMITES DA CAMPANHA.
                </div>
              )}
            </div>
          </div>

          {/* Items listing column */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 mb-2">
                <Scroll className="w-4 h-4 text-teal-400" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-300 uppercase">
                  Inventário ({char.inventario.itens.length})
                </h3>
              </div>

              {/* Items Container */}
              <div id="items-box" className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {char.inventario.itens.length === 0 ? (
                  <p className="text-xs text-neutral-550 italic p-6 text-center border border-dashed border-neutral-850 rounded">
                    A mochila está vazia. Não há pertences reportados.
                  </p>
                ) : (
                  char.inventario.itens.map((item) => (
                    <div
                      id={`item-row-${item.id}`}
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-neutral-900/60 rounded-xl p-4 gap-3 text-xs bg-zinc-950/80 hover:border-teal-500/20 transition duration-300 shadow-md text-left"
                    >
                      <div className="flex-1 space-y-2">
                        {isLocked ? (
                          <span className="text-neutral-200 font-bold text-sm tracking-wide block">{item.nome}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.nome}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setChar((prev) => ({
                                ...prev,
                                inventario: {
                                  ...prev.inventario,
                                  itens: prev.inventario.itens.map((i) =>
                                    i.id === item.id ? { ...i, nome: newName } : i
                                  )
                                }
                              }));
                            }}
                            className="bg-black/95 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-800 outline-none focus:border-teal-500 w-full font-mono"
                            placeholder="Nome do item"
                          />
                        )}
                        <div className="flex items-center gap-4 text-[9px] uppercase tracking-wider text-neutral-500 font-mono font-bold leading-none">
                          <div className="flex items-center gap-1.5">
                            <span>Categoria:</span>
                            {isLocked ? (
                              <span className="text-teal-400 font-semibold">{item.categoria}</span>
                            ) : (
                              <select
                                value={item.categoria}
                                onChange={(e) => {
                                  const newCat = e.target.value;
                                  setChar((prev) => ({
                                    ...prev,
                                    inventario: {
                                      ...prev.inventario,
                                      itens: prev.inventario.itens.map((i) =>
                                        i.id === item.id ? { ...i, categoria: newCat } : i
                                      )
                                    }
                                  }));
                                }}
                                className="bg-black text-teal-400 text-[10px] px-1.5 py-0.5 rounded border border-neutral-850 outline-none"
                              >
                                <option value="Livre">Livre</option>
                                <option value="I">Cat I</option>
                                <option value="II">Cat II</option>
                                <option value="III">Cat III</option>
                                <option value="IV">Cat IV</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold hidden sm:inline">Espaços:</span>
                          {isLocked ? (
                            <span className="bg-neutral-900 border border-neutral-850 px-3 py-1 rounded-lg text-teal-400 font-bold" title="Espaços no inventário">
                              {item.espacos} {item.espacos === 1 ? "espaço" : "espaços"}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={item.espacos}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value) || 0;
                                setChar((prev) => ({
                                  ...prev,
                                  inventario: {
                                    ...prev.inventario,
                                    itens: prev.inventario.itens.map((i) =>
                                      i.id === item.id ? { ...i, espacos: Math.max(0, parsed) } : i
                                    )
                                  }
                                }));
                              }}
                              className="bg-black text-teal-400 border border-neutral-800 rounded outline-none w-14 text-center py-1 font-bold text-xs"
                            />
                          )}
                        </div>
                        
                        {!isLocked && (
                          <button
                            id={`del-item-${item.id}`}
                            type="button"
                            onClick={() => setConfirmAction({ type: "delete_item", data: { id: item.id, nome: item.nome } })}
                            className="text-neutral-600 hover:text-paranormal-red p-1.5 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                            title="Descartar Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE CONFIRMATION DIALOG MODAL OVERLAY */}
      {confirmAction && (
        <div id="confirm-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-neutral-900 rounded-lg p-6 max-w-sm md:max-w-md w-full font-mono text-left space-y-4 shadow-2xl my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
              <AlertCircle className="w-5 h-5 text-paranormal-red animate-pulse" />
              <h3 className="text-[11px] uppercase tracking-widest text-neutral-300 font-bold">
                {confirmAction.type.includes("wizard") ? "Ficha de Transição // Novo Registro" : "Procedimento de Segurança // Confirmação"}
              </h3>
            </div>
            
            {/* Modal Content Switch */}
            {confirmAction.type === "toggle_lock" && (
              <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                Você está prestes a alternar o <span className="text-amber-500 font-bold">Modo de Edição / Segurança</span>.
                <br /><br />
                Desbloquear permite manipulação direta de atributos, habilidades secretas, rituais e inventário do recruta. Manter bloqueado protege a ficha contra alterações acidentais em combate. Deseja continuar?
              </p>
            )}

            {confirmAction.type === "delete_ability" && (
              <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                Aviso: Você está prestes a apagar a habilidade <span className="text-amber-400 font-bold uppercase">"{confirmAction.data?.nome}"</span> da memória do agente.
                <br /><br />
                Esta ação expurgará permanentemente o registro e não poderá ser desfeita. Tem certeza?
              </p>
            )}

            {confirmAction.type === "delete_ritual" && (
              <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                Aviso: Você está prestes a dissipar o ritual ocultista <span className="text-cyan-400 font-bold uppercase">"{confirmAction.data?.nome}"</span>.
                <br /><br />
                Esta ação desvinculará a marca paranormais na alma do agente. O registro será expurgado permanentemente. Tem certeza de que quer continuar?
              </p>
            )}

            {confirmAction.type === "delete_item" && (
              <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                Aviso: Deseja descartar permanentemente o item <span className="text-teal-400 font-bold uppercase">"{confirmAction.data?.nome}"</span> da mochila?
                <br /><br />
                O espaço ocupado no inventário será liberado de forma imediata. Tem certeza?
              </p>
            )}

            {/* WIZARD: ADD ABILITY */}
            {confirmAction.type === "add_ability_wizard" && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-[11px] text-amber-500 font-bold uppercase tracking-wider block">Registrar Habilidade de Classe ou Origem</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Nome da Habilidade</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="Ex: Saque Rápido"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Custo de Ativação</label>
                    <input
                      type="text"
                      value={wizardCusto}
                      onChange={(e) => setWizardCusto(e.target.value)}
                      placeholder="Ex: 2 PE"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-amber-500 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Descrição</label>
                    <textarea
                      value={wizardDescricao}
                      onChange={(e) => setWizardDescricao(e.target.value)}
                      placeholder="Descreva o efeito ativado, condições, bônus adicionados ao teste, segredos e uso da habilidade tática..."
                      rows={5}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-amber-500 text-xs resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD: ADD RITUAL */}
            {confirmAction.type === "add_ritual_wizard" && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">Manifestar Novo Ritual Ocultista</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Nome do Ritual</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="Ex: Decadência"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Custo de PE</label>
                      <input
                        type="text"
                        value={wizardCusto}
                        onChange={(e) => setWizardCusto(e.target.value)}
                        placeholder="Ex: 1 PE"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Elemento Principal</label>
                      <select
                        value={wizardElemento}
                        onChange={(e) => setWizardElemento(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none"
                      >
                        <option value="Morte">💀 Morte</option>
                        <option value="Sangue">🩸 Sangue</option>
                        <option value="Energia">⚡ Energia</option>
                        <option value="Conhecimento">👁️ Conhecimento</option>
                        <option value="Medo">🌀 Medo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Descrição & Efeito</label>
                    <textarea
                      value={wizardDescricao}
                      onChange={(e) => setWizardDescricao(e.target.value)}
                      placeholder="Transcrição das palavras ocultas, componentes de conjuração exigidos e os efeitos colaterais brutais no Outro Lado..."
                      rows={5}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-cyan-500 text-xs resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD: ADD ITEM */}
            {confirmAction.type === "add_item_wizard" && (
              <div className="space-y-4 text-xs font-mono">
                <p className="text-[11px] text-teal-400 font-bold uppercase tracking-wider block">Manifestar e Guardar Novo Equipamento</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Nome do Item</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="Ex: Colete Antibalas"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Categoria de Item</label>
                      <select
                        value={wizardCategoria}
                        onChange={(e) => setWizardCategoria(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 outline-none"
                      >
                        <option value="Livre">Livre</option>
                        <option value="I">Cat I</option>
                        <option value="II">Cat II</option>
                        <option value="III">Cat III</option>
                        <option value="IV">Cat IV</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-neutral-500 block text-[9px] uppercase font-bold tracking-widest mb-1">Espaços Ocupados</label>
                      <input
                        type="number"
                        value={wizardEspacos}
                        onChange={(e) => setWizardEspacos(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        max="10"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-neutral-200 text-center outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons Row with horror effects */}
            <div className="flex justify-end gap-3 pt-2 text-[10px] uppercase font-bold tracking-wider">
              <button
                id="confirm-btn-no"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
              >
                Abortar
              </button>
              <button
                id="confirm-btn-yes"
                onClick={() => {
                  if (confirmAction.type === "toggle_lock") {
                    setIsLocked(!isLocked);
                  } else if (confirmAction.type === "delete_ability") {
                    handleRemoveAbility(confirmAction.data.id);
                  } else if (confirmAction.type === "delete_ritual") {
                    handleRemoveAbility(confirmAction.data.id);
                  } else if (confirmAction.type === "delete_item") {
                    handleRemoveItem(confirmAction.data.id);
                  } else if (confirmAction.type === "add_ability_wizard") {
                    const newId = "hab-" + (keyCounter.current++);
                    const newHab: HabilidadeRitual = {
                      id: newId,
                      nome: wizardName.trim() || "Nova Habilidade",
                      custo: wizardCusto || "0 PE",
                      pagina: "",
                      descricao: wizardDescricao ? `<p>${wizardDescricao.replace(/\n/g, "<br />")}</p>` : "<p>Descrição da habilidade secreta...</p>",
                      tipo: "habilidade"
                    };
                    setChar((prev) => ({
                      ...prev,
                      habilidadesRituais: [...prev.habilidadesRituais, newHab]
                    }));
                    setExpandedAbilityId(newId);
                  } else if (confirmAction.type === "add_ritual_wizard") {
                    const newId = "rit-" + (keyCounter.current++);
                    const newRit: HabilidadeRitual = {
                      id: newId,
                      nome: wizardName.trim() || "Novo Ritual",
                      custo: wizardCusto || "1 PE",
                      elemento: wizardElemento || "Morte",
                      pagina: "",
                      descricao: wizardDescricao ? `<p>${wizardDescricao.replace(/\n/g, "<br />")}</p>` : "<p>Efeitos de conjuração e runas ocultistas...</p>",
                      tipo: "ritual"
                    };
                    setChar((prev) => ({
                      ...prev,
                      habilidadesRituais: [...prev.habilidadesRituais, newRit]
                    }));
                    setExpandedRitualId(newId);
                  } else if (confirmAction.type === "add_item_wizard") {
                    handleAddItem(
                      wizardName.trim() || "Equipamento Novo",
                      wizardCategoria || "Livre",
                      wizardEspacos || 1
                    );
                  }
                  
                  // Reset actions
                  setConfirmAction(null);
                }}
                className="bg-red-950 hover:bg-red-900 border border-red-700/60 text-red-400 px-4 py-2 transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOSSIER DESCRIPTION */}
      {activeTab === "historico" && (
        <div id="tab-historico-content" className="space-y-6">
          <div className="bg-paranormal-gray border border-paranormal-border rounded-xl p-5 text-left grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <Scroll className="w-4 h-4 text-paranormal-red" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200">
                  Aparência Geral e Marcas Ocultas
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">Descreva feições físicas, cicatrizes e detalhes visíveis das marcas do Outro Lado.</p>
              <RichTextEditor
                id="edit-desc-aparencia"
                value={char.descricao.aparencia}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, aparencia: text } }))}
                readOnly={false}
                placeholder="Aparência física do agente..."
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <UserCheck className="w-4 h-4 text-paranormal-red" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200">
                  Perfil de Personalidade & Conduta
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">Comportamento tático, manias, traumas, fobias irracionais derivadas do medo.</p>
              <RichTextEditor
                id="edit-desc-personalidade"
                value={char.descricao.personalidade}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, personalidade: text } }))}
                readOnly={false}
                placeholder="Traços comportamentais e desvios..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <BookOpen className="w-4 h-4 text-paranormal-red" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200">
                  Dossiê Histórico & Antecedentes do Recruta
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">Como ingressou na Ordo Realitas? Qual foi o sinistro primeiro contato com o paranormal?</p>
              <RichTextEditor
                id="edit-desc-historico"
                value={char.descricao.historico}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, historico: text } }))}
                readOnly={false}
                placeholder="Narrativa histórica..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <Sparkle className="w-4 h-4 text-paranormal-red" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200">
                  Objetivo Imediato de Investigação
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">O que motiva este agente a continuar se expondo na escuridão?</p>
              <RichTextEditor
                id="edit-desc-objetivo"
                value={char.descricao.objetivo}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, objetivo: text } }))}
                readOnly={false}
                placeholder="Meta principal ou obsessão..."
              />
            </div>

            {/* NEW FIELD: ALTERAÇÕES PARANORMAIS FÍSICAS E MENTAIS */}
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <Flame className="w-4 h-4 text-violet-400" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200 uppercase text-violet-400">
                  Alterações Paranormais Físicas e Mentais
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">Registro de cicatrizes esotéricas, olhos mutantes, obsessões obsessivas, ou mutações biológicas provocadas pelo Outro Lado.</p>
              <RichTextEditor
                id="edit-desc-alteracoes-paranormais"
                value={char.descricao.alteracoesParanormais || ""}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, alteracoesParanormais: text } }))}
                readOnly={false}
                placeholder="Exemplo: Cabelo ficou totalmente branco após transcender, ou ouve vozes fracas sussurrando em latim quando sob estresse..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-1 mb-2">
                <Check className="w-4 h-4 text-paranormal-red" />
                <h3 className="font-horror text-sm tracking-widest text-neutral-200">
                  Anotações Secretas do Jogador
                </h3>
              </div>
              <p className="text-[10px] text-neutral-550 block italic pb-1">Espaço livre para pistas, códigos, suspeitos ou diário de investigação do agente.</p>
              <RichTextEditor
                id="edit-desc-anotacoes-jogador"
                value={char.descricao.anotacoesJogador || ""}
                onChange={(text) => setChar((prev) => ({ ...prev, descricao: { ...prev.descricao, anotacoesJogador: text } }))}
                readOnly={false}
                placeholder="Anote aqui as pistas cruciais sobre os mistérios resolvidos..."
              />
            </div>

          </div>
        </div>
      )}

      {/* MASTER SECTOR: Visible ONLY when role === "mestre" */}
      {isMestre && (
        <section id="master-private-sector" className="bg-paranormal-gray border-2 border-paranormal-gold/50 rounded-xl p-5 mt-8 text-left relative overflow-hidden text-neutral-200 gold-glow">
          <div className="absolute top-0 right-0 p-1 opacity-5">
            <Award className="w-32 h-32 text-paranormal-gold" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-2.5">
              <Award className="w-5 h-5 text-paranormal-gold" />
              <h3 className="font-horror text-base tracking-widest text-paranormal-gold uppercase">
                Anotações Secretas do Mestre (Confidencial • Apenas GM)
              </h3>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-normal">
              Este bloco de informações é totalmente oculto para jogadores comuns. Utilize-o para mapear segredos de backstory, ganchos paranormais, revelações inesperadas de NEX, marcas do Outro Lado latentes e fraquezas reprimidas.
            </p>

            <RichTextEditor
              id="mestre-confidencial-notes"
              value={char.notasMestre || ""}
              onChange={(text) => setChar((prev) => ({ ...prev, notasMestre: text }))}
              readOnly={false}
              placeholder="Segredos, fraquezas latentes e notas secretas importantes para a história..."
              label="Notas Confidenciais do Narrador"
            />
          </div>
        </section>
      )}

      {/* Outer float instructions or save strip */}
      <footer className="mt-8 text-center text-[10px] text-neutral-500 typewriter-font uppercase tracking-widest pb-12">
        Membro de Operação • Documento Cadastrado sob Chave de Criptografia Ordo Realitas
      </footer>

    </div>
  );
}
