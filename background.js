
var BackgroundScript = (function() {

  var _store, _classifier, _stemmer;

  var init = function() {
    setupStorage();
    setupClassifier();
    setupStemmer();
    setupSync();
    setupListener();
    setupTopicLimit();
  };

  var setupStorage = function() {
    if (localStorage.getItem('reader') === null) {
      _store = {};
      _store.topics = {};
      _store.clicks = {};
      _store.classifier = {};
    } else {
      _store = JSON.parse(localStorage.getItem('reader'));
    }
  };

  var setupClassifier = function() {
    _classifier = {};
    _classifier.title = 'title' in _store.classifier 
      ? Gullible.fromJSON(_store.classifier.title, {tokenizer: tokenizeTitle})
      : new Gullible({tokenizer: tokenizeTitle});

    _classifier.text = 'text' in _store.classifier 
      ? Gullible.fromJSON(_store.classifier.text, {tokenizer: tokenizeText})
      : new Gullible({tokenizer: tokenizeText});

    _classifier.author = 'author' in _store.classifier 
      ? Gullible.fromJSON(_store.classifier.author, {tokenizer: tokenizeAuthor})
      : new Gullible({tokenizer: tokenizeAuthor});
  };

  var setupStemmer = function() {
    _stemmer = new Snowball('turkish');
  };

  var setupSync = function() {
    setInterval(function() {
      for (var key in _classifier) {
        if (_classifier.hasOwnProperty(key)) {
          _store.classifier[key] = Gullible.toJSON(_classifier[key]);
        }
      }
      localStorage.setItem('reader', JSON.stringify(_store));
    }, 300000);
  };

  var setupListener = function() {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      if(request.type === 'register-topic-click') {
        registerTopicClick(request);
      } else if (request.type === 'is-indexed-topic') {
        var indexed = isIndexedTopic(request);
        sendResponse(indexed);
      } else if (request.type === 'add-topic') {
        addTopic(request);
      } else if (request.type === 'get-reader') {
        var reader = getReader();
        sendResponse(reader);
      } else if (request.type === 'clear-history') {
        clearHistory();
      }
    });
  };

  var registerTopicClick = function(request) {
    var topic = _store.topics[request.href];
    if (typeof topic !== 'undefined') {
      _classifier.title.learn(topic.title, 'click');
      for (var entry of topic.entries) {
        _classifier.text.learn(entry.text, 'click');
        _classifier.author.learn(entry.author, 'click');
      }
    }
    _store.clicks[request.href] = true;
  };

  var tokenizeTitle = function(title) {
    var tokens = [];

    var matches = title.match(/^\d{1,2} \w+ \d{1,4}/);
    if (matches) {
      tokens.push('_DATE_');
      title = title.substr(matches[0].length);
    }
    
    tokens = tokens.concat(tokenizeText(title));
    return tokens;
  };

  var tokenizeText = function(text) {
    text = text.replace(/'/g, '');
    text = text.replace(/[^A-Za-z0-9_ÇçĞğİıÖöŞşÜü]+/g, ' ');
    text = text.toLowerCase();
    var words = text.split(/\s+/);

    for (var i = 0; i < words.length; i++) {
      _stemmer.setCurrent(words[i]);
      _stemmer.stem();
      words[i] = _stemmer.getCurrent();
    }

    words = words.filter(function(word) {
      return !(word.trim() === '' || word in STOP_WORDS);
    });
    return words;
  };

  var tokenizeAuthor = function(author) {
    return [author];
  };

  var getCurrentDateString = function() {
    var d = new Date();
    return d.getDate() + MONTHS[d.getMonth()] + d.getFullYear();
  };

  var isIndexedTopic = function(request) {
    return (request.href in _store.topics);
  };

  var addTopic = function(request) {
    delete request['type'];
    _store.topics[request.href] = request;
  };

  var getReader = function() {
    var scores = {};
    var keys = [];
    for (var key in _store.topics) {
      if (_store.topics.hasOwnProperty(key) && !(key in _store.clicks)) {
        keys.push(key);
      }
    }

    for (var key of keys) {
      var topic = _store.topics[key];
      scores[topic.href] = calculateTopicScore(topic);
    }

    keys.sort(function(k1, k2) {
      return scores[k2] - scores[k1];
    });
   
    var reader = [];
    for (var key of keys.slice(0, 50)) {
      var topic = _store.topics[key];
      reader.push({href: topic.href, title: topic.title});
    }

    return reader;
  };

  var calculateTopicScore = function(topic) {
    var score = 0;

    for (var entry of topic.entries) {
      score += _classifier.text.estimate(entry.text, 'click');
      score += _classifier.author.estimate(entry.author, 'click');
    }
    score /= topic.entries.length;

    score += _classifier.title.estimate(topic.title, 'click');
  };

  var setupTopicLimit = function() {
    setInterval(function() {
      var size = Object.keys(_store.topics).length;
      if (size > 10000) {
        removeTopics(size - 5000);
      }
    }, 600000);
  };

  var removeTopics = function(count) {
    for (var key in _store.topics) {
      if (count === 0) break; 
      if (_store.topics.hasOwnProperty(key)) {
        delete _store.topics[key];
        count--;
      }
    }
  };

  var clearHistory = function() {
    localStorage.removeItem('reader');
    setupStorage();
    setupClassifier();
  };

  var getClassifier = function() {
    return _classifier;
  };

  return {
    init: init,
    isIndexedTopic: isIndexedTopic,
    addTopic: addTopic,
    registerTopicClick: registerTopicClick,
    getReader: getReader,
    getClassifier: getClassifier
  };

}());

BackgroundScript.init();

