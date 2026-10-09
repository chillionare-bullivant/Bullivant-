// Object
const user = {
  name: process.argv[2] || 'Alice',
  age: process.argv[3] ? Number(process.argv[3]) : 25,
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
};

// Array
const defaultColors = ['red', 'green', 'blue'];
const colors = process.argv[4] ? process.argv[4].split(',').map(c => c.trim()) : defaultColors;

// Invoke object method
user.greet();

// Array methods (ES6+)
colors.forEach(color => console.log(color));
const lengths = colors.map(color => color.length);
console.log('Lengths: ' + JSON.stringify(lengths));
