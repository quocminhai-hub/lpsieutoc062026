"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }

      // Đăng nhập thành công, chuyển hướng đến Dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} glass-card`}>
        <div className={styles.logoHeader}>
          <div className={styles.logoDot} />
          SADOMA AI
        </div>
        <h2 className={styles.loginTitle}>Đăng nhập cổng học viên & quản trị</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email đăng nhập</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhapemail@luyenai.vn"
              className="input-field"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary ${styles.submitBtn} ${loading ? "btn-disabled" : ""}`}
          >
            {loading ? "ĐANG XÁC THỰC..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <Link href="/" className={styles.backHome}>
          ← Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
