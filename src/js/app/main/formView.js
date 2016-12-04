import Backbone from 'backbone';
import formModel from '../models/formModel';
import _ from 'underscore';
import $ from 'jquery';
import Wysiwyg from './Wysiwyg';
import template from './formView.html';

export default Backbone.View.extend({
  template: _.template(template),
 	initialize(options) {
   _.bindAll(this);
   this.userModel = options.userModel;
   this.formModel = new formModel();
   this.collection = options.collection;
   this.listenTo(this.userModel, 'change', this.render);
 },
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
        $('#comments').append('<img src=\'' + thisThumb + '\'>');
      }
    }

  },
  upload() {
    this.clearArea();
    const self = this;
    const data = new FormData();
    $.each($('#file-submit')[0].files, (i, file) => {
      data.append('FICHERO_IMAGEN' + i, file);
    });
    $.ajax({
      url: 'web/cgi/upload.cgi?sessionId=' + this.userModel.get('uid'),
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
    const self = this;
    // tinyMCE.triggerSave();
    let comments = this.$('#comments').html();
    comments = comments.replace(/\n/ig, '<br>');
    comments = comments.replace(/\r/ig, '<br>');
    this.formModel.save(
      {
        comments,
        'sessionId': this.userModel.get('uid'),
      },
      {
        success(data) {
          self.formModel.clear();
          self.isClear = false;
          self.render();
          self.collection.reload();
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
      this.$el.html(this.template());

      if (this.afterRender && typeof this.afterRender === 'function') {
        this.afterRender.apply(this);
      }      
    }
    return this;
  },
  afterRender() {
    const wysiwyg = new Wysiwyg;
    wysiwyg.el.insertBefore('#comments');
    this.$('.wysiwyg').hide();

    this.$('#comments').keyup(function() {
      $(this).height(38);
      $(this).height(this.scrollHeight + parseFloat($(this).css('borderTopWidth')) + parseFloat($(this).css('borderBottomWidth')));
    });
  },
});
