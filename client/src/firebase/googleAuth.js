import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { auth, googleProvider } from './firebaseConfig';
import { setAccessToken } from '../utils/auth';
import { authActions } from '../redux/store';

export const signInWithGoogle = async ({ dispatch, navigate, onError }) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    let data;
    try {
      const response = await axios.post('/api/v1/user/google', { idToken });
      data = response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Google sign-in failed. Please try again.';
      onError(message);
      return;
    }

    if (data.success) {
      
      setAccessToken(data.accessToken);
      localStorage.setItem('userId', data.user._id);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role);

      dispatch(authActions.login(data.user));

      const target = data.user.role === 'Admin' ? '/admin' : '/';
      navigate(target);
    } else {
      onError(data.message || 'Google sign-in failed. Please try again.');
    }
  } catch (err) {
   
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      onError('Google sign-in was cancelled.');
    } else if (code === 'auth/unauthorized-domain') {
      onError('This domain is not authorized for Google sign-in. Add it in the Firebase console.');
    } else {
      onError(err?.message || 'Google sign-in was cancelled or failed.');
    }
  }
};