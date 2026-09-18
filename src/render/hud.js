/* DOM heads-up display: turn banner, active ship panel, action buttons,
 * initiative order and combat log. Reads state, writes DOM, and reports user
 * intent back through the handlers object. No game rules live here.
 *
 * Every action is available as a real button so the game is fully playable by
 * tapping, without depending on canvas precision, hover or right-click.
 */
(function (FC) {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function button(label, disabled, onClick, extraClass) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.disabled = !!disabled;
    if (extraClass) { b.className = extraClass; }
    b.addEventListener('click', onClick);
    return b;
  }

  function stat(label, value, max) {
    var row = document.createElement('div');
    row.className = 'stat';
    var name = document.createElement('span');
    name.className = 'stat-label';
    name.textContent = label;
    var val = document.createElement('span');
    val.className = 'stat-value';
    val.textContent = value + ' / ' + max;
    row.appendChild(name);
    row.appendChild(val);
    return row;
  }

  function renderTurn(state) {
    var banner = el('turn-indicator');
    if (state.winner) {
      banner.textContent = state.winner === 'draw'
        ? 'Battle over -- mutual destruction'
        : 'Battle over -- ' + FC.ROSTERS[state.winner].name + ' victorious';
      banner.className = 'over';
      return;
    }
    var active = FC.activeShip(state);
    banner.textContent = 'Turn ' + state.turn + ' -- ' + FC.ROSTERS[active.fleet].name +
      ' activating ' + active.name;
    banner.className = active.fleet;
  }

  function renderActive(state) {
    var panel = el('active-panel');
    panel.innerHTML = '';
    var active = FC.activeShip(state);
    if (!active) { return; }

    var head = document.createElement('h2');
    head.textContent = active.name;
    var sub = document.createElement('p');
    sub.className = 'sub';
    sub.textContent = active.className + ' -- ' + FC.ROSTERS[active.fleet].name +
      ' -- band ' + active.band;

    panel.appendChild(head);
    panel.appendChild(sub);
    panel.appendChild(stat('Shields', active.shields, active.shieldsMax));
    panel.appendChild(stat('Armor', active.armor, active.armorMax));
    panel.appendChild(stat('Structure', active.structure, active.structureMax));

    var mounts = document.createElement('p');
    mounts.className = 'sub';
    mounts.textContent = active.mounts.length + ' x ' + FC.WEAPONS[active.mounts[0]].name;
    panel.appendChild(mounts);
  }

  function renderActions(state, handlers) {
    var moveBox = el('move-actions');
    var fireBox = el('fire-actions');
    var endBox = el('end-actions');
    moveBox.innerHTML = '';
    fireBox.innerHTML = '';
    endBox.innerHTML = '';

    var active = FC.activeShip(state);
    if (!active) {
      endBox.appendChild(button('New battle', false, handlers.onNewBattle, 'primary'));
      return;
    }

    var moveLabel = document.createElement('h3');
    moveLabel.textContent = active.hasMoved ? 'Move (used)' : 'Move to band';
    moveBox.appendChild(moveLabel);
    var moveRow = document.createElement('div');
    moveRow.className = 'button-row';
    for (var band = 1; band <= FC.BOARD.bands; band++) {
      (function (b) {
        moveRow.appendChild(button(String(b), !FC.canMoveTo(active, b), function () {
          handlers.onMove(b);
        }));
      })(band);
    }
    moveBox.appendChild(moveRow);

    var fireLabel = document.createElement('h3');
    fireLabel.textContent = active.hasFired ? 'Fire (used)' : 'Fire on';
    fireBox.appendChild(fireLabel);
    var fireRow = document.createElement('div');
    fireRow.className = 'button-row';
    FC.enemiesOf(state, active).forEach(function (enemy) {
      var range = FC.rangeBetween(active, enemy);
      fireRow.appendChild(button(
        enemy.abbr + ' ' + enemy.name + ' (r' + range + ')',
        !FC.canFireAt(state, active, enemy),
        function () { handlers.onFire(enemy.id); },
        'target'
      ));
    });
    fireBox.appendChild(fireRow);

    endBox.appendChild(button('End activation', false, handlers.onEndActivation, 'primary'));
    endBox.appendChild(button('New battle', false, handlers.onNewBattle, ''));
  }

  function renderInitiative(state) {
    var list = el('initiative-list');
    list.innerHTML = '';
    state.order.forEach(function (id, i) {
      var ship = FC.shipById(state, id);
      var li = document.createElement('li');
      li.className = ship.fleet + (i === state.activeIndex && !state.winner ? ' current' : '') +
        (ship.alive ? '' : ' dead');
      li.textContent = FC.initiativeValue(ship) + '  ' + ship.abbr + ' ' + ship.name +
        '  b' + ship.band;
      list.appendChild(li);
    });
  }

  function renderLog(state) {
    var log = el('log');
    log.innerHTML = '';
    state.log.slice().reverse().forEach(function (entry) {
      var li = document.createElement('li');
      li.textContent = 'T' + entry.turn + '  ' + entry.text;
      log.appendChild(li);
    });
  }

  FC.renderHud = function (state, handlers) {
    renderTurn(state);
    renderActive(state);
    renderActions(state, handlers);
    renderInitiative(state);
    renderLog(state);
  };
})(window.FC = window.FC || {});
