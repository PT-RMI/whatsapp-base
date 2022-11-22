const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const { Client, LocalAuth } = require('whatsapp-web.js');
const { appendFile } = require('fs');
const port = 80;

const client = new Client({
    authStrategy: new LocalAuth()
}); 
// const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on('auth_failure', message => {
  // Fired if session restore was unsuccessful
  console.error('AUTHENTICATION FAILURE', message);
});

client.on('ready', () => {
  console.log('Client is ready!');
  app.listen(port, ()=>{
    console.log(`Server berjalan pada http://localhost:${port}`)
  })

  app.get('/send/:phone', function (req, res) {
    if (req.query.text == null || req.query.text == '') {
      return res.send('param text required')
    }
    if (typeof parseInt(req.params.phone)  != 'number') {
      return res.send('phone number must be integer')
    }
    var textuser = req.query.text;
    var numberuser= req.params.phone; 
    chatuser( numberuser, textuser);
    res.send(`sending text to ${numberuser} with text = ${textuser}`)
 });
  app.get('/', (req, res)=>{
    res.send('haii');
  });
  app.get('/test-send', (req, res)=>{
    var numberuser= `6285155489797`
    var textuser = 'hai-tayooo' 
    chatuser( numberuser, textuser);
    res.send(`sending text to ${numberuser} with text = ${textuser}`)
  });
  

  
});

client.initialize();

client.on('message', message => {
	console.log(message.from+' -  '+ message.body);
});
client.on('message', message => {
	if(message.body === '!ping') {
		message.reply('pong');
	}else if (message.body.startsWith('!sendto ')) {
    // Direct send a new message to specific id
    let number = message.body.split(' ')[1];
    let messageIndex = message.body.indexOf(number) + number.length;
    let chats = message.body.slice(messageIndex, message.body.length);
    number = number.includes('@c.us') ? number : `${number}@c.us`;
    let chat = message.getChat();
    console.log(`text terkirim ke ${number} dengan pesan ${chats}`)
    // chat.sendSeen();
    // console.log('send seen');
    client.sendMessage(number, chats);
    console.log('sendmessage');
  }
});



function chatuser(numberuser, textuser) {
  
  const chatId = numberuser + "@c.us";
  client.sendMessage(chatId, textuser);
    console.log(`sending text to ${chatId} with text = ${textuser}`);
}

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
  