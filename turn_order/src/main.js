/* src/main.js – single‑file refactor
 *
 * 1. Fighter & TurnManager (unchanged)
 * 2. Small DOM helpers
 * 3. UI rendering helpers
 * 4. Event‑delegation logic
 * 5. Bootstrap
 */

(() => {
  /* ------------------------------------------------------------------
   * 1. Fighter & TurnManager
   * ------------------------------------------------------------------ */
  class Fighter {
    #name;
    #delay = 0;
    #speed;
    #mult = 1;
    #trackers = [];
    #lockedTrackers = false;

    constructor(name, speed) {
      this.#name = name;
      this.#speed = speed;
      this.setDelay(1000);
    }

    /* … all methods from the original Fighter class … */
    addDelay(val) {
      this.#delay += val;
      if (this.#delay < 0) this.#delay = 0;
    }
    setDelay(val) { this.#delay = val / (this.#speed * this.#mult); }
    nextCast(delayValue) { this.setDelay(delayValue); }
    nextTurn(delayValue) { this.setDelay(delayValue); this.tickDownTrackers(); }
    sCraft(multiplier = 1) { this.#delay = 0; this.#delay += (4000 * multiplier) / (this.#speed * this.#mult); this.tickDownTrackers(); }
    getName() { return this.#name; }
    getDelay() { return Number.parseFloat(this.#delay).toFixed(2); }
    getBaseSpeed() { return this.#speed; }
    getSpeed() { return this.#speed * this.#mult; }
    getMult() { return this.#mult; }
    setMult(val) { this.#mult = val; }
    setTracker(index, val) { this.#trackers[index] = val; }
    getTrackers() { return this.#trackers; }
    addTracker(name, val) { this.#trackers.push({name, val}); }
    deleteTracker(index) { this.#trackers.splice(index, 1); }
    tickDownTrackers() {
      if (this.#lockedTrackers) return;
      this.#trackers.forEach((t, i) => {
        this.#trackers[i].val -= 1;
        if (this.#trackers[i].val < 0) this.#trackers[i].val = 0;
      });
    }
    updateFighter(newName, newMult, newTrackers, lockedTrackers) {
      this.#name = newName;
      this.#mult = newMult;
      this.#trackers = newTrackers;
      this.#lockedTrackers = lockedTrackers;
    }
    lockTrackers() { this.#lockedTrackers = true; }
    unlockTrackers() { this.#lockedTrackers = false; }
    areTrackersLocked() { return this.#lockedTrackers; }
  }

  class TurnManager {
    #fighters = [];
    #turnCount = 0;

    beginTurn() {
      if (this.#fighters.length === 0 || this.#fighters[0].getDelay() === 0) return;
      this.#turnCount += 1;
      this.#sortFighters();
    }
    addFighter(fighter) { this.#fighters.push(fighter); this.#sortFighters(); }
    removeFighter(index) { this.#fighters.splice(index, 1); this.#sortFighters(); }
    getFighter(index) { return this.#fighters[index]; }
    getFighters() { return this.#fighters; }
    clearFighters() { this.#fighters = []; }
    #sortFighters() {
      this.#fighters.sort((a, b) => {
        const d = a.getDelay() - b.getDelay();
        if (d !== 0) return d;
        return b.getSpeed() - a.getSpeed();
      });
      if (this.#turnCount !== 0) {
        const delay = this.#fighters[0].getDelay();
        this.#fighters.forEach(f => f.addDelay(-delay));
      }
    }
    nextCast(delayValue) { if (!this.#fighters.length) return; this.#fighters[0].nextCast(delayValue); this.beginTurn(); }
    nextTurn(delayValue) { if (!this.#fighters.length) return; this.#fighters[0].nextTurn(delayValue); this.beginTurn(); }
    updateFighter(index, newName, newMult, newTrackers, lockedTrackers) {
      const f = this.getFighter(index);
      f.updateFighter(newName, newMult, newTrackers, lockedTrackers);
      this.#sortFighters();
    }
    getTurnCount() { return this.#turnCount; }
    sCraft(index, multiplier = 1) {
        this.#fighters[index].sCraft(multiplier);
        this.#turnCount += 1;
        this.#sortFighters();
    }
    /* Serialize the current state to a plain JSON object */
    toJSON() {
      return {
        fighters: this.#fighters.map(f => ({
          name: f.getName(),
          delay: f.getDelay(),
          speed: f.getBaseSpeed(),
          mult: f.getMult(),
          trackers: f.getTrackers(),
          lockedTrackers: f.areTrackersLocked()
        })),
        turnCount: this.#turnCount
      };
    }
    /* Create a TurnManager instance from a JSON object */
    static fromJSON(data) {
      const tm = new TurnManager();
      if (Array.isArray(data.fighters)) {
        data.fighters.forEach(fdata => {
          const fighter = new Fighter(fdata.name, fdata.speed);
          fighter.setMult(fdata.mult);
          // set delay directly (bypass setDelay to avoid speed multiplier)
          fighter.setDelay(fdata.delay * fdata.speed * fdata.mult);
          fighter.getTrackers().length = 0;
          fdata.trackers.forEach(t => fighter.addTracker(t.name, t.val));
          if (fdata.lockedTrackers) fighter.lockTrackers();
          tm.addFighter(fighter);
        });
      }
      tm.#turnCount = data.turnCount || 0;
      return tm;
    }
  }

  /* ------------------------------------------------------------------
   * 2. Small DOM helpers
   * ------------------------------------------------------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const el = (tag, attrs = {}, ...children) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on') && typeof v === 'function')
        e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c instanceof Node) e.appendChild(c);
    });
    return e;
  };

  /* ------------------------------------------------------------------
   * 3. UI rendering helpers
   * ------------------------------------------------------------------ */
  const renderTrackerTable = trackers => {
    const table = el('table', { style: 'border-collapse:collapse;width:100%' });
    const tbody = el('tbody', {});
    trackers.forEach(t => {
      tbody.appendChild(
        el('tr', {},
          el('td', {}, t.name),
          el('td', {}, t.val.toString())
        )
      );
    });
    table.appendChild(tbody);
    return table;
  };

  const createFighterRow = (fighter, index) => {
    const row = el('tr', { id: `fighter-row-${index}` });

    row.appendChild(el('td', { class: 'name-cell' }, fighter.getName()));
    row.appendChild(el('td', { class: 'delay-cell' }, fighter.getDelay()));
    row.appendChild(el('td', { class: 'speed-cell' }, fighter.getSpeed().toString()));

    const trackersCell = el('td', { class: 'trackers-cell' });
    trackersCell.appendChild(renderTrackerTable(fighter.getTrackers()));
    if (fighter.areTrackersLocked())
      trackersCell.appendChild(el('span', { style: 'margin-left:4px;color:gray' }, 'Locked'));
    row.appendChild(trackersCell);

    const actionCell = el('td', { class: 'actions-cell' });
    actionCell.appendChild(
      el('button', { 'data-action': 'sCraft', 'data-index': index }, 'S‑Craft')
    );
    actionCell.appendChild(
      el('button', { 'data-action': 'edit', 'data-index': index }, 'Edit')
    );
    row.appendChild(actionCell);

    return row;
  };

  const renderTurnOrder = turnManager => {
    const tbody = $('#turn-order-body');
    tbody.innerHTML = '';
    turnManager.getFighters().forEach((f, i) => tbody.appendChild(createFighterRow(f, i)));
    $('#current-turn').textContent = turnManager.getTurnCount();
    // Disable sCraft buttons until turn order begins
    const sCraftButtons = document.querySelectorAll('button[data-action="sCraft"]');
    const disabled = turnManager.getTurnCount() === 0;
    sCraftButtons.forEach(btn => btn.disabled = disabled);
    // Disable Begin Turn button when there are no fighters
    const turnFooter = $('#turn-order-footer');
    if (turnFooter) turnFooter.style.display = (turnManager.getFighters().length !== 0 && turnManager.getTurnCount() !== 0) ? 'none' : '';
  };

  /* ------------------------------------------------------------------
   * 4. Event‑delegation logic
   * ------------------------------------------------------------------ */
  const initEventHandlers = turnManager => {
    const addFighterBtn = $('#add-fighter-btn');
    addFighterBtn.addEventListener('click', () => {
      const name = $('#fighter-name').value.trim();
      const speed = parseFloat($('#fighter-speed').value, 10).toFixed(2);
      if (!name || isNaN(speed) || speed <= 0) return;
      turnManager.addFighter(new Fighter(name, speed));
      renderTurnOrder(turnManager);
      $('#fighter-name').value = '';
      $('#fighter-speed').value = '';
    });

    const tableBody = $('#turn-order-body');
    tableBody.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const idx = parseInt(btn.dataset.index, 10);
      if (btn.dataset.action === 'edit') editFighter(idx, turnManager);
      else if (btn.dataset.action === 'sCraft') {
        const characterName = turnManager.getFighter(idx).getName();
        const multiplier = parseFloat(prompt(`Enter delay multiplier for S‑Craft (${characterName}):`, '1'));
        if (!isNaN(multiplier) && multiplier > 0) {
          turnManager.sCraft(idx, multiplier);
          renderTurnOrder(turnManager);
        }
      }
    });

    $('#begin-turn-button').addEventListener('click', () => {
      turnManager.beginTurn();
      renderTurnOrder(turnManager);
      $('#turn-order-footer').style.display = 'none';
    });
    // Persistence buttons
    const saveBtn = $('#save-turn-btn');
    const loadBtn = $('#load-turn-btn');
    const fileInput = $('#load-file-input');

    saveBtn.addEventListener('click', () => {
      const data = JSON.stringify(turnManager.toJSON(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'turn-order.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    loadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          const tm = TurnManager.fromJSON(data);
          // Replace current manager
          turnManager = tm;
          renderTurnOrder(turnManager);
          updateTurnControls();
          const turnFooter = $('#turn-order-footer');
          if (turnFooter) turnFooter.style.display = (turnManager.getTurnCount() !== 0) ? 'none' : '';
        } catch (err) {
          console.error('Invalid JSON', err);
        }
      };
      reader.readAsText(file);
    });

      const nextTurnBtn = document.getElementById('advance-turn-button');
      const nextCastBtn = document.getElementById('advance-cast-button');

      const updateTurnControls = () => {
          const turnCount = turnManager.getTurnCount();
          const disabled = turnCount === 0 || turnManager.getFighters().length === 0;
          nextTurnBtn.disabled = disabled;
          nextCastBtn.disabled = disabled;
      };

      nextTurnBtn.addEventListener('click', () => {
          const delayInput = document.getElementById('turn-delay');
          const delayValue = parseInt(delayInput.value);
          if (!isNaN(delayValue)) {
              turnManager.nextTurn(delayValue);
              renderTurnOrder(turnManager);
          }
      });

      nextCastBtn.addEventListener('click', () => {
          const castInput = document.getElementById('cast-delay');
          const castValue = parseInt(castInput.value);
          if (!isNaN(castValue)) {
              turnManager.nextCast(castValue);
              renderTurnOrder(turnManager);
          }
      });

      updateTurnControls(); // Call to update button states initially

      // Update controls whenever the turn changes
      const originalBeginTurn = turnManager.beginTurn.bind(turnManager);
      turnManager.beginTurn = () => {
          originalBeginTurn();
          updateTurnControls();
      };
  };

  /* ------------------------------------------------------------------
   * 5. Edit form logic (kept inline for simplicity)
   * ------------------------------------------------------------------ */
  const editFighter = (index, turnManager) => {
    const fighter = turnManager.getFighter(index);
    const row = $('#fighter-row-' + index);
    row.innerHTML = `
      <td><input type="text" id="edit-name-${index}" value="${fighter.getName()}"></td>
      <td>${fighter.getDelay()} + <input type="number" id="edit-delay-${index}"></td>
      <td>${fighter.getBaseSpeed()} * <input type="number" id="edit-speed-${index}" value="${fighter.getMult()}"></td>
      <td id="edit-trackers-${index}">
        <label for="lockedTrackers">Lock trackers</label>
        <input id="locked-trackers-${index}" name="lockedTrackers" type="checkbox" ${fighter.areTrackersLocked() ? 'checked' : ''}>
      </td>
      <td>
        <button id="save-btn-${index}">Save</button>
        <button id="cancel-btn-${index}">Cancel</button>
        <button id="delete-btn-${index}">Delete</button>
      </td>
    `;

    const saveBtn = $('#save-btn-' + index);
    const cancelBtn = $('#cancel-btn-' + index);
    const deleteBtn = $('#delete-btn-' + index);

    saveBtn.addEventListener('click', () => {
      const newName = $('#edit-name-' + index).value.trim();
      const delayInput = $('#edit-delay-' + index).value;
      const locked = $('#locked-trackers-' + index).checked;

      if (delayInput) fighter.addDelay(parseFloat(delayInput));

      const newSpeed = parseFloat($('#edit-speed-' + index).value);
      const newTrackers = [];
      const nameInputs = $$('.tracker-name-input-' + index);
      const valInputs = $$('.tracker-val-input-' + index);

      nameInputs.forEach((ni, i) => {
        const tName = ni.value.trim();
        const tVal = parseInt(valInputs[i].value, 10);
        if (tName && !isNaN(tVal)) newTrackers.push({ name: tName, val: tVal });
      });

      turnManager.updateFighter(index, newName, newSpeed, newTrackers, locked, (turnManager.getTurnCount()!==0));
      renderTurnOrder(turnManager);
    });

    cancelBtn.addEventListener('click', () => renderTurnOrder(turnManager));

    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete ${fighter.getName()}?`)) {
        turnManager.removeFighter(index);
        renderTurnOrder(turnManager);
      }
    });

    /* Tracker controls */
    const trackersDiv = $('#edit-trackers-' + index);
    const addBtn = el('button', { type: 'button' }, 'Add Tracker');
    addBtn.addEventListener('click', () => {
      const nameIn = el('input', { type: 'text', placeholder: 'Tracker Name', class: `tracker-name-input-${index}` });
      const valIn = el('input', { type: 'number', placeholder: 'Value', class: `tracker-val-input-${index}` });
      const delBtn = el('button', { type: 'button' }, 'Delete');
      delBtn.addEventListener('click', () => {
        trackersDiv.removeChild(nameIn);
        trackersDiv.removeChild(valIn);
        trackersDiv.removeChild(delBtn);
      });
      trackersDiv.append(nameIn, valIn, delBtn);
    });
    trackersDiv.appendChild(addBtn);

    fighter.getTrackers().forEach((t, ti) => {
      const nameIn = el('input', { type: 'text', value: t.name, class: `tracker-name-input-${index}` });
      const valIn = el('input', { type: 'number', value: t.val, class: `tracker-val-input-${index}` });
      const delBtn = el('button', { type: 'button' }, 'Delete');
      delBtn.addEventListener('click', () => {
        trackersDiv.removeChild(nameIn);
        trackersDiv.removeChild(valIn);
        trackersDiv.removeChild(delBtn);
      });
      trackersDiv.append(nameIn, valIn, delBtn);
    });
  };

  /* ------------------------------------------------------------------
   * 6. Bootstrap
   * ------------------------------------------------------------------ */
  const turnManager = new TurnManager();
  initEventHandlers(turnManager);
  renderTurnOrder(turnManager);
})();