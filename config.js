import firebase from 'firebase'

require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyBBwhyoXox9miDQ_xz_W7bCy2xh7rNDLEI",
    authDomain: "wily-2f052.firebaseapp.com",
    projectId: "wily-2f052",
    storageBucket: "wily-2f052.appspot.com",
    messagingSenderId: "569141500974",
    appId: "1:569141500974:web:9a2b2cddf167ce166e53bf"
};
  firebase.initializeApp(firebaseConfig);
  
  export default firebase.firestore();