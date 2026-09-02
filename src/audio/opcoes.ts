/**
 * As opções de som, guardadas separadas do jogo.
 *
 * Chave própria no armazenamento, e não um campo do save, porque volume não é
 * progresso: começar uma partida nova, perder a antiga ou ter o save
 * aposentado por mudança de regra não pode devolver o volume ao padrão nem
 * ligar o som de quem desligou.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { aplicar, type Mixagem } from './motor'
import { apertarTrilha, pararTrilha, tocarTrilha, trilhaTocando } from './trilha'

interface OpcoesDeSom extends Mixagem {
  setMudo: (mudo: boolean) => void
  setMusica: (v: number) => void
  setEfeitos: (v: number) => void
  /** Manda o estado atual para o motor. Chamado quando o áudio destrava. */
  sincronizar: () => void
}

const PADRAO: Mixagem = {
  mudo: false,
  // A trilha entra baixa de propósito: ela é ambiente, e quem quiser mais tem
  // o controle logo ali.
  musica: 0.35,
  efeitos: 0.7,
}

/** Sem localStorage (testes em Node), guarda em memória e segue. */
function memoria(): Storage {
  const dados = new Map<string, string>()
  return {
    get length() { return dados.size },
    key: (i) => [...dados.keys()][i] ?? null,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => { dados.set(k, v) },
    removeItem: (k) => { dados.delete(k) },
    clear: () => dados.clear(),
  }
}

export const useSom = create<OpcoesDeSom>()(
  persist(
    (set, get) => {
      /** Aplica no motor e liga ou desliga a trilha conforme o caso. */
      const mandar = () => {
        const { mudo, musica, efeitos } = get()
        aplicar({ mudo, musica, efeitos })
        // Trilha em volume zero continuaria agendando notas à toa.
        const deveTocar = !mudo && musica > 0
        if (deveTocar && !trilhaTocando()) tocarTrilha()
        if (!deveTocar && trilhaTocando()) pararTrilha()
      }

      return {
        ...PADRAO,
        setMudo: (mudo) => { set({ mudo }); mandar() },
        setMusica: (musica) => { set({ musica }); mandar() },
        setEfeitos: (efeitos) => { set({ efeitos }); mandar() },
        sincronizar: mandar,
      }
    },
    {
      name: 'scanss-evasion-som',
      version: 1,
      storage: createJSONStorage(() =>
        typeof localStorage !== 'undefined' ? localStorage : memoria()),
      partialize: (s) => ({
        mudo: s.mudo, musica: s.musica, efeitos: s.efeitos,
      }) as OpcoesDeSom,
    },
  ),
)

/** Repassa o rastreamento para a trilha, que acelera com ele. */
export const acompanharRastro = apertarTrilha
