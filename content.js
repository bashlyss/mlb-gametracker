// content.js

console.log(chrome.storage.local.get('strike', function(val){console.log(val)}));
