import Backbone from 'backbone';
import formModel from '../../models/formModel';
import _ from 'lodash';
import $ from 'jquery';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';
import endpoints from '../../util/endpoints';
import emojione from 'emojione';
import EmojisModal from './emojisModal';

export default Backbone.View.extend({
  template: _.template(template),
 	initialize(options) {
   this.userModel = options.userModel;
   this.formModel = new formModel();
   this.showEmojisModal = false;
   if (options.globalModel){
     if (options.globalModel.get('ID')){
       this.formModel.set('tags', options.globalModel.get('ID'));
     }
     this.listenTo(options.globalModel, 'change:ID', ()=>{
       this.formModel.set('tags', options.globalModel.get('ID'));
     });
   }
   this.wysiwyg = new Wysiwyg();
   this.listenTo(this.userModel, 'change', this.render.bind(this));
   this.listenTo(this, 'remove', this.clean.bind(this));
   this.listenTo(this.formModel, 'change', this.render.bind(this));
 },
  className: 'formulario',
  events: {
    'click .formularioTextArea': 'clearArea',
    'click .form-submit-button': 'submitPost',
    'mouseup': 'getSelectedText',
    'mousedown': 'getSelectedText',
    'keyup': 'getSelectedText',
    'keydown': 'getSelectedText',
    'change input[type="file"]': 'upload',
    'click .emojis': 'showEmojis',
    'click .show-tags': 'toggleTags',
    'keyup .input-tag': 'inputTag',
  },
  inputTag(e){
    if (e.keyCode === 13){
      e.preventDefault();
      let tags = '';
      const newTag = e.target.value.replace(/^\w/ig,'');
      if (newTag){
        if (this.formModel.get('tags')){
          tags = this.formModel.get('tags') + ',';
        }
        tags = tags + newTag;
        this.formModel.set('comments', this.$('.formularioTextArea').html());
        this.formModel.set({tags});
      }
    }
  },
  toggleTags(){
    this.tagPlaceShown = !this.tagPlaceShown;
    this.$el.find('.tags-place ul').toggle('slow');
  },
  showEmojisIn(prev){
    if (prev){
      this.$('.emojis-modal-place').show('slow');
      EmojisModal.setParent(this);
      this.$('.emojis-modal-place').html(EmojisModal.render().el);
    } else {
      this.$('.emojis-modal-place').hide('slow');
    }
  },
  showEmojis(){
    if (EmojisModal.parent && EmojisModal.parent.cid !== this.cid){
      this.showEmojisModal = false;
    }
    this.showEmojisModal = !this.showEmojisModal;
    this.showEmojisIn(this.showEmojisModal);
  },
  getEmoji(string){
    this.clearArea();
    this.$('.formularioTextArea').append(string);
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    for (const prop in jsonModel){
      if ((/IMAGEN\d+\_THUMB/).test(prop)){
        const thisThumb = jsonModel[prop];
        this.$('.formularioTextArea').append('<img src=\'' + thisThumb + '\'>');
      }
    }
  },

  upload() {
    if (!this.userModel.get('uid')){ return; }
    this.clearArea();
    const self = this;
    const data = new FormData();
    $.each(this.$('input[type="file"]')[0].files, (i, file) => {
      data.append('FICHERO_IMAGEN' + i, file);
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
        self.formModel.set(data.response);
        self.addImages();
      },
    });
  },
  getSelectedText(e) {
    let selection;
    if (this.model && this.model.get('ID') && e.keyCode == 13){
      this.submitPost();
    }
    //Get the selected stuff
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
    const self = this;
    // tinyMCE.triggerSave();
    let comments = this.$('.formularioTextArea').html();
    comments = comments.replace(/\n/ig, '<br>');
    comments = comments.replace(/\r/ig, '<br>');
    const saveObj = {
      comments,
      'uid': this.userModel.get('uid'),
      tags: this.formModel.get('tags'),
    };
    if (this.model && this.model.get('ID')){
      Object.assign(saveObj,
        {
          minigrito: {
            indice: this.model.get('INDICE'),
            entrada: this.model.get('ID'),
          },
        },
        {
          room: this.model.get('INDICE') + '/' + this.model.get('ID'),
        });
    } else {
      Object.assign(saveObj,
        {
          room: this.collection.id,
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
    if (this.isClear){return;}
    this.$('.formularioTextArea').html(this.formModel.get('comments')).addClass('on');
    this.isClear =  true;
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
    } else {
      this.$el.removeClass('active');
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    this.$('.wysiwyg').hide();
    componentHandler.upgradeElement(this.$el.find('.mdl-button')[0]);

    this.$('.formularioTextArea').keyup(function() {
      $(this).height(38);
      $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    });
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
