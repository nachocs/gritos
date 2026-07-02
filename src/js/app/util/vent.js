/**
 * Modern Event Bus to replace Backbone.Events.
 * Maintains the API used throughout the application (on, off, trigger, once).
 */
class Vent {
  constructor() {
    this.events = {};
  }

  on(event, callback, context) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push({ callback, context });
    return this;
  }

  off(event, callback, context) {
    if (!event) {
      this.events = {};
      return this;
    }
    if (!this.events[event]) return this;
    if (!callback && !context) {
      delete this.events[event];
    } else {
      this.events[event] = this.events[event].filter(
        (e) =>
          (callback && e.callback !== callback) ||
          (context && e.context !== context),
      );
    }
    return this;
  }

  trigger(event, ...args) {
    if (!this.events[event]) return this;
    // Slice to avoid issues if a callback modifies the event list
    this.events[event].slice().forEach((e) => {
      e.callback.apply(e.context || this, args);
    });
    return this;
  }

  once(event, callback, context) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper, context);
      callback.apply(context || this, args);
    };
    return this.on(event, onceWrapper, context);
  }
}

export default new Vent();
