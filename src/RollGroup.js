import ComparePoint from './ComparePoint';
import ExplodeModifier from './modifiers/ExplodeModifier';
import Modifier from './modifiers/Modifier';
import ReRollModifier from './modifiers/ReRollModifier';
import RollResult from './results/RollResult';

const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');
const expressionsSymbol = Symbol('expressions');

class RollGroup {
  /**
   *
   * @param {string} notation
   * @param {StandardDice[]} expressions
   * @param {[]|null} modifiers
   */
  constructor(notation, expressions, modifiers = null) {
    if (!notation) {
      throw new TypeError('Notation is required');
    }

    this[notationSymbol] = notation;
    this.expressions = expressions || [];
    this.modifiers = modifiers || [];
  }

  /**
   * The expressions in this group
   *
   * @returns {[]}
   */
  get expressions() {
    return [...(this[expressionsSymbol] || [])];
  }

  /**
   * Sets the expressions
   *
   * @param {[]} expressions
   */
  set expressions(expressions) {
    console.log(expressions);
    if (!expressions || !Array.isArray(expressions)) {
      throw new Error(`Expressions must be an array: ${expressions}`);
    }

    // loop through each expression and add it to the list
    this[expressionsSymbol] = [];
    expressions.forEach((expression) => {
      this.addExpression(expression);
    });
  }

  /**
   * The modifiers that affect this group
   *
   * @returns {Map|null}
   */
  get modifiers() {
    // ensure modifiers are ordered correctly
    if (this[modifiersSymbol]) {
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
      throw new Error('modifiers should be a Map or an Object');
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
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
  }

  /**
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  addExpression(value) {
    this[expressionsSymbol].push(value);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { modifiers, notation, expressions } = this;

    return {
      expressions,
      modifiers,
      notation,
      type: 'group',
    };
  }
}

export default RollGroup;
