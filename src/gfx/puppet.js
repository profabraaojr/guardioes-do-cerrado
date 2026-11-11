// Boneco articulado em pixel art (quadro 64×64 em densidade dupla, pé em 32,62).
// Cada pose define ângulos de quadril, tronco, braços e pernas; o desenho é feito
// pixel a pixel, recebe contorno escuro e luz de cima. Assim as animações ficam
// fluidas (8 quadros de caminhada e corrida) sem perder a nitidez.
GC.Puppet = (function () {
  const D = Math.PI / 180;

  // ——— Especificações visuais ———
  const SPECS = {
    piata: {
      skin: '#b87850', skinD: '#8a5432', hair: '#1c1820', hairHi: '#3e3848', hairStyle: 'spiky',
      band: '#d8342c', bandD: '#9a2420', bandDot: '#f2c230',
      shirt: '#f2eee2', shirtD: '#c8c0ac', sleeve: 'short', emblem: '#4aa03a',
      pants: '#5a8a3e', pantsD: '#3e6a2a', pocket: true,
      boots: '#8a5428', bootsD: '#5a3418', sole: '#2a1a10',
      belt: '#4a3020', buckle: '#d8b040', pack: '#8a5a2e', packD: '#5e3a1c', staff: '#9a6a36', wrist: '#3a8ad8', mouth: '#7a2e24'
    },
    larinha: {
      skin: '#d29a70', skinD: '#a8704e', hair: '#5a321e', hairHi: '#7e4a2e', hairD: '#3a2014', hairStyle: 'curly',
      goggles: true,
      shirt: '#ec5a96', shirtD: '#b83c70', tee: '#f6f2ea', sleeve: 'rolled',
      pants: '#4a76b8', pantsD: '#2e5290', patch: '#e86aa0',
      boots: '#f070a8', bootsD: '#b84a7c', sole: '#f4f0f0',
      belt: '#5a3a1e', buckle: '#c8ccd8', pack: '#2a3a5a', packD: '#1a2640', glow: '#5ae8f8', mouth: '#8a3030', earring: '#5ae8f8'
    },
    traficante: { skin: '#b07850', skinD: '#86583a', hair: '#16161c', hairStyle: 'cap', cap: '#1e1e26', shirt: '#2e2e38', shirtD: '#1e1e26', sleeve: 'long', pants: '#3a3a4a', pantsD: '#2a2a36', boots: '#1e1e22', bootsD: '#121216', sole: '#0c0c10', belt: '#222', buckle: '#888', shades: true, mouth: '#5a2a22' },
    cacador: { skin: '#9a6a48', skinD: '#74482e', hair: '#2a1e16', hairStyle: 'brim', cap: '#6a7a42', shirt: '#5a6a3a', shirtD: '#43512a', sleeve: 'long', vest: '#4a4a2e', pants: '#4a4a32', pantsD: '#363622', boots: '#3a2a1a', bootsD: '#2a1c10', sole: '#160e08', belt: '#3a2a1a', buckle: '#8a7a4a', mouth: '#5a2a22', beard: true },
    descartador: { skin: '#c8906a', skinD: '#a06a48', hair: '#3a2a20', hairStyle: 'hood', cap: '#4a4e5a', shirt: '#5a6270', shirtD: '#444a56', sleeve: 'long', pants: '#2a2d36', pantsD: '#1c1e26', boots: '#22252e', bootsD: '#16181e', sole: '#0c0c10', belt: '#22252e', buckle: '#666', mouth: '#6a2a22' },
    garimpeiro: { skin: '#8a5a3a', skinD: '#6a4026', hair: '#1c1418', hairStyle: 'helmet', cap: '#e8c030', shirt: '#8a7a5a', shirtD: '#6a5c40', sleeve: 'short', scarf: '#c8302a', pants: '#4a3e2e', pantsD: '#362c20', boots: '#2a2018', bootsD: '#1c140e', sole: '#0c0806', belt: '#2a1c10', buckle: '#8a7a4a', mouth: '#5a2a22', mud: '#6a5a3a' },
    cida: { skin: '#b07850', skinD: '#8a5a38', hair: '#d8d0c8', hairStyle: 'strawhat', cap: '#e0cf9a', shirt: '#4a7ab0', shirtD: '#365e8c', sleeve: 'long', pants: '#5a4a3a', pantsD: '#463a2c', boots: '#4a3020', bootsD: '#34200f', sole: '#1c1008', belt: '#4a3020', buckle: '#c8a040', mouth: '#7a3a2a', radio: true },
    rafael: { skin: '#7a4a2e', skinD: '#5e3820', hair: '#1c1418', hairStyle: 'cap', cap: '#3a6a3a', shirt: '#2a8a7a', shirtD: '#1e6a5e', sleeve: 'short', pants: '#3a3e4a', pantsD: '#2a2d36', boots: '#5a3a22', bootsD: '#3e2814', sole: '#1c1008', belt: '#2a1c10', buckle: '#c8ccd8', mouth: '#5a2a1e', tablet: true }
  };

  // ——— Poses ———
  // th: coxa (0 = vertical, + para frente) · kn: flexão do joelho · a: braço · e: cotovelo
  const base = () => ({ bob: 0, lean: 0, tilt: 0, thF: 0, knF: 0, thB: 0, knB: 0, aF: 8, eF: 10, aB: -8, eB: 10, face: 'neutral', rot: 0, dx: 0, dy: 0, foot: 0, wave: 0, prop: null });
  const P = (o) => Object.assign(base(), o);
  const sin = Math.sin;

  const ANIMS = {
    idle: { n: 4, fps: 5, f: (i) => { const b = [0, 0.5, 1, 0.5][i]; return P({ bob: b, aF: 6 + b * 2, aB: -6 - b * 2, wave: i }); } },
    walk: { n: 8, fps: 11, f: (i) => { const p = i / 8 * Math.PI * 2, s = sin(p); return P({ bob: Math.abs(sin(p)) * -1.2 + 1, thF: 26 * s, thB: -26 * s, knF: Math.max(0, -40 * sin(p + 1.2)) + 6, knB: Math.max(0, 40 * sin(p + 1.2)) + 6, aF: -22 * s, eF: 18, aB: 22 * s, eB: 18, lean: 3, wave: i }); } },
    run: { n: 8, fps: 14, f: (i) => { const p = i / 8 * Math.PI * 2, s = sin(p); return P({ bob: Math.abs(sin(p)) * -3 + 2, thF: 46 * s + 8, thB: -46 * s + 8, knF: Math.max(0, -75 * sin(p + 1.3)) + 15, knB: Math.max(0, 75 * sin(p + 1.3)) + 15, aF: -45 * s, eF: 85, aB: 45 * s, eB: 85, lean: 12, face: 'focus', wave: i * 2 }); } },
    jump: { n: 2, fps: 8, f: (i) => P({ bob: -2, thF: 55, knF: 70, thB: -5, knB: 55, aF: 150 - i * 10, eF: 20, aB: -40, eB: 40, lean: 4, foot: 3, face: 'focus', wave: 3 + i }) },
    fall: { n: 2, fps: 8, f: (i) => P({ bob: 0, thF: 20, knF: 20, thB: -15, knB: 25, aF: 110 + i * 8, eF: 15, aB: -110 - i * 8, eB: 15, lean: 0, foot: 2, wave: 6 + i }) },
    tool: { n: 3, fps: 14, f: (i) => P({ bob: 0, thF: 18, knF: 10, thB: -14, knB: 8, aF: [-50, 70, 88][i], eF: [80, 20, 0][i], aB: -20, eB: 20, lean: [-4, 6, 8][i], face: 'focus', prop: 'tool' }) },
    hurt: { n: 2, fps: 10, f: (i) => P({ bob: 0, thF: 18, knF: 15, thB: -18, knB: 15, aF: 60 + i * 15, eF: 30, aB: -70 - i * 10, eB: 30, lean: -14 - i * 4, tilt: -10, face: 'hurt' }) },
    death: { n: 4, fps: 6, loop: false, f: (i) => [
      P({ thF: 60, knF: 110, thB: 20, knB: 120, bob: 7, lean: 12, aF: 20, aB: -10, face: 'hurt' }),
      P({ thF: 80, knF: 140, thB: 60, knB: 140, bob: 12, lean: 28, aF: 30, aB: 10, face: 'hurt', tilt: 15 }),
      P({ thF: 50, knF: 40, thB: 40, knB: 50, bob: 6, lean: 10, aF: 60, aB: 40, rot: -50, dx: 6, dy: 6, face: 'dead' }),
      P({ thF: 10, knF: 10, thB: 5, knB: 10, bob: 0, lean: 0, aF: 160, aB: 150, rot: -88, dx: 11, dy: 17, face: 'dead' })
    ][i] },
    victory: { n: 4, fps: 6, f: (i) => P({ bob: [0, -3, -4, -1][i], thF: [10, 30, 35, 15][i], knF: [10, 40, 45, 20][i], thB: -10, knB: 15, aF: 175, eF: 5, aB: -30, eB: 30, face: 'happy', wave: i }) },
    climb: { n: 4, fps: 8, f: (i) => { const s = [1, 0.3, -1, -0.3][i]; return P({ bob: 0, thF: 40 + s * 25, knF: 70 - s * 20, thB: 40 - s * 25, knB: 70 + s * 20, aF: 165 - s * 25, eF: -30, aB: 165 + s * 25, eB: -30, lean: 6, face: 'focus', wave: i }); } },
    swim: { n: 4, fps: 7, f: (i) => { const s = sin(i / 4 * Math.PI * 2); return P({ rot: 80, dx: -9, dy: 9, thF: 20 * s, knF: 25, thB: -20 * s, knB: 25, aF: 150 + 30 * s, eF: 10, aB: 120 - 30 * s, eB: 20, face: 'focus', foot: 4, wave: i }); } },
    slide: { n: 2, fps: 10, f: (i) => P({ rot: -64, dx: 9, dy: 13, thF: 80, knF: 10, thB: 70, knB: 30, aF: -20, eF: 20, aB: -40 - i * 5, eB: 30, lean: 10, face: 'focus', wave: i }) },
    crouch: { n: 4, fps: 7, f: (i) => { const s = sin(i / 4 * Math.PI * 2); return P({ bob: 8, thF: 60 + 12 * s, knF: 110, thB: 25 - 12 * s, knB: 115, aF: 30, eF: 50, aB: -10, eB: 40, lean: 22, face: 'focus', wave: i }); } },
    // infratores
    alert: { n: 2, fps: 4, f: (i) => P({ thF: 14, thB: -12, knF: 8, knB: 8, aF: 70, eF: 20 + i * 10, aB: -10, lean: 2, face: 'focus' }) },
    throw: { n: 2, fps: 8, f: (i) => P({ thF: 20, thB: -16, knF: 10, knB: 10, aF: [-70, 110][i], eF: [70, 10][i], aB: -10, lean: [-6, 10][i], face: 'focus' }) },
    hands: { n: 2, fps: 4, f: (i) => P({ thF: 4, thB: -4, aF: 172, eF: 0 + i * 6, aB: 172, eB: 0 + i * 6, face: 'hurt' }) },
    slip: { n: 2, fps: 6, f: (i) => P({ rot: -86, dx: 11, dy: 17, thF: 40, knF: 20, thB: 10, knB: 40, aF: 120 + i * 20, eF: 10, aB: 160, face: 'dead' }) },
    talk: { n: 4, fps: 4, f: (i) => P({ bob: [0, 0.5, 1, 0.5][i], aF: 30 + (i % 2) * 15, eF: 60, aB: -6, face: i % 2 ? 'happy' : 'neutral' }) }
  };

  function draw(pix, who, pose) {
    const S = SPECS[who];
    const ox = 32 + pose.dx, oy = 62 + pose.dy, r = pose.rot * D, cr = Math.cos(r), sr = Math.sin(r);
    const hip = [0, -20 + pose.bob];
    // rotação em torno do quadril (nado, deslize, queda)
    const T = (x, y) => { const X = x - hip[0], Y = y - hip[1]; return [ox + hip[0] + X * cr - Y * sr, oy + hip[1] + X * sr + Y * cr]; };
    const ang = (a) => [Math.sin(a * D), Math.cos(a * D)];
    const add = (p, v, L) => [p[0] + v[0] * L, p[1] + v[1] * L];
    const leg = (th, kn) => { const k = add(hip, ang(th), 10); const a = add(k, ang(th - kn), 9.5); return { k, a }; };
    const neck = add(hip, [Math.sin(pose.lean * D), -Math.cos(pose.lean * D)], 14);
    const shoulder = add(neck, [Math.sin(pose.lean * D), -Math.cos(pose.lean * D)], -2.5);
    const arm = (a, e) => { const el = add(shoulder, ang(a + pose.lean * 0.5), 7.5); const h = add(el, ang(a + e + pose.lean * 0.5), 7); return { el, h }; };
    const headA = pose.lean + pose.tilt;
    const head = add(neck, [Math.sin(headA * D), -Math.cos(headA * D)], 8.5);
    const HS = 1.12; // cabeça maior (proporção de herói de ação)
    const HT = (dx, dy) => { dx *= HS; dy *= HS; const c = Math.cos(headA * D), s = Math.sin(headA * D); return T(head[0] + dx * c - dy * s, head[1] + dx * s + dy * c); };

    const cap = (p1, p2, r1, c, r2) => { const a = T(...p1), b = T(...p2); pix.capsule(a[0], a[1], b[0], b[1], r1, c, r2 === undefined ? r1 : r2); };
    const circ = (p, rr, c) => { const a = T(...p); pix.circle(a[0], a[1], rr, c); };
    const hc = (dx, dy, rr, c) => { const a = HT(dx, dy); pix.circle(a[0], a[1], rr * HS, c); };
    const hp = (dx, dy, c) => { const a = HT(dx, dy); pix.px(a[0], a[1], c); };
    const hcap = (x1, y1, x2, y2, rr, c) => { const a = HT(x1, y1), b = HT(x2, y2); pix.capsule(a[0], a[1], b[0], b[1], rr * HS, c); };

    const LB = leg(pose.thB, pose.knB), LF = leg(pose.thF, pose.knF);
    const AB = arm(pose.aB, pose.eB), AF = arm(pose.aF, pose.eF);
    const foot = (L, c, cd, sole) => {
      const toe = [L.a[0] + 6.5, L.a[1] + pose.foot];
      cap(L.a, toe, 2.9, c); cap([L.a[0] - 0.5, L.a[1] + 2.3], [toe[0] + 0.5, toe[1] + 2.3], 1, sole);
      cap([L.a[0], L.a[1] - 1.5], [L.a[0] + 2, L.a[1] - 1], 1.5, cd);
    };
    const drawLeg = (L, back) => {
      const c = back ? S.pantsD : S.pants;
      cap(hip, L.k, 3.8, c, 3.2); cap(L.k, L.a, 3.2, c, 2.7);
      if (S.pocket && !back) { const m = [(hip[0] + L.k[0]) / 2 + 1.5, (hip[1] + L.k[1]) / 2 + 1]; circ(m, 1.6, S.pantsD); }
      if (S.patch && !back) circ([(L.k[0] + L.a[0]) / 2, (L.k[1] + L.a[1]) / 2 - 1], 1.3, S.patch);
      foot(L, back ? S.bootsD : S.boots, S.bootsD, S.sole);
    };
    const drawArm = (A, back) => {
      const sk = back ? S.skinD : S.skin;
      const sl = back ? S.shirtD : S.shirt;
      if (S.sleeve === 'long') { cap(shoulder, A.el, 2.8, sl); cap(A.el, A.h, 2.5, sl, 2.3); }
      else { cap(shoulder, A.el, 2.6, sk); cap(A.el, A.h, 2.4, sk, 2.2); circ(shoulder, 3.4, sl); if (S.sleeve === 'rolled') circ(add(shoulder, ang(pose.aF), 2.5), 2.6, sl); }
      circ(A.h, 2.4, sk);
      if (S.wrist && !back) circ([A.h[0] * 0.75 + A.el[0] * 0.25, A.h[1] * 0.75 + A.el[1] * 0.25], 1.4, S.wrist);
    };

    // ——— atrás do corpo ———
    if (S.staff) cap([hip[0] - 7, hip[1] + 2], [neck[0] - 3, neck[1] - 12], 1.1, S.staff);
    drawArm(AB, true);
    drawLeg(LB, true);
    if (S.pack) {
      const top = add(neck, [-1, 0], 0), p1 = [neck[0] - 6, neck[1] + 3], p2 = [hip[0] - 6, hip[1] - 3];
      cap(p1, p2, 4.6, S.packD); cap([p1[0] + 0.5, p1[1]], [p2[0] + 0.5, p2[1] - 1], 3.6, S.pack);
      if (S.glow) { circ([p1[0] - 1, (p1[1] + p2[1]) / 2], 1.3, S.glow); }
    }
    // tronco
    cap(hip, neck, 6.2, S.shirtD, 6.6);
    cap([hip[0] + 0.8, hip[1]], [neck[0] + 0.8, neck[1]], 5.2, S.shirt, 5.6);
    if (S.tee) cap([hip[0] + 4, hip[1] - 3], [neck[0] + 4, neck[1] + 2], 1.6, S.tee);
    if (S.emblem) circ([hip[0] * 0.5 + neck[0] * 0.5 + 3, hip[1] * 0.45 + neck[1] * 0.55], 1.5, S.emblem);
    if (S.vest) cap([hip[0] - 1, hip[1] - 2], [neck[0] - 1, neck[1] + 3], 4.6, S.vest);
    if (S.scarf) cap([neck[0] - 3, neck[1] + 1], [neck[0] + 4, neck[1] + 1], 1.8, S.scarf);
    if (S.mud) { circ([hip[0] + 2, hip[1] - 5], 1.4, S.mud); circ([hip[0] - 2, hip[1] - 9], 1.1, S.mud); }
    cap([hip[0] - 5, hip[1] - 0.5], [hip[0] + 5.5, hip[1] - 0.5], 1.4, S.belt);
    circ([hip[0] + 3.5, hip[1] - 0.5], 1.1, S.buckle);
    if (S.radio) { cap([hip[0] - 5, hip[1] - 3], [hip[0] - 5, hip[1] - 8], 1.6, '#3a3a48'); circ([hip[0] - 5, hip[1] - 8], 0.8, '#6ae8c8'); }
    drawLeg(LF, false);

    // ——— cabeça ———
    const hairBack = S.hairStyle === 'curly';
    if (hairBack) {
      const b = Math.sin(pose.wave * 1.3) * 1.2;
      [[-6, -6, 4.6], [-2, -8.5, 4.6], [3, -8, 4.2], [6.5, -5, 3.4], [-8, -1, 4.2], [-7.5, 4, 3.6], [-3, -3, 5]].forEach(([x, y, rr]) => hc(x, y, rr, S.hair));
      [[-9, -11 + b, 3.6], [-13, -11.5 + b, 3.4], [-16, -8.5 + b * 1.3, 3.2], [-16.5, -4.5 + b * 1.6, 3]].forEach(([x, y, rr]) => hc(x, y, rr, S.hair));
      [[-13, -13 + b], [-17, -9 + b], [-4, -11], [-9, -4], [1, -11]].forEach(([x, y]) => { hp(x, y, S.hairHi); hp(x + 1, y + 1, S.hairHi); });
      [[-16, -3 + b], [-8, 6], [-11, -7]].forEach(([x, y]) => hp(x, y, S.hairD));
    } else {
      hc(-1, -1.5, 8.8, S.hair);
    }
    hc(0.9, 0.6, 7.8, S.skin);           // rosto
    hc(-1.5, 3.5, 4.5, S.skin);
    hcap(-3, 5.5, 3, 7, 1.6, S.skin);
    // sombra da mandíbula e orelha
    hcap(-4.5, 4.5, -0.5, 7, 1, S.skinD);
    if (!hairBack) { hc(-3.6, 0.8, 2, S.skin); hp(-3.6, 0.8, S.skinD); }
    if (S.earring) hp(-4.2, 3.5, S.earring);
    // cabelo e chapéus
    if (S.hairStyle === 'spiky') {
      const spikes = [[-125, 7], [-100, 9], [-75, 10.5], [-50, 10.5], [-25, 9.5], [0, 8], [24, 5.5]];
      for (const [a, L] of spikes) {
        const t = (a - 90) * D, n = t + Math.PI / 2;
        const bx = Math.cos(t) * 6, by = Math.sin(t) * 6, tx = Math.cos(t) * (6 + L), ty = Math.sin(t) * (6 + L);
        const w = 2.6;
        const p1 = HT(bx + Math.cos(n) * w, by + Math.sin(n) * w), p2 = HT(bx - Math.cos(n) * w, by - Math.sin(n) * w), p3 = HT(tx, ty);
        pix.poly([p1, p2, p3], S.hair);
      }
      hp(-2, -9, S.hairHi); hp(2, -10, S.hairHi); hp(-6, -7, S.hairHi); hp(4, -8, S.hairHi);
      hcap(1, -5, 7, -4, 1.4, S.hair); // franja
      // faixa vermelha com grafismo e pontas ao vento
      hcap(-8.6, -2.6, 8.4, -3.4, 1.7, S.band);
      hcap(-8.6, -1.6, 8.4, -2.4, 0.6, S.bandD);
      for (let x = -6; x <= 7; x += 3) hp(x, -3.2, S.bandDot);
      const w2 = Math.sin(pose.wave * 0.9) * 1.6;
      hcap(-8.5, -2.5, -14.5, -1 + w2, 1.2, S.band);
      hcap(-8.5, -1.5, -13.5, 2 + w2 * 0.7, 1.1, S.bandD);
    } else if (S.hairStyle === 'curly') {
      [[4, -6.5, 2.6], [1, -7.6, 2.6], [6.5, -3.8, 1.9]].forEach(([x, y, rr]) => hc(x, y, rr, S.hair));
      hc(-6, 2, 2.4, S.hair); hc(-5.5, 6, 2.1, S.hair);
      hp(1, -9, S.hairHi); hp(4.5, -8, S.hairHi);
      if (S.goggles) {
        hcap(-6.5, -5.5, 6, -6.5, 1, '#3a3a48');
        hc(4.6, -7, 2.8, '#d0d4e0'); hc(4.6, -7, 1.9, '#5ad0f8'); hp(4, -7.8, '#ffffff');
        hc(0.4, -7.6, 2.4, '#d0d4e0'); hc(0.4, -7.6, 1.5, '#5ad0f8');
      }
    } else if (S.hairStyle === 'cap') {
      hc(0, -3.5, 8, S.cap); hcap(2, -3.5, 10.5, -2.8, 1.3, S.cap); hcap(-7, -1.5, -1, -1, 1, S.hair);
    } else if (S.hairStyle === 'brim') {
      hc(0, -4.5, 7.2, S.cap); hcap(-11, -2.2, 11, -2.2, 1.4, S.cap); hcap(-6, -3, 6, -3, 0.7, '#4a5a2a');
    } else if (S.hairStyle === 'hood') {
      hc(-1.5, -1.5, 9.4, S.cap); hc(1.6, 1, 7.4, S.skin); hcap(-5, 4, -2, 9, 2.4, S.cap);
    } else if (S.hairStyle === 'helmet') {
      hc(0, -3.5, 8.4, S.cap); hcap(-9.5, -1, 9.5, -1, 1.2, '#c8a020'); hc(5, -6, 1.2, '#fff6b0');
    } else if (S.hairStyle === 'strawhat') {
      hc(-4, 1, 4, S.hair); hc(0, -4.5, 6.8, S.cap); hcap(-12, -1.8, 12, -1.8, 1.5, S.cap); hcap(-6, -2.8, 6, -2.8, 0.8, '#8a5a2e');
    }
    if (S.beard) hcap(1, 6, 6, 5, 1.6, S.hair);
    // rosto: olho, sobrancelha, nariz, boca
    const face = pose.face;
    if (face === 'hurt' || face === 'dead') {
      hp(3, -1.5, '#1a1220'); hp(4, -0.5, '#1a1220'); hp(3, 0.5, '#1a1220'); hp(5, -1.5, '#1a1220'); hp(5, 0.5, '#1a1220');
    } else if (face === 'happy') {
      hp(3, -0.5, '#1a1220'); hp(4, -1.5, '#1a1220'); hp(5, -0.5, '#1a1220');
    } else {
      const ew = S.shades ? null : '#ffffff';
      if (ew) { const a = HT(2.6, -2); pix.rect(a[0], a[1], 2, 3, ew); }
      const p = HT(3.8, -1.2); pix.rect(p[0], p[1], 1, 2, '#1a1220');
      hp(3.4, -1.6, '#ffffff');
      if (S.shades) hcap(1.5, -1.4, 6.5, -1.4, 1.2, '#14141a');
    }
    const browY = face === 'focus' ? -3.6 : -4.2;
    hcap(2, browY - (face === 'focus' ? 0.6 : 0), 5.2, browY + (face === 'focus' ? 0.6 : 0), S.hairStyle === 'spiky' ? 0.9 : 0.6, S.hairStyle === 'curly' ? S.hairD : S.hair === '#d8d0c8' ? '#8a8078' : S.hair);
    hp(8, 1, S.skinD); hp(8, 2, S.skinD);
    const m = S.mouth;
    if (face === 'happy') { hp(4, 4, m); hp(5, 4.6, m); hp(6, 4.6, m); hp(7, 4, m); hp(5.5, 4, '#ffffff'); }
    else if (face === 'hurt') { hp(5, 4, m); hp(6, 4, m); hp(5, 5, m); hp(6, 5, m); }
    else if (face === 'dead') { hp(5, 4.5, m); hp(6, 4.5, m); }
    else if (face === 'focus') { hp(4.5, 4.5, m); hp(5.5, 4.5, m); hp(6.5, 4, m); }
    else { hp(5, 4.4, m); hp(6, 4.4, m); }
    hp(6.5, 2.5, 'rgba(232,110,110,0.45)'); // rubor

    // ——— braço da frente e objetos ———
    drawArm(AF, false);
    if (pose.prop === 'tool') {
      if (S.glow) { const a = T(...AF.h); pix.rect(a[0] - 1, a[1] - 1.5, 6, 3, '#3e6676'); pix.rect(a[0] + 4, a[1] - 1, 2, 2, '#6ae8c8'); const b = T(neck[0] - 6, neck[1] + 6); pix.line(b[0], b[1], a[0], a[1], '#24304e'); }
      else { const a = T(AF.h[0] + 1, AF.h[1] - 1); pix.circle(a[0], a[1], 1.8, '#8a5424'); pix.px(a[0], a[1] - 2, '#6ec04a'); }
    }
    if (S.tablet) { const a = T(AF.h[0] + 1.5, AF.h[1] - 2); pix.rect(a[0] - 1, a[1] - 3, 4, 5, '#2a2d36'); pix.rect(a[0], a[1] - 2, 2, 3, '#6ae8c8'); }

    pix.outline('#1a1220');
    pix.rimLight();
  }

  return { SPECS, ANIMS, draw };
})();
