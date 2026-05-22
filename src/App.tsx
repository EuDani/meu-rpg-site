/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Personagem, CurrentRole } from "./types";
import { DEFAULT_CHARACTERS, getFreshPericiasList } from "./data";
import { Hub } from "./components/Hub";
import { CharacterSheet } from "./components/CharacterSheet";
import { DiceRoller, RollRequest } from "./components/DiceRoller";
import { Shield, Sparkle, RefreshCw } from "lucide-react";

export default function App() {
  // Global sheets database state direct localstorage loading
  const [characters, setCharacters] = useState<Personagem[]>([]);
  const [currentRole, setCurrentRole] = useState<CurrentRole>("jogador");
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [diceRequest, setDiceRequest] = useState<RollRequest | null>(null);

  // Success indicator notice flag
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const savedChars = localStorage.getItem("ordem_paranormal_chars");
    if (savedChars) {
      try {
        setCharacters(JSON.parse(savedChars));
      } catch (e) {
        setCharacters(DEFAULT_CHARACTERS);
      }
    } else {
      setCharacters(DEFAULT_CHARACTERS);
      localStorage.setItem("ordem_paranormal_chars", JSON.stringify(DEFAULT_CHARACTERS));
    }

    const savedRole = localStorage.getItem("ordem_paranormal_role");
    if (savedRole && (savedRole === "jogador" || savedRole === "mestre")) {
      setCurrentRole(savedRole as CurrentRole);
    }

    const savedMyId = localStorage.getItem("ordem_paranormal_my_id");
    if (savedMyId) {
      setMyCharacterId(savedMyId);
    }
  }, []);

  // Sync helpers
  const saveToLocalStorage = (updatedChars: Personagem[]) => {
    localStorage.setItem("ordem_paranormal_chars", JSON.stringify(updatedChars));
    setCharacters(updatedChars);
  };

  const handleRoleChange = (role: CurrentRole) => {
    setCurrentRole(role);
    localStorage.setItem("ordem_paranormal_role", role);
  };

  const handleMyCharIdChange = (id: string | null) => {
    setMyCharacterId(id);
    if (id) {
      localStorage.setItem("ordem_paranormal_my_id", id);
    } else {
      localStorage.removeItem("ordem_paranormal_my_id");
    }
  };

  // Open sheets tracker
  const handleSelectCharacter = (id: string, viewOnlyState: boolean = false) => {
    setActiveSheetId(id);
    setViewOnly(viewOnlyState);
    // Auto clear active dice rolls
    setDiceRequest(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save Character to DB
  const handleSaveCharacter = (updatedChar: Personagem) => {
    const updated = characters.map((c) => (c.id === updatedChar.id ? updatedChar : c));
    saveToLocalStorage(updated);
    
    // Trigger neat quick notice
    setSaveSuccessMsg(`Dossiê de ${updatedChar.nome} salvo com êxito!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  // Delete Character
  const handleDeleteCharacter = (id: string) => {
    const updated = characters.filter((c) => c.id !== id);
    saveToLocalStorage(updated);
    if (myCharacterId === id) {
      handleMyCharIdChange(null);
    }
    if (activeSheetId === id) {
      setActiveSheetId(null);
    }
  };

  // Add character utilizing optimize class stats formulas
  const handleAddCharacter = ({ nome, classe, origem }: { nome: string; classe: string; origem: string }) => {
    // Generate class optimized parameters:
    let baseAttrs = { FOR: 1, AGI: 1, INT: 1, VIG: 1, PRE: 1 };
    let maxPV = 15;
    let maxPE = 3;
    let maxSAN = 20;
    let baseDef = 10;
    let defaultWeapon = "Pistola Leve (.38)";
    let defaultWeaponDmg = "1d6";
    let defaultWeaponAttr = "AGI + 2 (Pontaria)";

    if (classe === "Combatente") {
      baseAttrs = { FOR: 2, AGI: 1, INT: 1, VIG: 2, PRE: 1 };
      maxPV = 20 + 2 * 5; // 20 + VIGOR * 5 = 30
      maxPE = 2;
      maxSAN = 12;
      defaultWeapon = "Machadinha ou Bastão";
      defaultWeaponDmg = "1d6 + 2";
      defaultWeaponAttr = "FOR + 2 (Luta)";
    } else if (classe === "Ocultista") {
      baseAttrs = { FOR: 1, AGI: 1, INT: 3, VIG: 1, PRE: 2 };
      maxPV = 12 + 1 * 5; // 12 + VIGOR * 5 = 17
      maxPE = 4;
      maxSAN = 20;
    } else if (classe === "Especialista") {
      baseAttrs = { FOR: 1, AGI: 2, INT: 2, VIG: 1, PRE: 1 };
      maxPV = 16 + 1 * 5; // 16 + VIGOR * 5 = 21
      maxPE = 3;
      maxSAN = 16;
    }

    const newChar: Personagem = {
      id: "char-" + Date.now(),
      nome,
      jogador: currentRole === "jogador" ? "Você" : "Mestre",
      origem,
      classe,
      nex: 5,
      peRodada: 1,
      deslocamento: "9m",
      patente: "Recruta",
      prestigio: 0,
      avatarUrl: "",

      atributos: baseAttrs,
      pv: { atual: maxPV, max: maxPV },
      pe: { atual: maxPE, max: maxPE },
      san: { atual: maxSAN, max: maxSAN },
      
      defesa: {
        base: baseDef,
        agi: baseAttrs.AGI,
        equip: 0,
        outros: 0,
        total: baseDef + baseAttrs.AGI
      },
      
      protecao: "Roupas Comuns",
      resistencias: "",
      
      pericias: getFreshPericiasList(),
      ataques: [
        {
          id: "new-atk-1",
          nome: defaultWeapon,
          teste: defaultWeaponAttr,
          dano: defaultWeaponDmg,
          critico: "20/x2",
          alcance: "Curto/Corpo a corpo",
          especial: ""
        }
      ],
      habilidadesRituais: [],
      dtRituais: classe === "Ocultista" ? "12" : "10",
      
      inventario: {
        itens: [
          { id: "new-item-1", nome: "Lanterna Básica", categoria: "Livre", espacos: 0 },
          { id: "new-item-2", nome: "Pistola Tática", categoria: "I", espacos: 1 }
        ],
        limiteEspacos: baseAttrs.FOR * 5,
        limiteCredito: "Baixo",
        cargaMaxima: baseAttrs.FOR * 5
      },
      
      descricao: {
        aparencia: "<p>Agente recém ingressado. Vestimentas simples e discretas para evitar quebrar a Membrana.</p>",
        personalidade: "<p>Comportamento tenso, cético sobre o paranormal.</p>",
        historico: "<p>Recrutado pela Ordo Realitas após sofrer uma manifestação de medo no trabalho ou na vida acadêmica.</p>",
        objetivo: "<p>Garantir que a escuridão permaneça contida.</p>"
      },
      
      notasMestre: ""
    };

    const updated = [...characters, newChar];
    saveToLocalStorage(updated);

    // If player is choosing to create a sheet, let's link it automatically
    if (currentRole === "jogador" && !myCharacterId) {
      handleMyCharIdChange(newChar.id);
    }

    setSaveSuccessMsg(`${nome} foi admitido como agente da Ordem!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleBackToHub = () => {
    setActiveSheetId(null);
    setDiceRequest(null);
  };

  // Helper trigger rolls from circular elements or lists inside components
  const handleTriggerRoll = (request: RollRequest) => {
    setDiceRequest(request);
  };

  const activeChar = characters.find((c) => c.id === activeSheetId);

  return (
    <div className="min-h-screen occult-bg text-neutral-300 flex flex-col justify-between" style={{ backgroundColor: "#0d0d0e" }}>
      {/* Dynamic Save Indicator */}
      {saveSuccessMsg && (
        <div id="save-toast" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 border-2 border-red-700 text-red-500 text-xs font-mono font-bold px-6 py-3 rounded flex items-center gap-2 shadow-2xl shadow-red-950/50 animate-bounce">
          <Sparkle className="w-4 h-4 animate-spin text-red-500" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Technical Terminal Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-red-950/40 bg-zinc-950/60 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-800 flex items-center justify-center rounded-sm rotate-45">
            <span className="-rotate-45 font-bold text-white text-xs">OP</span>
          </div>
          <h1 className="uppercase tracking-[0.3em] text-xs sm:text-sm font-semibold text-zinc-400">
            Ordem Paranormal // <span className="text-red-700">Terminal_V04</span>
          </h1>
        </div>
        <nav className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest font-medium">
          <button 
            onClick={handleBackToHub} 
            className={`transition-colors cursor-pointer ${!activeChar ? "text-red-500 border-b border-red-500 pb-1" : "text-zinc-500 hover:text-white"}`}
          >
            Hub de Equipe
          </button>
          {activeChar ? (
            <span className="text-red-500 border-b border-red-500 pb-1">
              Dossiê Ativo: {activeChar.nome}
            </span>
          ) : (
            <span className="text-zinc-600">Nenhum Agente Selecionado</span>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 uppercase">Conexão Estável</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
        </div>
      </header>

      {/* Main Container routes */}
      <main className="flex-1 border-x border-zinc-900/60 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeChar ? (
          /* Main interactive character sheet view */
          <CharacterSheet
            character={activeChar}
            viewOnly={viewOnly}
            onSave={handleSaveCharacter}
            onBack={handleBackToHub}
            isMestre={currentRole === "mestre"}
            onTriggerRoll={handleTriggerRoll}
          />
        ) : (
          /* Main Operations Hub / character select */
          <Hub
            characters={characters}
            activeSheetId={activeSheetId}
            onSelectCharacter={handleSelectCharacter}
            onAddCharacter={handleAddCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            currentRole={currentRole}
            onChangeRole={handleRoleChange}
            myCharacterId={myCharacterId}
            onChangeMyCharacterId={handleMyCharIdChange}
          />
        )}
      </main>

      {/* Embedded Persistent Dice Roller Drawer at bottom-right */}
      <DiceRoller
        request={diceRequest}
        onClose={() => setDiceRequest(null)}
        personagemNome={activeChar ? activeChar.nome : "Agente da Ordem"}
      />

      {/* Technical Dashboard Footer */}
      <footer className="h-6 bg-red-950 flex items-center px-4 justify-between text-[8px] uppercase tracking-widest font-bold text-red-200">
        <div>Status: Recon_Online</div>
        <div>Regra: Ordem Paranormal v1.2</div>
        <div className="font-mono">ID: ORD-7742-{activeChar ? activeChar.id.substring(5, 9).toUpperCase() : "HUB"}</div>
      </footer>

      {/* Floating Manual Reset Button in case user wants to restore fallback profiles */}
      <div className="fixed bottom-10 left-4 z-40">
        <button
          id="system-restore-btn"
          onClick={() => {
            if (confirm("Gostaria de redefinir toda a campanha de fichas para as 2 fichas modelo iniciais (Thiago Santos e Agatha Volkov)? Isto apagará modificações locais.")) {
              localStorage.removeItem("ordem_paranormal_chars");
              localStorage.removeItem("ordem_paranormal_my_id");
              setMyCharacterId(null);
              setActiveSheetId(null);
              setCharacters(DEFAULT_CHARACTERS);
              localStorage.setItem("ordem_paranormal_chars", JSON.stringify(DEFAULT_CHARACTERS));
              setSaveSuccessMsg("Base de agentes restaurada com êxito!");
              setTimeout(() => setSaveSuccessMsg(null), 3000);
            }
          }}
          className="p-1 px-2 rounded bg-neutral-950/80 hover:bg-black text-[9px] text-neutral-500 hover:text-white border border-neutral-900 hover:border-red-900 transition flex items-center gap-1 cursor-pointer font-semibold shadow"
          title="Restaurar Agentes Modelos"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Restaurar Banco
        </button>
      </div>
    </div>
  );
}
