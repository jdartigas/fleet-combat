/* Canvas rendering of the range bands and both fleets, plus the geometry the
 * input layer uses for hit testing. Reads state, draws. Never mutates state.
 *
 * Layout: twelve columns across. The left half is the blue fleet's side with
 * its band 6 at the outer edge and band 1 against the centre line; the right
 * half mirrors it for the red fleet. Each roster slot gets its own lane, so a
 * ship's horizontal position is its standoff band and its vertical position is
 * simply which hull it is.
 */
(function (FC) {
  'use strict';

  var COLORS = {
    bg: '#0b0e13',
    grid: '#1b232e',
    gridCentre: '#39485c',
    label: '#6f8093',
    blue: '#5d8fb3',
    red: '#b3705d',
    blueFill: '#16222c',
    redFill: '#2c1d16',
    hull: '#c7d2dc',
    shields: '#4fb8d9',
    armor: '#8d9aa6',
    structure: '#79b87f',
    structureLow: '#c25f4e',
    active: '#e8c46a',
    move: '#4f7f5f',
    target: '#c25f4e',
    dead: '#39424d'
  };

  var RULER_H = 18;
  var BAR_H = 4;

  FC.geometry = function (canvas) {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var lanes = Math.max(FC.ROSTERS.blue.ships.length, FC.ROSTERS.red.ships.length);
    return {
      width: w,
      height: h,
      lanes: lanes,
      colWidth: w / (FC.BOARD.bands * 2),
      laneHeight: (h - RULER_H) / lanes,
      rulerH: RULER_H
    };
  };

  /* Column index 0..11 for a fleet's band. Blue counts down from the left
   * edge, red counts up from the centre. */
  FC.columnFor = function (fleet, band) {
    return fleet === 'blue' ? FC.BOARD.bands - band : FC.BOARD.bands + band - 1;
  };

  FC.cellRect = function (geo, fleet, band, lane) {
    var col = FC.columnFor(fleet, band);
    return {
      x: col * geo.colWidth,
      y: geo.rulerH + lane * geo.laneHeight,
      w: geo.colWidth,
      h: geo.laneHeight
    };
  };

  FC.laneOf = function (state, ship) {
    return FC.fleetShips(state, ship.fleet).indexOf(ship);
  };

  function bar(ctx, x, y, w, value, max, color) {
    ctx.fillStyle = '#131922';
    ctx.fillRect(x, y, w, BAR_H);
    if (max > 0 && value > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w * Math.max(0, Math.min(1, value / max)), BAR_H);
    }
  }

  function drawShip(ctx, geo, state, ship, opts) {
    var rect = FC.cellRect(geo, ship.fleet, ship.band, FC.laneOf(state, ship));
    var pad = Math.max(2, rect.w * 0.08);
    var boxW = rect.w - pad * 2;
    var boxH = Math.min(26, rect.h * 0.42);
    var x = rect.x + pad;
    var y = rect.y + Math.max(4, (rect.h - boxH - BAR_H * 3 - 6) / 2);

    ctx.fillStyle = ship.alive ? (ship.fleet === 'blue' ? COLORS.blueFill : COLORS.redFill) : '#121418';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.lineWidth = opts.active ? 2 : 1;
    ctx.strokeStyle = !ship.alive ? COLORS.dead
      : opts.active ? COLORS.active
      : opts.target ? COLORS.target
      : (ship.fleet === 'blue' ? COLORS.blue : COLORS.red);
    ctx.strokeRect(x + 0.5, y + 0.5, boxW - 1, boxH - 1);

    ctx.fillStyle = ship.alive ? COLORS.hull : COLORS.dead;
    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ship.abbr, x + boxW / 2, y + boxH / 2);

    if (!ship.alive) { return; }
    var by = y + boxH + 2;
    bar(ctx, x, by, boxW, ship.shields, ship.shieldsMax, COLORS.shields);
    bar(ctx, x, by + BAR_H + 1, boxW, ship.armor, ship.armorMax, COLORS.armor);
    bar(ctx, x, by + (BAR_H + 1) * 2, boxW, ship.structure, ship.structureMax,
      ship.structure / ship.structureMax <= 0.34 ? COLORS.structureLow : COLORS.structure);
  }

  function drawBands(ctx, geo) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, geo.width, geo.height);

    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var col = 0; col < FC.BOARD.bands * 2; col++) {
      var x = col * geo.colWidth;
      var centre = col === FC.BOARD.bands;
      ctx.strokeStyle = centre ? COLORS.gridCentre : COLORS.grid;
      ctx.lineWidth = centre ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, geo.height);
      ctx.stroke();

      var band = col < FC.BOARD.bands ? FC.BOARD.bands - col : col - FC.BOARD.bands + 1;
      ctx.fillStyle = COLORS.label;
      ctx.fillText(String(band), x + geo.colWidth / 2, geo.rulerH / 2);
    }
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, geo.rulerH + 0.5);
    ctx.lineTo(geo.width, geo.rulerH + 0.5);
    ctx.stroke();
  }

  function drawMoveOptions(ctx, geo, state, ship) {
    for (var band = 1; band <= FC.BOARD.bands; band++) {
      if (!FC.canMoveTo(ship, band)) { continue; }
      var rect = FC.cellRect(geo, ship.fleet, band, FC.laneOf(state, ship));
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = COLORS.move;
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x + 3.5, rect.y + 3.5, rect.w - 7, rect.h - 7);
      ctx.restore();
    }
  }

  FC.drawBoard = function (canvas, state) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var geo = FC.geometry(canvas);

    if (canvas.width !== Math.round(geo.width * dpr) || canvas.height !== Math.round(geo.height * dpr)) {
      canvas.width = Math.round(geo.width * dpr);
      canvas.height = Math.round(geo.height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawBands(ctx, geo);

    var active = FC.activeShip(state);
    if (active) { drawMoveOptions(ctx, geo, state, active); }

    state.ships.forEach(function (ship) {
      drawShip(ctx, geo, state, ship, {
        active: !!(active && active.id === ship.id),
        target: !!(active && FC.canFireAt(state, active, ship))
      });
    });
  };

  /* Map a canvas-relative point to something meaningful.
   * Returns { type: 'ship', id } for a click on a hull, or
   * { type: 'band', fleet, band } for a click on empty board space. */
  FC.hitTest = function (canvas, state, px, py) {
    var geo = FC.geometry(canvas);
    var hit = null;

    state.ships.forEach(function (ship) {
      if (!ship.alive) { return; }
      var rect = FC.cellRect(geo, ship.fleet, ship.band, FC.laneOf(state, ship));
      if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
        hit = { type: 'ship', id: ship.id };
      }
    });
    if (hit) { return hit; }

    if (py < geo.rulerH) { return null; }
    var col = Math.floor(px / geo.colWidth);
    if (col < 0 || col >= FC.BOARD.bands * 2) { return null; }
    return col < FC.BOARD.bands
      ? { type: 'band', fleet: 'blue', band: FC.BOARD.bands - col }
      : { type: 'band', fleet: 'red', band: col - FC.BOARD.bands + 1 };
  };
})(window.FC = window.FC || {});
