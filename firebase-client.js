// Firebase web configuration is public, not an administrator credential.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import {getFunctions} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js';
export const app=initializeApp({apiKey:'AIzaSyBYj2j9eB9QN4_IBzK7uIN_AA5430DM-2s',authDomain:'malsseum-mundap.firebaseapp.com',projectId:'malsseum-mundap',appId:'1:549420840535:web:39da8edc1810c7bac55512'});
export const functions=getFunctions(app,'asia-northeast3');
