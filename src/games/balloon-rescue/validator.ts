import type {
  BalloonActiveObstacle,
  BalloonObstacleDef,
  BalloonPoint,
  BalloonStageDef,
} from './types';

export const BALLOON_RADIUS = 3.2;

export function resolveObstaclePosition(
  obs: BalloonObstacleDef,
  tickCount: number,
): BalloonActiveObstacle {
  if (!obs.oscillateAxis || !obs.oscillateAmplitude || !obs.oscillatePeriodTicks) {
    return {
      id: obs.id,
      x: obs.x,
      y: obs.y,
      width: obs.width,
      height: obs.height,
      kind: obs.kind,
    };
  }

  // Deterministic triangle wave in [0, 1] -> smooth ping-pong without trig precision variance
  const period = obs.oscillatePeriodTicks;
  const phase = (tickCount % period) / period;
  const wave = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const offset = wave * obs.oscillateAmplitude;

  return {
    id: obs.id,
    x: obs.oscillateAxis === 'x' ? obs.x + offset : obs.x,
    y: obs.oscillateAxis === 'y' ? obs.y + offset : obs.y,
    width: obs.width,
    height: obs.height,
    kind: obs.kind,
  };
}

export function getActiveObstacles(
  stage: BalloonStageDef,
  tickCount: number,
): BalloonActiveObstacle[] {
  return stage.obstacles.map((obs) => resolveObstaclePosition(obs, tickCount));
}

export function checkBalloonCollision(
  pos: BalloonPoint,
  stage: BalloonStageDef,
  obstacles: BalloonActiveObstacle[],
): boolean {
  if (
    pos.x - BALLOON_RADIUS < 0 ||
    pos.x + BALLOON_RADIUS > stage.arenaWidth ||
    pos.y - BALLOON_RADIUS < 0 ||
    pos.y + BALLOON_RADIUS > stage.arenaHeight
  ) {
    return true;
  }

  return obstacles.some((o) => {
    const closestX = Math.max(o.x, Math.min(pos.x, o.x + o.width));
    const closestY = Math.max(o.y, Math.min(pos.y, o.y + o.height));
    const dx = pos.x - closestX;
    const dy = pos.y - closestY;
    return dx * dx + dy * dy < BALLOON_RADIUS * BALLOON_RADIUS;
  });
}

export function checkBalloonLanded(
  pos: BalloonPoint,
  landingZone: BalloonStageDef['landingZone'],
): boolean {
  return (
    pos.x >= landingZone.x &&
    pos.x <= landingZone.x + landingZone.width &&
    pos.y >= landingZone.y &&
    pos.y <= landingZone.y + landingZone.height
  );
}
