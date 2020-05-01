import { diceUtils } from '../utilities/utils';
import ExplodeModifier from '../modifiers/ExplodeModifier';
import RollResult from '../results/RollResult';
import RollResults from '../results/RollResults';
import ComparePoint from '../ComparePoint';
import ReRollModifier from '../modifiers/ReRollModifier';
import Modifier from '../modifiers/Modifier';

const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');
const qtySymbol = Symbol('qty');
const sidesSymbol = Symbol('sides');
const minSymbol = Symbol('min-value');
const maxSymbol = Symbol('max-value');

class StandardDice {
  /**
   * @param {string} notation
   * @param {number} sides
   * @param {number=} qty
   * @param {Map|{}|Map[]|null=} modifiers
   * @param {?number=} min The minimum possible roll value (Defaults to 1)
   * @param {?number=} max The maximum possible roll value (Defaults to the value of sides)
   */
  constructor(notation, sides, qty = 1, modifiers = null, min = 1, max = null) {
    if (!notation) {
      throw new TypeError('Notation is required');
    } else if (!sides) {
      throw new TypeError('Sides is required');
    } else if (!diceUtils.isNumeric(qty) || (qty < 1)) {
      throw new TypeError('qty must be a positive integer');
    }

    this[notationSymbol] = notation;
    this[qtySymbol] = parseInt(qty, 10);
    this[sidesSymbol] = sides;

    if (modifiers) {
      this.modifiers = modifiers;
    }

    this[minSymbol] = diceUtils.isNumeric(min) ? parseInt(min, 10) : 1;
    this[maxSymbol] = diceUtils.isNumeric(max) ? parseInt(max, 10) : sides;
  }

  /**
   * The modifiers that affect this dice roll
   *
   * @returns {Map|null}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Sets the modifiers that affect this roll
   *
   * @param value
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new Error('modifiers should be a Map, an Array, or an Object');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new Error('modifiers is invalid. List must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    this[modifiersSymbol].forEach((modifier) => {
      /* eslint-disable no-param-reassign */
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
  }

  /**
   * The maximum value that can be rolled om the die
   *
   * @returns {number}
   */
  get max() {
    return this[maxSymbol];
  }

  /**
   * Returns the minimum value that can be rolled on the die
   *
   * @returns {number}
   */
  get min() {
    return this[minSymbol];
  }

  /**
   * Returns the name for the dice
   *
   * @returns {*}
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * The dice notation for this dice roll
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  /**
   * Returns the number of dice that should be rolled.
   *
   * @returns {number}
   */
  get qty() {
    return this[qtySymbol];
  }

  /**
   * The number of sides the dice has
   *
   * @returns {*}
   */
  get sides() {
    return this[sidesSymbol];
  }

  /**
   * Rolls the dice, for the specified quantity and
   * includes any modifiers, and returns the roll output
   *
   * @returns {RollResults}
   */
  roll() {
    // create a result object to hold the rolls
    const rollResult = new RollResults();

    // loop for the quantity and roll the die
    for (let i = 0; i < this.qty; i++) {
      // add the rolls to the list
      rollResult.addRoll(this.rollOnce());
    }

    // loop through each modifier and carry out its actions
    (this.modifiers || []).forEach((modifier) => {
      modifier.run(rollResult, this);
    });

    return rollResult;
  }

  /**
   * Rolls a single die and returns the output value
   *
   * @returns {RollResult}
   */
  rollOnce() {
    return new RollResult(diceUtils.generateNumber(this.min, this.max));
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const {
      max, min, modifiers, name, notation, qty, sides,
    } = this;

    return {
      max,
      min,
      modifiers,
      name,
      notation,
      qty,
      sides,
      type: 'die',
    };
  }

  /**
   * Returns the String representation of the object
   *
   * @returns {string}
   */
  toString() {
    return this.notation;
  }
}

export default StandardDice;
