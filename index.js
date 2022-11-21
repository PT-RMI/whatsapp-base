const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');


const client = new Client({
    authStrategy: new LocalAuth()
}); 
// const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

client.on('message', message => {
	console.log(message.body);
});
client.on('message', message => {
	if(message.body === '!ping') {
		message.reply('pong');
	}
});

let text = "tes"


  
  function broadcast(text) {
    client.on('ready', () => {
        const message = text;
        sendToChats(message);
      });
    async function sendToChats(m){
        const mychats = await client.getChats();
        for(chat of mychats){
          chat.sendMessage(m);
        }
      }
  }
  