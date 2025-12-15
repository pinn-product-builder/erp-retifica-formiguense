/**
 * Mapa de cores dos componentes do motor
 * Centralizado para evitar duplicação
 */

export const COMPONENT_COLORS = {
  todos: 'bg-blue-500',
  bloco: 'bg-green-500',
  eixo: 'bg-orange-500',
  biela: 'bg-yellow-500',
  comando: 'bg-purple-500',
  cabecote: 'bg-red-500',
  virabrequim: 'bg-cyan-500',
  pistao: 'bg-pink-500',
  pistao_com_anel: 'bg-rose-500',
  anel: 'bg-indigo-500',
  camisas: 'bg-teal-500',
  bucha_comando: 'bg-violet-500',
  retentores_dianteiro: 'bg-blue-600',
  retentores_traseiro: 'bg-blue-700',
  pista_virabrequim: 'bg-sky-500',
  selo_comando: 'bg-fuchsia-500',
  gaxeta: 'bg-emerald-500',
  selo_dagua: 'bg-amber-500',
  borrachas_camisa: 'bg-lime-500',
  calco_camisas: 'bg-green-600',
  bujao_carter: 'bg-stone-500',
  tubo_bloco: 'bg-gray-500'
} as const;

export const COLOR_HEX_MAP = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-orange-500': '#f97316',
  'bg-yellow-500': '#eab308',
  'bg-purple-500': '#a855f7',
  'bg-red-500': '#ef4444',
  'bg-cyan-500': '#06b6d4',
  'bg-pink-500': '#ec4899',
  'bg-rose-500': '#f43f5e',
  'bg-indigo-500': '#6366f1',
  'bg-teal-500': '#14b8a6',
  'bg-violet-500': '#8b5cf6',
  'bg-blue-600': '#2563eb',
  'bg-blue-700': '#1d4ed8',
  'bg-sky-500': '#0ea5e9',
  'bg-fuchsia-500': '#d946ef',
  'bg-emerald-500': '#10b981',
  'bg-amber-500': '#f59e0b',
  'bg-lime-500': '#84cc16',
  'bg-green-600': '#16a34a',
  'bg-stone-500': '#78716c',
  'bg-gray-500': '#6b7280'
} as const;

/**
 * Obtém a cor Tailwind de um componente
 */
export function getComponentColor(componentId: string): string {
  return COMPONENT_COLORS[componentId as keyof typeof COMPONENT_COLORS] || 'bg-gray-500';
}

/**
 * Converte cor Tailwind para HEX
 */
export function getComponentColorHex(tailwindColor: string): string {
  return COLOR_HEX_MAP[tailwindColor as keyof typeof COLOR_HEX_MAP] || '#6b7280';
}
