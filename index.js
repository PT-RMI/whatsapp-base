const qrcode = require('qrcode-terminal');
const express = require('express');
const fileUpload = require('express-fileupload')
const app = express();
require("dotenv").config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { appendFile } = require('fs');
const path = require('path');
const { log, error } = require('console');
const { abort } = require('process');
const port = process.env.PORT ? process.env.PORT: 1000;
const crypt = process.env.TOKEN_API;
const client = new Client({
        puppeteer: {
                args: ['--no-sandbox'],
        },
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
  app.use(fileUpload())

  app.post('/send/:encrypt/:phone', function (req, res) {
    if(req.params.encrypt != crypt){
      return res.send('KEY DATA tidak ada')
    }
    if (req.body.text == null || req.body.text == '') {
      return res.send('param text required')
    }
    if (typeof parseInt(req.params.phone)  != 'number') {
      return res.send('phone number must be integer')
    }
    var textuser = req.body.text;
    var numberuser= req.params.phone;

    if((''+numberuser)[0] == 6 && (''+numberuser)[1] ==2){
      chatuser( numberuser, textuser);
    }else{
      chatgroup( numberuser, textuser);
    }
    res.send(`sending text to ${numberuser} with text = ${textuser}`)
 });

 app.post('/send-with-file/:encrypt/:phone', function (req, res) {
  if(req.params.encrypt != crypt){
    return res.send('KEY DATA tidak ada')
  }
  if (typeof parseInt(req.params.phone)  != 'number') {
    return res.send('phone number must be integer')
  }
  var textuser = req.body.text;
  var numberuser= req.params.phone;

  if((''+numberuser)[0] == 6 && (''+numberuser)[1] ==2){
    if (Object.keys(req.body).length ===2) {
      console.log('test with url_image');
      const file = req.body.file_url;
      console.log(file);
      sendFileLink(req.body.file_url, numberuser, textuser)

    }else if(Object.keys(req.files).length ===1){
      console.log("test with send file");
      const file = req.files.upload
      const filePath = path.join(__dirname, 'public', 'files', `${file.name}`)
      res.status(200).json({status : 'sukses', pathfile: filePath})
      file.mv(filePath, err => {
          if (err) return res.status(500).send(err)
      })
      sendFilemsg(filePath, numberuser, textuser)
    }else{
      return error('error')
    }
  }else{
    res.send(`fitur belum tersedia untuk group`)
  }

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
  app.get('/test-group', (req, res)=>{
    var groupnumber= `120363037341519775`
    var textuser = 'hai-tayooo\n apakabar ente' 
    chatgroup( groupnumber, textuser);
    res.send(`sending text to ${groupnumber} with text = ${textuser}`)
  });
  app.post('/test-send-file', (req, res)=>{
    var numberuser= `6285155489797`;

    if (Object.keys(req.body).length ===1) {
      console.log('test with url_image');
      const file = req.body.file_url;
      console.log(file);
      sendFileLink(req.body.file_url, numberuser, 'haii')

    }else if(Object.keys(req.files).length ===1){
      console.log("test with send file");
      const file = req.files.upload
      const filePath = path.join(__dirname, 'public', 'files', `${file.name}`)
      res.status(200).json({status : 'sukses', pathfile: filePath})
      file.mv(filePath, err => {
          if (err) return res.status(500).send(err)
      })
      sendFilemsg(filePath, numberuser)
    }else{
      return error('error')
    }
  });
  
  

  
});

client.initialize();

client.on('message', message => {
  const contact = message.getContact();
        console.log(`${message.from} (${contact.number}) -  ${message.body} `);
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
function chatgroup(groupnumber, textuser) {
  
  const chatId = groupnumber + "@g.us";
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

 function sendFilemsg(file_path,numberuser,msg){
  const media = MessageMedia.fromFilePath(file_path);
  console.log(media);
  console.log(client.sendMessage(`${numberuser}@c.us`, media, {caption: msg}) );
  console.log(`chat with photo has been send to ${numberuser} with cation = ${msg}`);
  }

  async function sendFileLink(url,numberuser,msg){
    const media = await MessageMedia.fromUrl(`${url}`);
    console.log(client.sendMessage(`${numberuser}@c.us`, media, {caption: msg}) );
    console.log(`chat with photo has been send to ${numberuser} with cation = ${msg}`);
    }
  