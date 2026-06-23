from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
from uuid import UUID

# User & Auth
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: UUID
    org_id: Optional[UUID]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Organization
class OrganizationBase(BaseModel):
    name: str

class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Project
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: UUID
    org_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# UploadedFile
class UploadedFileResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: Optional[UUID]
    filename: str
    file_type: str
    status: str
    size_bytes: int
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Dataset
class DatasetResponse(BaseModel):
    id: UUID
    file_id: UUID
    name: str
    row_count: int
    column_count: int
    raw_schema: Dict[str, Any]
    cleaned_schema: Dict[str, Any]
    summary_statistics: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Anomaly
class AnomalyResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    row_index: Optional[int] = None
    column_name: Optional[str] = None
    anomaly_type: str
    severity: str
    description: str
    suggested_fix: Optional[Dict[str, Any]] = None
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AnomalyResolve(BaseModel):
    is_resolved: bool

# Cleaning
class CleaningApply(BaseModel):
    approved_ops: List[str]
    reject_ops: List[str]

# Dashboard
class DashboardWidgetBase(BaseModel):
    title: str
    chart_type: str
    data_query: Dict[str, Any]
    positioning_config: Dict[str, Any]

class DashboardWidgetCreate(DashboardWidgetBase):
    pass

class DashboardWidgetResponse(DashboardWidgetBase):
    id: UUID
    dashboard_id: UUID

    class Config:
        from_attributes = True

class DashboardBase(BaseModel):
    title: str
    template_type: str
    layout_config: Optional[Dict[str, Any]] = None

class DashboardCreate(DashboardBase):
    dataset_id: UUID

class DashboardResponse(DashboardBase):
    id: UUID
    project_id: UUID
    dataset_id: UUID
    created_at: datetime
    widgets: List[DashboardWidgetResponse] = []

    class Config:
        from_attributes = True

class DashboardLayoutUpdate(BaseModel):
    layout_config: Dict[str, Any]

# Report
class ReportResponse(BaseModel):
    id: UUID
    project_id: UUID
    dataset_id: UUID
    title: str
    content_markdown: str
    sections: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportUpdate(BaseModel):
    content_markdown: str

# Conversations & Chat
class ChatMessageBase(BaseModel):
    role: str
    content: str

class ChatMessageResponse(ChatMessageBase):
    id: UUID
    created_at: datetime
    status_details: Optional[Dict[str, Any]] = None
    context_references: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
