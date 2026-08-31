/**
 * Klipe - o mascote do WinDoors, homenagem descarada ao clipe do Office.
 *
 * So o desenho: um clipe de papel com olhos que piscam. Quem decide o que ele
 * fala e o Manual do Operador (`apps/Tutorial.tsx`).
 */

interface Props {
  size?: number
  /** Faz a animacao de "falando" ao montar. */
  animado?: boolean
}

export function Klipe({ size = 52, animado = true }: Props) {
  return (
    <div className={`klipe${animado ? ' falando' : ''}`} aria-hidden>
      <svg viewBox="0 0 64 96" width={size} height={size * 1.5}>
        {/* o corpo: uma volta externa, uma do meio e a ponta interna */}
        <path
          d="M45 30 v42 a13 13 0 0 1 -26 0 v-46 a9 9 0 0 1 18 0 v44 a4.5 4.5 0 0 1 -9 0 v-38"
          fill="none" stroke="#9aa3b0" strokeWidth="6" strokeLinecap="round"
        />
        <path
          d="M45 30 v42 a13 13 0 0 1 -26 0 v-46 a9 9 0 0 1 18 0 v44 a4.5 4.5 0 0 1 -9 0 v-38"
          fill="none" stroke="#d8dee8" strokeWidth="2" strokeLinecap="round"
        />
        {/* olhos centrados sobre a curva de cima (que vai de x=19 a x=37) */}
        <g className="olhos">
          <ellipse cx="24" cy="20" rx="7.5" ry="8" fill="#fff" stroke="#5b6472" strokeWidth="1.5" />
          <ellipse cx="38" cy="20" rx="7.5" ry="8" fill="#fff" stroke="#5b6472" strokeWidth="1.5" />
          <circle cx="25.5" cy="21" r="3.2" fill="#1b2430" />
          <circle cx="39.5" cy="21" r="3.2" fill="#1b2430" />
        </g>
        {/* sobrancelhas dao a cara de "eu vi o que voce fez" */}
        <path d="M17 10 L29 13" stroke="#5b6472" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M45 10 L33 13" stroke="#5b6472" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
