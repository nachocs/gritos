import _ from 'lodash';
import $ from 'jquery';
import template from './mainView-t.html';
import LoginView from './header/loginView';
import MsgCollectionView from './foros/msgCollectionView';
import SpinnerView from './spinnerView';
import FormView from './form/formView';
import ResumenView from './header/resumenView';
import NotificacionesView from './header/notificacionesView';
import ModalView from './modalView';
import AvisosView from './header/avisosView';
import ViewBase from './base/ViewBase';

export default ViewBase.extend({
  className: 'main',
  template: _.template(template),
  initialize(options) {
    this.userModel = options.userModel;
    this.globalModel = options.globalModel;
    this.msgCollectionView = new MsgCollectionView({
      collection: this.collection,
      userModel: this.userModel,
      headModel: this.model,
    });

    this.loginView = new LoginView({
      userModel: this.userModel,
    });
    this.spinnerView = new SpinnerView({
      collection: this.collection,
    });
    this.formView = new FormView({
      userModel: this.userModel,
      collection: this.collection,
      globalModel: this.globalModel,
      type: 'foro',
      headModel: this.model,
    });
    this.resumenView = new ResumenView({
      collection: options.resumenCollection,
    });
    this.notificacionesView = new NotificacionesView({});
    this.listenTo(this.model, 'sync', this.render.bind(this));
    this.listenTo(this.userModel, 'change', this.render.bind(this));
    this.images = {
      logo: require('../../../img/logo50x50.gif'),
    };
  },
  events: {
    'click .new-msg': 'newMsg',
    'click .foro-admin': 'openForoAdmin',
    'click [data-link]': 'goToLink',
    'click .js-home': 'goToHome',
  },
  goToHome() {
    $(window).scrollTop(0);
    this.goToRoute('/');
    // this.collection.fetch(); // this breaks everything. DONT DO IT
  },
  openForoAdmin() {
    ModalView.update({
      model: {
        show: true,
        header: this.model.get('INDICE') === 'ciudadanos' ? 'EDITA TU MURO' : 'EDITAR FORO',
      },
      editForm: {
        userModel: this.userModel,
        msg: this.model,
        isHead: true,
      },
    }, );
  },
  newMsg() {
    if (this.userModel && this.userModel.get('ID')) {
      this.$el.find('main').scrollTop(0);
      this.formView.clearArea(true);
    } else {
      this.loginView.openMenu();
    }
  },
  render() {
    this.$el.html(this.template(this.serializer()));
    this.$('.msg-list').replaceWith(this.msgCollectionView.render().el);
    this.$('.login-view').html(this.loginView.render().el);
    this.$('.spinner-view').html(this.spinnerView.render().el);
    this.$('.form-view').html(this.formView.render().el);
    this.$('.resumen-collection').replaceWith(this.resumenView.render().el);
    this.$('.notificaciones-view').html(this.notificacionesView.render().el);
    this.$('.modal-view').html(ModalView.render().el);
    this.$('.avisos-view').html(AvisosView.render().el);
    this.spinnerView.hideSpinner();

    if (this.afterRender && typeof this.afterRender === 'function') {
      this.afterRender();
    }
    return this;
  },
  afterRender() {
    // if (this.model.get('SET') === '2'){
    //   $('body').addClass('oscuro');
    // } else {
    //   $('body').removeClass('oscuro');
    // }
    this.materialDesignUpdate();
    _.defer(_.bind(function () {
      // $(window).scroll(()=>{debugger;});
      // $('.mdl-layout__content').scroll(()=>{debugger;});
      // $('.mdl-layout').scroll(()=>{debugger;});
      // $('.mdl-layout__container').scroll(()=>{debugger;});

      $(window).scroll(this.detect_scroll.bind(this));
      // $('.mdl-layout__content').scroll(this.detect_scroll.bind(this));
    }, this));
  },
  detect_scroll(e) {
    if (($(e.currentTarget).scrollTop() + window.innerHeight) > ($('.msg-list').height() - 200)) {
      this.collection.nextPage();
    }
  },
  serializer() {
    return Object.assign({},
      this.model.toJSON(), {
        imgLogo: this.images.logo,
        Titulo: this.model.get('Titulo'),
        userModel: this.userModel.toJSON(),
      });
  },

});