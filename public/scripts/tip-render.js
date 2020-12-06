/**
 * Calculate the time difference between the current moment and a given one.
 * Returns result as n minutes/hours/days/months/years ago,
 * supports singular form of units.
 * If difference is less than a minute - returns 'now'
 * @param {*} date - a Date (in ms) to calculate a difference with
 */
const timeAgo = function(date) {

  const datemil = new Date(date);
  const timeMap = {
    'year' : 24 * 60 * 60 * 1000 * 365,
    'month' : 24 * 60 * 60 * 1000 * 30.42,
    'day' : 24 * 60 * 60 * 1000,
    'hour' : 60 * 60 * 1000,
    'minute' : 60 * 1000,
    'order': ['year', 'month', 'day', 'hour', 'minute']
  };

  const delta = Math.floor((Date.now() - datemil));
  for (const unit of timeMap.order) {
    const num = Math.floor(delta / timeMap[unit]);
    if (num >= 1) return `${num} ${unit}${(num === 1) ? '' : 's'} ago`;
  }
  return 'now';

};


/**
 * Function receives array (e.g. resource IDs)
 * and offset (default is 10)
 * Returns object like {1:[id1, id2...], 2:[id21, id22...]}
 * @param {*} arr
 * @param {*} offset
 */
const paginator = function(arr, offset = 10) {

  const pages = {};
  let page = 1;
  const lastPage = Math.ceil(arr.length / offset);
  while (page <= lastPage) {
    pages[page] = arr.slice(offset * (page - 1) ,offset * page);
    page++;
  }

  $('#paginator').empty().hide();
  if (pages['2']) drawPaginator(pages);
  loadTips(pages[1]);
  //return pages;
};


/**
 * Function receives an array of tip IDs to load
 * and pass it to /tips POST route, result is sent
 * to be rendered on a page
 */
const loadTips = function(tipsID) {

  $.ajax(`/tip`, { method: 'POST', data: { tipsID } })
    .then((tips, user) => {
      console.log(tips, user);
      renderTips(tips);
    });

};


/**
 * Function receives an object of pages with Resource IDs
 * Each page in the object creates button and associates
 * loading its resource IDs with this button
 * @param {*} tipsPaged
 */
const drawPaginator = function(tipsPaged) {

  for (const page in tipsPaged) {
    $('#paginator').append(`<button class=" btn btn-primary m-1.5 btn-sm rounded text-center">${page}</button>`);
    $('#paginator button:last-child').click(() => {
      loadTips(tipsPaged[page]);
    });
  }
};


/**
 * Compose a new resource element for the feed using
 * a particular resource-related data from the server
 * @param {*} tip
 *  */
const createTipElement = function(tip) {
  const { id, likes, creator_id, title, data,  description, tags, created_at, is_liked, is_bookmarked } = tip;
  let type = tip.type;
  let content = ``;
  switch (type) {
  case 'video':
    content += `<div class="video"><youtube-video controls src="${data}"></youtube-video></div>`;
    break;
  case 'markdown':
    content += `<div class="code-block markdown"><pre class="markdown">${data}</pre><p>${description}</p></div>`;
    break;
  case 'code':
    content += `<div class="code-block"><pre class="code javascript">${data}</pre><p>${description}</p></div>`;
    break;
  case 'link':
    content += `<div class="link"><span>Link: </span><a href="${data}">${data}</a><p>${description}</p></div>`;
    break;
  case 'image':
    content += `<div class="image"><img src="${data}" class="mw-100" alt="${title}"></div>`;
  }

  // @TODO this is breaking the index page
  let tagsField = '&nbsp;';
  if (tags) tagsField = tags.split(' ')
    .map(tag => `<a href="/search?search%5B%5D=${tag}">&nbsp;&nbsp;#${tag}&nbsp;&nbsp;</a>`).join('');

  const likeState = (is_liked) ? 'fas' : 'far';
  const bookmarkState = (is_bookmarked) ? 'fas' : 'far';

  return `
  <div class="row no-gutter justify-content-center tip index">
  <div class="col col-sm-10 col-md-12 col-lg-8 position-relative">
    <a href="/user/${creator_id}"><img class="tip-avatar m-4 bg-white border rounded-circle shadow-sm" width="48" height="48" src="https://avatars.dicebear.com/4.4/api/avataaars/${creator_id}.svg"></a>
    <div class="tip-icons d-flex flex-column align-items-center">
        <i class="${likeState} fa-thumbs-up" style="cursor: pointer" id="like-${id}"></i><span class="like badge badge-dark mb-2">${likes}</span>
        <i class="${bookmarkState} fa-bookmark" style="cursor: pointer" id="book-${id}"></i>
    </div>
    <div class="card mb-3 shadow-sm">
      <div class="card-header border-0 d-flex justify-content-between">
        <a href="/tip/${id}">${title}</a>
        <a>${timeAgo(created_at)}</a>
      </div>
      <div class="card-body" style="min-height: 10em;">
        ${content}
      </div>
      <mark style="background-color: rgba(0,0,0,.03)">${tagsField}</mark>
    </div>
  </div>
</div>
  `;
};


/**
 * Load a set of resources received as an array of database objects
 * @param {*} tweets - array of objects
 */
const renderTips = function(tips) {
  $('#list-tips').empty();
  for (const tip of tips) {
    $('#list-tips').append(createTipElement(tip));
  }
  EnlighterJS.init('pre.code', 'pre.javascript', {
    language : 'javascript',
    theme: 'dracula',
    indent : 2
  });
  EnlighterJS.init('pre.markdown', {
      language : 'markdown',
      theme: 'dracula',
      indent : 2
  });
  $('#paginator').show();
  likeAndBookmarkListeners();
};


const getAllTips = function() {

  $.ajax(`/tip/all`, { method: 'GET' })
    .then(tips => {
      paginator(tips);
    });
};


const likeAndBookmarkListeners = function() {

  // Like listener
  $('.fa-thumbs-up').on('click', function(event) {
    const likesCount = Number($(this).next()[0].innerText);
    const $likeIcon = $(this);
    const $tip_id = $(this)[0].id.replace(/like-/, '');

    const [ method, remove, add, likeAdjust ] = ($(this).hasClass('far')) ?
      [ 'POST', 'far', 'fas', 1 ] : [ 'DELETE', 'fas', 'far', -1 ];

    $(this).next()[0].innerText = likesCount + likeAdjust;
    $.ajax(`/tip/${$tip_id}/like`, {
      method: method,
      data: { "tip_id": $tip_id },
      dataType: "json"
    })
      .done(function() {

        $likeIcon.removeClass(`${remove}`).addClass(`${add}`);
      });
  });

  // Bookmark listener
  $('.fa-bookmark').on('click', function(event) {

    const $bookIcon = $(this);
    const $tip_id = $(this)[0].id.replace(/book-/, '');

    const [ method, remove, add ] = ($(this).hasClass('far')) ?
      ['POST', 'far', 'fas'] : [ 'DELETE', 'fas', 'far' ];

    $.ajax(`/tip/${$tip_id}/bookmark`, {
      method: method,
      data: { "tip_id": $tip_id },
      dataType: "json"
    })
      .done(function() {
        $bookIcon.removeClass(`${remove}`).addClass(`${add}`);
      });
  });
};


$(document).ready(() => {
  //if ($(document)[0].title === 'DevTips - Tip') changeTime();
  if ($(document)[0].title === 'Home Page') getAllTips();
  //loadTips([4,5]); // initial testcode, to be replaced
  //searchFormValidateInput();

});
