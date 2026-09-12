import React, { useState } from 'react';
import { Typography, TextField, Stack, InputAdornment, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Email as EmailIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import toast from "react-hot-toast";
import { toastResetLink } from '../utils/toasts';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { validateEmail } from '../utils/validate';
import AuthSplitLayout from '../components/AuthSplitLayout';
import GradientButton from '../components/GradientButton';

const STEPS = ["Enter your email", "We'll send a secure link", "Set a new password"];

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toastResetLink();
    } catch (error) {
      toast.error("Failed to send reset link");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthSplitLayout
      image="/forgot.jpg"
      eyebrow="Account access"
      headline="Reset your password"
      tagline="A few quick steps and you'll be back to writing."
      highlights={[
        { title: "Secure by design", body: "Reset links are time-limited and tied to your email — only you can use them." },
        { title: "Never stored in plain text", body: "Your password is hashed; we can't see it and will never ask for it." },
        { title: "Back in minutes", body: "Follow the link in your inbox to choose a new password and pick up where you left off." },
      ]}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 0.5 }}>
        Reset Password
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        {sent
          ? "Check your inbox — a reset link is on its way."
          : "Enter your email and we'll send you a secure link to get back in."}
      </Typography>

      {!sent && (
        <form style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
          <TextField
            fullWidth
            label="Email Address"
            margin="normal"
            required
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            onBlur={() => setEmailError(validateEmail(email))}
            error={Boolean(emailError)}
            helperText={emailError}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <GradientButton type="submit" fullWidth disabled={isSending} sx={{ mt: 2.5, py: 1.35, fontSize: "1rem" }}>
            {isSending ? "Sending…" : "Send Reset Link"}
          </GradientButton>
        </form>
      )}

      {sent && (
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {STEPS.map((s, i) => (
              <Stack key={s} direction="row" spacing={1.5} alignItems="center">
                <CheckCircleIcon sx={{ color: "primary.main", fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: i === 0 ? "text.primary" : "text.secondary", fontWeight: i === 0 ? 700 : 500 }}>
                  {s}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <GradientButton fullWidth onClick={() => { setSent(false); setEmail(''); }} sx={{ py: 1.35 }}>
            Use a different email
          </GradientButton>
        </Box>
      )}

      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>Remembered it?</Typography>
        <RouterLink to="/login" style={{ textDecoration: "none" }}>
          <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700 }}>Back to login</Typography>
        </RouterLink>
      </Stack>
    </AuthSplitLayout>
  );
};

export default ForgotPassword;
