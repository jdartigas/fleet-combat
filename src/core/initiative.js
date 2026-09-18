/* Initiative ordering. Pure: reads state, returns an array of ship ids.
 *
 * Recomputed at the start of every turn so that losses -- and, later, any
 * effect that changes speed -- are reflected immediately.
 *
 * Deliberately deterministic. No random roll, so a given board always produces
 * the same order and combat results can be checked by hand.
 */
(function (FC) {
  'use strict';

  FC.initiativeValue = function (ship) {
    return ship.speed + ship.initiativeBonus;
  };

  FC.computeInitiative = function (state) {
    return state.ships
      .filter(function (s) { return s.alive; })
      .slice()
      .sort(function (a, b) {
        var diff = FC.initiativeValue(b) - FC.initiativeValue(a);
        if (diff !== 0) { return diff; }
        /* stable, readable tiebreak: player fleet first, then roster order */
        if (a.fleet !== b.fleet) { return a.fleet === 'blue' ? -1 : 1; }
        return a.id < b.id ? -1 : 1;
      })
      .map(function (s) { return s.id; });
  };
})(window.FC = window.FC || {});
