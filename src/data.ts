/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Personagem, Pericia } from "./types";

export const CLASSES = ["Combatente", "Especialista", "Ocultista"] as const;

export const ORIGENS = [
  "Acadêmico",
  "Agente de Saúde",
  "Amnésico",
  "Artista",
  "Atleta",
  "Chef",
  "Criminoso",
  "Cultista Arrependido",
  "Desgarrado",
  "Eletricista",
  "Esportista",
  "Executivo",
  "Investigador",
  "Lutador",
  "Mercenário",
  "Militar",
  "Perito",
  "Policial",
  "Religioso",
  "Savant",
  "T.I.",
  "Trabalhador",
  "Vítima"
] as const;

export const PATENTES = [
  "Recruta",
  "Operador",
  "Agente Especial",
  "Oficial de Operações",
  "Agente de Elite"
] as const;

export const DEFAULT_PERICIAS: Omit<Pericia, "bonus" | "treinada" | "outros">[] = [
  { nome: "Acrobacia", atributo: "AGI" },
  { nome: "Adestramento", atributo: "PRE" },
  { nome: "Artes", atributo: "PRE" },
  { nome: "Atletismo", atributo: "FOR" },
  { nome: "Atualidades", atributo: "INT" },
  { nome: "Ciências", atributo: "INT" },
  { nome: "Crime", atributo: "AGI" },
  { nome: "Diplomacia", atributo: "PRE" },
  { nome: "Enganação", atributo: "PRE" },
  { nome: "Fortitude", atributo: "VIG" },
  { nome: "Furtividade", atributo: "AGI" },
  { nome: "Iniciativa", atributo: "AGI" },
  { nome: "Intimidação", atributo: "PRE" },
  { nome: "Intuição", atributo: "PRE" },
  { nome: "Investigação", atributo: "INT" },
  { nome: "Luta", atributo: "FOR" },
  { nome: "Medicina", atributo: "INT" },
  { nome: "Ocultismo", atributo: "INT" },
  { nome: "Percepção", atributo: "PRE" },
  { nome: "Pilotagem", atributo: "AGI" },
  { nome: "Pontaria", atributo: "AGI" },
  { nome: "Profissão", atributo: "INT" },
  { nome: "Reflexos", atributo: "AGI" },
  { nome: "Religião", atributo: "PRE" },
  { nome: "Sobrevivência", atributo: "INT" },
  { nome: "Tática", atributo: "INT" },
  { nome: "Tecnologia", atributo: "INT" },
  { nome: "Vontade", atributo: "PRE" }
];

export function getFreshPericiasList(): Pericia[] {
  return DEFAULT_PERICIAS.map(p => ({
    nome: p.nome,
    atributo: p.atributo,
    bonus: 0,
    treinada: false,
    outros: 0
  }));
}

// Immersive default character 1 (Combatente)
const charThiago: Personagem = {
  id: "thiago-zero-santos",
  nome: "Thiago \"Zero\" Santos",
  jogador: "Gabriel Souza",
  origem: "Militar",
  classe: "Combatente",
  nex: 35,
  peRodada: 3,
  deslocamento: "9m",
  patente: "Agente Especial",
  prestigio: 200,
  avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400",
  
  atributos: {
    FOR: 3,
    AGI: 2,
    INT: 1,
    VIG: 3,
    PRE: 1
  },
  
  pv: { atual: 48, max: 54 },
  pe: { atual: 12, max: 15 },
  san: { atual: 24, max: 35 },
  
  defesa: {
    base: 10,
    agi: 2,
    equip: 5,
    outros: 0,
    total: 17
  },
  
  protecao: "Colete Balístico Leve (+5 Defesa)",
  resistencias: "Resistência a Balístico 2, Resistência a Corte 2",
  
  pericias: getFreshPericiasList().map(p => {
    if (p.nome === "Iniciativa") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Fortitude") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Luta") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Atletismo") return { ...p, bonus: 5, treinada: true, outros: 2 };
    if (p.nome === "Reflexos") return { ...p, bonus: 5, treinada: true };
    return p;
  }),
  
  ataques: [
    {
      id: "atk-1",
      nome: "Fuzil de Assalto AR-15",
      teste: "AGI + 5 (Pontaria)",
      dano: "2d10",
      critico: "19/x3",
      alcance: "Médio",
      especial: "Auto/Semiativo, Calibre Grosso"
    },
    {
      id: "atk-2",
      nome: "Faca de Combate",
      teste: "FOR + 5 (Luta)",
      dano: "1d6 + 3",
      critico: "19/x2",
      alcance: "Corpo a corpo",
      especial: "Ágil, Margem de ameaça ampliada"
    }
  ],
  
  habilidadesRituais: [
    {
      id: "hab-1",
      nome: "Ataque Especial",
      custo: "1 PE",
      pagina: "75",
      descricao: "<p>Ao realizar um ataque, você pode gastar 1 PE para receber +2 no teste de ataque ou +2 na rolagem de dano. Conforme seu NEX aumenta, o bônus aumenta.</p>"
    },
    {
      id: "hab-2",
      nome: "Tiro de Cobertura",
      custo: "2 PE",
      pagina: "76",
      descricao: "<p>Você pode gastar uma ação de movimento e 2 PE para fazer disparos que forçam inimigos humanos a buscar cobertura, aplicando -2 em testes de ataque deles até sua próxima rodada.</p>"
    }
  ],
  
  dtRituais: "12",
  
  inventario: {
    itens: [
      { id: "item-1", nome: "Fuzil AR-15 com Munição", categoria: "II", espacos: 2 },
      { id: "item-2", nome: "Colete Tático", categoria: "I", espacos: 1 },
      { id: "item-3", nome: "Faca de Combate", categoria: "I", espacos: 1 },
      { id: "item-4", nome: "Lanterna e Pilhas", categoria: "Livre", espacos: 0 },
      { id: "item-5", nome: "Kit de Primeiros Socorros", categoria: "I", espacos: 1 }
    ],
    limiteEspacos: 15,
    limiteCredito: "Médio",
    cargaMaxima: 15
  },
  
  descricao: {
    aparencia: "<p>Thiago é um homem alto, de olhos cansados e pose ereta severa. Tem cabelos grisalhos cortados militarmente e uma cicatriz proeminente que cruza o supercílio esquerdo até a bochecha. Costuma usar roupas pretas e um casaco militar verde-oliva encardido.</p>",
    personalidade: "<p>Extremamente protetor com seus companheiros, Thiago fala somente o necessário. Ele carrega a culpa de ter perdido sua antiga equipe em uma missão paranormal em Paranapiacaba. É leal até as últimas consequências.</p>",
    historico: "<p>Ex-oficial de forças especiais da polícia militar. Após se deparar com uma criatura de <i>Sangue</i> no necrotério de um hospital desativado, foi recrutado pela Ordo Realitas. Utiliza sua disciplina tática para enfrentar terrores incompreensíveis.</p>",
    objetivo: "<p>Descobrir quem enviou as coordenadas da usina abandonada que vitimou sua antiga equipe de militares.</p>"
  },
  
  notasMestre: "<p><strong>SEGREDOS (Apenas Mestre vê):</strong> O Thiago está infundido com Sangue de forma latente devido ao incidente no necrotério. Na verdade, a criatura de Sangue que ele enfrentou não o atacou diretamente, mas sussurrou palavras em seu ouvido que ele apagou da memória. Ele tem uma marca nas costas que queima sempre que um ritual de 1º círculo de Sangue é conjurado por perto.</p>"
};

// Immersive default character 2 (Ocultista)
const charAgatha: Personagem = {
  id: "agatha-morte-volkov",
  nome: "Agatha Volkov",
  jogador: "Mariana Dias",
  origem: "Cultista Arrependido",
  classe: "Ocultista",
  nex: 40,
  peRodada: 4,
  deslocamento: "9m",
  patente: "Agente Especial",
  prestigio: 250,
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
  
  atributos: {
    FOR: 1,
    AGI: 2,
    INT: 4,
    VIG: 1,
    PRE: 2
  },
  
  pv: { atual: 21, max: 28 },
  pe: { atual: 22, max: 24 },
  san: { atual: 18, max: 45 },
  
  defesa: {
    base: 10,
    agi: 2,
    equip: 1,
    outros: 0,
    total: 13
  },
  
  protecao: "Acessórios Ocultistas (+1 Defesa)",
  resistencias: "Resistência a Conhecimento 5, Resistência a Morte 2",
  
  pericias: getFreshPericiasList().map(p => {
    if (p.nome === "Ocultismo") return { ...p, bonus: 10, treinada: true };
    if (p.nome === "Investigação") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Furtividade") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Intuição") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Vontade") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Percepção") return { ...p, bonus: 5, treinada: true };
    if (p.nome === "Perito Ciências") return { ...p, bonus: 5, treinada: true };
    return p;
  }),
  
  ataques: [
    {
      id: "atk-3",
      nome: "Revólver .38",
      teste: "AGI + 2 (Pontaria)",
      dano: "2d6",
      critico: "18/x2",
      alcance: "Curto",
      especial: "Leve, Recarga Lenta"
    },
    {
      id: "atk-4",
      nome: "Agulha Ritualística (Canalizador)",
      teste: "FOR + 1 (Luta)",
      dano: "1d4 + 1",
      critico: "25/x3",
      alcance: "Corpo a corpo",
      especial: "Pode gastar 1 PE para usar como foco canalizador (+1 em DT)"
    }
  ],
  
  habilidadesRituais: [
    {
      id: "rit-1",
      nome: "Ritual: Decadência (Morte - 1º Círculo)",
      custo: "1 PE",
      pagina: "123",
      descricao: "<p>Você gasta 1 PE para convocar a poeira e espiral do tempo. O toque acelera o envelhecimento celular do alvo. O inimigo sofre 2d8+2 de dano de Morte e envelhece sutilmente (reduz deslocamento em -3m por 1 rodada).</p>"
    },
    {
      id: "rit-2",
      nome: "Ritual: Cicatrização (Morte - 1º Círculo)",
      custo: "1 PE",
      pagina: "125",
      descricao: "<p>Ao tocar o alvo e gastar 1 PE, você acelera o tempo de recuperação celular do corpo dele. Cura 2d10+2 Pontos de Vida, mas o alvo envelhece 1 ano biologicamente na hora (marca estética temporária).</p>"
    },
    {
      id: "rit-3",
      nome: "Ritual: Terceiro Olho (Conhecimento)",
      custo: "2 PE",
      pagina: "128",
      descricao: "<p>Você gasta 2 PE para ver fluxo de energia em seres ou objetos. Recebe +5 em Percepção e Intuição e consegue enxergar vestígios de rituais e crias paranormais em até 9 metros.</p>"
    }
  ],
  
  dtRituais: "15",
  
  inventario: {
    itens: [
      { id: "item-6", nome: "Revólver .38", categoria: "I", espacos: 1 },
      { id: "item-7", nome: "Mala de Ocultista (Livros, Runas)", categoria: "I", espacos: 1 },
      { id: "item-8", nome: "Agulha de Prata Canalizadora", categoria: "I", espacos: 1 },
      { id: "item-9", nome: "Símbolos Sagrados de Giz", categoria: "Livre", espacos: 0 },
      { id: "item-10", nome: "Rações de Sobrevivência", categoria: "Livre", espacos: 0 }
    ],
    limiteEspacos: 5,
    limiteCredito: "Baixo",
    cargaMaxima: 5
  },
  
  descricao: {
    aparencia: "<p>Agatha é jovem, possui olhos de um azul gelo cortantes e longos cabelos negros que ela costuma trançar. Suas mãos estão marcadas por finas runas pretas tatuadas que parecem se mover sutilmente sob a luz indireta. Ela veste xales pretos largos e túnicas cinzentas.</p>",
    personalidade: "<p>Calculista e melancólica. Agatha fala num tom suave mas tenso, quase sussurrado, como se estivesse sempre guardando um segredo cósmico. Tem pânico de rituais com chamas puras devido ao seu trauma familiar.</p>",
    historico: "<p>Filha de líderes da seita <i>Filhos da Névoa Espiral</i>, Agatha foi criada envolvida em rituais de Morte e Conhecimento. Aos 16 anos, percebeu que a seita pretendia sacrificá-la para manifestar um Ente. Fugiu sabotando o santuário e foi recolhida pela Ordo Realitas.</p>",
    objetivo: "<p>Expiar seus pecados passados, desmantelar o antigo culto de sua família e libertar outros jovens cativos.</p>"
  },
  
  notasMestre: "<p><strong>INFO SECRETA DO MESTRE:</strong> A família de Agatha a está caçando ativamente. O pai dela, Arthur Volkov, sobreviveu à sabotagem do templo e agora é um marcado de alto NEX de Morte (com nome fictício de Kian-seguidor). Agatha está lentamente acumulando <i>marcas de envelhecimento na pele</i> decorrentes de abusar de ritos temporais (Cicatrização); sua expectativa de vida real diminuiu pela metade.</p>"
};

export const DEFAULT_CHARACTERS = [charThiago, charAgatha];
