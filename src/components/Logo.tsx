// MolecuLensLogo.tsx
import React from 'react'

type Props = {
  size?: number
  showWordmark?: boolean
  c1?: string
  c2?: string
  title?: string
  idSuffix?: string
  className?: string
}

export default function MolecuLensLogo({
  size = 256,
  showWordmark = false,
  c1 = '#06b6d4',
  c2 = '#8b5cf6',
  title = 'MolecuLens',
  idSuffix = 'ml',
  className
}: Props) {
  const gid = (n: string) => `${n}-${idSuffix}`
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 512 512'
      width={size}
      height={size}
      role='img'
      aria-labelledby='title desc'
      className={className}
    >
      <title id='title'>{title}</title>
      <desc id='desc'>Logomark combining a camera lens ring and a hexagonal molecule network.</desc>
      <defs>
        <linearGradient id={gid('ml-g')} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor={c1}/>
          <stop offset='100%' stopColor={c2}/>
        </linearGradient>
        <radialGradient id={gid('ml-glass')} cx='35%' cy='30%' r='75%'>
          <stop offset='0%' stopColor='white' stopOpacity='0.35'/>
          <stop offset='50%' stopColor='#0ea5e9' stopOpacity='0.12'/>
          <stop offset='100%' stopColor='#312e81' stopOpacity='0.2'/>
        </radialGradient>
        <filter id={gid('ml-soft')} x='-20%' y='-20%' width='140%' height='140%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='6' result='b'/>
          <feBlend in='SourceGraphic' in2='b' mode='screen'/>
        </filter>
        <mask id={gid('ml-cut')}>
          <rect width='100%' height='100%' fill='white'/>
          <circle cx='176' cy='168' r='62' fill='black'/>
        </mask>
      </defs>

      <circle cx='256' cy='256' r='176' fill={`url(#${gid('ml-glass')})`}/>
      <circle cx='256' cy='256' r='176' fill='none' stroke={`url(#${gid('ml-g')})`} strokeWidth='18'/>
      <circle cx='256' cy='256' r='144' fill='none' stroke={`url(#${gid('ml-g')})`} strokeWidth='2' opacity='0.5'/>

      <g stroke={`url(#${gid('ml-g')})`} strokeWidth='10' strokeLinecap='round' strokeLinejoin='round' fill='none' filter={`url(#${gid('ml-soft')})`}>
        <path d='M256 142 L336 188 L336 276 L256 322 L176 276 L176 188 Z'/>
      </g>

      <g stroke={`url(#${gid('ml-g')})`} strokeWidth='10' strokeLinecap='round' fill='none'>
        <path d='M256 142 L256 90'/>
        <path d='M336 188 L382 160'/>
        <path d='M336 276 L382 304'/>
        <path d='M256 322 L256 374'/>
        <path d='M176 276 L130 304'/>
        <path d='M176 188 L130 160'/>
      </g>

      <g fill={`url(#${gid('ml-g')})`}>
        <circle cx='256' cy='142' r='12'/>
        <circle cx='336' cy='188' r='12'/>
        <circle cx='336' cy='276' r='12'/>
        <circle cx='256' cy='322' r='12'/>
        <circle cx='176' cy='276' r='12'/>
        <circle cx='176' cy='188' r='12'/>

        <circle cx='256' cy='90' r='9'/>
        <circle cx='382' cy='160' r='9'/>
        <circle cx='382' cy='304' r='9'/>
        <circle cx='256' cy='374' r='9'/>
        <circle cx='130' cy='304' r='9'/>
        <circle cx='130' cy='160' r='9'/>
      </g>

      

      {showWordmark && (
        <g transform='translate(64,420)'>
          <text x='0' y='0' fontFamily='ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, Helvetica, Arial' fontSize='44' letterSpacing='0.5' fill={`url(#${gid('ml-g')})`}>
            MolecuLens
          </text>
        </g>
      )}
    </svg>
  )
}