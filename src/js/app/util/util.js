import _ from 'lodash';
import template from './displayImage.html';
import template2 from './displayImage2.html';

class Util{
  constructor(){
    this.template = _.template(template);
    this.template2 = _.template(template2);
  }
  displayImage(obj, image){
    return this.template(Object.assign({}, obj, {image}));
  }
  displayImage2(obj, image){
    return this.template2(Object.assign({}, obj, {image}));
  }
};

export default new Util();
