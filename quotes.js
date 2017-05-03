var request = require('request');

module.exports = function(RED) {

  function Quotes(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.source = config.source;
    this.markdown = config.markdown;

    this.formatQuote = function(text, author, link) {
      if (node.markdown) {
        return text + '\n' + '*' + author + '*\n' + link;
      } else {
        return text + '\n' + author + '\n' + link;
      }
    };

    this.on('input', function(msg) {


      switch(node.source) {
        case 'quotzzy':
          request('http://www.quotzzy.co/api/quote', function (error, response, body) {
            if (error !== null) {
              node.error('Timeout from http://www.quotzzy.co');
              return;
            }
            var json = null;
            try {
              json = JSON.parse(body);
            } catch(e) {
              // do nothing
            }
            // send parsed
            if (json !== null) {
              msg.payload = node.formatQuote(json.text, json.author.name, json.author.wiki);
              node.send(msg);
            } else {
              node.error('Unable to parse from http://www.quotzzy.co');
            }
          });
          break;
      }

    });
  }
  RED.nodes.registerType('quotes', Quotes);

};
