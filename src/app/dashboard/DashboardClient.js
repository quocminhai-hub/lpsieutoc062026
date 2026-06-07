"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

export default function DashboardClient({
  user,
  initialCourses = [],
  initialLectures = [],
  initialStudents = [],
  initialRegistrations = [],
}) {
  const router = useRouter();

  // 1. Data States (Admin & Student)
  const [courses, setCourses] = useState(initialCourses);
  const [lectures, setLectures] = useState(initialLectures);
  const [students, setStudents] = useState(initialStudents);
  const [registrations, setRegistrations] = useState(initialRegistrations);

  // 2. Active Course & Lecture selection (For watching videos)
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLecture, setSelectedLecture] = useState(null);

  // 3. Admin Form States
  const [courseForm, setCourseForm] = useState({ id: "", title: "", description: "" });
  const [lectureForm, setLectureForm] = useState({ id: "", title: "", description: "", videoUrl: "", courseId: "", order: "" });
  const [studentForm, setStudentForm] = useState({ name: "", email: "", password: "", selectedCourses: [] });

  // 4. UI Indicators
  const [loading, setLoading] = useState({ course: false, lecture: false, student: false, reload: false });
  const [errorMsg, setErrorMsg] = useState({ course: "", lecture: "", student: "" });
  const [successMsg, setSuccessMsg] = useState({ course: "", lecture: "", student: "" });

  // Initialize selected course and lecture
  useEffect(() => {
    if (courses.length > 0) {
      const firstCourse = courses[0];
      setSelectedCourseId(firstCourse.id);
      
      const courseLectures = lectures.filter(l => l.courseId === firstCourse.id);
      if (courseLectures.length > 0) {
        setSelectedLecture(courseLectures[0]);
      } else if (firstCourse.lectures && firstCourse.lectures.length > 0) {
        setSelectedLecture(firstCourse.lectures[0]);
      } else {
        setSelectedLecture(null);
      }
    }
  }, [courses]);

  // Set default courseId for lecture creation form
  useEffect(() => {
    if (courses.length > 0 && !lectureForm.courseId) {
      setLectureForm(prev => ({ ...prev, courseId: courses[0].id }));
    }
  }, [courses]);

  // Handle course selector change
  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    // Find the first lecture of the selected course
    const courseLectures = lectures.filter(l => l.courseId === courseId);
    if (courseLectures.length > 0) {
      setSelectedLecture(courseLectures[0]);
    } else {
      const courseObj = courses.find(c => c.id === courseId);
      if (courseObj && courseObj.lectures && courseObj.lectures.length > 0) {
        setSelectedLecture(courseObj.lectures[0]);
      } else {
        setSelectedLecture(null);
      }
    }
  };

  // Helper to parse YouTube URLs into proper embed URLs
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("embed/")) return url;
    
    let videoId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      return url; // fallback to raw
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

  // --- CRUD KHÓA HỌC (ADMIN) ---
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(prev => ({ ...prev, course: "" }));
    setSuccessMsg(prev => ({ ...prev, course: "" }));
    setLoading(prev => ({ ...prev, course: true }));

    if (!courseForm.title) {
      setErrorMsg(prev => ({ ...prev, course: "Tên khóa học là bắt buộc." }));
      setLoading(prev => ({ ...prev, course: false }));
      return;
    }

    try {
      const isEdit = !!courseForm.id;
      const url = "/api/admin/courses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi lưu khóa học.");

      if (isEdit) {
        setCourses(prev => prev.map(c => c.id === data.course.id ? { ...c, ...data.course } : c));
        setSuccessMsg(prev => ({ ...prev, course: "Cập nhật khóa học thành công!" }));
      } else {
        setCourses(prev => [data.course, ...prev]);
        setSuccessMsg(prev => ({ ...prev, course: "Tạo khóa học thành công!" }));
      }

      setCourseForm({ id: "", title: "", description: "" });
    } catch (err) {
      setErrorMsg(prev => ({ ...prev, course: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, course: false }));
    }
  };

  const handleEditCourse = (course) => {
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description || "",
    });
    setErrorMsg(prev => ({ ...prev, course: "" }));
    setSuccessMsg(prev => ({ ...prev, course: "" }));
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này? Mọi bài giảng và lượt học viên liên quan sẽ bị xóa!")) return;

    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa khóa học.");

      setCourses(prev => prev.filter(c => c.id !== id));
      // Nếu khóa học đang được chọn bị xóa, chọn lại khóa học đầu tiên còn lại
      if (selectedCourseId === id) {
        const remaining = courses.filter(c => c.id !== id);
        if (remaining.length > 0) {
          handleCourseChange(remaining[0].id);
        } else {
          setSelectedCourseId("");
          setSelectedLecture(null);
        }
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // --- CRUD BÀI GIẢNG (ADMIN) ---
  const handleLectureSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(prev => ({ ...prev, lecture: "" }));
    setSuccessMsg(prev => ({ ...prev, lecture: "" }));
    setLoading(prev => ({ ...prev, lecture: true }));

    if (!lectureForm.title || !lectureForm.videoUrl || !lectureForm.courseId) {
      setErrorMsg(prev => ({ ...prev, lecture: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc." }));
      setLoading(prev => ({ ...prev, lecture: false }));
      return;
    }

    try {
      const isEdit = !!lectureForm.id;
      const url = "/api/admin/lectures";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...lectureForm,
        order: lectureForm.order ? parseInt(lectureForm.order) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi lưu bài giảng.");

      if (isEdit) {
        setLectures(prev => prev.map(l => l.id === data.lecture.id ? { ...l, ...data.lecture } : l).sort((a, b) => a.order - b.order));
        setSuccessMsg(prev => ({ ...prev, lecture: "Cập nhật bài giảng thành công!" }));
      } else {
        setLectures(prev => [...prev, data.lecture].sort((a, b) => a.order - b.order));
        setSuccessMsg(prev => ({ ...prev, lecture: "Thêm bài giảng thành công!" }));
      }

      setLectureForm({ id: "", title: "", description: "", videoUrl: "", courseId: courses[0]?.id || "", order: "" });
    } catch (err) {
      setErrorMsg(prev => ({ ...prev, lecture: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, lecture: false }));
    }
  };

  const handleEditLecture = (lecture) => {
    setLectureForm({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description || "",
      videoUrl: lecture.videoUrl,
      courseId: lecture.courseId,
      order: lecture.order.toString(),
    });
    setErrorMsg(prev => ({ ...prev, lecture: "" }));
    setSuccessMsg(prev => ({ ...prev, lecture: "" }));
  };

  const handleDeleteLecture = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài giảng này không?")) return;

    try {
      const res = await fetch(`/api/admin/lectures?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa bài giảng.");

      setLectures(prev => prev.filter(l => l.id !== id));
      if (selectedLecture?.id === id) {
        setSelectedLecture(null);
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // --- QUẢN LÝ HỌC VIÊN (ADMIN) ---
  const handleStudentCheckboxChange = (courseId) => {
    setStudentForm(prev => {
      const isSelected = prev.selectedCourses.includes(courseId);
      const updated = isSelected
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId];
      return { ...prev, selectedCourses: updated };
    });
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(prev => ({ ...prev, student: "" }));
    setSuccessMsg(prev => ({ ...prev, student: "" }));
    setLoading(prev => ({ ...prev, student: true }));

    if (!studentForm.name || !studentForm.email) {
      setErrorMsg(prev => ({ ...prev, student: "Họ tên và Email là bắt buộc." }));
      setLoading(prev => ({ ...prev, student: false }));
      return;
    }

    try {
      const payload = {
        name: studentForm.name,
        email: studentForm.email,
        password: studentForm.password,
        courseIds: studentForm.selectedCourses,
      };

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi cấp tài khoản.");

      setSuccessMsg(prev => ({ ...prev, student: "Kích hoạt và gửi email tài khoản thành công!" }));
      setStudentForm({ name: "", email: "", password: "", selectedCourses: [] });
      
      // Tải lại danh sách học viên và đăng ký
      handleReloadData();
    } catch (err) {
      setErrorMsg(prev => ({ ...prev, student: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, student: false }));
    }
  };

  const handleApplyRegistration = (reg) => {
    setStudentForm({
      name: reg.name,
      email: reg.email,
      password: "",
      selectedCourses: courses.length > 0 ? [courses[0].id] : [],
    });
    setErrorMsg(prev => ({ ...prev, student: "" }));
    setSuccessMsg(prev => ({ ...prev, student: "" }));
    
    // Cuộn xuống khu vực quản lý học viên
    document.getElementById("admin-student-manager")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản học viên này?")) return;

    try {
      const res = await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa học viên.");

      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  // Tải lại dữ liệu (Refresh học viên & đăng ký)
  const handleReloadData = async () => {
    setLoading(prev => ({ ...prev, reload: true }));
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải lại dữ liệu:", err);
    } finally {
      setLoading(prev => ({ ...prev, reload: false }));
    }
  };

  // Get active course object
  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  // Filter lectures of current selected course
  const activeLectures = lectures.filter(l => l.courseId === selectedCourseId);

  return (
    <div className={styles.dashboard}>
      {/* Navigation Header */}
      <header className={styles.header}>
        <div className={`${styles.headerContent} container`}>
          <div className={styles.logoArea}>
            <div className={styles.logoDot} />
            SADOMA AI
          </div>
          <div className={styles.userArea}>
            <span className={user.role === "ADMIN" ? styles.roleBadge : styles.studentBadge}>
              {user.role === "ADMIN" ? "ADMINISTRATOR" : "HỌC VIÊN"}
            </span>
            <span className={styles.userName}>Xin chào, {user.name}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className={`${styles.layout} container`}>
        {/* Left Sidebar: Course & Lessons Selection */}
        <div className={styles.sidebar}>
          {/* Select Course Card */}
          <div className={styles.sidebarCard}>
            <h4 className={styles.sidebarTitle}>
              <span>📁</span> CHỌN KHÓA HỌC
            </h4>
            {courses.length > 0 ? (
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className={styles.courseSelector}
              >
                {courses.map((course) => {
                  const count = lectures.filter((l) => l.courseId === course.id).length;
                  return (
                    <option key={course.id} value={course.id}>
                      {course.title} ({count} bài học)
                    </option>
                  );
                })}
              </select>
            ) : (
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Không có khóa học nào.</div>
            )}
          </div>

          {/* Lessons List Card */}
          <div className={styles.sidebarCard} style={{ flex: 1 }}>
            <h4 className={styles.sidebarTitle}>
              <span>📖</span> DANH SÁCH BÀI HỌC ({activeLectures.length})
            </h4>
            <div className={styles.lectureList}>
              {activeLectures.length > 0 ? (
                activeLectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => setSelectedLecture(lecture)}
                    className={`${styles.lectureItem} ${selectedLecture?.id === lecture.id ? styles.lectureItemActive : ""}`}
                  >
                    <span className={styles.lectureNumber}>Bài {lecture.order}:</span>
                    <span>{lecture.title}</span>
                  </button>
                ))
              ) : (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "12px" }}>
                  Chưa có bài học nào trong khóa học này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Column */}
        <div className={styles.mainContent}>
          {/* Lecture Video Player Section */}
          <section className={styles.videoSection}>
            {selectedLecture ? (
              <>
                <div className={styles.videoContainer}>
                  <iframe
                    src={getYouTubeEmbedUrl(selectedLecture.videoUrl)}
                    title={selectedLecture.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className={styles.lectureDetails}>
                  <h2 className={styles.lectureTitle}>{selectedLecture.title}</h2>
                  <p className={styles.lectureDesc}>
                    {selectedLecture.description || "Bài học này chưa có phần giới thiệu thêm."}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "360px", padding: "40px", textAlign: "center" }}>
                <span style={{ fontSize: "48px", marginBottom: "20px" }}>📺</span>
                <h3>Chọn một bài học từ menu bên trái để bắt đầu học</h3>
                <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
                  Vui lòng chọn bài giảng để hiển thị trình phát video.
                </p>
              </div>
            )}
          </section>

          {/* ADMIN MANAGEMENT SECTIONS */}
          {user.role === "ADMIN" && (
            <>
              {/* ADMIN Course Manager */}
              <section className={styles.adminCard}>
                <h3 className={styles.adminSectionTitle}>
                  <span>⚙️</span> Quản lý Khóa Học (Admin)
                </h3>
                <div className={styles.adminSplit}>
                  {/* Create Course Form */}
                  <form onSubmit={handleCourseSubmit} className={styles.adminForm}>
                    <h4 className={styles.adminFormTitle}>
                      {courseForm.id ? "Cập Nhật Khóa Học" : "Tạo Khóa Học Mới"}
                    </h4>
                    
                    {errorMsg.course && <div style={{ color: "var(--error)", fontSize: "12px", marginBottom: "12px" }}>⚠️ {errorMsg.course}</div>}
                    {successMsg.course && <div style={{ color: "var(--success)", fontSize: "12px", marginBottom: "12px" }}>✓ {successMsg.course}</div>}

                    <div className="form-group">
                      <label className="form-label">Tên khóa học *</label>
                      <input
                        type="text"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Nhập tên khóa học..."
                        className="input-field"
                        style={{ padding: "10px" }}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label">Mô tả ngắn</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Mô tả tóm tắt nội dung..."
                        className="input-field"
                        style={{ padding: "10px", resize: "vertical", height: "80px" }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading.course}
                      className={`btn btn-primary ${styles.formSubmitBtn}`}
                    >
                      {loading.course ? "Đang xử lý..." : courseForm.id ? "Cập nhật" : "Tạo khóa học"}
                    </button>
                    {courseForm.id && (
                      <button
                        type="button"
                        onClick={() => setCourseForm({ id: "", title: "", description: "" })}
                        className="btn btn-secondary"
                        style={{ width: "100%", padding: "8px", fontSize: "12px", marginTop: "8px" }}
                      >
                        Hủy bỏ
                      </button>
                    )}
                  </form>

                  {/* Courses List Table */}
                  <div className={styles.tableContainer}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "60px" }}>STT</th>
                          <th>TÊN KHÓA HỌC</th>
                          <th style={{ width: "100px" }}>HÀNH ĐỘNG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length > 0 ? (
                          courses.map((course, idx) => {
                            const count = lectures.filter((l) => l.courseId === course.id).length;
                            return (
                              <tr key={course.id}>
                                <td>{idx + 1}</td>
                                <td style={{ fontWeight: "600" }}>
                                  {course.title}
                                  <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: "600", color: "var(--primary)", background: "rgba(255, 107, 0, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                    {count} bài giảng
                                  </span>
                                  {course.description && (
                                    <div style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-muted)", marginTop: "4px" }}>
                                      {course.description}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div className={styles.actions}>
                                    <button
                                      onClick={() => handleEditCourse(course)}
                                      className={`${styles.actionBtn} ${styles.actionEdit}`}
                                      title="Chỉnh sửa"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCourse(course.id)}
                                      className={`${styles.actionBtn} ${styles.actionDelete}`}
                                      title="Xóa"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                              Chưa có khóa học nào được tạo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ADMIN Lecture Manager */}
              <section className={styles.adminCard}>
                <h3 className={styles.adminSectionTitle}>
                  <span>⚙️</span> Quản lý Bài Giảng (Admin)
                </h3>
                <div className={styles.adminSplit}>
                  {/* Create Lecture Form */}
                  <form onSubmit={handleLectureSubmit} className={styles.adminForm}>
                    <h4 className={styles.adminFormTitle}>
                      {lectureForm.id ? "Cập Nhật Bài Giảng" : "Thêm Bài Giảng Mới"}
                    </h4>

                    {errorMsg.lecture && <div style={{ color: "var(--error)", fontSize: "12px", marginBottom: "12px" }}>⚠️ {errorMsg.lecture}</div>}
                    {successMsg.lecture && <div style={{ color: "var(--success)", fontSize: "12px", marginBottom: "12px" }}>✓ {successMsg.lecture}</div>}

                    <div className="form-group">
                      <label className="form-label">Chọn khóa học *</label>
                      <select
                        value={lectureForm.courseId}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, courseId: e.target.value }))}
                        className={styles.courseSelector}
                        required
                      >
                        {courses.map((c) => {
                          const count = lectures.filter((l) => l.courseId === c.id).length;
                          return (
                            <option key={c.id} value={c.id}>
                              {c.title} ({count} bài giảng)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tên bài giảng *</label>
                      <input
                        type="text"
                        value={lectureForm.title}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Bài 1: Tổng quan về..."
                        className="input-field"
                        style={{ padding: "10px" }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Link video / Embed URL *</label>
                      <input
                        type="url"
                        value={lectureForm.videoUrl}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="input-field"
                        style={{ padding: "10px" }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Thứ tự hiển thị (Order)</label>
                      <input
                        type="number"
                        value={lectureForm.order}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, order: e.target.value }))}
                        placeholder="VD: 1, 2, 3..."
                        className="input-field"
                        style={{ padding: "10px" }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label">Mô tả ngắn (Không bắt buộc)</label>
                      <textarea
                        value={lectureForm.description}
                        onChange={(e) => setLectureForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Nội dung bài học..."
                        className="input-field"
                        style={{ padding: "10px", resize: "vertical", height: "80px" }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading.lecture}
                      className={`btn btn-primary ${styles.formSubmitBtn}`}
                    >
                      {loading.lecture ? "Đang xử lý..." : lectureForm.id ? "Cập nhật" : "Thêm bài giảng"}
                    </button>
                    {lectureForm.id && (
                      <button
                        type="button"
                        onClick={() => setLectureForm({ id: "", title: "", description: "", videoUrl: "", courseId: courses[0]?.id || "", order: "" })}
                        className="btn btn-secondary"
                        style={{ width: "100%", padding: "8px", fontSize: "12px", marginTop: "8px" }}
                      >
                        Hủy bỏ
                      </button>
                    )}
                  </form>

                  {/* Lectures List Table */}
                  <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                      <span className={styles.tableTitle}>
                        Danh sách bài giảng thuộc khóa đang chọn ({lectures.filter(l => l.courseId === lectureForm.courseId).length})
                      </span>
                    </div>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th style={{ width: "60px" }}>STT</th>
                          <th style={{ width: "150px" }}>KHÓA HỌC</th>
                          <th>TÊN BÀI GIẢNG</th>
                          <th>LINK VIDEO</th>
                          <th style={{ width: "100px" }}>HÀNH ĐỘNG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lectures.filter(l => l.courseId === lectureForm.courseId).length > 0 ? (
                          lectures.filter(l => l.courseId === lectureForm.courseId).map((lecture, idx) => (
                            <tr key={lecture.id}>
                              <td>{lecture.order}</td>
                              <td style={{ color: "var(--text-secondary)", fontWeight: "500" }}>{lecture.course?.title || courses.find(c => c.id === lecture.courseId)?.title || "Chưa phân loại"}</td>
                              <td style={{ fontWeight: "600" }}>{lecture.title}</td>
                              <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                                  {lecture.videoUrl}
                                </a>
                              </td>
                              <td>
                                <div className={styles.actions}>
                                  <button
                                    onClick={() => handleEditLecture(lecture)}
                                    className={`${styles.actionBtn} ${styles.actionEdit}`}
                                    title="Chỉnh sửa"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLecture(lecture.id)}
                                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                                    title="Xóa"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                              Khóa học này chưa có bài giảng nào. Hãy thêm bài giảng mới ở form bên cạnh.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ADMIN Student / Accounts Manager */}
              <section id="admin-student-manager" className={styles.adminCard}>
                <h3 className={styles.adminSectionTitle}>
                  <span>⚙️</span> Quản lý Học Viên (Admin)
                </h3>
                <div className={styles.adminSplit}>
                  {/* Create / Grant Student Form */}
                  <form onSubmit={handleStudentSubmit} className={styles.adminForm}>
                    <h4 className={styles.adminFormTitle}>Cấp Tài Khoản</h4>

                    {errorMsg.student && <div style={{ color: "var(--error)", fontSize: "12px", marginBottom: "12px" }}>⚠️ {errorMsg.student}</div>}
                    {successMsg.student && <div style={{ color: "var(--success)", fontSize: "12px", marginBottom: "12px" }}>✓ {successMsg.student}</div>}

                    <div className="form-group">
                      <label className="form-label">Họ và tên *</label>
                      <input
                        type="text"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Họ tên học viên..."
                        className="input-field"
                        style={{ padding: "10px" }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email đăng nhập *</label>
                      <input
                        type="email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="input-field"
                        style={{ padding: "10px" }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mật khẩu cấp (Trống = Sinh ngẫu nhiên)</label>
                      <input
                        type="text"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mật khẩu đăng nhập..."
                        className="input-field"
                        style={{ padding: "10px" }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label">Cho phép xem khóa học:</label>
                      <div className={styles.checkboxGroup}>
                        {courses.map((course) => (
                          <label key={course.id} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={studentForm.selectedCourses.includes(course.id)}
                              onChange={() => handleStudentCheckboxChange(course.id)}
                            />
                            <span>{course.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading.student}
                      className={`btn btn-primary ${styles.formSubmitBtn}`}
                    >
                      {loading.student ? "Đang xử lý..." : "Cấp tài khoản & Gửi Mail"}
                    </button>
                  </form>

                  {/* Registered Wait List & Active Students List Tab */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Wait List (Registrations from Landing page) */}
                    <div>
                      <div className={styles.tableHeader}>
                        <span className={styles.tableTitle} style={{ color: "var(--primary)" }}>DANH SÁCH ĐĂNG KÝ MỚI (CHỜ PHÊ DUYỆT)</span>
                        <button onClick={handleReloadData} disabled={loading.reload} className={styles.refreshBtn}>
                          {loading.reload ? "Đang tải..." : "🔄 Tải lại"}
                        </button>
                      </div>
                      <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                          <thead>
                            <tr>
                              <th>HỌ TÊN</th>
                              <th>EMAIL</th>
                              <th>SĐT</th>
                              <th>MÃ CK (VIETQR)</th>
                              <th>TRẠNG THÁI</th>
                              <th>THAO TÁC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrations.length > 0 ? (
                              registrations.map((reg) => (
                                <tr key={reg.id}>
                                  <td style={{ fontWeight: "600" }}>{reg.name}</td>
                                  <td>{reg.email}</td>
                                  <td>{reg.phone}</td>
                                  <td style={{ fontFamily: "monospace", color: "var(--primary)", fontWeight: "bold" }}>{reg.transferCode}</td>
                                  <td>
                                    <span className={`${styles.statusBadge} ${reg.status === "PENDING" ? styles.statusPending : styles.statusCompleted}`}>
                                      {reg.status === "PENDING" ? "Chờ duyệt" : "Đã duyệt"}
                                    </span>
                                  </td>
                                  <td>
                                    {reg.status === "PENDING" ? (
                                      <button
                                        onClick={() => handleApplyRegistration(reg)}
                                        className="btn btn-primary"
                                        style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px" }}
                                      >
                                        Duyệt & Cấp
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Đã cấp TK</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                  Chưa có đăng ký mới nào.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Active Student List */}
                    <div>
                      <div className={styles.tableHeader}>
                        <span className={styles.tableTitle}>DANH SÁCH TÀI KHOẢN HỌC VIÊN ({students.length})</span>
                      </div>
                      <div className={styles.tableContainer}>
                        <table className={styles.adminTable}>
                          <thead>
                            <tr>
                              <th>HỌ TÊN</th>
                              <th>EMAIL</th>
                              <th>KHÓA HỌC ĐƯỢC HỌC</th>
                              <th>NGÀY TẠO</th>
                              <th style={{ width: "80px" }}>HÀNH ĐỘNG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.length > 0 ? (
                              students.map((student) => (
                                <tr key={student.id}>
                                  <td style={{ fontWeight: "600" }}>{student.name}</td>
                                  <td>{student.email}</td>
                                  <td>
                                    {student.enrollments && student.enrollments.length > 0 ? (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {student.enrollments.map((en) => (
                                          <span
                                            key={en.courseId}
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", fontSize: "10.5px" }}
                                          >
                                            {en.course?.title}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>Không có khóa học</span>
                                    )}
                                  </td>
                                  <td>{new Date(student.createdAt).toLocaleDateString("vi-VN")}</td>
                                  <td>
                                    <div className={styles.actions}>
                                      <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className={`${styles.actionBtn} ${styles.actionDelete}`}
                                        title="Xóa học viên"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                  Chưa có tài khoản học viên nào được cấp.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
