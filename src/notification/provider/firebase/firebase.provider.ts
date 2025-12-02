import admin from 'firebase-admin';
import * as path from 'path';

// firebase.initializeApp({
//   credential: firebase.credential.cert(path.join('./firebase-admin-sdk.json')),
// });
admin.initializeApp({
  credential: admin.credential.cert(path.join('./firebase-admin-sdk.json')),
  // other config
});

export default admin;
