import Backbone from 'backbone';
import formModel from '../../models/formModel';
import _ from 'lodash';
import $ from 'jquery';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';
import endpoints from '../../endpoints';
import emojione from 'emojione';
import EmojisModal from './emojisModal';

export default Backbone.View.extend({
  template: _.template(template),
 	initialize(options) {
   this.userModel = options.userModel;
   this.formModel = new formModel();
   this.wysiwyg = new Wysiwyg();
   this.emojisModal = new EmojisModal();
   this.listenTo(this.userModel, 'change', this.render.bind(this));
   this.listenTo(this, 'remove', this.clean.bind(this));
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
  },
  showEmojis(){
    this.showEmojisModal = !this.showEmojisModal;
    if (this.showEmojisModal){
      this.$('.emojis-modal-place').html(this.emojisModal.render().el);
    } else {
      this.emojisModal.remove();
    }
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
          room:this.model.get('INDICE') + this.model.get('ID'),
        });
    } else {
      Object.assign(saveObj,
        {
          room:'ciudadanos' + this.userModel.get('ID'),
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
    this.$('.formularioTextArea').html('').addClass('on');
    this.isClear =  true;
   // tinymce.init({
   //     selector: "textarea",
   //     plugins: [
   //         "advlist autolink lists link image charmap print preview anchor",
   //         "code emoticons textcolor",
   //         "table contextmenu paste"
   //     ],
   //     toolbar: "preview | undo redo | bold italic fontselect fontsizeselect | alignleft aligncenter alignright alignjustify | table bullist numlist outdent indent | link image | emoticons forecolor backcolor",
   //     menubar: false,
   //     statusbar: false,
   //     toolbar_items_size: 'small',
   //     auto_focus: "formulario",
   //     object_resizing : false,
   //     convert_fonts_to_spans : true,
   //     fontsize_formats: "8pt 10pt 12pt 14pt 18pt",
   //     entity_encoding : "raw"
   // });
  },
  render() {
    if (this.userModel.get('uid')){
      this.$el.html(this.template(this.serializer()));
      this.$el.addClass('active');
      this.$('.wysiwyg-view').html(this.wysiwyg.render().el);

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }
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
