import Backbone from 'backbone';
import formModel from '../models/formModel';
import _ from 'underscore';
import $ from 'jquery';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';
import endpoints from '../endpoints';

export default Backbone.View.extend({
  template: _.template(template),
 	initialize(options) {
   this.userModel = options.userModel;
   this.formModel = new formModel();
   this.wysiwyg = new Wysiwyg();
   this.listenTo(this.userModel, 'change', this.render.bind(this));
 },
  className: 'formulario',
  events: {
    'click #comments': 'clearArea',
    'click #formSubmit': 'submitPost',
    'mouseup': 'getSelectedText',
    'mousedown': 'getSelectedText',
    'keyup': 'getSelectedText',
    'keydown': 'getSelectedText',
    'change #file-submit': 'upload',
  },
  addImages() {
    const jsonModel = this.formModel.toJSON();
    for (const prop in jsonModel){
      if ((/IMAGEN\d+\_THUMB/).test(prop)){
        const thisThumb = jsonModel[prop];
        this.$('#comments').append('<img src=\'' + thisThumb + '\'>');
      }
    }

  },
  upload() {
    if (!this.userModel.get('uid')){ return; }
    this.clearArea();
    const self = this;
    const data = new FormData();
    $.each($('#file-submit')[0].files, (i, file) => {
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
  getSelectedText() {
    let selection;

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
  submitPost() {
    if (!this.userModel.get('uid')){ return; }

    const self = this;
    // tinyMCE.triggerSave();
    let comments = this.$('#comments').html();
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
        });
    }

    this.formModel.save(
      saveObj,
      {
        success(data) {
          self.formModel.clear();
          self.isClear = false;
          self.render();
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
    this.$('#comments').html('').addClass('on');
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
      this.$('.wysiwyg-view').html(this.wysiwyg.render().el);

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }
    }
    this.delegateEvents();
    return this;
  },
  afterRender() {
    this.$('.wysiwyg').hide();
    componentHandler.upgradeElement(this.$el.find('.mdl-button')[0]);

    this.$('#comments').keyup(function() {
      $(this).height(38);
      $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    });
  },
  serializer(){
    return this.userModel.toJSON();
  },
});
