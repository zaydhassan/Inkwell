import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Typography, TextField, IconButton, InputAdornment, MenuItem, Stack, Divider, Box,
} from "@mui/material";
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon, Person as PersonIcon } from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";
import { validateEmail, validatePassword, validateMinLength, validateFields } from "../utils/validate";
import { toastRegister } from "../utils/toasts";
import AuthSplitLayout from "../components/AuthSplitLayout";
import GradientButton from "../components/GradientButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { signInWithGoogle } from "../firebase/googleAuth";
import { useDispatch } from "react-redux";
import { authActions } from "../redux/store";

// Presentational password-strength meter. Purely derived from the password
// string — no side effects, no logic impact on the form.
const strengthOf = (pw) => {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;
  const map = [
    { label: "Too short", color: "#9B98AD" },
    { label: "Weak", color: "#dc2626" },
    { label: "Fair", color: "#d97706" },
    { label: "Good", color: "#F59E0B" },
    { label: "Strong", color: "#16a34a" },
  ];
  return { score, ...map[score] };
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    password: "",
    role: "Reader"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const setFieldError = (field, msg) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Google sign-in is a one-step flow: it creates the account AND logs the
  // user in (unlike the email form, which redirects to /login), so on success
  // the user is navigated home by signInWithGoogle.
  const handleGoogle = () => {
    setIsGoogleLoading(true);
    signInWithGoogle({
      dispatch,
      navigate,
      onError: (message) => toast.error(message),
    }).finally(() => setIsGoogleLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Server Zod requires a username, valid email, and an 8+ char password.
    const found = validateFields(inputs, {
      name: (v) => validateMinLength(v, 2, "Name"),
      email: (v) => validateEmail(v),
      password: (v) => validatePassword(v, { min: 8 }),
    });
    setErrors(found || {});
    if (found) return;
    setIsSubmitting(true);
    try {
      const { data } = await axios.post("/api/v1/user/register", {
        username: inputs.name,
        email: inputs.email,
        password: inputs.password,
        role: inputs.role
      });
      if (data.success) {
        toastRegister();
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = strengthOf(inputs.password);

  return (
    <AuthSplitLayout
      image="/signup.jpg"
      eyebrow="Join Inkwell"
      headline="Create your account"
      tagline="Share your stories, follow writers, and join the conversation."
      highlights={[
        { title: "Write & publish", body: "A rich-text editor with dictation, drafts, tags, and one-click publish." },
        { title: "Earn rewards", body: "Gain points for every action, climb levels, and redeem real rewards." },
        { title: "A community of voices", body: "Follow writers, join discussions, and share your perspective with readers." },
      ]}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", mb: 0.5 }}>
        Register
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Start writing in under a minute — it's free.
      </Typography>

      <Box sx={{ width: "100%", mb: 1 }}>
        <GoogleSignInButton onClick={handleGoogle} loading={isGoogleLoading} label="Sign up with Google" />
      </Box>

      <Divider sx={{ my: 2.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>or</Typography>
      </Divider>

      <form style={{ width: "100%" }} onSubmit={handleSubmit}>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          required
          name="name"
          autoFocus
          value={inputs.name}
          onChange={(e) => { handleChange(e); setFieldError("name", ""); }}
          onBlur={() => setFieldError("name", validateMinLength(inputs.name, 2, "Name"))}
          error={Boolean(errors.name)}
          helperText={errors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Email Address"
          fullWidth
          margin="normal"
          required
          name="email"
          autoComplete="email"
          value={inputs.email}
          onChange={(e) => { handleChange(e); setFieldError("email", ""); }}
          onBlur={() => setFieldError("email", validateEmail(inputs.email))}
          error={Boolean(errors.email)}
          helperText={errors.email}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Password"
          fullWidth
          margin="normal"
          required
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={inputs.password}
          onChange={(e) => { handleChange(e); setFieldError("password", ""); }}
          onBlur={() => setFieldError("password", validatePassword(inputs.password, { min: 8 }))}
          error={Boolean(errors.password)}
          helperText={errors.password || "At least 8 characters."}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePassword} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Strength meter */}
        {inputs.password && (
          <Box sx={{ mt: 1.25, mb: 0.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {[1, 2, 3, 4].map((s) => (
                <Box
                  key={s}
                  sx={{
                    flex: 1,
                    height: 5,
                    borderRadius: 999,
                    bgcolor: strength.score >= s ? strength.color : "divider",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </Stack>
            {strength.label && (
              <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                Password strength: <Box component="span" sx={{ color: strength.color, fontWeight: 700 }}>{strength.label}</Box>
              </Typography>
            )}
          </Box>
        )}

        <TextField
          select
          label="Role"
          fullWidth
          required
          name="role"
          value={inputs.role}
          onChange={handleChange}
          margin="normal"
          helperText="Writers can publish blogs; Readers can read, like, and comment."
        >
          <MenuItem value="Reader">Reader</MenuItem>
          <MenuItem value="Writer">Writer</MenuItem>
        </TextField>

        <GradientButton type="submit" fullWidth disabled={isSubmitting} sx={{ mt: 2.5, py: 1.35, fontSize: "1rem" }}>
          {isSubmitting ? "Signing up…" : "Create Account"}
        </GradientButton>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>Already with us?</Typography>
        </Divider>

        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Typography variant="body2" sx={{ color: "text.secondary" }}>Already have an account?</Typography>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700 }}>Sign in</Typography>
          </Link>
        </Stack>
      </form>
    </AuthSplitLayout>
  );
};

export default Register;
