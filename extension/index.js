const tmi = require('tmi.js');
const fs = require('fs');

module.exports = function (nodecg) {
	const client = new tmi.Client({
        channels: ['jaiocg']
    });
    
    client.connect();
    
    client.on('message', (channel, tags, message, self) => {
        if(self || !message.startsWith('!')) return;

        // "Alca: Hello, World!"
        console.log(`${tags['display-name']}: ${message}`);
        nodecg.sendMessage('chatCommand', message);
    });
};
