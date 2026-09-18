/* Weapon platforms and the damage multiplier table.
 *
 * DATA ONLY. The multiplier table is the primary balance lever in the game and
 * it lives here, in one place, never scattered through combat code.
 *
 * Milestone 1 implements the projectile platform only. Beam, pulse cannon and
 * missile rows get added here when those platforms are built.
 */
(function (FC) {
  'use strict';

  /* Multiplier applied to raw damage as it meets each defensive layer.
   * Projectile: strong against armor, weak against shields. */
  FC.DAMAGE_MULTIPLIERS = {
    projectile: { shields: 0.5, armor: 1.5, structure: 1.0 }
  };

  /* Range is measured in bands between two ships, see core/state.js for how
   * two band positions combine into a range. Projectiles have no falloff and
   * reach the whole board, so minRange/maxRange do not gate anything yet. */
  FC.WEAPONS = {
    mass_driver: {
      id: 'mass_driver',
      name: 'Mass Driver',
      platform: 'projectile',
      damage: 8,
      minRange: 1,
      maxRange: 11,
      falloffPerBand: 0
    }
  };
})(window.FC = window.FC || {});
