// Polyfill global.crypto.getRandomValues for React Native / Expo before loading CryptoJS
if (typeof global.crypto !== 'object') {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = function (array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

import { registerRootComponent } from 'expo';
import App from './app/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
