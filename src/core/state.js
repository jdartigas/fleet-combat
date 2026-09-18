/* Battle state construction and small pure helpers over it.
 *
 * No rendering, no DOM, no input. Functions here take state and return state.
 */
(function (FC) {
  'use strict';

  /* Band model.
   *
   * Each ship sits in a band 1..6 that measures how far it stands off from the
   * enemy line: band 1 is closest to the enemy, band 6 is furthest back. The
   * two fleets face each other, so the range between two ships is the sum of
   * their standoffs. Range 1 means both hulls have pushed all the way to the
   * front; range 11 means both are sitting at the back of their own side.
   *
   * This keeps range trivial to compute and symmetric: a ship can close to
   * shorten the range, and its target can back off to lengthen it again.
   */
  FC.rangeBetween = function (shipA, shipB) {
    return shipA.band + shipB.band - 1;
  };

  FC.MAX_RANGE = FC.BOARD.bands * 2 - 1;

  function buildShip(entry, fleet, index) {
    var cls = FC.SHIP_CLASSES[entry.classKey];
    return {
      id: fleet + '-' + index,
      name: entry.name,
      fleet: fleet,
      classKey: entry.classKey,
      className: cls.name,
      abbr: cls.abbr,
      speed: cls.speed,
      initiativeBonus: cls.initiativeBonus,
      movement: cls.movement,
      shields: cls.shields,
      shieldsMax: cls.shields,
      shieldRegen: cls.shieldRegen,
      armor: cls.armor,
      armorMax: cls.armor,
      structure: cls.structure,
      structureMax: cls.structure,
      mounts: cls.mounts.slice(),
      band: FC.BOARD.startBand,
      alive: true,
      /* per-activation flags, cleared at the start of each turn */
      hasMoved: false,
      hasFired: false
    };
  }

  FC.createBattle = function () {
    var ships = [];
    ['blue', 'red'].forEach(function (fleet) {
      FC.ROSTERS[fleet].ships.forEach(function (entry, i) {
        ships.push(buildShip(entry, fleet, i));
      });
    });

    var state = {
      turn: 1,
      ships: ships,
      order: [],
      activeIndex: 0,
      winner: null,
      log: []
    };
    state.order = FC.computeInitiative(state);
    return FC.logLine(state, 'Turn 1. Fleets at maximum separation.');
  };

  /* Shallow-clone the state with a fresh ships array of fresh ship objects, so
   * callers never mutate what they were handed. */
  FC.cloneState = function (state) {
    return {
      turn: state.turn,
      ships: state.ships.map(function (s) {
        var copy = {};
        for (var k in s) { if (Object.prototype.hasOwnProperty.call(s, k)) { copy[k] = s[k]; } }
        copy.mounts = s.mounts.slice();
        return copy;
      }),
      order: state.order.slice(),
      activeIndex: state.activeIndex,
      winner: state.winner,
      log: state.log.slice()
    };
  };

  FC.shipById = function (state, id) {
    for (var i = 0; i < state.ships.length; i++) {
      if (state.ships[i].id === id) { return state.ships[i]; }
    }
    return null;
  };

  FC.activeShip = function (state) {
    if (state.winner) { return null; }
    return FC.shipById(state, state.order[state.activeIndex]);
  };

  FC.fleetShips = function (state, fleet) {
    return state.ships.filter(function (s) { return s.fleet === fleet; });
  };

  FC.livingShips = function (state, fleet) {
    return state.ships.filter(function (s) {
      return s.alive && (fleet === undefined || s.fleet === fleet);
    });
  };

  FC.enemiesOf = function (state, ship) {
    return state.ships.filter(function (s) { return s.alive && s.fleet !== ship.fleet; });
  };

  FC.MAX_LOG = 60;

  FC.logLine = function (state, text) {
    var next = FC.cloneState(state);
    next.log.push({ turn: next.turn, text: text });
    if (next.log.length > FC.MAX_LOG) {
      next.log = next.log.slice(next.log.length - FC.MAX_LOG);
    }
    return next;
  };
})(window.FC = window.FC || {});
