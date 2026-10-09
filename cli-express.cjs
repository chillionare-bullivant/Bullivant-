console.log('This example is different!');
console.log('The result is displayed in the Command Line Interface');
const os = require('os');
console.log(os.platform());
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World!'));

const PORT = 8080;
const server = app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`Express app ready: GET / -> 'Hello World!'`);
  setTimeout(() => {
    server.close();
  }, 1200);
});

const http = require('http');

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    http.get(`http://127.0.0.1:${PORT}`, (clientRes) => {
      let data = '';
      clientRes.on('data', (chunk) => { data += chunk; });
      clientRes.on('end', () => {
        console.log(`Express server is active on port ${PORT}!`);
        console.log(`Response: ${data}`);
        process.exit(0);
      });
    });
  } else {
    console.error('Server error:', err);
  }
});
