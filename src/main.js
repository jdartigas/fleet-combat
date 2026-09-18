/* Boot and wiring. Owns the single mutable reference to the current battle
 * state; every change goes through the pure core functions in src/core.
 */
(function (FC) {
  'use strict';

  var canvas = document.getElementById('board');
  var state = FC.createBattle();

  function getState() { return state; }

  /* A ship that has both moved and fired has nothing left to do, so its
   * activation ends on its own. The button is there to pass early. */
  function autoAdvance(next) {
    var active = FC.activeShip(next);
    if (active && active.hasMoved && active.hasFired) {
      return FC.endActivation(next);
    }
    return next;
  }

  function setState(next) {
    state = next;
    render();
  }

  var handlers = {
    onMove: function (band) {
      var active = FC.activeShip(state);
      if (!active) { return; }
      setState(autoAdvance(FC.moveShip(state, active.id, band)));
    },
    onFire: function (targetId) {
      var active = FC.activeShip(state);
      if (!active) { return; }
      setState(autoAdvance(FC.fireAt(state, active.id, targetId)));
    },
    onEndActivation: function () {
      setState(FC.endActivation(state));
    },
    onNewBattle: function () {
      setState(FC.createBattle());
    }
  };

  function render() {
    FC.drawBoard(canvas, state);
    FC.renderHud(state, handlers);
  }

  FC.bindCanvasInput(canvas, getState, handlers);
  window.addEventListener('resize', function () { FC.drawBoard(canvas, state); });

  /* Exposed for hand-checking combat maths from the browser console. */
  FC.debug = { getState: getState, setState: setState };

  render();
})(window.FC = window.FC || {});
