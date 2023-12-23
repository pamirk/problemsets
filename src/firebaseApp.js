import firebase from "firebase/app";
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import 'firebase/functions';

const hostname = window.location.hostname;
const isPsetApp = hostname === "cs109psets.netlify.app";

// if you are at cs106a.stanford.edu, use that domain
// if you are at codeinplace.stanford.edu, use that domain
// otherwise, use the firebaseapp domain

let authDomain = "guia-cs109psets.firebaseapp.com";
if (isPsetApp) {
    authDomain = hostname;
}

export const firebaseConfig = {
    apiKey: "AIzaSyCnbk0pBaCjf7oI2Byz1hL9UlKrHhY207Q",
    authDomain: `${authDomain}`,
    databaseURL: "https://guia-cs109psets-default-rtdb.firebaseio.com",
    projectId: "guia-cs109psets",
    storageBucket: "guia-cs109psets.appspot.com",
    messagingSenderId: "281483229198",
    appId: "1:281483229198:web:66835fb4fee6be50d9645f",
    measurementId: "G-SXFTTQYK54",
};

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const database = firebase.database();
// const functions = firebase.functions()
const functions = firebase.app().functions('us-central1');
const auth = firebase.auth;

// eslint-disable-next-line no-restricted-globals
if (location.hostname === 'localhost') {
    // firestore.useEmulator('localhost', 8080);
    // debugger;
    // database.useEmulator('localhost', 9000);
    // functions.useEmulator("localhost", 5001);

    // auth().useEmulator('http://localhost:9099/', { disableWarnings: true });
}

export default firebase;
export {firestore, database, auth, functions};


