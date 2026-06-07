"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationData, setRegistrationData] = useState(null);
  const [copied, setCopied] = useState(false);

  const pricingRef = useRef(null);

  const handleScrollToRegister = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã xảy ra lỗi đăng ký.");
      }

      setRegistrationData(data.registration);
      // Reset form
      setFormData({ name: "", email: "", phone: "" });
    } catch (err) {
      setError(err.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Không thể sao chép văn bản: ", err);
    }
  };

  const handleCloseModal = () => {
    setRegistrationData(null);
  };

  return (
    <div className={styles.landing}>
      {/* Header */}
      <header className={styles.header}>
        <div className={`${styles.headerContent} container`}>
          <div className={styles.logo}>
            <div className={styles.logoDot} />
            SADOMA AI
          </div>
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>Trang chủ</a>
            <a href="#register-section" onClick={(e) => { e.preventDefault(); handleScrollToRegister(); }} className={styles.navLink}>Khóa học</a>
            <a href="mailto:support@luyenai.io.vn" className={styles.navLink}>Liên hệ</a>
          </nav>
          <Link href="/login" className="btn btn-secondary">
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`${styles.heroContent} container`}>
          <div className={styles.badge}>Chương trình huấn luyện đặc biệt</div>
          <h1 className={styles.title}>
            Tự Tạo Landing Page Bán Hàng <br />
            <span className="gradient-text">Chuyển Đổi Cao Trong 60 Giây</span>
          </h1>
          <p className={styles.subtitle}>
            Không cần biết lập trình, không cần kỹ năng thiết kế. Học cách làm chủ công cụ AI để nhân bản doanh số bán hàng hoàn toàn tự động.
          </p>
          <button onClick={handleScrollToRegister} className="btn btn-primary" style={{ padding: "16px 36px", fontSize: "16px" }}>
            ĐẶT MUA NGAY - Giảm 95%
          </button>
        </div>
      </section>

      {/* Video Demo Mockup Section */}
      <div className="container">
        <div className={styles.videoFrameWrapper}>
          <div className={styles.videoRatio}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      {/* Course Highlights / Features */}
      <section className="container" style={{ paddingBottom: "80px" }}>
        <div className={styles.featuresGrid}>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>🚀</span>
            <h3 className={styles.featureTitle}>Dễ Dàng & Siêu Tốc</h3>
            <p className={styles.featureText}>Sử dụng sức mạnh AI của PageForge để sinh mã giao diện, tạo nội dung bán hàng chỉ trong nháy mắt.</p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>🎯</span>
            <h3 className={styles.featureTitle}>Chuyển Đổi Đỉnh Cao</h3>
            <p className={styles.featureText}>Thiết kế tối ưu UI/UX cho thị trường Việt Nam, thúc đẩy người mua hàng thanh toán nhanh qua VietQR.</p>
          </div>
          <div className={`${styles.featureCard} glass-card`}>
            <span className={styles.featureIcon}>🤖</span>
            <h3 className={styles.featureTitle}>Tự Động Hóa 100%</h3>
            <p className={styles.featureText}>Ghi thông tin học viên tự động vào Google Sheets, gửi email kích hoạt tài khoản lập tức khi thanh toán.</p>
          </div>
        </div>
      </section>

      {/* Pricing & Registration Section */}
      <section id="register-section" ref={pricingRef} className={styles.pricing}>
        <div className="container">
          <div className={styles.pricingHeader}>
            <h2 style={{ fontSize: "36px", marginBottom: "16px" }}>Sở Hữu Trọn Đời - Học Ngay Hôm Nay</h2>
            <p style={{ color: "var(--text-secondary)" }}>Đăng ký một lần, truy cập toàn bộ tài liệu khóa học và cập nhật trọn đời.</p>
          </div>

          <div className={`${styles.pricingCard} glass-card`}>
            <div className={styles.pricingBadge}>CƠ HỘI DUY NHẤT</div>
            <div className={styles.pricingCourseName}>SADOMA AI – GÓI PRO LIFETIME</div>
            
            <div className={styles.priceWrapper}>
              <span className={styles.oldPrice}>35.580.000đ</span>
              <span className={styles.newPrice}>1.490.000đ</span>
            </div>
            <p className={styles.priceNote}>
              Thanh toán một lần – sở hữu trọn đời. Chỉ <strong>4.700đ / ngày</strong> trong năm đầu.
            </p>

            <ul className={styles.benefitsList}>
              <li className={styles.benefitItem}>
                <span className={styles.checkIcon}>✓</span>
                Truy cập trọn đời tất cả tính năng SADOMA AI
              </li>
              <li className={styles.benefitItem}>
                <span className={styles.checkIcon}>✓</span>
                Tạo không giới hạn landing page bán hàng
              </li>
              <li className={styles.benefitItem}>
                <span className={styles.checkIcon}>✓</span>
                Tất cả 5 gói quà tặng đặc quyền trị giá 23.700.000đ
              </li>
              <li className={styles.benefitItem}>
                <span className={styles.checkIcon}>✓</span>
                Hỗ trợ ưu tiên 24/7 qua Zalo & email hỗ trợ học viên
              </li>
              <li className={styles.benefitItem}>
                <span className={styles.checkIcon}>✓</span>
                Cập nhật mọi tính năng mới miễn phí
              </li>
            </ul>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div style={{ color: "var(--error)", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" }}>
                  ⚠️ {error}
                </div>
              )}

              <div className={styles.formField}>
                <span className={styles.formIcon}>👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Họ và tên đầy đủ *"
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formField}>
                <span className={styles.formIcon}>✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Địa chỉ email nhận tài khoản *"
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formField}>
                <span className={styles.formIcon}>📞</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Số điện thoại liên hệ *"
                  className={styles.formInput}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary ${styles.submitBtn} ${loading ? "btn-disabled" : ""}`}
              >
                {loading ? "ĐANG GỬI THÔNG TIN..." : "ĐẶT MUA NGAY – Giảm 95% ➔"}
              </button>

              <div className={styles.formFooterNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Điền thông tin → Nhận QR chuyển khoản → Nhận tài khoản qua email trong 15 phút.
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerText}>© 2026 LuyenAI (SADOMA AI). All rights reserved.</p>
        </div>
      </footer>

      {/* VietQR Modal Popup */}
      {registrationData && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className={`${styles.qrModal} modal-content`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button className={styles.modalClose} onClick={handleCloseModal}>×</button>
              <div className={styles.modalStepBadge}>🔥 Bước cuối cùng</div>
              <h3 className={styles.modalTitle}>Quét QR để thanh toán</h3>
              <p className={styles.modalSubtitle}>Chuyển khoản để hoàn tất đặt mua – nhận tài khoản học ngay trong 15 phút</p>
            </div>

            <div className={styles.modalBody}>
              {/* QR Image */}
              <div className={styles.qrWrapper}>
                <img
                  src={`https://img.vietqr.io/image/MB-0913579509-compact2.png?amount=1490000&addInfo=${encodeURIComponent(registrationData.transferCode)}&accountName=PHU%20QUOC%20NAM`}
                  alt="VietQR MB Bank"
                  className={styles.qrImage}
                />
              </div>

              {/* Bank Details Table */}
              <div className={styles.bankDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Ngân hàng</span>
                  <span className={styles.detailVal}>MB Bank</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Số tài khoản</span>
                  <span className={styles.detailVal} style={{ letterSpacing: "1px" }}>0913 579 509</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Chủ tài khoản</span>
                  <span className={styles.detailVal}>PHU QUOC NAM</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Số tiền</span>
                  <span className={styles.detailVal} style={{ color: "var(--primary)", fontSize: "16px", fontWeight: "800" }}>1.490.000đ</span>
                </div>
                <div className={styles.detailRow} style={{ paddingBottom: 0 }}>
                  <span className={styles.detailLabel}>Nội dung chuyển khoản</span>
                  <div className={styles.detailValCopyable}>
                    <span>{registrationData.transferCode}</span>
                    <button
                      onClick={() => handleCopyText(registrationData.transferCode)}
                      className={styles.copyBtn}
                    >
                      {copied ? "Đã copy!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* User Registered Info Summary */}
              <div className={styles.summaryBox}>
                <div className={styles.summaryTitle}>Thông tin đăng ký của bạn:</div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryIcon}>👤</span>
                  <span className={styles.summaryVal}>Họ tên: <strong className={styles.summaryValHighlight}>{registrationData.name}</strong></span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryIcon}>✉️</span>
                  <span className={styles.summaryVal}>Email: <strong className={styles.summaryValHighlight}>{registrationData.email}</strong></span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryIcon}>📞</span>
                  <span className={styles.summaryVal}>Số ĐT: <strong className={styles.summaryValHighlight}>{registrationData.phone}</strong></span>
                </div>
              </div>

              {/* Guarantee footer */}
              <div className={styles.footerNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginTop: "3px" }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>
                  Sau khi chuyển khoản thành công, chúng tôi sẽ gửi tài khoản qua email <strong>{registrationData.email}</strong> trong vòng 15 phút.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
