/**
 * Social sharing utilities migrated from legacy Util.bookmarkthis.
 */

const SHARERS = {
  facebook: (href, title) =>
    `http://www.facebook.com/sharer.php?u=${encodeURIComponent(href)}&t=${encodeURIComponent(title)}`,
  twitter: (href) =>
    `http://twitter.com/home?status=${encodeURIComponent(href)}`,
  webeame: (href) =>
    `http://www.webeame.net/submit.php?url=${encodeURIComponent(href)}`,
  meneame: (href) =>
    `http://meneame.net/submit.php?url=${encodeURIComponent(href)}`,
  stumbleupon: (href) =>
    `http://www.stumbleupon.com/submit?url=${encodeURIComponent(href)}`,
  delicious: (href, title) =>
    `http://del.icio.us/post?url=${encodeURIComponent(href)}&title=${encodeURIComponent(title)}`,
  wong: (href, title) =>
    `http://www.mister-wong.es/index.php?action=addurl&bm_url=${encodeURIComponent(href)}&bm_description=${encodeURIComponent(title)}`,
  digg: (href) =>
    `http://digg.com/submit?phase=2&url=${encodeURIComponent(href)}`,
  technorati: (href, title) =>
    `http://technorati.com/faves?add=${encodeURIComponent(href)}&t=${encodeURIComponent(title)}`,
  blinklist: (href, title) =>
    `http://blinklist.com/index.php?Action=Blink/addblink.php&url=${encodeURIComponent(href)}&Title=${encodeURIComponent(title)}`,
  furl: (href, title) =>
    `http://furl.net/storeIt.jsp?u=${encodeURIComponent(href)}&t=${encodeURIComponent(title)}`,
  reddit: (href, title) =>
    `http://reddit.com/submit?url=${encodeURIComponent(href)}&title=${encodeURIComponent(title)}`,
  slashdot: (href, title) =>
    `http://slashdot.org/bookmark.pl?url=${encodeURIComponent(href)}&title=${encodeURIComponent(title)}`,
  newsvine: (href, title) =>
    `http://www.newsvine.com/_tools/seed&save?u=${encodeURIComponent(href)}&h=${encodeURIComponent(title)}`,
  google: (href, title) =>
    `http://www.google.com/bookmarks/mark?op=edit&bkmk=${encodeURIComponent(href)}&title=${encodeURIComponent(title)}`,
  yahoo: (href) =>
    `http://bookmarks.yahoo.com/myresults/bookmarklet?u=${encodeURIComponent(href)}`,
  fresqui: (href) =>
    `http://tec.fresqui.com/post?url=${encodeURIComponent(href)}`,
  barrapunto: (href, title) =>
    `http://barrapunto.com/submit.pl?story=${encodeURIComponent(href)}&subj=${encodeURIComponent(title)}`,
  myspace: (href) =>
    `http://www.myspace.com/Modules/PostTo/Pages/?u=${encodeURIComponent(href)}`,
  email_link: (href, title) =>
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(href)}`,
};

/**
 * Opens a sharing window for the specified platform.
 * @param {string} platform - Platform key (e.g., 'facebook', 'twitter')
 * @param {string} href - URL to share
 * @param {string} title - Title of the content
 */
export const shareTo = (platform, href, title) => {
  if (platform === "printer") {
    window.print();
    return;
  }

  const getUrl = SHARERS[platform];
  if (!getUrl) return;

  const url = getUrl(href, title);
  const specs = platform === "email_link" ? "" : "width=450, height=250";

  if (platform === "email_link") {
    window.location.href = url;
  } else {
    window.open(url, "", specs);
  }
};
