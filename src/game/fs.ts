/**
 * Sistema de arquivos em arvore - funcoes puras, sem estado.
 *
 * Um caminho e a lista de nomes de pasta do topo ate onde voce esta:
 * `[]` e a raiz, `['Meus documentos', 'Fotos']` e duas pastas abaixo.
 * Toda operacao devolve uma arvore nova; nada e mutado no lugar.
 */

import type { VFile, VFolder, VNode, VPath } from './types'

export const isFolder = (n: VNode): n is VFolder => n.type === 'folder'
export const isFile = (n: VNode): n is VFile => n.type === 'file'

export const folder = (name: string, children: VNode[] = []): VFolder =>
  ({ type: 'folder', name, children })

/** Os filhos da pasta em `path`, ou null se o caminho nao existe. */
export function listAt(tree: VNode[], path: VPath): VNode[] | null {
  let atual = tree
  for (const nome of path) {
    const achou = atual.find((n) => isFolder(n) && n.name === nome)
    if (!achou || !isFolder(achou)) return null
    atual = achou.children
  }
  return atual
}

/** O no exato em `path` (o ultimo elemento e o nome do no). */
export function nodeAt(tree: VNode[], path: VPath): VNode | null {
  if (path.length === 0) return null
  const pai = listAt(tree, path.slice(0, -1))
  return pai?.find((n) => n.name === path[path.length - 1]) ?? null
}

/**
 * Substitui os filhos da pasta em `path` pelo resultado de `fn`, devolvendo
 * uma arvore nova. E a base de todas as operacoes de escrita.
 */
export function updateAt(
  tree: VNode[], path: VPath, fn: (children: VNode[]) => VNode[],
): VNode[] {
  if (path.length === 0) return fn(tree)
  const [cabeca, ...resto] = path
  return tree.map((n) => (
    isFolder(n) && n.name === cabeca
      ? { ...n, children: updateAt(n.children, resto, fn) }
      : n
  ))
}

/** Nome livre dentro de uma pasta: "Nova pasta", "Nova pasta (2)"... */
export function uniqueName(children: VNode[], base: string): string {
  if (!children.some((n) => n.name === base)) return base
  for (let i = 2; ; i++) {
    const tentativa = `${base} (${i})`
    if (!children.some((n) => n.name === tentativa)) return tentativa
  }
}

export function addAt(tree: VNode[], path: VPath, node: VNode): VNode[] {
  return updateAt(tree, path, (filhos) => [
    ...filhos,
    { ...node, name: uniqueName(filhos, node.name) },
  ])
}

export function removeAt(tree: VNode[], path: VPath, name: string): VNode[] {
  return updateAt(tree, path, (filhos) => filhos.filter((n) => n.name !== name))
}

export function renameAt(
  tree: VNode[], path: VPath, from: string, to: string,
): VNode[] {
  const limpo = to.trim()
  if (!limpo) return tree
  return updateAt(tree, path, (filhos) => {
    if (!filhos.some((n) => n.name === from)) return filhos
    // Nome ja usado por outro no: mantem como esta em vez de duplicar.
    if (filhos.some((n) => n.name === limpo && n.name !== from)) return filhos
    return filhos.map((n) => (n.name === from ? { ...n, name: limpo } : n))
  })
}

/** Marca um arquivo como aberto (usado ao quebrar o cadeado). */
export function unlockAt(tree: VNode[], path: VPath, name: string): VNode[] {
  return updateAt(tree, path, (filhos) => filhos.map((n) => (
    n.name === name && isFile(n) ? { ...n, locked: 0 } : n
  )))
}

/** Percorre a arvore inteira, incluindo subpastas. */
export function walk(tree: VNode[]): VFile[] {
  return tree.flatMap((n) => (isFolder(n) ? walk(n.children) : [n]))
}

/** Soma o peso incriminador de tudo que esta no disco. */
export function totalEvidence(tree: VNode[]): number {
  return walk(tree).reduce((soma, f) => soma + (f.evidence ?? 0), 0)
}

/** Quantos arquivos (nao pastas) existem na arvore inteira. */
export function countFiles(tree: VNode[]): number {
  return walk(tree).length
}

/** Caminho legivel para a barra de endereco. */
export function pathLabel(raiz: string, path: VPath): string {
  return [raiz, ...path].join('\\') + '\\'
}
