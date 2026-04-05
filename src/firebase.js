import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCWQjPxTQVZommvZxGNkdTISuCoDZBpOFk',
  authDomain: 'here-f59e1.firebaseapp.com',
  projectId: 'here-f59e1',
  storageBucket: 'here-f59e1.firebasestorage.app',
  messagingSenderId: '639244939779',
  appId: '1:639244939779:web:33161b22e9fe3d54771436',
  measurementId: 'G-7Z2HVQ1MM7',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
