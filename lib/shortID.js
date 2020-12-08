// shortID.js
const charsetbase62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const charsetbase64 = '-_0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateRandomString = function(length, charset) {
  const base = charset.length;
  const maxInt = base ** length - 1;
  let value = generateRandomInt(maxInt);
  let result = [];
  while (value > 0) {
    result.push(charset[value % base]);
    value = Math.floor(value / base);
  }
  return result.join('');
};


const generateRandomInt = function(max) {
  return Math.floor(Math.random() * max);
};

module.exports = { charsetbase62, charsetbase64, generateRandomString, generateRandomInt };
