/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Personagem, CurrentRole } from "../types";
import { User, Shield, Skull, Plus, Eye, Key, MapPin, Activity, Flame, ShieldAlert, Heart, Brain, Trash2, Award } from "lucide-react";
import { CLASSES, ORIGENS } from "../data";

interface HubProps {
  characters: Personagem[];
  activeSheetId: string | null;
  onSelectCharacter: (id: string, viewOnly?: boolean) => void;
  onAddCharacter: (options: { nome: string; classe: string; origem: string }) => void;
  onDeleteCharacter: (id: string) => void;
  currentRole: CurrentRole;
  onChangeRole: (role: CurrentRole) => void;
  myCharacterId: string | null;
  onChangeMyCharacterId: (id: string | null) => void;
}

export function Hub({
  characters,
  activeSheetId,
  onSelectCharacter,
  onAddCharacter,
  onDeleteCharacter,
  currentRole,
  onChangeRole,
  myCharacterId,
  onChangeMyCharacterId
}: HubProps) {
  // Modal for adding a character
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCharForm, setNewCharForm] = useState({
    nome: "",
    classe: CLASSES[0],
    origem: ORIGENS[0]
  });

  const handleSubmitNewChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharForm.nome.trim()) return;
    onAddCharacter({
      nome: newCharForm.nome.trim(),
      classe: newCharForm.classe,
      origem: newCharForm.origem
    });
    setNewCharForm({ nome: "", classe: CLASSES[0], origem: ORIGENS[0] });
    setShowAddModal(false);
  };

  const currentSelectionName = characters.find(c => c.id === myCharacterId)?.nome || "Não Vinculada";

  return (
    <div id="hub-container" className="max-w-7xl mx-auto px-4 py-4 font-sans pb-32">
      {/* Title block */}
      <header className="mb-8 text-left relative border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 bg-red-700"></span>
          <h2 className="uppercase tracking-[0.25em] text-xs font-mono font-bold text-zinc-500">
            SISTEMA DE INVESTIGAÇÃO INTERATIVA // MEMBRO DA REDE
          </h2>
        </div>
        <h1 className="font-sans text-3xl md:text-4xl text-white tracking-widest uppercase mt-2 mb-1 font-extrabold">
          FICHAS DE AGENTES <span className="text-red-700">//</span> ORDO REALITAS
        </h1>
        <p className="font-mono text-[10px] text-zinc-500 tracking-wider">
          CONEXÃO SEGURA ESTABELECIDA • MONITORAMENTO DE MEMBRANA REATIVO
        </p>
      </header>

      {/* Control panel: Role picker & character linker */}
      <section id="role-control-panel" className="bg-zinc-950/70 border border-zinc-800 rounded-none p-5 mb-8 text-neutral-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1 opacity-[0.03]">
          <Skull className="w-24 h-24 text-red-600" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
          {/* Role selector */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-widest block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Credenciamento de Segurança
            </span>
            <div className="inline-flex rounded-none border border-zinc-800 bg-black p-0.5">
              <button
                id="role-btn-jogador"
                onClick={() => onChangeRole("jogador")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-none text-[10px] font-mono font-bold tracking-wider uppercase transition cursor-pointer ${
                  currentRole === "jogador"
                    ? "bg-red-950/80 border border-red-900/60 text-red-400"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Jogador
              </button>
              <button
                id="role-btn-mestre"
                onClick={() => onChangeRole("mestre")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-none text-[10px] font-mono font-bold tracking-wider uppercase transition cursor-pointer ${
                  currentRole === "mestre"
                    ? "bg-zinc-900 border border-zinc-800 text-amber-500 hover:text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Mestre
              </button>
            </div>
          </div>

          {/* Linking character to jugador role */}
          {currentRole === "jogador" && (
            <div className="space-y-2 w-full md:w-auto">
              <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 tracking-widest block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-650"></span> Vincular Minha Ficha Comercial
              </span>
              <div className="flex gap-2">
                <select
                  id="link-char-select"
                  value={myCharacterId || ""}
                  onChange={(e) => onChangeMyCharacterId(e.target.value || null)}
                  className="bg-black border border-zinc-800 rounded-none text-[11px] font-mono p-2 text-zinc-300 outline-none focus:border-red-900 w-full min-w-[200px]"
                >
                  <option value="">-- Escolha seu personagem --</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.classe})
                    </option>
                  ))}
                </select>
                {myCharacterId && (
                  <button
                    id="open-own-sheet-btn"
                    onClick={() => onSelectCharacter(myCharacterId, false)}
                    className="bg-red-950/60 hover:bg-red-900/80 text-red-400 text-[10px] font-mono font-bold px-4 py-2 border border-red-900 rounded-none leading-none transition uppercase tracking-widest cursor-pointer"
                  >
                    ATIVAR_AGENTE
                  </button>
                )}
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-normal max-w-sm">
                Ao selecionar sua ficha, você terá permissão para alterar pontos vitais. Outros cards de aliados estarão acessíveis apenas no modo de visualização tática.
              </p>
            </div>
          )}

          {/* Master Panel Quick Info */}
          {currentRole === "mestre" && (
            <div className="space-y-1 text-xs bg-zinc-900/30 border border-zinc-800 p-3 rounded-none max-w-md w-full md:w-auto">
              <div className="flex items-center gap-2 text-amber-500/90 font-mono">
                <Key className="w-3.5 h-3.5" />
                <span className="tracking-wider text-[10px] uppercase font-bold">Autoridade de Mestre Ativa</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                Você pode criar fichas para novos agentes, apagar investigados da Ordem, editar e ler anotações secretas e desbloquear os atributos de qualquer ficha.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Agents collection dossier index */}
      <section id="agents-index" className="space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-px bg-zinc-800"></span>
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">Dossiê de Agentes Ativos</h2>
          </div>
          {(currentRole === "mestre" || characters.length === 0) && (
            <button
              id="show-add-modal-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/30 text-[10px] font-mono uppercase tracking-wider py-1.5 px-3 rounded-none transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Recrutar Novo Agente
            </button>
          )}
        </div>

        {characters.length === 0 ? (
          <div id="empty-hub-state" className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-none bg-zinc-950/30">
            <Skull className="w-12 h-12 text-zinc-650 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-400">Nenhum agente cadastrado no sistema da Ordo Realitas.</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto p-2">Clique no botão acima ou coloque-se no papel de Mestre para recrutar novos investigadores.</p>
            <button
              id="quick-add-btn"
              onClick={() => {
                onAddCharacter({ nome: "Novo Recruta", classe: "Especialista", origem: "Investigador" });
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 border border-zinc-800 text-neutral-300 hover:text-white rounded-none text-xs font-serif uppercase tracking-widest transition"
            >
              Criar Ficha Rápida
            </button>
          </div>
        ) : (
          <div id="characters-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((char) => {
              const isMineState = char.id === myCharacterId;
              const isOcultista = char.classe === "Ocultista";
              const isCombatente = char.classe === "Combatente";

              // Color accents depending on class
              const classColorClass = isCombatente
                ? "border-amber-900/40 text-amber-500 font-bold bg-amber-950/20"
                : isOcultista
                ? "border-red-950/40 text-red-400 font-bold bg-red-950/20"
                : "border-teal-900/40 text-teal-400 font-bold bg-teal-950/20";

              return (
                <div
                  id={`char-card-${char.id}`}
                  key={char.id}
                  className={`bg-zinc-950/80 border rounded-none overflow-hidden flex flex-col transition-all duration-300 ${
                    isMineState
                      ? "border-red-700 shadow-[0_0_15px_rgba(234,56,56,0.1)]"
                      : "border-zinc-800 hover:border-zinc-700 hover:shadow-black"
                  }`}
                >
                  {/* Card top banner with Avatar */}
                  <div className="relative h-44 bg-zinc-900/60 overflow-hidden group">
                    <img
                      src={char.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300"}
                      alt={char.nome}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-75 transition duration-500"
                    />
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    
                    {/* Class badge */}
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-none border ${classColorClass}`}>
                        {char.classe}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-wider bg-black/80 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-none">
                        NEX {char.nex}%
                      </span>
                    </div>

                    {/* Owner tag */}
                    {isMineState && (
                      <div className="absolute top-3 right-3 bg-red-700 text-white text-[8px] font-semibold font-mono uppercase tracking-wider px-2 py-0.5 rounded-none shadow">
                        ATIVO : SEU AGENTE
                      </div>
                    )}

                    {/* Position info */}
                    <div className="absolute bottom-3 left-3 text-left">
                      <span className="text-[9px] uppercase text-zinc-500 tracking-widest font-mono block">
                        Origem: {char.origem}
                      </span>
                      <h3 className="font-sans text-base text-zinc-100 font-bold leading-tight mt-0.5">
                        {char.nome}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body with basic statistics */}
                  <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-950/40 text-left space-y-4">
                    {/* Vital Meters (PV, PE, SAN) simplified */}
                    <div className="space-y-3 text-xs">
                      {/* PV */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> PV [VIDA]</span>
                          <span className="font-bold">{char.pv.atual} / {char.pv.max}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-none overflow-hidden">
                          <div
                            className="bg-red-600 h-full shadow-[0_0_8px_#dc2626] transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, (char.pv.atual / char.pv.max) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* SAN */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-cyan-400" /> SAN [SANIDADE]</span>
                          <span className="font-bold">{char.san.atual} / {char.san.max}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-none overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full shadow-[0_0_8px_#06b6d4] transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, (char.san.atual / char.san.max) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* PE */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-400">
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-500" /> PE [ESFORÇO]</span>
                          <span className="font-bold">{char.pe.atual} / {char.pe.max}</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-none overflow-hidden">
                          <div
                            className="bg-amber-500 h-full shadow-[0_0_8px_#f59e0b] transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, (char.pe.atual / char.pe.max) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Attributes shorthand Row */}
                    <div className="grid grid-cols-5 p-1.5 bg-zinc-950 border border-zinc-850/60 rounded-none text-center font-mono text-[10px]">
                      <div>
                        <div className="text-[8px] text-zinc-500">FOR</div>
                        <div className="text-zinc-300 font-bold">{char.atributos.FOR}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-zinc-500">AGI</div>
                        <div className="text-zinc-300 font-bold">{char.atributos.AGI}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-zinc-500">INT</div>
                        <div className="text-zinc-300 font-bold">{char.atributos.INT}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-zinc-500">PRE</div>
                        <div className="text-zinc-300 font-bold">{char.atributos.PRE}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-zinc-500">VIG</div>
                        <div className="text-zinc-300 font-bold">{char.atributos.VIG}</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                      {currentRole === "mestre" ? (
                        <>
                          <button
                            id={`mestre-open-${char.id}`}
                            onClick={() => onSelectCharacter(char.id, false)}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-amber-500 border border-zinc-800 hover:border-amber-600 text-[10px] font-mono font-bold py-1.5 rounded-none transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" /> Administrar
                          </button>
                          <button
                            id={`mestre-delete-${char.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`ADMIN: Deseja apagar a ficha de "${char.nome}" permanentemente do banco? Esta ação é irreversível!`)) {
                                onDeleteCharacter(char.id);
                              }
                            }}
                            className="bg-zinc-900 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/60 text-zinc-500 hover:text-red-400 p-1.5 rounded-none transition"
                            title="Eliminar Agente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        /* Player Mode operations */
                        <>
                          {isMineState ? (
                            <button
                              id={`player-edit-${char.id}`}
                              onClick={() => onSelectCharacter(char.id, false)}
                              className="flex-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-100 text-[10px] font-mono font-bold py-1.5 rounded-none transition uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                            >
                              ABRIR_DOSSIÊ
                            </button>
                          ) : (
                            <button
                              id={`player-view-${char.id}`}
                              onClick={() => onSelectCharacter(char.id, true)}
                              className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[10px] font-mono py-1.5 rounded-none transition uppercase border border-zinc-800 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> TÁTICO_ALIADO
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add character modal overlay */}
      {showAddModal && (
        <div id="add-char-modal" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-none w-full max-w-md p-6 overflow-hidden shadow-2xl relative">
            <h3 className="font-mono text-xs text-zinc-400 mb-4 tracking-widest text-left border-b border-zinc-800 pb-2 uppercase font-bold">
              // NOVO_AGENTE_REGULADOR
            </h3>

            <form onSubmit={handleSubmitNewChar} className="space-y-4 text-left font-mono">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Nome Completo</label>
                <input
                  id="new-char-name"
                  type="text"
                  required
                  value={newCharForm.nome}
                  onChange={(e) => setNewCharForm({ ...newCharForm, nome: e.target.value })}
                  placeholder="ex: Thiago Santos"
                  className="bg-black border border-zinc-800 rounded-none text-xs text-zinc-300 p-2.5 outline-none focus:border-red-900/60"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Classe</label>
                <select
                  id="new-char-class"
                  value={newCharForm.classe}
                  onChange={(e) => setNewCharForm({ ...newCharForm, classe: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-none text-xs text-zinc-300 p-2.5 outline-none focus:border-red-900/60"
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">Origem</label>
                <select
                  id="new-char-origin"
                  value={newCharForm.origem}
                  onChange={(e) => setNewCharForm({ ...newCharForm, origem: e.target.value })}
                  className="bg-black border border-zinc-800 rounded-none text-xs text-zinc-300 p-2.5 outline-none focus:border-red-900/60"
                >
                  {ORIGENS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-900 mt-6 font-sans">
                <button
                  id="cancel-add-char-btn"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white py-2 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition"
                >
                  Cancelar
                </button>
                <button
                  id="submit-add-char-btn"
                  type="submit"
                  className="flex-1 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 py-2 rounded-none font-mono tracking-widest text-[10px] uppercase font-bold transition cursor-pointer"
                >
                  Admitir Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
