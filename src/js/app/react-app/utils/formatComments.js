import Autolinker from "autolinker";

// Port of legacy main/message/baseMsgView.js formatComments() + its
// module-level Autolinker instance: spoiler tokens become clickable spans,
// bare links get linked, and YouTube URLs become embedded players.

const youtubeParser = (url) => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : false;
};

const autolinker = new Autolinker({
  replaceFn(match) {
    if (match.getType() === "url") {
      if (
        match.getUrl().indexOf("youtube.com") > 0 ||
        match.getUrl().indexOf("youtu.be") > 0
      ) {
        const youtubeId = youtubeParser(match.getUrl());
        return `<div class="videodelimitador"><div class="videocontenedor"><iframe title="youtube" src="//www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen=""></iframe></div></div>`;
      }
    }
    return undefined;
  },
});

const formatComments = (string) => {
  if (!string) {
    return string;
  }
  const replacer = (match, p1) => {
    const tip = p1.replace(/"/gi, "&quot;");
    return ` <span class="spoiler" data-tip="${tip}">SPOILER</span> `;
  };

  let formatted = string.replace(
    /-:SPOILER\[([^\][]+)\]SPOILER:-/gi,
    replacer,
  );
  formatted = formatted.replace(
    /a href=/gi,
    'a target="_blank" rel="noopener" href=',
  );
  return autolinker.link(formatted);
};

export default formatComments;
