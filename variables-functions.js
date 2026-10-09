// Variables (let, const, var)
let name = 'Node.js';
const version = 20;

// Function declaration
function greet(user) {
  return `Hello, ${user}!`; // Template literal (ES6)
}

// Arrow function (ES6+)
const add = (a, b) => a + b;

// Support optional CLI arguments for interactive runs while preserving default output
const targetUser = process.argv[2] || 'Developer';
const num1 = process.argv[3] !== undefined ? Number(process.argv[3]) : 5;
const num2 = process.argv[4] !== undefined ? Number(process.argv[4]) : 3;

console.log(greet(targetUser)); // Hello, Developer!
console.log(add(num1, num2)); // 8
