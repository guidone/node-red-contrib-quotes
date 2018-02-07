var request = require('request');
var _s = require("underscore.string");
var _ = require('underscore');

var quoters = {
  qod: function () {
    return new Promise(function(resolve, reject) {
      request(
        'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1',
        function (error, response, body) {
          if (error !== null) {
            reject('Error fetching from http://quotesondesign.com');
            return;
          }
          var json = null;
          try {
            json = JSON.parse(body);
          } catch(e) {
            // do nothing
          }
          if (json == null) {
            reject('Error parsing quotesdesign');
          } else {
            resolve({
              text: _s.stripTags(json[0].content).replace(/\n$/, ''),
              author: json[0].title,
              link: null
            });
          }
        }
      );
    });
  },
  forismatic: function() {
    return new Promise(function(resolve, reject) {
      request(
        'http://api.forismatic.com/api/1.0/?method=getQuote&format=json&jsonp=parseQuote&lang=en',
        function (error, response, body) {
          if (error !== null) {
            reject('Error fetching from http://quotesondesign.com');
            return;
          }
          var json = null;
          try {
            json = JSON.parse(body);
          } catch(e) {
            // do nothing
          }
          if (json == null) {
            reject('Error parsing forismatic');
          } else {
            resolve({
              text: json.quoteText,
              author: json.quoteAuthor,
              link: null
            });
          }
        }
      );
    });
  }
};


module.exports = function(RED) {

  function Quotes(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.source = config.source;
    this.markdown = config.markdown;

    this.formatQuote = function(text, author, link) {
      if (node.markdown) {
        return text + '\n' + '*' + author + '*\n' + (link != null ? link : '');
      } else {
        return text + '\n' + author + '\n' + (link != null ? link : '');
      }
    };

    this.on('input', function(msg) {

      var id = null;
      if (node.source != null && quoters[node.source] != null && node.source !== 'random') {
        id = node.source;
      } else {
        id = _(quoters).chain().keys().sample().value();
      }

      quoters[id]()
        .then(
          function(quote) {
            console.log('quote', quote);
            msg.payload = node.formatQuote(quote.text, quote.author, quote.link);
            node.send(msg);
          },
          function(error) {
            node.error(error);
          });
    });
  }
  RED.nodes.registerType('quotes', Quotes);

};
