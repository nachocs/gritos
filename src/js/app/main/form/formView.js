import Backbone from 'backbone';
import formModel from '../../models/formModel';
import _ from 'lodash';
import $ from 'jquery';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';
import endpoints from '../../util/endpoints';
import emojione from 'emojione';
import EmojisModal from './emojisModal';

function isOrContains(node, container) {
  while (node) {
    if (node === container) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function elementContainsSelection(el) {
  let sel;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      for (let i = 0; i < sel.rangeCount; ++i) {
        if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
          return false;
        }
      }
      return true;
    }
  } else if ( (sel = document.selection) && sel.type != 'Control') {
    return isOrContains(sel.createRange().parentElement(), el);
  }
  return false;
}

export default Backbone.View.extend({
  template: _.template(template),
 	initialize(options) {
   this.globalModel = options.globalModel;
   this.userModel = options.userModel;
   this.formModel = new formModel();
   this.showEmojisModal = false;
   this.tagPlaceShown = false;
  //  if (this.globalModel){
  //    if (this.globalModel.get('ID') && this.globalModel.get('ID') !== 'foroscomun'){
  //      this.formModel.set('tags', this.globalModel.get('ID'));
  //    }
    //  this.listenTo(this.globalModel, 'change:ID', ()=>{
    //    if(this.globalModel.get('ID') !== 'foroscomun'){
    //      this.formModel.set('tags', '#' + this.globalModel.get('ID'));
    //    } else {
    //      this.formModel.set('tags', '');
    //    }
    //  });
  //  }
   this.wysiwyg = new Wysiwyg();
   this.listenTo(this.userModel, 'change', this.render.bind(this));
   this.listenTo(this, 'remove', this.clean.bind(this));
   this.listenTo(this.formModel, 'change', this.render.bind(this));
 },
  className: 'formulario',
  events: {
    'click .formularioTextArea': 'clearArea',
    'click .form-submit-button': 'submitPost',
    'mouseup .formularioTextArea': 'getSelectedText',
    'mousedown .formularioTextArea': 'getSelectedText',
    'keyup .formularioTextArea': 'getSelectedText',
    'keydown .formularioTextArea': 'getSelectedText',
    'change input[type="file"]': 'upload',
    'click .emojis': 'showEmojis',
    'click .show-tags': 'toggleTags',
    'keyup .input-tag': 'inputTag',
    'click [data-delete-tag]':'deleteTag',
  },
  deleteTag(e){
    const tag = this.$(e.currentTarget).data('delete-tag');
    const tags = this.formModel.get('tags').split(',');
    if (this.globalModel.get('ID') === tags[tag]){
      return;
    }
    let newTags = '';
    for (let i = 0; i < tags.length; ++i) {
      if (i != tag){
        if (newTags.length > 0){
          newTags = newTags + ',';
        }
        newTags = newTags + tags[i];
      }
    }
    this.setComments();
    this.formModel.set({tags: newTags});
  },
  inputTag(e){
    if (e.keyCode === 13 || e.keyCode === 188){
      e.preventDefault();
      let newTag = e.target.value.replace(/\W/ig,'');
      if (newTag){
        newTag = '#' + newTag;
        let tags = this.formModel.get('tags') ? this.formModel.get('tags').split(',') : [];
        tags.push(newTag);
        tags = _.uniq(tags);
        this.setComments();
        this.formModel.set({tags:_.join(tags, ',')});
      }
    }
  },
  toggleTags(){
    this.showEmojisIn(false);
    this.tagPlaceShown = !this.tagPlaceShown;
    this.toggleTagsIn(this.tagPlaceShown);
  },
  toggleTagsIn(prev){
    if (prev){
      this.$el.find('.tags-place ul').show('slow');
    } else {
      this.$el.find('.tags-place ul').hide('slow');
    }
    if (prev){
      componentHandler.upgradeElement(this.$el.find('.mdl-js-textfield')[0]);
    }
    this.tagPlaceShown = prev;
  },
  showEmojisIn(prev){
    if (prev){
      this.$('.emojis-modal-place').show('slow');
      EmojisModal.setParent(this);
      this.$('.emojis-modal-place').html(EmojisModal.render().el);
    } else {
      this.$('.emojis-modal-place').hide('slow');
    }
    this.showEmojisModal = prev;
  },
  showEmojis(){
    this.toggleTagsIn(false);
    if (EmojisModal.parent && EmojisModal.parent.cid !== this.cid){
      this.showEmojisModal = false;
    }
    this.showEmojisModal = !this.showEmojisModal;
    this.showEmojisIn(this.showEmojisModal);
  },
  getEmoji(string){
    this.clearArea();
    if (this.currentPosition){
      this.restoreSelection(this.currentPosition);
      this.insertTextAtCursor(string);
    } else {
      this.$('.formularioTextArea').append(string);
    }
    // if (this.currentPosition){
    //   const content = this.$('.formularioTextArea').html();
    //   const newContent = content.substr(0, this.currentPosition) + string + content.substr(this.currentPosition);
    //   this.$('.formularioTextArea').html(newContent);
    // } else {
    //   this.$('.formularioTextArea').append(string);
    // }
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    for (const prop in jsonModel){
      if ((/IMAGEN\d+\_THUMB/).test(prop)){
        const thisThumb = jsonModel[prop];
        this.$('.thumbs-place').append('<img src=\'' + thisThumb + '\'>');
      }
    }
  },

  upload() {
    if (!this.userModel.get('uid')){ return; }
    this.clearArea();
    this.showEmojisIn(false);
    const self = this;
    const data = new FormData();
    let imagenes_jump = 0;

    Object.keys(this.formModel.toJSON()).forEach((key)=> {
      if ((/IMAGEN(\d+)_URL/).exec(key)){
        const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        if ((Number(image)+1)>imagenes_jump){
          imagenes_jump = Number(image)+1;
        }
      }
    });
    $.each(this.$('input[type="file"]')[0].files, (i, file) => {
      const numero = imagenes_jump + i;
      data.append('FICHERO_IMAGEN' + numero, file);
    });
    $.ajax({
      url: endpoints.apiUrl + 'upload.cgi?sessionId=' + this.userModel.get('uid'),
      data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success(data) {
        console.log('UPLOAD RESPONSE: ', data);
        self.setComments();
        if (data.response && data.response.Ficheros && self.formModel.get('Ficheros')){
          data.response.Ficheros = self.formModel.get('Ficheros') + ',' + data.response.Ficheros;
        }
        self.formModel.set(data.response);
        self.addImages();
      },
    });
  },
  setComments(){
    this.formModel.set('comments', this.$('.formularioTextArea').html());
  },
  saveSelection() {
    let sel, res = null;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        res = sel.getRangeAt(0);
      }
    } else if (document.selection && document.selection.createRange) {
      res = document.selection.createRange();
    }

    if (res && res.commonAncestorContainer.className && !res.commonAncestorContainer.className.match(/formularioTextArea/)){
      res = null;
    }
    if (res && !res.commonAncestorContainer.className && res.commonAncestorContainer.parentNode && !res.commonAncestorContainer.parentNode.className.match(/formularioTextArea/)){
      res = null;
    }
    return res;

  },
  insertTextAtCursor(element) {
    let sel, range;
    if (!elementContainsSelection(this.$('.formularioTextArea')[0])){
      this.$('.formularioTextArea').append(element);
    } else {
      if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0);
          range.deleteContents();
          // Range.createContextualFragment() would be useful here but is
           // only relatively recently standardized and is not supported in
           // some browsers (IE9, for one)
          const el = document.createElement('div');
          el.innerHTML = element;
          const frag = document.createDocumentFragment();
          let node;
          let lastNode;
          while ( (node = el.firstChild) ) {
            lastNode = frag.appendChild(node);
          }
          range.insertNode(frag);

         // Preserve the selection
          if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else if (document.selection && document.selection.type != 'Control') {
          // IE < 9
        document.selection.createRange().pasteHTML(element);
      }
    }

    this.currentPosition = this.saveSelection();
  },
  restoreSelection(range) {
    let sel;
    if (range) {
      if (window.getSelection) {
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (document.selection && range.select) {
        range.select();
      }
    }
  },
  getSelectedText(e) {
    let selection;
    if (this.model && this.model.get('ID') && e.keyCode == 13){
      this.submitPost();
    }
    //Get the selected stuff
    this.currentPosition = this.saveSelection();

    if(window.getSelection)
      selection = window.getSelection();
    else if(typeof document.selection != 'undefined')
      selection = document.selection;
    if ((typeof selection === 'undefined') || (selection.toString().length < 1) ){
      this.$('.wysiwyg').hide();
      return;
    }

    //Get a the selected content, in a range object
    const range = selection.getRangeAt(0);

    //If the range spans some text, and inside a tag, set its css class.
    if(range && !selection.isCollapsed)
    {
      this.$('.wysiwyg').show().offset({top: range.getBoundingClientRect().top-22, left: range.getBoundingClientRect().left});
    } else if (selection.isCollapsed){
      this.$('.wysiwyg').hide();
    }
  },
  submitPost(){
    return _.throttle(this.submitPostThrottle.bind(this), 1000)();
  },
  submitPostThrottle() {
    if (!this.userModel.get('uid')){ return; }
    if (this.isSaving){return;}
    this.showEmojisIn(false);
    this.toggleTagsIn(false);
    const self = this;
    // tinyMCE.triggerSave();
    let comments = this.$('.formularioTextArea').html();
    comments = comments.replace(/\n/ig, '<br>');
    comments = comments.replace(/\r/ig, '<br>');
    const saveObj = {
      comments,
      uid: this.userModel.get('uid'),
      tags: this.formModel.get('tags'),
    };
    if (this.model && this.model.get('ID')){
      Object.assign(saveObj,
        {
          minigrito: {
            indice: this.model.get('INDICE'),
            entrada: this.model.get('ID'),
          },
        });
    } else if (this.collection.id && this.collection.id.length && this.collection.id !== 'foroscomun'){
      Object.assign(saveObj,
        {
          foro: this.collection.id.replace(/\/$/,''),
        },
      );
    }
    this.isSaving = true;
    this.formModel.save(
      saveObj,
      {
        success(data) {
          self.isSaving = false;
          self.formModel.clear();
          self.isClear = false;
          self.render();
          self.collection.reset();
          self.collection.fetch();
          console.log('success', data);
        },
        error(data) {
          console.log('error', data);
        },
      });
  },
  clearArea() {
    // if (this.isClear){return;}
    // this.$('.formularioTextArea').html(this.formModel.get('comments')).addClass('on');
    this.active = true;
    this.$('.formularioTextArea').addClass('on');
    // this.isClear =  true;
  },
  render() {
    if (this.userModel.get('uid')){
      this.$el.html(this.template(this.serializer()));
      this.$el.addClass('active');
      this.$('.wysiwyg-view').html(this.wysiwyg.render().el);

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }
      this.showEmojisIn(this.showEmojisModal);
      this.toggleTagsIn(this.tagPlaceShown);
    } else {
      this.$el.removeClass('active');
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    this.$('.wysiwyg').hide();
    componentHandler.upgradeElement(this.$el.find('.mdl-button')[0]);
    if (this.tagPlaceShown){
      this.$el.find('.mdl-js-textfield').each((index, ele)=>{
        componentHandler.upgradeElement(ele);
      });
    }
    // this.$('.formularioTextArea').keyup(function() {
    //   $(this).height(38);
    //   $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    // });
  },
  serializer(){
    const obj = this.userModel.toJSON();
    if (this.model && this.model.get('ID')){
      Object.assign(obj, { msg: this.model.toJSON() });
    }
    Object.assign(obj, {
      emojis: emojione.toImage(':smile:'),
      formModel: this.formModel.toJSON(),
      tags: this.formModel.get('tags') ? this.formModel.get('tags').split(',') : null,
      tagPlaceShown: this.tagPlaceShown,
      active: this.active,
    });
    return obj;
  },
  clean(){
    this.wysiwyg.remove();
    this.emojisModal.remove();
    delete this.wysiwyg;
    delete this.emojisModal;
  },
});
