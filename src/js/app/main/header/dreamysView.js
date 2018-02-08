import ViewBase from '../base/ViewBase';
import _ from 'lodash';
import template from './dreamysView.html';
import userModel from '../../models/userModel';
import DreamysService from '../../util/dreamysService';
import { Subscription } from 'rxjs/Subscription';
import formModel from '../../models/formModel';
import $ from 'jquery';
import endpoints from '../../util/endpoints';

export default ViewBase.extend({
  template: _.template(template),
  events: {
    'click .select-dreamy': 'selectDreamy',
    'change input[type="file"]': 'uploadPostAndUpdate',
  },
  initialize(options) {
    this.subscription = new Subscription();
    this.uploadAvailable = options.uploadAvailable;
    this.close = options.close;
    this.model = userModel;
    this.formModel = new formModel();
    this.dreamyFormModel = options.dreamyFormModel;

    // this.getDreamys();
    this.publicDreamys = [];
    this.personalDreamys = [];
    this.personalLoader = true;
    this.publicLoader = true;
    this.subscription.add(
      DreamysService.getGeneralDreamys().subscribe((data => {
        this.publicLoader = false;
        this.publicDreamys = [...data];
        this.render();
      })));
    if (this.model.get('uid')) {
      this.subscription.add(
        DreamysService.getPersonalDreamys().subscribe((data => {
          this.personalLoader = false;
          this.personalDreamys = [...data];
          if (this.model.get('FB_picture')) {
            this.personalDreamys.unshift({
              IMAGEN1_URL: this.model.get('FB_picture'),
              subject: 'FB profile',
            });
          }
          this.render();
        })));
      DreamysService.fetchGeneralDreamys();
      DreamysService.fetchPersonalDreamys(this.model.get('ID'));
    }
  },
  uploadPostAndUpdate() {
    if (!this.model.get('uid')) { return; }
    const self = this;
    const data = new FormData();
    let imagenes_jump = 0;

    this.$('.upload-dreamy').addClass('loading');
    Object.keys(this.formModel.toJSON()).forEach((key) => {
      if ((/IMAGEN(\d+)_URL/).exec(key)) {
        const image = (/IMAGEN(\d+)_URL/).exec(key)[1];
        if ((Number(image) + 1) > imagenes_jump) {
          imagenes_jump = Number(image) + 1;
        }
      }
    });
    $.each(this.$('input[type="file"]')[0].files, (i, file) => {
      const numero = imagenes_jump + i;
      data.append('FICHERO_IMAGEN' + numero, file);
    });
    $.ajax({
      url: endpoints.apiUrl + 'upload.cgi?sessionId=' + this.model.get('uid'),
      data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success(data) {
        // console.log('UPLOAD RESPONSE: ', data);
        if (data.response && data.response.Ficheros && self.formModel.get('Ficheros')) {
          data.response.Ficheros = self.formModel.get('Ficheros') + ',' + data.response.Ficheros;
        }
        self.formModel.set(data.response);
        self.submitEntry();
      },
      error() {
        self.$('.upload-dreamy').removeClass('loading');
      },
    });
  },
  submitEntry() {
    if (!this.model.get('uid')) { return; }
    const self = this;
    const comments = 'Nuevo avatar!';
    const saveObj = {
      comments,
      uid: this.model.get('uid'),
    };
    this.isSaving = true;
    this.formModel.save(
      saveObj, {
        success(model, data) {
          self.formModel.clear();
          if (data && data.mensaje && data.mensaje.IMAGEN0_THUMB) {
            self.close();
            self.model.save('dreamy_principal', data.mensaje.IMAGEN0_THUMB);
            self.$('.upload-dreamy').removeClass('loading');
          }
        },
        error() {
          self.$('.upload-dreamy').removeClass('loading');
        },
      }
    );
  },
  selectDreamy(e) {
    e.preventDefault();
    e.stopPropagation();
    const img = e.target.src;
    if (this.model.get('uid')) {
      this.close();
      if (this.dreamyFormModel) {
        this.dreamyFormModel.set('emocion', img);
      } else {
        this.model.save('dreamy_principal', img);
      }
    }
  },
  submitPost() {},
  render() {
    this.$el.html(this.template(this.serializer()));
    this.materialDesignUpdate();
    this.delegateEvents();
    return this;
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        personalDreamys: this.personalDreamys,
        publicDreamys: this.publicDreamys,
        personalLoader: this.personalLoader,
        publicLoader: this.publicLoader,
        uploadAvailable: this.uploadAvailable,
      },
    );
  },
  borrar() {
    this.subscription.unsubscribe();
    this.remove();
  },
});