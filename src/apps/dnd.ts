/**
 * Arrastar arquivo de uma janela para outra.
 *
 * As janelas do jogo vivem todas no mesmo documento, entao o drag-and-drop
 * nativo do navegador funciona entre elas: o Explorer marca os arquivos da
 * unidade Z: como arrastaveis e o Decodificador do NetRipper e o alvo do drop.
 */

/** Tipo do payload no dataTransfer. */
export const DND_FILE = 'application/x-scanss-file'

export interface DragFile {
  /** Pasta onde o arquivo esta, dentro da maquina conectada. */
  path: string[]
  name: string
  /** Nivel do cadeado, para o alvo do drop saber se consegue abrir. */
  locked: number
}

export function setDragFile(e: React.DragEvent, file: DragFile): void {
  e.dataTransfer.setData(DND_FILE, JSON.stringify(file))
  // O texto simples e so cortesia: alguns alvos so aceitam text/plain.
  e.dataTransfer.setData('text/plain', file.name)
  e.dataTransfer.effectAllowed = 'copy'
}

/** Le o payload de um drop. Devolve null se nao for um arquivo do jogo. */
export function getDragFile(e: React.DragEvent): DragFile | null {
  const bruto = e.dataTransfer.getData(DND_FILE)
  if (!bruto) return null
  try {
    return JSON.parse(bruto) as DragFile
  } catch {
    return null
  }
}
