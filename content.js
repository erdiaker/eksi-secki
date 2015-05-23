
var ContentScript = (function() {

  var init = function() {
    wireAnchorClickCallbacks();
    wireIndexChangeCallbacks();
    sendTopics();
    setupButton();
  };

  var wireAnchorClickCallbacks = function() {
    $('.topic-list').find('a:not(.sponsored)')
    .off('click', recordTitleClick)
    .on('click', recordTitleClick);
  };

  var wireIndexChangeCallbacks = function() {
    $('#partial-index')
    .off('DOMNodeInserted', '.topic-list', wireAnchorClickCallbacks)
    .on('DOMNodeInserted', '.topic-list', wireAnchorClickCallbacks);
  };

  var recordTitleClick = function(e) {
    var anchor = e.target;
    var title = stripAnchor(anchor);
    send({type: 'register-topic-click', title: title, 
      href: anchor.pathname
    });
  };

  var setupButton = function() {
    var button = $('<li>').append(
      $('<a>', {
        id: 'reader-button',
        title: 'senin için seçtiklerim',
        text: 'seçki'}));

    $('#quick-index-nav').append(button);
    $('#reader-button').off('click', retrieveReader).on('click', retrieveReader);
  };

  var retrieveReader = function() {
    $('#partial-index > h2').append(
      $('<span>', {class: 'loader-tick spin'}));

    send({type: 'get-reader'}, function(reader) {
      var leftMenu = $('#partial-index');
      var header = $('<h2>').append('seçki');
      leftMenu.empty();
      leftMenu.append(header);
      leftMenu.append(formatReader(reader));
    });
  };

  var formatReader = function(reader) {
    var topicList = $('<ul>');
    topicList.addClass('topic-list partial');
    for (var topic of reader) {
      var href = topic.href + '?a=popular';
      var anchorLi = $('<li>').append(
        $('<a>', {href: href, text: topic.title}));
      topicList.append(anchorLi);
    }
    return topicList;
  };

  var stripAnchor = function(anchor) {
    var title = anchor.innerHTML;
    if (anchor.innerHTML.indexOf(' <small>') !== -1) {
      // remove count
      title = title.slice(0, title.lastIndexOf(' <small>'));
    }
    return title;
  };

  var checkIndex = function(anchor) {
    var d = $.Deferred();
    var msg = {type: 'is-indexed-topic', href: anchor.pathname};
    send(msg, function(resp) {d.resolve(resp)});
    return d.promise();
  };

  var sendTopics = function() {
    var anchors = $('.topic-list').find('a:not(.sponsored)');
    anchors.each(function() {
      var anchor = this;
      checkIndex(anchor)
      .then(function(indexed) {
        getContentPage(anchor.pathname + '?a=popular')
        .then(function(html) {
          var parsedEntries = parseContentPage(html);
          send({type: 'add-topic', 
            title: stripAnchor(anchor), 
            href: anchor.pathname, 
            entries: parsedEntries});
        });
      });
    });
  };

  var getContentPage = function(href) {
    return $.ajax({
      type: 'GET', 
      url: href, 
      cache: false
    });
  };

  var parseContentPage = function(html) {
    var entries = $(html).find('#entry-list > li');
    var parsedEntries = [];
    for (var i = 0; i < entries.length; i++) {
      var parsedEntry = parseEntry($(entries[i]));
      parsedEntries.push(parsedEntry);
    }
    return parsedEntries;
  };

  var parseEntry = function(entry) {
    var parsed = {};
    parsed.text = entry.find('div.content')[0].innerText;
    parsed.author = entry.find('a.entry-author')[0].textContent;
    return parsed;
  };

  var send = function(message, callback) {
    chrome.runtime.sendMessage(message, callback);
  };

  return {
    init: init
  };

})();

ContentScript.init();

