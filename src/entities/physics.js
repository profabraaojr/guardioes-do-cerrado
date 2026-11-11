// Colisão contra o mapa de tiles: eixos separados, plataformas de mão única,
// rampas de 45° e tolerância de degrau. Usado pelo guardião e por criaturas.
GC.Phys = (function () {
  const S = 16;
  const TP = () => GC.TP;

  function blocksH(level, tx, ty) { return TP()[level.tile(tx, ty)].solid; }

  function moveX(b, dx, level) {
    if (!dx) return false;
    let nx = b.x + dx, hit = false;
    const top = b.y, bot = b.y + b.h;
    const ty0 = Math.floor(top / S), ty1 = Math.floor((bot - 0.01) / S);
    const tx = dx > 0 ? Math.floor((nx + b.w - 0.01) / S) : Math.floor(nx / S);
    for (let ty = ty0; ty <= ty1; ty++) {
      if (!blocksH(level, tx, ty)) continue;
      // tolerância de degrau (sobe bordas de rampas)
      if (b.onGround && ty * S >= bot - GC.CFG.STEP_UP) continue;
      nx = dx > 0 ? tx * S - b.w : (tx + 1) * S;
      hit = true;
      break;
    }
    b.x = nx;
    return hit;
  }

  function moveY(b, dy, level) {
    const T = GC.TP;
    let ny = b.y + dy, landed = false, bonk = false;
    const tx0 = Math.floor(b.x / S), tx1 = Math.floor((b.x + b.w - 0.01) / S);
    if (dy > 0) {
      const oldBot = b.y + b.h, newBot = ny + b.h;
      const ty0 = Math.floor((oldBot - GC.CFG.STEP_UP) / S), ty1 = Math.floor((newBot - 0.01) / S);
      let best = Infinity;
      for (let ty = Math.max(0, ty0); ty <= ty1; ty++) {
        const top = ty * S;
        if (top < oldBot - GC.CFG.STEP_UP - 0.01) continue;
        for (let tx = tx0; tx <= tx1; tx++) {
          const p = T[level.tile(tx, ty)];
          if (p.solid || (p.oneway && !b.dropThrough && oldBot <= top + 0.5)) { if (top < best) best = top; }
        }
      }
      if (best < Infinity && newBot >= best) { ny = best - b.h; landed = true; }
    } else if (dy < 0) {
      const ty = Math.floor(ny / S);
      for (let tx = tx0; tx <= tx1; tx++) if (T[level.tile(tx, ty)].solid) { ny = (ty + 1) * S; bonk = true; break; }
    }
    b.y = ny;
    return { landed, bonk };
  }

  // superfície de rampa sob o ponto (fx, pés)
  function slopeSurface(level, fx, bottom) {
    const tx = Math.floor(fx / S);
    const ty0 = Math.floor((bottom - 1) / S);
    for (let ty = ty0; ty <= ty0 + 1; ty++) {
      const t = level.tile(tx, ty), p = GC.TP[t];
      if (!p.slope) continue;
      const local = fx - tx * S;
      const surf = ty * S + (p.slope > 0 ? S - local : local);
      return { surf, dir: p.slope };
    }
    return null;
  }

  function move(b, dt, level) {
    const wasGround = b.onGround;
    b.hitWall = moveX(b, b.vx * dt, level) ? (b.vx > 0 ? 1 : -1) : 0;
    if (b.hitWall) b.vx = 0;
    const r = moveY(b, b.vy * dt, level);
    b.onGround = false;
    b.onSlope = 0;
    if (r.landed) { b.vy = 0; b.onGround = true; }
    if (r.bonk) b.vy = 0;
    // rampas
    const s = slopeSurface(level, b.x + b.w / 2, b.y + b.h);
    if (s && b.vy >= 0) {
      const bot = b.y + b.h, d = s.surf - bot;
      if ((wasGround && d <= 9 && d >= -12) || (!wasGround && d <= 0 && d >= -12)) {
        b.y = s.surf - b.h; b.vy = 0; b.onGround = true; b.onSlope = s.dir;
      }
    }
    // chão abaixo (detecção para cair de bordas)
    if (!b.onGround && b.vy >= 0) {
      const bot = b.y + b.h;
      if (Math.abs(bot - Math.round(bot / S) * S) < 0.01) {
        const ty = Math.round(bot / S);
        const tx0 = Math.floor(b.x / S), tx1 = Math.floor((b.x + b.w - 0.01) / S);
        for (let tx = tx0; tx <= tx1; tx++) { const p = GC.TP[level.tile(tx, ty)]; if (p.solid || (p.oneway && !b.dropThrough)) { b.onGround = true; break; } }
      }
    }
    return b;
  }

  function ceilingBlocked(b, level, newH) {
    const top = b.y + b.h - newH;
    const tx0 = Math.floor(b.x / S), tx1 = Math.floor((b.x + b.w - 0.01) / S);
    for (let ty = Math.floor(top / S); ty <= Math.floor((b.y - 0.01) / S); ty++)
      for (let tx = tx0; tx <= tx1; tx++) if (GC.TP[level.tile(tx, ty)].solid) return true;
    return false;
  }

  return { move, moveX, moveY, slopeSurface, ceilingBlocked };
})();
