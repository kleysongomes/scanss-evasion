/**
 * "Baixar": gera um atalho para a URL do jogo e entrega como arquivo.
 *
 * Nao existe API de navegador para criar um icone na area de trabalho, entao a
 * saida honesta e baixar o arquivo de atalho do proprio sistema - o jogador
 * arrasta para a area de trabalho e pronto. Cada sistema tem o seu formato:
 *
 *   Windows  .url      arquivo INI que o Explorer entende como atalho
 *   macOS    .webloc   plist que o Finder entende
 *   Linux    .desktop  entrada de aplicativo do padrao freedesktop
 *
 * Quando o navegador suporta instalacao (PWA), a landing prefere aquele caminho:
 * ele cria um icone de verdade em vez de um arquivo na pasta de downloads.
 */

export type Sistema = 'windows' | 'mac' | 'linux'

/** Adivinha o sistema pelo que o navegador conta. Erra para Windows. */
export function detectarSistema(): Sistema {
  const s = navigator.userAgent
  if (/Mac|iPhone|iPad/i.test(s)) return 'mac'
  if (/Linux|X11|Android/i.test(s) && !/Windows/i.test(s)) return 'linux'
  return 'windows'
}

const NOME = 'ScanSS Evasion'

interface Atalho { nome: string; tipo: string; conteudo: string }

export function montarAtalho(url: string, sistema: Sistema): Atalho {
  switch (sistema) {
    case 'mac':
      return {
        nome: `${NOME}.webloc`,
        tipo: 'application/xml',
        conteudo:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ' +
          '"http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
          '<plist version="1.0">\n<dict>\n' +
          `\t<key>URL</key>\n\t<string>${url}</string>\n` +
          '</dict>\n</plist>\n',
      }

    case 'linux':
      return {
        nome: `${NOME}.desktop`,
        tipo: 'application/x-desktop',
        conteudo:
          '[Desktop Entry]\n' +
          'Type=Link\n' +
          `Name=${NOME}\n` +
          `URL=${url}\n` +
          'Icon=text-html\n',
      }

    default:
      // O .url do Windows e um INI, e precisa de quebra de linha CRLF.
      return {
        nome: `${NOME}.url`,
        tipo: 'application/internet-shortcut',
        conteudo: ['[InternetShortcut]', `URL=${url}`, 'IconIndex=0', ''].join('\r\n'),
      }
  }
}

/** Entrega o atalho como download. */
export function baixarAtalho(url: string, sistema = detectarSistema()): void {
  const { nome, tipo, conteudo } = montarAtalho(url, sistema)
  const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` })
  const href = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = href
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()

  // Sem isto o blob fica na memoria ate a aba fechar.
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/** Onde o atalho vai parar, para a landing explicar ao jogador. */
export function comoUsar(sistema: Sistema): string {
  switch (sistema) {
    case 'mac':
      return 'O arquivo cai em Downloads. Arraste para a Mesa e dê dois cliques.'
    case 'linux':
      return 'O arquivo cai em Downloads. Mova para a Área de Trabalho e marque ' +
             'como executável.'
    default:
      return 'O arquivo cai em Downloads. Arraste para a Área de Trabalho e ' +
             'dê dois cliques.'
  }
}

/**
 * Como instalar na mao, quando o navegador nao oferece o convite.
 *
 * O evento `beforeinstallprompt` e so do Chrome e derivados - Firefox e Safari
 * nunca disparam, e mesmo no Chrome ele as vezes demora. Um botao que depende
 * so dele fica calado justamente para quem quer instalar, entao o texto abaixo
 * cobre o caminho manual de cada navegador.
 */
export function comoInstalar(): string {
  const ua = navigator.userAgent
  const toque = /iPhone|iPad|Android/i.test(ua)
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)
  const firefox = /Firefox/i.test(ua)

  if (/iPhone|iPad/i.test(ua)) {
    return 'No iPhone e no iPad: toque em Compartilhar e depois em ' +
           '"Adicionar à Tela de Início".'
  }
  if (toque) {
    return 'No celular: abra o menu do navegador (⋮) e toque em ' +
           '"Instalar aplicativo".'
  }
  if (safari) {
    return 'No Safari: menu Arquivo › "Adicionar à Dock".'
  }
  if (firefox) {
    return 'O Firefox não instala sites como aplicativo. Use o atalho abaixo, ' +
           'ou abra em um navegador que instale (Chrome, Edge, Brave).'
  }
  return 'Clique no ícone de instalar na barra de endereço — ou abra o menu ' +
         'do navegador (⋮) e escolha "Instalar ScanSS Evasion".'
}
