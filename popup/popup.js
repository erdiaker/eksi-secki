(function() {

$(document).ready(function() {
  $('#clearButton')
  .off('click')
  .on('click', function() {
    chrome.runtime.sendMessage({type: 'clear-history'});
  });
});

})();
