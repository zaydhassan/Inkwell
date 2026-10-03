import React from "react";
import { InkField, InkPrimaryButton, InkSectionHead, InkSurface } from "../ink";
import { validateEmail, validateMinLength, validatePassword } from "../../utils/validate";

/* ─────────────────────────────────────────────────────────────────────
   Section 6 — profile settings.

   The only plain `.ink-surface` on the page, and the narrowest section at
   760px: a form wants a short measure, and the two-column field grid under a
   760px cap is what makes it read as a settings panel rather than another
   content block.

   Validation is unchanged — the same helpers, fired on the same events as the
   previous MUI TextFields — so behaviour matches exactly. `InkField` renders a
   plain input plus a `role="alert"` error so a failed validation is announced,
   not just coloured.
   ───────────────────────────────────────────────────────────────────── */

const ProfileSettings = ({
  username,
  email,
  bio,
  password,
  errors,
  isUpdating,
  disabled,
  setUsername,
  setEmail,
  setBio,
  setPassword,
  setFieldError,
  onSubmit,
}) => (
  <section
    className="ink-profile-section ink-profile-section-narrow"
    aria-label="Profile settings"
  >
    <InkSectionHead
      eyebrow="Your details"
      title="Profile settings"
      size="compact"
      sx={{ mb: 3 }}
    />

    <InkSurface className="ink-profile-settings">
      {/* A real form, so Enter submits from any field; onSubmit calls the same
          handler the button always did. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="ink-profile-fields">
          <InkField
            label="Username"
            name="username"
            value={username}
            autoComplete="username"
            onChange={(e) => {
              setUsername(e.target.value);
              setFieldError("username", "");
            }}
            onBlur={() =>
              setFieldError("username", validateMinLength(username, 2, "Username"))
            }
            error={errors.username}
          />

          <InkField
            label="Email"
            name="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError("email", "");
            }}
            onBlur={() => setFieldError("email", validateEmail(email))}
            error={errors.email}
          />

          {/* Bio keeps its place in the original field order and takes the
              full width; free-form text has no natural half-column width. */}
          <InkField
            label="Bio"
            name="bio"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            sx={{ gridColumn: "1 / -1" }}
          />

          <InkField
            label="New password"
            name="password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldError("password", "");
            }}
            onBlur={() =>
              setFieldError(
                "password",
                password.trim()
                  ? validatePassword(password, { min: 8, required: false })
                  : ""
              )
            }
            error={errors.password}
            hint="Leave blank to keep your current password."
            sx={{ gridColumn: "1 / -1" }}
          />
        </div>

        <div className="ink-profile-form-actions">
          <InkPrimaryButton type="submit" disabled={disabled}>
            {isUpdating ? "Updating…" : "Update profile"}
          </InkPrimaryButton>
          <span className="ink-profile-form-note">
            Changes apply everywhere you appear on InkWell.
          </span>
        </div>
      </form>
    </InkSurface>
  </section>
);

export default ProfileSettings;
