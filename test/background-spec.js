
describe('Background script', function() {
  
  var assert = require('chai').assert;
  var fs = require('fs');
  var sinon = require('sinon');
  var chrome = require('sinon-chrome');
  var localStorage = require('localStorage');
  var Gullible = require('gullible');
  var Snowball = require('snowball');

  before(function() {

    // mock chrome API
    var stub = chrome.runtime.sendMessage;
    stub.withArgs(sinon.match({type: 'is-indexed-topic'}))
      .returns(true);
    stub.withArgs(sinon.match({type: 'get-reader'}))
      .returns([{href: '/stub--678862', title: 'stub'}]);

    // load scripts
    eval(fs.readFileSync('./data/stopwords.js').toString());
    eval(fs.readFileSync('./background.js').toString());
    global.STOP_WORDS = STOP_WORDS;
    global.BackgroundScript = BackgroundScript;
  });

  it('should load', function() {
    assert(typeof STOP_WORDS !== 'undefined'); 
    assert(typeof BackgroundScript !== 'undefined'); 
  });

  it('should check if a topic is indexed', function() {
    var req = {type: 'is-indexed-topic', href: '/test-href'};
    assert(BackgroundScript.isIndexedTopic(req) === false);
  });

  it('should add new topics to its index', function() {
    var req = {
      type: 'add-topic',
      href: '/test-href',
      title: 'test title',
      entries: [
        {text: 'This is an entry.', author: 'author1'},
        {text: 'Another entry.', author: 'author2'}
      ]
    };
    BackgroundScript.addTopic(req);
    assert(BackgroundScript.isIndexedTopic(req));
  });

  it('should register topic clicks', function() {
    var req = {
      type: 'register-topic-click',
      href: '/test-href',
      title: 'test title'
    };
    BackgroundScript.registerTopicClick(req);
    var classifier = BackgroundScript.getClassifier();
    assert(classifier.title.getSampleCount() === 1);
    assert(classifier.text.getSampleCount() === 2);
    assert(classifier.author.getSampleCount() === 2);
  });

  it('should prepare a reader list', function() {
    // first, add a new topic to the index
    var req = {
      type: 'add-topic',
      href: '/new-href',
      title: 'new title',
      entries: [
        {text: 'New entry.', author: 'new author'}
      ]
    };
    BackgroundScript.addTopic(req);
 
    // assert that this new topic is in the reader
    var req = {type: 'get-reader'};
    var reader = BackgroundScript.getReader(req);
    assert(reader[0].href === '/new-href'); 
    assert(reader[0].title === 'new title'); 
  });

});

