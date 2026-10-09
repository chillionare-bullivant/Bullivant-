// Destructuring & Template Literals (ES6+)
const user = {
  name: 'Alice',
  age: 25,
  role: 'Node.js Developer'
};

// Object destructuring
const { name, age } = user;
console.log(`Hello, ${name}! You are ${age} years old.`);

// Array destructuring
const colors = ['red', 'green', 'blue'];
const [primaryColor, secondaryColor] = colors;
console.log(`Primary color: ${primaryColor}, Secondary color: ${secondaryColor}`);

// Key JavaScript Concept: Error Handling (try/catch)
console.log('\n--- Error Handling (try/catch) ---');
try {
  console.log('Attempting risky operation (JSON parsing)...');
  const parsed = JSON.parse('{"valid": true, "engine": "V8"}');
  console.log('Success:', parsed.engine);
  
  // Demonstrating error interception
  JSON.parse('invalid json payload');
} catch (err) {
  console.log('Caught expected error cleanly:', err.message);
}

// Key JavaScript Concept: Modules
console.log('\n--- Modules & Environment ---');
console.log('Module system: CommonJS (require/exports) & ES6 Modules (import/export)');
console.log(`Node.js Architecture: Single-threaded event loop powered by libuv & V8`);
