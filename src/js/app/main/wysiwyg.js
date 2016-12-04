// http://maccman.github.io/wysiwyg/

import $ from 'jquery';

const Wysiwyg = () => {};

Wysiwyg.prototype.className = 'wysiwyg';

Wysiwyg.prototype.events = {
  'click [data-type=bold]': 'bold',
  'click [data-type=italic]': 'italic',
  'click [data-type=list]': 'list',
  'click [data-type=link]': 'link',
  'click [data-type=h2]': 'h2',
  'click [data-type=h3]': 'h3',
  'click a': 'cancel',
};

Wysiwyg.prototype.document = document;

function Wysiwyg(options) {
  let key, value;

  this.options = options != null ? options : {};
  this.el = $('<div />');
  const _ref = this.options;
  for (key in _ref) {
    value = _ref[key];
    this[key] = value;
  }
  this.el.addClass(this.className);
  this.delegateEvents(this.events);
  this.render();
}

Wysiwyg.prototype.render = function() {
  this.el.empty();
  this.el.append('<a href="#" data-type="bold" style="font-weight: bold;" title="bold">B</a>');
  this.el.append('<a href="#" data-type="italic" style="font-style: italic;" title="italic">I</a>');
  this.el.append('<a href="#" data-type="link" style="text-decoration: underline;" title="link">A</a>');
  this.el.append('<a href="#" data-type="h2" title="large">XL</a>');
  this.el.append('<a href="#" data-type="h3" title="medium">M</a>');
  return this;
};

Wysiwyg.prototype.bold = function(e) {
  e.preventDefault();
  if (!this.selectTest()) {
    return;
  }
  return this.exec('bold');
};

Wysiwyg.prototype.italic = function(e) {
  e.preventDefault();
  if (!this.selectTest()) {
    return;
  }
  return this.exec('italic');
};

Wysiwyg.prototype.list = function(e) {
  e.preventDefault();
  return this.exec('insertUnorderedList');
};

Wysiwyg.prototype.link = function(e) {
  let href;

  e.preventDefault();
  if (!this.selectTest()) {
    return;
  }
  href = 'http://';
  const parentElement = window.getSelection().focusNode.parentElement;
  if (parentElement != null ? parentElement.href : void 0) {
    href = parentElement.href;
  }
  this.exec('unlink');
  href = prompt('Enter a link:', href);
  if (!href || href === 'http://') {
    return;
  }
  if (!/:\/\//.test(href)) {
    href = 'http://' + href;
  }
  return this.exec('createLink', href);
};

Wysiwyg.prototype.h2 = function(e) {
  e.preventDefault();
  if (this.query('formatBlock') === 'h2') {
    return this.exec('formatBlock', 'p');
  } else {
    return this.exec('formatBlock', 'h2');
  }
};

Wysiwyg.prototype.h3 = function(e) {
  e.preventDefault();
  if (this.query('formatBlock') === 'h3') {
    return this.exec('formatBlock', 'p');
  } else {
    return this.exec('formatBlock', 'h3');
  }
};

Wysiwyg.prototype.move = function(position) {
  return this.el.css(position);
};

Wysiwyg.prototype.cancel = e => {
  e.preventDefault();
  return e.stopImmediatePropagation();
};

Wysiwyg.prototype.getSelectedText = function() {
  let _ref;

  if ((_ref = this.document) != null ? _ref.selection : void 0) {
    return document.selection.createRange().text;
  } else if (this.document) {
    return document.getSelection().toString();
  }
};

Wysiwyg.prototype.selectTest = function() {
  if (this.getSelectedText().length === 0) {
    alert('Select some text first.');
    return false;
  }
  return true;
};

Wysiwyg.prototype.exec = function(type, arg) {
  if (arg == null) {
    arg = null;
  }
  return this.document.execCommand(type, false, arg);
};

Wysiwyg.prototype.query = function(type) {
  return this.document.queryCommandValue(type);
};

Wysiwyg.prototype.delegateEvents = function(events) {
  let eventName;
  let key;
  let match;
  let method;
  let selector;
  const _this = this;

  const _results = [];
  for (key in events) {
    method = events[key];
    if (typeof method !== 'function') {
      method = ((method => function() {
        _this[method].apply(_this, arguments);
        return true;
      }))(method);
    }
    match = key.match(/^(\S+)\s*(.*)$/);
    eventName = match[1];
    selector = match[2];
    if (selector === '') {
      _results.push(this.el.bind(eventName, method));
    } else {
      _results.push(this.el.delegate(selector, eventName, method));
    }
  }
  return _results;
};

export default Wysiwyg;
