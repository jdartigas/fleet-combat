/* Ship class definitions and the Milestone 1 fleet rosters.
 *
 * DATA ONLY. No logic in this file. Every tunable ship number lives here so
 * balance can be changed without touching combat code.
 *
 * Stat meanings:
 *   speed            initiative input, higher acts earlier
 *   initiativeBonus  class-based initiative modifier (light hulls react faster)
 *   movement         bands a ship may cross on one activation
 *   shields          regenerating pool, absorbs damage first
 *   shieldRegen      restored at end of turn, up to the maximum
 *   armor            ablative, does not regenerate
 *   structure        hull integrity, destroyed at 0
 *   mounts           weapon ids from weapons.js, one entry per mount
 *
 * Milestone 1 fields projectile mounts only. Beam, pulse and missile mounts
 * land with those platforms in later milestones.
 */
(function (FC) {
  'use strict';

  FC.SHIP_CLASSES = {
    patrol: {
      name: 'Patrol Craft', abbr: 'PTL',
      speed: 10, initiativeBonus: 5, movement: 3,
      shields: 6, shieldRegen: 1, armor: 4, structure: 12,
      mounts: ['mass_driver']
    },
    corvette: {
      name: 'Corvette', abbr: 'COR',
      speed: 9, initiativeBonus: 4, movement: 3,
      shields: 9, shieldRegen: 2, armor: 8, structure: 18,
      mounts: ['mass_driver']
    },
    frigate: {
      name: 'Frigate', abbr: 'FRG',
      speed: 7, initiativeBonus: 3, movement: 2,
      shields: 15, shieldRegen: 2, armor: 14, structure: 30,
      mounts: ['mass_driver', 'mass_driver']
    },
    destroyer: {
      name: 'Destroyer', abbr: 'DST',
      speed: 6, initiativeBonus: 2, movement: 2,
      shields: 18, shieldRegen: 3, armor: 18, structure: 38,
      mounts: ['mass_driver', 'mass_driver']
    },
    cruiser: {
      name: 'Cruiser', abbr: 'CRU',
      speed: 4, initiativeBonus: 1, movement: 1,
      shields: 27, shieldRegen: 3, armor: 34, structure: 60,
      mounts: ['mass_driver', 'mass_driver', 'mass_driver']
    },
    carrier: {
      name: 'Fleet Carrier', abbr: 'CVF',
      speed: 3, initiativeBonus: 0, movement: 1,
      shields: 22, shieldRegen: 3, armor: 20, structure: 70,
      mounts: ['mass_driver']
    }
  };

  /* Milestone 1 battle: three hulls per side, mirrored so the loop can be
   * verified without fleet asymmetry confusing the result. */
  FC.ROSTERS = {
    blue: {
      name: 'Coalition',
      ships: [
        { classKey: 'corvette', name: 'Halyard' },
        { classKey: 'frigate',  name: 'Verge' },
        { classKey: 'cruiser',  name: 'Anvil Point' }
      ]
    },
    red: {
      name: 'Free Orbit',
      ships: [
        { classKey: 'corvette', name: 'Shrike' },
        { classKey: 'frigate',  name: 'Tallow' },
        { classKey: 'cruiser',  name: 'Deep Ledger' }
      ]
    }
  };

  /* Board shape. Six bands per side, both fleets start at maximum separation. */
  FC.BOARD = { bands: 6, startBand: 6 };
})(window.FC = window.FC || {});
