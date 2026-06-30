"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Za-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", color: "red" };
    if (score === 2) return { label: "Medium", color: "orange" };
    return { label: "Strong", color: "green" };
  };

  const strength = getStrength(password);

  const validatePassword = (password: string) => {
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    if (!/[A-Za-z]/.test(password)) throw new Error("Password must contain a letter");
    if (!/[0-9]/.test(password)) throw new Error("Password must contain a number");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password))
      throw new Error("Password must contain a special character");
    if (/\s/.test(password)) throw new Error("Password cannot contain spaces");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      validatePassword(password);

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Password updated successfully. You can now log in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Reset Password</h1>

        {message && <p className="mb-4 text-green-600">{message}</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            className="w-full px-4 py-2 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {password && (
            <p className="text-sm font-semibold" style={{ color: strength.color }}>
              Strength: {strength.label}
            </p>
          )}

          <ul className="text-sm text-gray-600 space-y-1">
            <li>• At least 8 characters</li>
            <li>• At least one letter</li>
            <li>• At least one number</li>
            <li>• At least one special symbol (!@#$%^&*)</li>
            <li>• No spaces</li>
          </ul>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg"
          >
            Update password
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/auth/login" className="text-blue-600">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
