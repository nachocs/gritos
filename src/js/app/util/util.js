import _ from 'lodash';
import template from './displayImage.html';

class Util{
  constructor(){
    this.template = _.template(template);
  }
  displayImage(obj, image){
    return this.template(Object.assign({}, obj, {image}));
  }
};

export default new Util();
