# Tong hop chinh sua - ATVSLĐ Platform
# Ngay: 2026-04-27

---

## 1. BREADCRUMB NAVIGATION (thay nut Back)

**Muc tieu:** Thay vi nut "Quay lai", hien duong dan tieu de de nguoi dung biet dang o page nao
va co the click de dieu huong len cap tren.

**File moi:**
- `antoanlaodongfe/src/components/common/Breadcrumb.tsx` — component Breadcrumb su dung MUI Breadcrumbs,
  map route path sang label (e.g. `/admin/courses/abc` → "Trang chu > Quan ly khoa hoc > Chinh sua")

**File sua doi:**
- `antoanlaodongfe/src/components/layout/AppLayout.tsx` — them `<Breadcrumb />` tren moi page trong layout

**Loai bo nut Back (ArrowBack) khoi 14 page:**
- `src/pages/admin/templates/TemplateCreatePage.tsx`
- `src/pages/admin/templates/TemplateEditPage.tsx`
- `src/pages/admin/templates/TemplateDetailPage.tsx`
- `src/pages/admin/exams/ExamDetailPage.tsx`
- `src/pages/admin/exams/ExamSubmissionsPage.tsx`
- `src/pages/admin/exams/ExamGeneratePage.tsx`
- `src/pages/admin/questions/QuestionDetailPage.tsx`
- `src/pages/admin/courses/CourseDetailPage.tsx`
- `src/pages/admin/courses/CourseDetailEditPage.tsx`
- `src/pages/admin/documents/DocumentDetailPage.tsx`
- `src/pages/admin/rooms/RoomDetailPage.tsx`
- `src/pages/exams/ExamResultPage.tsx`
- `src/pages/study/CourseStudyPage.tsx`
- `src/pages/forum/ForumTopicPage.tsx`

---

## 2. HIEN SO CAU HOI TOI DA TRONG PHAN BO DE THI

**Muc tieu:** Khi tao mau de thi, admin nhin thay so cau hoi co san trong ngan hang theo bo loc
(chu de, loai cau hoi, muc do) de biet gioi han truoc khi dien so cau.

**Backend:**
- `antoanlaodongbe/app/api/questions.py` — them endpoint `GET /questions/count` tra ve `{total: N}`
  theo cac filter: question_type, difficulty, occupation, topic_tag, status

**Frontend:**
- `antoanlaodongfe/src/api/questionApi.ts` — them `getCount(params)`
- `antoanlaodongfe/src/components/exam/DistributionEditor.tsx` — them cot "Co san" hien Chip xanh (du)
  hoac do (thieu), tu dong fetch theo tung dong phan bo

---

## 3. DUYET KY THI (THEM EXAM VAO HOP DUYET)

**Muc tieu:** Ky thi (Exam) sau khi tao tu mau de se o trang thai PENDING_REVIEW,
can duoc duyet moi hien thi chinh thuc. Them vao Hop duyet.

**Backend:**
- `antoanlaodongbe/app/models/exam.py` — them truong `status: ApprovalStatus = PENDING_REVIEW`
- `antoanlaodongbe/app/api/approvals.py` — them type `"exam"` vao PendingType, inbox lay exams pending,
  them handler approve/reject exam trong `_set_status`
- `antoanlaodongbe/app/api/exams.py` — them param `status` vao `list_exams`, include `status` vao response
- `antoanlaodongbe/app/services/exam_service.py` — them `status` filter vao `get_exams`;
  auto-set `status = APPROVED` khi sinh exam tu template da duyet
- `antoanlaodongbe/app/schemas/exam_schemas.py` — them `status` vao ExamResponse va ExamDetailResponse

**Frontend:**
- `antoanlaodongfe/src/api/approvalApi.ts` — them `'exam'` vao PendingType
- `antoanlaodongfe/src/pages/admin/approvals/ApprovalInboxPage.tsx` — them tab "Bai thi", icon, link
- `antoanlaodongfe/src/types/exam.ts` — them `status: ApprovalStatus` vao ExamResponse, ExamDetailResponse,
  va ExamListFilters

---

## 4. COURSE LIST PAGE — LOC & NHOM THEO NGANH NGHE + TAI LIEU NGUON

**Muc tieu:** Nhom khoa hoc theo `occupation` dang Accordion co the mo/rong;
them bo loc "Tai lieu nguon" va hien ten tai lieu duoi ten khoa hoc.

**Backend:**
- `antoanlaodongbe/app/schemas/course_schemas.py` — them `source_document_ids`, `source_document_names`
  vao CourseListResponse
- `antoanlaodongbe/app/api/courses.py` — `list_courses` them param `source_document_id`, resolve doc IDs
  sang ten tai lieu (cache de tranh query trung)
- `antoanlaodongbe/app/services/course_service.py` — them `source_document_id` filter vao `get_courses`

**Frontend:**
- `antoanlaodongfe/src/api/courseApi.ts` — them `source_document_names`, `source_document_id` filter
- `antoanlaodongfe/src/pages/admin/courses/CourseListPage.tsx` —
  - Nhom khoa hoc theo `occupation` dang Accordion (co icon, badge dem so luong)
  - Them dropdown "Tai lieu nguon", fetch danh sach tai lieu
  - Hien ten tai lieu duoi ten khoa hoc trong bang

---

## 5. QUESTION LIST PAGE — LOC THEO TAI LIEU NGUON

**Muc tieu:** Them bo loc "Tai lieu nguon" va hien ten tai lieu nguoc cau hoi duoc tao ra.

**Backend:**
- `antoanlaodongbe/app/schemas/question_schemas.py` — them `source_document_ids`, `source_document_names`
  vao QuestionListResponse
- `antoanlaodongbe/app/api/questions.py` — `list_questions` them param `source_document_id`, resolve doc IDs
  sang ten tai lieu
- `antoanlaodongbe/app/services/question_service.py` — them `source_document_id` filter vao `get_questions`

**Frontend:**
- `antoanlaodongfe/src/api/questionApi.ts` — them `source_document_names`, `source_document_id` filter
- `antoanlaodongfe/src/pages/admin/questions/QuestionListPage.tsx` — them dropdown "Tai lieu nguon",
  hien ten tai lieu trong cot Nghe/Bac

---

## 6. EXAM ROOMS — LOC THEO TRANG THAI DUYET

**Muc tieu:** Dropdown chon phong thi/ky thi chi hien item da duyet (`approval_status = approved`).

**Backend:**
- `antoanlaodongbe/app/api/exam_periods.py` — them param `approval_status` vao `list_rooms`
- `antoanlaodongbe/app/services/exam_period_service.py` — them filter `approval_status` vao `list_rooms()`

**Frontend:**
- `antoanlaodongfe/src/api/examRoomApi.ts` — them `approval_status` vao `ExamRoomListFilters`
- `antoanlaodongfe/src/pages/admin/rooms/RoomFormPage.tsx` — loc exams dropdown theo `status: 'approved'`

---

## 7. TIMEZONE GMT+7 (Asia/Ho_Chi_Minh)

**Muc tieu:** Tat ca thoi gian phong thi / ky thi hien thi dung Gio Viet Nam (GMT+7),
bat ke trinh duyet dang o muc timezone nao.

**File sua doi:**
- `antoanlaodongfe/src/main.tsx` — config dayjs timezone global:
  `dayjs.extend(utc)`; `dayjs.extend(tz)`; `dayjs.tz.setDefault('Asia/Ho_Chi_Minh')`
- `antoanlaodongfe/src/utils/formatters.ts` — dung `.tz(VN_TZ)` thay vi `.local()`
  cho `formatDate()` / `formatDateTime()`
- `antoanlaodongfe/src/pages/admin/rooms/RoomFormPage.tsx` — `toLocal` / `fromLocal`
  dung `dayjs.tz(VN_TZ)` chuyen doi
- `antoanlaodongfe/src/pages/admin/rooms/RoomDetailPage.tsx` — hien thi ngay gio phong thi theo GMT+7
- `antoanlaodongfe/src/utils/roomStatusHelper.ts` — so sanh thoi gian theo GMT+7
  cho trang thai phong thi

---

## 8. LOAI BO BAI THI TAY NGHE (Practical Exam)

**Muc tieu:** Xoa bo tham chieu den "bai thi tay nghe" / `practical_pass` khoi codebase.

**File sua doi:**
- `antoanlaodongfe/src/pages/AchievementsPage.tsx` — bo label `practical_pass`
- `antoanlaodongbe/app/services/gamification_service.py` — bo `practical_pass` khoi `POINTS_FOR`

---

## 9. CAI THIEN CHAM DIEM TU LUAN (Essay Grading)

**Muc tieu:** Cham diem cau hoi `scenario_based` (tu luan / tinh huong) chinh xac hon
voi chuan hoa tieng Viet va nhieu chien luoc danh gia.

**File sua doi:**
- `antoanlaodongbe/app/services/exam_service.py` —
  - Them `_normalize_vi_text()`: chuan hoa van ban tieng Viet (bo dau, lowercase, collapse whitespace)
  - Them `_grade_essay_answer()`: 3 chien luoc cham diem:
    1. **Key-point matching** — correct_answer phan tach boi `|`, dem so key-point xuat hien trong cau tra loi
    2. **Jaccard overlap + Recall** — do tuong dong tu vung giua cau tra loi va dap an, ket hop precision va recall
    3. **Substring match** — neu cau tra loi chua dap an (hoặc nguoc lai), cho 50% diem
  - Cap nhat `submit_exam()` dung `_grade_essay_answer()` thay vi `split("|")` don gian

---

## CONG THONG KE

| Loai thay doi | So file |
|---|---|
| Backend Python (BE) | 14 file |
| Frontend TypeScript (FE) | 25 file |
| Component moi | 1 file (Breadcrumb.tsx) |
| Endpoint moi | 1 endpoint (GET /questions/count) |
| Model field moi | 1 truong (Exam.status) |
| Schema field moi | 7 truong |
| Ham grading moi | 2 ham (_normalize_vi_text, _grade_essay_answer) |

---

## DA HOAN THANH — KHONG CON TON DONG

Tat ca yeu cau da duoc xu ly:
- [x] Breadcrumb navigation thay nut Back
- [x] Hien so cau hoi toi da trong phan bo de thi
- [x] Bo bai thi tay nghe
- [x] Nhom khoa hoc theo nganh nghe
- [x] Filter theo tai lieu nguon (courses + questions)
- [x] Duyệt ky thi trong Hop duyet
- [x] Filter unapproved khoi dropdown
- [x] Timezone GMT+7
- [x] Cai thien cham diem tu luan
