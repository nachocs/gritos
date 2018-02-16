import emojiJson from '../../../assets/emoji_short.json';
import _ from 'lodash';
// import emojione from 'emojione';
// const context = require.context('../../../assets/svg', false);
// const files = {};
// context.keys().forEach((filename) => {
//   files[filename] = context(filename);
// });

class Emojis {
  constructor() {
    const emojisUrl = 'https://gritos.com/assets/svg/';
    this.emojiList = {};
    _.forOwn(emojiJson, (value, key) => {
      if (!this.emojiList[value.category]) {
        this.emojiList[value.category] = [];
      }
      this.emojiList[value.category].push({
        unicode: value.unicode,
        shortname: value.shortname,
        name: key,
        aliases_ascii: value.aliases_ascii,
        img: '<img class="emojione" alt="&#x' + value.unicode + ';" title="' + value.shortname + '" src="' + emojisUrl + value.unicode + '.svg">',
      });
    });
  }
  get emojis() {
    return this.emojiList;
  }
}

const emojis = new Emojis();
export default emojis;