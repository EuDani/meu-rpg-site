/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Atributos {
  FOR: number; // Força
  AGI: number; // Agilidade
  INT: number; // Intelecto
  VIG: number; // Vigor
  PRE: number; // Presença
}

export type AtributoKey = keyof Atributos;

export interface Pericia {
  nome: string;
  atributo: AtributoKey;
  bonus: number;
  treinada: boolean;
  outros: number;
}

export interface Ataque {
  id: string;
  nome: string;
  teste: string;
  dano: string;
  critico: string;
  alcance: string;
  especial: string;
}

export interface HabilidadeRitual {
  id: string;
  nome: string;
  custo: string;
  pagina: string;
  descricao: string; // Utilizará rich text
  tipo?: "habilidade" | "ritual";
  elemento?: string; // Elemento do ritual (Sangue, Morte, Energia, Conhecimento, Medo)
}

export interface ItemInventario {
  id: string;
  nome: string;
  categoria: string; // I, II, III, IV ou Livre
  espacos: number;
}

export interface StatusBar {
  atual: number;
  max: number;
}

export interface Defesa {
  base: number;
  agi: number;
  equip: number;
  outros: number;
  total: number;
}

export interface Personagem {
  id: string;
  nome: string;
  jogador: string;
  origem: string;
  classe: string; // Combatente, Especialista, Ocultista
  nex: number; // Nível de Exposição Paranormal %
  peRodada: number; // Limite de PE por rodada
  deslocamento: string;
  patente: string; // Recrut, Operador, Agente Especial...
  prestigio: number;
  avatarUrl: string; // Base64 ou URL padrão

  atributos: Atributos;
  pv: StatusBar; // Pontos de Vida
  pe: StatusBar; // Pontos de Esforço
  san: StatusBar; // Sanidade
  defesa: Defesa;
  protecao: string;
  resistencias: string;

  pericias: Pericia[];
  ataques: Ataque[];
  habilidadesRituais: HabilidadeRitual[];
  dtRituais: string;

  inventario: {
    itens: ItemInventario[];
    limiteEspacos: number;
    limiteCredito: string;
    cargaMaxima: number;
  };

  descricao: {
    aparencia: string; // Rich Text
    personalidade: string; // Rich Text
    historico: string; // Rich Text
    objetivo: string; // Rich Text
    anotacoesJogador?: string; // Rich Text para anotações do jogador
    alteracoesParanormais?: string; // Rich Text para Alterações Paranormais Físicas e mentais
  };

  notasMestre: string; // Rich Text para anotações secretas
}

export type CurrentRole = "jogador" | "mestre";
