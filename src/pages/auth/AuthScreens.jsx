import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import Field from "../../ui/Field";
import Logo from "../../ui/Logo";
import StatePanel from "../../ui/StatePanel";

/**
 * Authentication screens for the M2 design. They are design-only: nothing is
 * sent, checked, or stored. Credentials are never kept in component state.
 * Sign-in and the real authentication flow arrive with Keycloak in M3.
 */
const NOT_CONNECTED =
  "Authentication is not connected yet. It will be added with Keycloak in M3. Nothing you enter here is sent or stored.";

function AuthLayout({ title, intro, path, children }) {
  usePageMeta({ title, description: intro, path });
  return (
    <div className="flex min-h-[70vh] items-start justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="card mt-8 p-6 sm:p-8">
          <h1 className="display-title text-3xl">{title}</h1>
          {intro ? (
            <p className="mt-3 text-sm leading-6 text-body">{intro}</p>
          ) : null}
          <div className="mt-6 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SubmitNotice({ onSubmit, children }) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <button
        type="submit"
        className="btn-primary w-full"
        onClick={(event) => {
          event.preventDefault();
          setShown(true);
        }}
      >
        {children}
      </button>
      {shown ? (
        <StatePanel variant="info" title="Not available yet">
          {NOT_CONNECTED}
        </StatePanel>
      ) : null}
      {onSubmit ? null : null}
    </>
  );
}

export function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      intro="Sign in to your Manada account."
      path="/login"
    >
      <form
        aria-label="Sign in"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <Field label="Email address" required>
          <input
            className="field-input"
            type="email"
            name="email"
            autoComplete="username"
          />
        </Field>
        <Field label="Password" required>
          <input
            className="field-input"
            type="password"
            name="password"
            autoComplete="current-password"
          />
        </Field>
        <SubmitNotice>Sign in</SubmitNotice>
      </form>
      <p className="text-sm text-body">
        <Link to="/forgot-password" className="link-action">
          Forgot your password?
        </Link>
      </p>
      <p className="text-sm text-body">
        New customer?{" "}
        <Link to="/register" className="link-action">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      intro="Register as a customer to track quotations, orders and service requests."
      path="/register"
    >
      <form
        aria-label="Create an account"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <Field label="Full name" required>
          <input className="field-input" name="name" autoComplete="name" />
        </Field>
        <Field label="Email address" required>
          <input
            className="field-input"
            type="email"
            name="email"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone number" hint="Optional.">
          <input
            className="field-input"
            type="tel"
            name="phone"
            autoComplete="tel"
          />
        </Field>
        <Field label="Password" required hint="Use at least 12 characters.">
          <input
            className="field-input"
            type="password"
            name="password"
            autoComplete="new-password"
          />
        </Field>
        <SubmitNotice>Create account</SubmitNotice>
      </form>
      <p className="text-sm text-body">
        Already registered?{" "}
        <Link to="/login" className="link-action">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      intro="Enter your email address and we will send a reset link."
      path="/forgot-password"
    >
      <form
        aria-label="Reset password request"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <Field label="Email address" required>
          <input
            className="field-input"
            type="email"
            name="email"
            autoComplete="username"
          />
        </Field>
        <SubmitNotice>Send reset link</SubmitNotice>
      </form>
      <p className="text-sm text-body">
        <Link to="/login" className="link-action">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Verify your email"
      intro="We will send a verification link to the address you registered with."
      path="/verify-email"
    >
      <StatePanel variant="info" title="Check your inbox">
        Open the verification link in the email to activate your account.{" "}
        {NOT_CONNECTED}
      </StatePanel>
      <button type="button" disabled className="btn-secondary w-full">
        Resend verification email (available after M3)
      </button>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Choose a new password"
      intro="Enter a new password for your account."
      path="/reset-password"
    >
      <form
        aria-label="Choose a new password"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <Field label="New password" required hint="Use at least 12 characters.">
          <input
            className="field-input"
            type="password"
            name="password"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" required>
          <input
            className="field-input"
            type="password"
            name="confirm"
            autoComplete="new-password"
          />
        </Field>
        <SubmitNotice>Save new password</SubmitNotice>
      </form>
    </AuthLayout>
  );
}

export function MfaPage() {
  return (
    <AuthLayout
      title="Two-step verification"
      intro="Enter the six-digit code from your authenticator app."
      path="/mfa"
    >
      <form
        aria-label="Verification code"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <Field label="Verification code" required>
          <input
            className="field-input tracking-[0.4em]"
            inputMode="numeric"
            name="code"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </Field>
        <SubmitNotice>Verify</SubmitNotice>
      </form>
    </AuthLayout>
  );
}

export function SessionExpiredPage() {
  return (
    <AuthLayout title="Your session has expired" path="/session-expired">
      <StatePanel variant="info" title="Sign in again to continue">
        For your security, sessions end after a period of inactivity. Your
        unsaved changes may not be recoverable.
      </StatePanel>
      <Link to="/login" className="btn-primary w-full">
        Sign in again
      </Link>
    </AuthLayout>
  );
}

export function AccessDeniedPage() {
  return (
    <AuthLayout title="Access denied" path="/access-denied">
      <StatePanel
        variant="error"
        title="You do not have permission to view this page."
      >
        If you think this is a mistake, contact Manada.
      </StatePanel>
      <div className="flex flex-wrap gap-4">
        <Link to="/" className="btn-secondary">
          Homepage
        </Link>
        <Link to="/contact" className="link-action">
          Contact us
        </Link>
      </div>
    </AuthLayout>
  );
}
