"""Aggregated inbox of items waiting for review/approval.

Supports 2-level approval workflow:
  Level 1 (Department): PENDING_DEPT_REVIEW → DEPT_APPROVED
  Level 2 (Specific):   PENDING_REVIEW → APPROVED
"""
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import require_staff
from app.models.enums import ApprovalStatus
from app.models.user import User

router = APIRouter(prefix="/approvals", tags=["Approvals"])


PendingType = Literal["document", "course", "exam_template", "question", "exam_room", "exam", "exam_period"]


class PendingItem(BaseModel):
    id: str
    type: PendingType
    title: str
    created_by: str
    created_at: datetime
    approval_status: ApprovalStatus
    occupation: Optional[str] = None
    skill_level: Optional[int] = None


class ApprovalSummary(BaseModel):
    total: int
    dept_pending: int
    review_pending: int
    by_type: dict[str, int]
    items: list[PendingItem]


@router.get("/inbox", response_model=ApprovalSummary)
async def inbox(
    type: Optional[PendingType] = None,
    _: User = Depends(require_staff()),
):
    """Return items in PENDING_DEPT_REVIEW and PENDING_REVIEW status."""
    from app.models.document import TrainingDocument
    from app.models.course import Course
    from app.models.exam_template import ExamTemplate
    from app.models.question import Question

    items: list[PendingItem] = []
    by_type: dict[str, int] = {}
    dept_pending = 0
    review_pending = 0

    pending_statuses = [ApprovalStatus.PENDING_DEPT_REVIEW, ApprovalStatus.PENDING_REVIEW]

    if type in (None, "document"):
        docs = await TrainingDocument.find(
            TrainingDocument.status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["document"] = len(docs)
        for d in docs:
            if d.status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(d.id),
                type="document",
                title=d.title,
                created_by=d.uploaded_by,
                created_at=d.created_at,
                approval_status=d.status,
                occupation=d.occupations[0] if d.occupations else None,
                skill_level=d.skill_levels[0] if d.skill_levels else None,
            ))

    if type in (None, "course"):
        courses = await Course.find(
            Course.status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["course"] = len(courses)
        for c in courses:
            if c.status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(c.id),
                type="course",
                title=c.title,
                created_by=c.created_by,
                created_at=c.created_at,
                approval_status=c.status,
                occupation=c.occupation,
                skill_level=c.skill_level,
            ))

    if type in (None, "exam_template"):
        templates = await ExamTemplate.find(
            ExamTemplate.status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["exam_template"] = len(templates)
        for t in templates:
            if t.status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(t.id),
                type="exam_template",
                title=t.name,
                created_by=t.created_by,
                created_at=t.created_at,
                approval_status=t.status,
                occupation=t.occupation,
                skill_level=t.skill_level,
            ))

    if type in (None, "question"):
        questions = await Question.find(
            Question.status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["question"] = len(questions)
        for q in questions:
            if q.status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(q.id),
                type="question",
                title=q.content[:100],
                created_by=q.created_by,
                created_at=q.created_at,
                approval_status=q.status,
                occupation=q.occupation,
                skill_level=q.skill_level,
            ))

    if type in (None, "exam_room"):
        from app.models.exam_room import ExamRoom
        from datetime import timezone, timedelta
        vn_tz = timezone(timedelta(hours=7))
        rooms = await ExamRoom.find(
            ExamRoom.approval_status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["exam_room"] = len(rooms)
        for r in rooms:
            if r.approval_status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(r.id),
                type="exam_room",
                title=r.name,
                created_by=r.created_by,
                created_at=r.created_at,
                approval_status=r.approval_status,
                occupation=f"Lịch thi: {r.scheduled_start.astimezone(vn_tz).strftime('%d/%m/%Y %H:%M')}",
                skill_level=None,
            ))

    if type in (None, "exam_period"):
        from app.models.exam_period import ExamPeriod
        from datetime import timezone, timedelta
        vn_tz = timezone(timedelta(hours=7))
        periods = await ExamPeriod.find(
            ExamPeriod.approval_status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["exam_period"] = len(periods)
        for p in periods:
            if p.approval_status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            items.append(PendingItem(
                id=str(p.id),
                type="exam_period",
                title=p.name,
                created_by=p.created_by,
                created_at=p.created_at,
                approval_status=p.approval_status,
                occupation=f"Từ {p.start_date.astimezone(vn_tz).strftime('%d/%m/%Y')}",
                skill_level=None,
            ))

    if type in (None, "exam"):
        from app.models.exam import Exam
        from app.models.exam_template import ExamTemplate
        exams = await Exam.find(
            Exam.status.in_(pending_statuses)
        ).sort("-created_at").to_list()
        by_type["exam"] = len(exams)
        for e in exams:
            if e.status == ApprovalStatus.PENDING_DEPT_REVIEW:
                dept_pending += 1
            else:
                review_pending += 1
            template_name = ""
            if e.template_id:
                t = await ExamTemplate.get(e.template_id)
                template_name = f" ({t.name})" if t else ""
            items.append(PendingItem(
                id=str(e.id),
                type="exam",
                title=f"{e.name}{template_name}",
                created_by=e.created_by,
                created_at=e.created_at,
                approval_status=e.status,
                occupation=e.occupation,
                skill_level=e.skill_level,
            ))

    items.sort(key=lambda i: i.created_at, reverse=True)
    return ApprovalSummary(
        total=sum(by_type.values()),
        dept_pending=dept_pending,
        review_pending=review_pending,
        by_type=by_type,
        items=items,
    )


class ApproveRequest(BaseModel):
    review_notes: Optional[str] = None


# --- Level 2: Specific reviewer approve/reject (existing) ---

@router.post("/{type}/{item_id}/approve")
async def approve_item(
    type: PendingType,
    item_id: str,
    data: ApproveRequest,
    user: User = Depends(require_staff()),
):
    return await _set_status(type, item_id, ApprovalStatus.APPROVED, str(user.id), data.review_notes, level=2)


@router.post("/{type}/{item_id}/reject")
async def reject_item(
    type: PendingType,
    item_id: str,
    data: ApproveRequest,
    user: User = Depends(require_staff()),
):
    return await _set_status(type, item_id, ApprovalStatus.REJECTED, str(user.id), data.review_notes, level=2)


# --- Level 1: Department reviewer approve/reject ---

@router.post("/{type}/{item_id}/dept-approve")
async def dept_approve_item(
    type: PendingType,
    item_id: str,
    data: ApproveRequest,
    user: User = Depends(require_staff()),
):
    return await _set_status(type, item_id, ApprovalStatus.APPROVED, str(user.id), data.review_notes, level=1)


@router.post("/{type}/{item_id}/dept-reject")
async def dept_reject_item(
    type: PendingType,
    item_id: str,
    data: ApproveRequest,
    user: User = Depends(require_staff()),
):
    return await _set_status(type, item_id, ApprovalStatus.REJECTED, str(user.id), data.review_notes, level=1)


async def _set_status(
    type: PendingType,
    item_id: str,
    status: ApprovalStatus,
    reviewer_id: str,
    notes: Optional[str],
    level: int = 2,
):
    from beanie import PydanticObjectId

    now = datetime.now(timezone.utc)

    if type == "document":
        from app.models.document import TrainingDocument
        doc = await TrainingDocument.get(PydanticObjectId(item_id))
        if not doc:
            raise HTTPException(404, "Document not found")
        if level == 1:
            if doc.status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            doc.dept_reviewer_id = reviewer_id
            doc.dept_review_notes = notes
            doc.dept_approved_at = now
            doc.status = ApprovalStatus.PENDING_REVIEW  # Auto-promote to level 2
        else:
            if doc.status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            doc.reviewed_by = reviewer_id
            doc.review_notes = notes
            doc.approved_at = now
            doc.status = ApprovalStatus.APPROVED
        doc.updated_at = now
        await doc.save()
        return {"id": str(doc.id), "status": doc.status}

    if type == "course":
        from app.models.course import Course
        c = await Course.get(PydanticObjectId(item_id))
        if not c:
            raise HTTPException(404, "Course not found")
        if level == 1:
            if c.status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            c.dept_reviewer_id = reviewer_id
            c.dept_review_notes = notes
            c.dept_approved_at = now
            c.status = ApprovalStatus.PENDING_REVIEW
        else:
            if c.status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            c.reviewed_by = reviewer_id
            c.review_notes = notes
            c.approved_at = now
            c.status = ApprovalStatus.APPROVED
        c.updated_at = now
        await c.save()
        return {"id": str(c.id), "status": c.status}

    if type == "exam_template":
        from app.models.exam_template import ExamTemplate
        t = await ExamTemplate.get(PydanticObjectId(item_id))
        if not t:
            raise HTTPException(404, "Exam template not found")
        if level == 1:
            if t.status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            t.dept_reviewer_id = reviewer_id
            t.dept_review_notes = notes
            t.dept_approved_at = now
            t.status = ApprovalStatus.PENDING_REVIEW
        else:
            if t.status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            t.reviewed_by = reviewer_id
            t.review_notes = notes
            t.approved_at = now
            t.status = ApprovalStatus.APPROVED
        t.updated_at = now
        await t.save()
        return {"id": str(t.id), "status": t.status}

    if type == "question":
        from app.models.question import Question
        q = await Question.get(PydanticObjectId(item_id))
        if not q:
            raise HTTPException(404, "Question not found")
        if level == 1:
            if q.status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            q.dept_reviewer_id = reviewer_id
            q.dept_review_notes = notes
            q.dept_approved_at = now
            q.status = ApprovalStatus.PENDING_REVIEW
        else:
            if q.status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            q.reviewed_by = reviewer_id
            q.review_notes = notes
            q.approved_at = now
            q.status = ApprovalStatus.APPROVED
        q.updated_at = now
        await q.save()
        return {"id": str(q.id), "status": q.status}

    if type == "exam_room":
        from app.models.exam_room import ExamRoom
        r = await ExamRoom.get(PydanticObjectId(item_id))
        if not r:
            raise HTTPException(404, "Exam room not found")
        if level == 1:
            if r.approval_status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            r.dept_reviewer_id = reviewer_id
            r.dept_review_notes = notes
            r.dept_approved_at = now
            r.approval_status = ApprovalStatus.PENDING_REVIEW
        else:
            if r.approval_status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            r.reviewed_by = reviewer_id
            r.review_notes = notes
            r.approved_at = now
            r.approval_status = ApprovalStatus.APPROVED
        r.updated_at = now
        await r.save()
        return {"id": str(r.id), "status": r.approval_status}

    if type == "exam_period":
        from app.models.exam_period import ExamPeriod
        p = await ExamPeriod.get(PydanticObjectId(item_id))
        if not p:
            raise HTTPException(404, "Exam period not found")
        if level == 1:
            if p.approval_status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            p.dept_reviewer_id = reviewer_id
            p.dept_review_notes = notes
            p.dept_approved_at = now
            p.approval_status = ApprovalStatus.PENDING_REVIEW
        else:
            if p.approval_status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            p.reviewed_by = reviewer_id
            p.review_notes = notes
            p.approved_at = now
            p.approval_status = ApprovalStatus.APPROVED
        p.updated_at = now
        await p.save()
        return {"id": str(p.id), "status": p.approval_status}

    if type == "exam":
        from app.models.exam import Exam
        e = await Exam.get(PydanticObjectId(item_id))
        if not e:
            raise HTTPException(404, "Exam not found")
        if level == 1:
            if e.status != ApprovalStatus.PENDING_DEPT_REVIEW:
                raise HTTPException(400, "Item is not pending department review")
            e.dept_reviewer_id = reviewer_id
            e.dept_review_notes = notes
            e.dept_approved_at = now
            e.status = ApprovalStatus.PENDING_REVIEW
        else:
            if e.status not in (ApprovalStatus.PENDING_REVIEW, ApprovalStatus.DEPT_APPROVED):
                raise HTTPException(400, "Item is not pending review")
            e.reviewed_by = reviewer_id
            e.review_notes = notes
            e.approved_at = now
            e.status = ApprovalStatus.APPROVED
        e.updated_at = now
        await e.save()
        return {"id": str(e.id), "status": e.status}

    raise HTTPException(400, f"Unknown type: {type}")
