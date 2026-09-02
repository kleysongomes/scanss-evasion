/**
 * Balao da bandeja avisando que o rastreamento subiu de faixa.
 *
 * Morava dentro da Taskbar, mas nao e barra de tarefas: e um aviso do sistema,
 * irmao do aviso de e-mail e do de missao. Junto com eles na mesma pilha, ele
 * para de brigar por espaco - antes os tres disputavam o mesmo canto e o balao
 * cobria os botoes do e-mail, deixando a pausa sem saida visivel.
 */

import { useEffect, useRef, useState } from 'react'
import { heatColor, heatLevel, useGame } from '@/game/store'

const ALERTS: Record<string, { title: string; body: string }> = {
  atencao: {
    title: 'ScanSS · atividade registrada',
    body: 'Seus pacotes estão sendo amostrados. Nada grave ainda — mas o relógio começou.',
  },
  alerta: {
    title: 'ScanSS · rastreamento ativo',
    body: 'A V-Sec está correlacionando seus saltos. Considere limpar os logs.',
  },
  critico: {
    title: 'ScanSS · localização iminente',
    body: 'Eles estão a poucos saltos. Limpe os logs AGORA ou eles chegam aqui.',
  },
}

const FAIXAS = ['calmo', 'atencao', 'alerta', 'critico']

export function HeatBalloon() {
  const heat = useGame((s) => s.player.heat)
  const level = heatLevel(heat)

  const [balloon, setBalloon] = useState<{ title: string; body: string } | null>(null)
  const anterior = useRef(level)

  // Avisa quando o rastreamento sobe de faixa (nunca quando desce).
  useEffect(() => {
    if (FAIXAS.indexOf(level) > FAIXAS.indexOf(anterior.current) && ALERTS[level]) {
      setBalloon(ALERTS[level])
      const t = setTimeout(() => setBalloon(null), 9000)
      anterior.current = level
      return () => clearTimeout(t)
    }
    anterior.current = level
  }, [level])

  if (!balloon) return null

  return (
    <div className="balloon" onClick={() => setBalloon(null)}>
      <div className="title">
        <span style={{ color: heatColor(heat) }}>🛡️</span>
        {balloon.title}
      </div>
      <div>{balloon.body}</div>
    </div>
  )
}
