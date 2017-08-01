import Backbone from 'backbone';
import template from './notificacionesItemView-t.html';
import _ from 'lodash';
import userModel from '../../models/userModel';
import moment from 'moment';
import router from '../../router';

export default Backbone.View.extend({
  template: _.template(template),
  tagName: 'li',
  render(){
    this.$el.html(this.template(this.serializer()));
    return this;
  },
  events:{
    'click':'goTo',
  },
  goTo(e){
    e.stopPropagation();
    e.preventDefault();
    router.navigate('/' + this.model.get('indice').replace(/^gritos\//,'').replace(/\/(\d+)\/\d+$/, '/$1'), {trigger:true});

  },
  serializer(){
    let indiceBasic = '# ' + this.model.get('indice').replace(/^gritos\//,'').replace(/^foros\//,'').replace(/\/.*$/,'');
    if (this.model.get('indice').match(/^ciudadanos/) && this.model.get('head')){
      if (this.model.get('head').ID === userModel.get('ID')){
        indiceBasic = 'tu muro';
      } else {
        indiceBasic = 'el muro de @' + this.model.get('head').alias_principal.replace(/\s/g, '_');
      }
    }
    let entry = this.model.get('entry');
    if (entry && entry['emocion']){
      entry['emocion'] = entry['emocion'].replace(/https?/, '');
    }
    let citizen = this.model.get('citizen');
    if (citizen && citizen['dreamy_principal']){
      citizen['dreamy_principal'] = citizen['dreamy_principal'].replace(/https?/, '');
    }

    return Object.assign({},
      this.model.toJSON(), {
        entry,
        user: userModel.toJSON(),
        indiceBasic,
        date: moment.unix(this.model.toJSON().entry.FECHA).fromNow(),
      },
    );
  },
});
