/* Turn sequencing. Pure: every function takes state and returns new state.
 *
 * Milestone 1 turn structure:
 *   1. initiative order computed from class and speed, recalculated each turn
 *   2. each living ship, on its activation, may move and may fire
 *   3. end of turn: shield regeneration, destruction checks, victory check
 *
 * The reaction (point defense) step and missile flight land with the missile
 * platform in a later milestone.
 */
(function (FC) {
  'use strict';

  FC.canMoveTo = function (ship, band) {
    if (!ship || !ship.alive || ship.hasMoved) { return false; }
    if (band < 1 || band > FC.BOARD.bands) { return false; }
    return Math.abs(band - ship.band) <= ship.movement && band !== ship.band;
  };

  FC.moveShip = function (state, shipId, band) {
    var ship = FC.shipById(state, shipId);
    if (!FC.canMoveTo(ship, band)) { return state; }

    var next = FC.cloneState(state);
    var moving = FC.shipById(next, shipId);
    var from = moving.band;
    moving.band = band;
    moving.hasMoved = true;
    return FC.logLine(next, moving.name + ' moves from band ' + from + ' to band ' + band + '.');
  };

  FC.canFireAt = function (state, attacker, target) {
    if (!attacker || !attacker.alive || attacker.hasFired) { return false; }
    if (!target || !target.alive) { return false; }
    if (target.fleet === attacker.fleet) { return false; }
    var range = FC.rangeBetween(attacker, target);
    return attacker.mounts.some(function (id) {
      return FC.weaponInRange(FC.WEAPONS[id], range);
    });
  };

  FC.fireAt = function (state, attackerId, targetId) {
    var attacker = FC.shipById(state, attackerId);
    var target = FC.shipById(state, targetId);
    if (!FC.canFireAt(state, attacker, target)) { return state; }

    var range = FC.rangeBetween(attacker, target);
    var result = FC.resolveAttack(attacker, target, range);

    var next = FC.cloneState(state);
    var firing = FC.shipById(next, attackerId);
    var hit = FC.shipById(next, targetId);
    firing.hasFired = true;
    hit.shields = result.layers.shields;
    hit.armor = result.layers.armor;
    hit.structure = result.layers.structure;

    var totals = result.shots.reduce(function (acc, shot) {
      if (shot.outOfRange) { return acc; }
      acc.shields += shot.shieldDamage;
      acc.armor += shot.armorDamage;
      acc.structure += shot.structureDamage;
      return acc;
    }, { shields: 0, armor: 0, structure: 0 });

    next = FC.logLine(next,
      firing.name + ' fires on ' + hit.name + ' at range ' + range + ' -- ' +
      'shields ' + round1(totals.shields) + ', armor ' + round1(totals.armor) +
      ', structure ' + round1(totals.structure) + '.');

    if (result.destroyed) {
      var dead = FC.shipById(next, targetId);
      dead.alive = false;
      dead.shields = 0;
      dead.structure = 0;
      next = FC.logLine(next, dead.name + ' (' + dead.className + ') destroyed.');
      next = FC.checkVictory(next);
    }
    return next;
  };

  function round1(n) { return Math.round(n * 10) / 10; }

  FC.checkVictory = function (state) {
    if (state.winner) { return state; }
    var blue = FC.livingShips(state, 'blue').length;
    var red = FC.livingShips(state, 'red').length;
    if (blue > 0 && red > 0) { return state; }

    var next = FC.cloneState(state);
    if (blue === 0 && red === 0) {
      next.winner = 'draw';
      return FC.logLine(next, 'Mutual destruction. No fleet remains.');
    }
    next.winner = blue > 0 ? 'blue' : 'red';
    return FC.logLine(next, FC.ROSTERS[next.winner].name + ' holds the field. Battle over.');
  };

  /* Advance to the next living ship in the initiative order, rolling the turn
   * over when the order is exhausted. */
  FC.endActivation = function (state) {
    if (state.winner) { return state; }
    var next = FC.cloneState(state);
    var i = next.activeIndex + 1;
    while (i < next.order.length && !isLiving(next, next.order[i])) { i += 1; }
    if (i < next.order.length) {
      next.activeIndex = i;
      return next;
    }
    return FC.endTurn(next);
  };

  function isLiving(state, id) {
    var ship = FC.shipById(state, id);
    return !!(ship && ship.alive);
  }

  FC.endTurn = function (state) {
    var next = FC.cloneState(state);

    next.ships.forEach(function (ship) {
      if (!ship.alive) { return; }
      ship.shields = Math.min(ship.shieldsMax, Math.round((ship.shields + ship.shieldRegen) * 10) / 10);
      ship.hasMoved = false;
      ship.hasFired = false;
    });

    next = FC.checkVictory(next);
    if (next.winner) { return next; }

    next.turn += 1;
    next.order = FC.computeInitiative(next);
    next.activeIndex = 0;
    return FC.logLine(next, 'Turn ' + next.turn + '. Shields regenerate, initiative recalculated.');
  };
})(window.FC = window.FC || {});
