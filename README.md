
# WHATSAPP API (Unofficial)

![Logo](https://github.com/PT-RMI/JUST-ASSET/blob/main/Frame%201.png?raw=true)


this project has created with base node.js. 





## Instalation

make sure you have node.js, or you can download in here https://nodejs.org/en/download/

clone this project
write on your terminal "npm install"



## Documentation

#### Send message at group or personal chat

```http
  GET /send/${crypt}/${phone}
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `text` | `string` | **Required**. Your message |

#### Testing chat

```http
  GET /test-send
```

#### add(num1, num2)

Takes two numbers and returns the sum.

