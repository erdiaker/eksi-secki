
describe('Content script', function() {
  
  var assert = require('chai').assert;
  var fs = require('fs');
  var sinon = require('sinon');
  var chrome = require('sinon-chrome');
  var jsdom = require('jsdom');

  var theWindow, $, ContentScript;

  before(function(done) {
    this.timeout(60000);
    
    // mock chrome API
    var stub = chrome.runtime.sendMessage;
    stub.withArgs(sinon.match({type: 'is-indexed-topic'}))
      .returns(true);
    stub.withArgs(sinon.match({type: 'get-reader'}))
      .returns([{href: '/stub--678862', title: 'stub'}]);

    // create DOM, load scripts
    var root = '.';
    var jQuery = fs.readFileSync(root + '/node_modules/jquery/dist/jquery.js');
    var contentScript = fs.readFileSync(root + '/content.js');

    jsdom.env({
      url: 'https://eksisozluk.com/',
      src: [jQuery, contentScript],
      created: function(errors, window) {
        if (errors) throw errors; 

        window.chrome = chrome;
      },
      done: function(errors, window) { 
        if (errors) throw errors; 

        theWindow = window;
        $ = window.$;
        ContentScript = window.ContentScript;
        done();
      }
    });

  });

  it('should load', function() {
    assert(typeof $ !== 'undefined'); 
    assert(typeof ContentScript !== 'undefined'); 
  });

  it('should process the topic list', function() {
    var spy = chrome.runtime.sendMessage;
    var callCount = spy.callCount;
    assert(callCount > 0);

    var topicCount = $('.topic-list').find('a:not(.sponsored)').length;
    assert(callCount === topicCount); // one call for every topic

    for (var i = 0; i < callCount; i++) {
      assert(spy.args[i][0].type === 'is-indexed-topic');
    }
  });

  it('should register topic clicks', function() {
    var firstTopic = $('.topic-list').find('a:not(.sponsored)')[0];
    $(firstTopic).trigger('click');

    var spy = chrome.runtime.sendMessage;
    assert(spy.lastCall.args[0].type === 'register-topic-click');
  });

  it('should setup a button to retrieve the reader', function() {
    $('#reader-button').trigger('click');

    var spy = chrome.runtime.sendMessage;
    assert(spy.lastCall.args[0].type === 'get-reader');
  });

});

