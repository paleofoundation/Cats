export const ROAD_HALF_LENGTH = 120
export const TRAFFIC_SPEED = 3.1
export const trafficLane = (direction: 1 | -1) => direction * -1.25

// Integrate active frames, so a paused/backgrounded garden never jumps ahead.
export function advanceTraffic(x: number, delta: number, direction: 1 | -1, active = true) {
  if (!active) return x
  const next = x + Math.min(.05, Math.max(0, delta)) * TRAFFIC_SPEED * direction
  if (next > ROAD_HALF_LENGTH) return next - ROAD_HALF_LENGTH * 2
  if (next < -ROAD_HALF_LENGTH) return next + ROAD_HALF_LENGTH * 2
  return next
}
