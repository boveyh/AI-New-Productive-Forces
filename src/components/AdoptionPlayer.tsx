import { Player, type PlayerRef } from '@remotion/player'
import { forwardRef, useEffect, useRef } from 'react'
import { AdoptionComposition } from './AdoptionComposition'

type Props = {
  durationInFrames: number
  fps: number
  onReady: () => void
}

export const AdoptionPlayer = forwardRef<PlayerRef, Props>(function AdoptionPlayer({ durationInFrames, fps, onReady }, ref) {
  const reported = useRef(false)
  useEffect(() => {
    if (!reported.current) {
      reported.current = true
      onReady()
    }
  }, [onReady])
  return <Player
    ref={ref}
    component={AdoptionComposition}
    durationInFrames={durationInFrames}
    compositionWidth={840}
    compositionHeight={500}
    fps={fps}
    controls
    loop
    style={{ width: '100%', aspectRatio: '840 / 500' }}
    acknowledgeRemotionLicense
  />
})
