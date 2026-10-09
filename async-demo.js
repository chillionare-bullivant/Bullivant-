// Asynchronous JavaScript

// 1. Callbacks (traditional)
function fetchData(callback) {
  setTimeout(() => {
    callback('Data received!');
  }, 200);
}

// 2. Promises (ES6+)
const fetchDataPromise = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve('Promise resolved!'), 200);
  });
};

// 3. Async/Await (ES8+)
async function getData() {
  console.log('1. Starting callback demonstration...');
  fetchData((data) => {
    console.log('Callback output:', data);
  });

  console.log('2. Awaiting promise using async/await...');
  const result = await fetchDataPromise();
  console.log('Async/Await output:', result);
  console.log('3. All asynchronous tasks completed.');
}

getData(); // Call the async function
