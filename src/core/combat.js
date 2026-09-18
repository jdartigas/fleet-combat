/* Damage resolution. Pure functions: numbers in, numbers out.
 *
 * The resolution ORDER is load-bearing and must not be reordered:
 *   1. shields   regenerating pool, absorbs first
 *   2. armor     ablative, does not regenerate
 *   3. structure hull integrity, ship is destroyed at 0
 *
 * A hit carries a raw damage value. At each layer the raw value is scaled by
 * that weapon's multiplier for the layer to get the effective damage. Whatever
 * the layer cannot absorb is converted back to raw damage and carried to the
 * next layer down, so a weapon that is weak against shields does not stay weak
 * once it has chewed through them.
 */
(function (FC) {
  'use strict';

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  /* Apply raw damage to one layer.
   * Returns the layer's new value, damage dealt to it, and raw carried onward. */
  function applyLayer(pool, raw, multiplier) {
    if (raw <= 0) {
      return { pool: pool, dealt: 0, carry: 0 };
    }
    if (multiplier <= 0) {
      /* immune layer: absorbs nothing, everything passes through */
      return { pool: pool, dealt: 0, carry: raw };
    }
    var effective = raw * multiplier;
    var absorbed = Math.min(pool, effective);
    var leftover = effective - absorbed;
    return {
      pool: round1(pool - absorbed),
      dealt: round1(absorbed),
      carry: leftover / multiplier
    };
  }

  /* Resolve one hit against a target's defensive layers.
   *
   * target: object with shields, armor, structure
   * rawDamage: damage before any multiplier
   * multipliers: { shields, armor, structure }
   *
   * Returns new layer values plus a per-layer breakdown. Does not mutate.
   */
  FC.resolveHit = function (target, rawDamage, multipliers) {
    var s = applyLayer(target.shields, rawDamage, multipliers.shields);
    var a = applyLayer(target.armor, s.carry, multipliers.armor);
    var structureDamage = round1(a.carry * multipliers.structure);
    var structure = round1(Math.max(0, target.structure - structureDamage));

    return {
      shields: s.pool,
      armor: a.pool,
      structure: structure,
      shieldDamage: s.dealt,
      armorDamage: a.dealt,
      structureDamage: Math.min(structureDamage, round1(target.structure)),
      destroyed: structure <= 0
    };
  };

  /* Damage a single mount delivers at a given range. */
  FC.weaponDamageAtRange = function (weapon, range) {
    var falloff = (weapon.falloffPerBand || 0) * (range - 1);
    return Math.max(0, round1(weapon.damage - falloff));
  };

  FC.weaponInRange = function (weapon, range) {
    return range >= weapon.minRange && range <= weapon.maxRange;
  };

  /* Fire every mount on the attacker at one target.
   * Returns { target, shots } with the target's post-hit layer values.
   * Pure: the passed target object is not modified. */
  FC.resolveAttack = function (attacker, target, range) {
    var layers = {
      shields: target.shields,
      armor: target.armor,
      structure: target.structure
    };
    var shots = [];
    attacker.mounts.forEach(function (mountId) {
      if (layers.structure <= 0) { return; }
      var weapon = FC.WEAPONS[mountId];
      if (!FC.weaponInRange(weapon, range)) {
        shots.push({ weapon: weapon.name, outOfRange: true });
        return;
      }
      var raw = FC.weaponDamageAtRange(weapon, range);
      var result = FC.resolveHit(layers, raw, FC.DAMAGE_MULTIPLIERS[weapon.platform]);
      layers = { shields: result.shields, armor: result.armor, structure: result.structure };
      shots.push({
        weapon: weapon.name,
        raw: raw,
        shieldDamage: result.shieldDamage,
        armorDamage: result.armorDamage,
        structureDamage: result.structureDamage,
        destroyed: result.destroyed
      });
    });

    return { layers: layers, shots: shots, destroyed: layers.structure <= 0 };
  };
})(window.FC = window.FC || {});
