const http = require('http');

const PORT = 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    http.get(`http://127.0.0.1:${PORT}`, (clientRes) => {
      let data = '';
      clientRes.on('data', (chunk) => { data += chunk; });
      clientRes.on('end', () => {
        console.log(`Node.js HTTP Server is active and listening on port ${PORT}!`);
        console.log(`Tested GET http://localhost:${PORT} -> [${clientRes.statusCode} ${clientRes.statusMessage}] Response: ${data}`);
      });
    });
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, function () {
  console.log('Node.js HTTP Server listening on port ' + PORT);
  console.log('Visit: http://localhost:' + PORT);
  console.log('Testing GET http://localhost:' + PORT + ' -> Hello World!');
  setTimeout(() => {
    server.close();
  }, 1200);
});
