// DOM HUD + menus.
import { ROSTER, COMBOS, BASE_MOVES } from './characters.js';

const $ = (s, r = document) => r.querySelector(s);
const show = (el, on) => el.classList.toggle('hidden', !on);

const P1_KEYS = { 's1': '<kbd>←</kbd><kbd>→</kbd><kbd>F</kbd>', 's2': '<kbd>S</kbd><kbd>W</kbd><kbd>R</kbd>', 'adv': '<kbd>→</kbd><kbd>←</kbd><kbd>→</kbd> + Left&nbsp;Click', 'chrono': '<kbd>S</kbd><kbd>S</kbd> + Right&nbsp;Click' };

export class UI {
  constructor() {
    this.el = { hud: $('#hud'), title: $('#title'), select: $('#select'), pause: $('#pause'), result: $('#result'), help: $('#help'), announce: $('#announce'), popups: $('#popups'),
      reticle: $('#reticle'), prompt: $('#prompt'), sub: $('#submeter'), hint: $('#hint'), vig: $('#vignette'), tint: $('#tint'), gas: $('#gas'), timer: $('#timer'), round: $('#roundlbl') };
    this.sides = ['.p1', '.p2'].map((c) => { const r = $('#hud ' + c); return { root: r, img: $('.portrait', r), name: $('.name', r), hp: $('.hp', r), hpFill: $('.hp .fill', r), ghost: $('.hp .ghost', r), mana: $('.mana', r), manaFill: $('.mana .fill', r), chips: $('.chips', r), pips: $('.pips', r), chipKey: '' }; });
    this.callEl = [$('#callouts .p1'), $('#callouts .p2')];
    this.portraits = {};
    $('#helpClose').onclick = () => show(this.el.help, false);
  }

  screen(name) { for (const k of ['title', 'select', 'pause', 'result']) show(this.el[k], k === name); }

  help(char) {
    const mv = (c) => c ? `<h3>${c.name.toUpperCase()} — SPECIALS</h3><table>
      <tr><td>${P1_KEYS.s1}</td><td><b>${c.moves.s1.name}</b> — special</td></tr>
      <tr><td>${P1_KEYS.s2}</td><td><b>${c.moves.s2.name}</b> — special</td></tr>
      <tr><td>${P1_KEYS.adv}</td><td><b>${c.moves.adv.name}</b> — advanced signature (big damage, hard to land)</td></tr>
      <tr><td>${P1_KEYS.chrono}</td><td><b>${BASE_MOVES.chrono.name}</b> — advanced, only while Focus is on, costs 20 mana, unblockable</td></tr></table>` : '';
    $('#helpBody').innerHTML = `<div class="cols"><div>
      <h3>PLAYER 1 — KEYBOARD + MOUSE</h3><table>
      <tr><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></td><td>Move around the cage (relative to the camera)</td></tr>
      <tr><td>Mouse pointer</td><td>Aim at the opponent's <b>head, body or legs</b> — this picks where you strike and where you block</td></tr>
      <tr><td>Left click</td><td>Power cross (aimed)</td></tr><tr><td>Right click</td><td>Roundhouse kick (aimed)</td></tr>
      <tr><td><kbd>F</kbd> / <kbd>R</kbd></td><td>Quick jab / push kick</td></tr>
      <tr><td><kbd>Shift</kbd> (hold)</td><td>Block the zone you are aiming at</td></tr>
      <tr><td><kbd>Space</kbd></td><td>Dash toward the mouse pointer (brief dodge)</td></tr>
      <tr><td><kbd>E</kbd></td><td>Grapple → then <kbd>F</kbd> knees, <kbd>R</kbd> throw, <kbd>E</kbd> submission hold</td></tr>
      <tr><td><kbd>Q</kbd></td><td><b>Focus</b> — spend blue mana to slow time</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Pause</td></tr></table>
      <h3>PLAYER 2 — KEYBOARD</h3><table>
      <tr><td>Arrow keys</td><td>Move</td></tr><tr><td><kbd>J</kbd> / <kbd>K</kbd></td><td>Jab / push kick</td></tr><tr><td><kbd>Y</kbd> / <kbd>H</kbd></td><td>Power cross / roundhouse (stand in for the mouse clicks)</td></tr>
      <tr><td><kbd>I</kbd> / <kbd>M</kbd> (hold)</td><td>Aim high / low (otherwise body)</td></tr>
      <tr><td><kbd>O</kbd> block</td><td><kbd>L</kbd> grapple · <kbd>U</kbd> Focus · <kbd>Enter</kbd> dash</td></tr></table>
      </div><div>
      <h3>HOW TO WIN</h3>Empty the other fighter's life bar for a <b>knockout</b>, or grapple them into a <b>submission hold</b> and crank it until they tap. Hurt opponents tap much faster. Best of three rounds.
      <h3>FOCUS — SLOWING TIME</h3>Focus drains blue mana while it is on. Time slows for everyone, but you move about twice as fast as an unfocused opponent, your strikes gain <b>Precision</b> damage, and blocking the correct zone just before impact becomes a <b>Parry</b> that stuns the attacker. Your vision tunnels the longer you hold it. If both fighters Focus, neither has the edge — it becomes a duel of reads. When Focus ends you are <b>fatigued</b> and slower for a moment.
      <h3>BLOCKING</h3>A block only fully stops attacks aimed at the zone you are guarding. Wrong zone: you still eat 60%. Grapples go straight through a block.
      ${mv(char)}
      <p style="opacity:.7">← / → mean <i>away from</i> / <i>toward</i> your opponent. Player 2 uses the same sequences with their own keys.</p>
      </div></div>`;
    show(this.el.help, true);
  }

  // ---- character select
  buildSelect(onPick) {
    const grid = $('#grid'); grid.innerHTML = '';
    ROSTER.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'card'; d.dataset.i = i;
      d.innerHTML = `<img src="${this.portraits[c.id]}" alt="${c.name}"><span>${c.name.toUpperCase()}</span>`;
      d.onmouseenter = () => this.detail(c); d.onclick = () => onPick(i);
      grid.appendChild(d);
    });
  }
  markSelect(sel, taken) { document.querySelectorAll('#grid .card').forEach((d) => { d.classList.toggle('sel', +d.dataset.i === sel); d.classList.toggle('taken', +d.dataset.i === taken); }); if (sel >= 0) this.detail(ROSTER[sel]); }
  detail(c) {
    $('#detail').innerHTML = `<h3>${c.name.toUpperCase()}</h3><div class="ttl">${c.title}</div><div>${c.blurb}</div><div class="gim"><b>ILLEGAL EDGE:</b> ${c.gimmick}</div>
      ${Object.entries(c.bars).map(([k, v]) => `<div class="stat"><label>${k}</label><i><u style="width:${v * 10}%"></u></i></div>`).join('')}
      <div style="margin-top:10px">
      <div class="mv"><b>${c.moves.s1.name}</b><code>← → F</code></div><div class="mv"><b>${c.moves.s2.name}</b><code>S W R</code></div>
      <div class="mv adv"><b>${c.moves.adv.name}</b><code>→ ← → + L-Click</code></div><div class="mv adv"><b>Time Breaker</b><code>S S + R-Click (Focus)</code></div></div>`;
  }

  // ---- fight HUD
  setupHud(fighters, roundsToWin) {
    fighters.forEach((f, i) => { const s = this.sides[i]; s.img.src = this.portraits[f.char.id]; s.name.textContent = f.char.name.toUpperCase(); s.pips.innerHTML = '<i></i>'.repeat(roundsToWin); s.chipKey = ''; s.chips.innerHTML = ''; });
    this.callEl.forEach((e) => (e.innerHTML = '')); this.el.popups.innerHTML = '';
  }
  hud(match) {
    match.f.forEach((f, i) => {
      const s = this.sides[i], hp = Math.max(0, f.hp) / f.maxHp;
      s.hpFill.style.transform = `scaleX(${hp})`; s.ghost.style.transform = `scaleX(${f.ghostHp / f.maxHp})`; s.hp.classList.toggle('low', hp < 0.25);
      s.manaFill.style.transform = `scaleX(${f.mana / f.maxMana})`; s.mana.classList.toggle('on', f.focusing); s.mana.classList.toggle('tired', f.fatigue > 0);
      const chips = [f.focusing && 'focus:FOCUS', f.fatigue > 0 && 'tired:FATIGUED', f.blind > 0 && 'blind:BLINDED', f.bleed > 0 && 'bleed:BLEEDING', f.slow > 0 && 'slow:HOBBLED', f.uplink > 0 && 'uplink:UPLINK', f.S.berserk && hp < 0.5 && 'rage:BERSERK'].filter(Boolean);
      const key = chips.join('|');
      if (key !== s.chipKey) { s.chipKey = key; s.chips.innerHTML = chips.map((c) => { const [k, t] = c.split(':'); return `<b class="${k}">${t}</b>`; }).join(''); }
      [...s.pips.children].forEach((p, n) => p.classList.toggle('won', n < f.wins));
    });
    this.el.timer.textContent = Math.max(0, Math.ceil(match.timer)); this.el.timer.classList.toggle('slow', match.worldScale < 0.8);
    this.el.round.textContent = 'ROUND ' + match.round;
  }
  versus(a, b) {
    const v = document.getElementById('versus');
    [a, b].forEach((c, i) => { const d = v.querySelectorAll('.vs')[i]; d.querySelector('img').src = this.portraits[c.id]; d.querySelector('b').textContent = c.name.toUpperCase(); d.querySelector('small').textContent = c.title; });
    v.classList.add('hidden'); void v.offsetWidth; v.classList.remove('hidden'); clearTimeout(this._vs); this._vs = setTimeout(() => v.classList.add('hidden'), 3000);
  }
  hideVersus() { clearTimeout(this._vs); document.getElementById('versus').classList.add('hidden'); }
  announce(text, kind) { const a = this.el.announce; a.className = kind; a.textContent = text; void a.offsetWidth; a.classList.add('go'); }
  callout(idx, name, tier, sub) {
    const e = document.createElement('span'); e.className = tier; e.innerHTML = `<small>${sub || (tier === 'advanced' ? 'ADVANCED' : 'SPECIAL')}</small>${name}`;
    const c = this.callEl[idx]; c.appendChild(e); while (c.children.length > 3) c.firstChild.remove(); setTimeout(() => e.remove(), 1700);
  }
  popup(x, y, text, kind) {
    const e = document.createElement('b'); e.className = kind; e.textContent = text; e.style.left = x + 'px'; e.style.top = y + 'px';
    this.el.popups.appendChild(e); setTimeout(() => e.remove(), 950);
  }
  reticle(on, x, y, zone, focus) {
    const r = this.el.reticle; show(r, on); if (!on) return;
    r.style.left = x + 'px'; r.style.top = y + 'px'; r.classList.toggle('focus', focus); r.lastChild.textContent = zone.toUpperCase();
  }
  prompt(html) { show(this.el.prompt, !!html); if (html && this._p !== html) this.el.prompt.innerHTML = html; this._p = html; }
  subMeter(v, text) { show(this.el.sub, v != null); if (v == null) return; $('#submeter i').style.left = Math.max(0, Math.min(100, v)) + '%'; $('#submeter .mash').innerHTML = text; }
  hint(html) { show(this.el.hint, !!html); if (html) this.el.hint.innerHTML = html; }
  // tunnel vision: strength 0..1, centre in px, radius in vmin
  vision(strength, x, y, radius, enemyFocus, gas) {
    const v = this.el.vig;
    if (strength > 0.01) {
      v.style.opacity = 1;
      v.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0,20,60,0) ${radius * 0.55}vmin, rgba(0,14,48,${0.55 * strength}) ${radius}vmin, rgba(0,4,18,${0.97 * strength}) ${radius * 1.7}vmin)`;
    } else v.style.opacity = 0;
    this.el.tint.style.opacity = enemyFocus ? 1 : 0;
    this.el.gas.style.opacity = gas;
  }
  result(winner, how, line) { $('#resImg').src = this.portraits[winner.char.id]; $('#resHow').textContent = 'WINNER BY ' + how.replace(/[!.]/g, '').replace('KO', 'KNOCKOUT').replace('TAP OUT', 'SUBMISSION').replace('TIME', 'DECISION'); $('#resName').textContent = winner.char.name.toUpperCase(); $('#resLine').textContent = line; this.screen('result'); }
}
