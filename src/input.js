/* Input handling. Turns taps and clicks on the canvas into game intents and
 * hands them to the handlers main.js provides. No game rules here.
 *
 * Tap an enemy hull to fire on it. Tap anywhere in your own half of the board
 * to move the active ship to that band. Both are also available as buttons in
 * the HUD, so nothing depends on precise pointing.
 */
(function (FC) {
  'use strict';

  FC.bindCanvasInput = function (canvas, getState, handlers) {
    function handlePoint(clientX, clientY) {
      var state = getState();
      if (state.winner) { return; }
      var active = FC.activeShip(state);
      if (!active) { return; }

      var rect = canvas.getBoundingClientRect();
      var hit = FC.hitTest(canvas, state, clientX - rect.left, clientY - rect.top);
      if (!hit) { return; }

      if (hit.type === 'ship') {
        var ship = FC.shipById(state, hit.id);
        if (ship.fleet !== active.fleet) {
          handlers.onFire(ship.id);
        }
        return;
      }
      if (hit.fleet === active.fleet) {
        handlers.onMove(hit.band);
      }
    }

    canvas.addEventListener('click', function (event) {
      handlePoint(event.clientX, event.clientY);
    });

    /* Keep a tap from also firing a synthesised click on a moved layout. */
    canvas.addEventListener('touchend', function (event) {
      if (event.changedTouches.length !== 1) { return; }
      event.preventDefault();
      var touch = event.changedTouches[0];
      handlePoint(touch.clientX, touch.clientY);
    }, { passive: false });
  };
})(window.FC = window.FC || {});
