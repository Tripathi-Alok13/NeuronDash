import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text, Table, JSON, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Organization(Base):
    __tablename__ = 'organizations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    projects = relationship("Project", back_populates="organization")


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id', ondelete='SET NULL'))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default='user')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    projects = relationship("Project", back_populates="user")
    uploaded_files = relationship("UploadedFile", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")


class Project(Base):
    __tablename__ = 'projects'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="projects")
    user = relationship("User", back_populates="projects")
    uploaded_files = relationship("UploadedFile", back_populates="project")
    dashboards = relationship("Dashboard", back_populates="project")
    reports = relationship("Report", back_populates="project")
    conversations = relationship("Conversation", back_populates="project")


class UploadedFile(Base):
    __tablename__ = 'uploaded_files'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False) # csv, xlsx, pdf, docx
    file_path = Column(String(512), nullable=False)
    status = Column(String(50), default='pending') # pending, processing, completed, failed
    size_bytes = Column(BigInteger, nullable=False)
    raw_metadata = Column(JSON)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="uploaded_files")
    user = relationship("User", back_populates="uploaded_files")
    datasets = relationship("Dataset", back_populates="file")


class Dataset(Base):
    __tablename__ = 'datasets'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey('uploaded_files.id', ondelete='CASCADE'))
    name = Column(String(255), nullable=False)
    row_count = Column(Integer, nullable=False)
    column_count = Column(Integer, nullable=False)
    raw_schema = Column(JSON, nullable=False)
    cleaned_schema = Column(JSON, nullable=False)
    summary_statistics = Column(JSON)
    parquet_path = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    file = relationship("UploadedFile", back_populates="datasets")
    anomalies = relationship("Anomaly", back_populates="dataset")
    cleaning_logs = relationship("CleaningLog", back_populates="dataset")
    dashboards = relationship("Dashboard", back_populates="dataset")
    reports = relationship("Report", back_populates="dataset")


class Anomaly(Base):
    __tablename__ = 'anomalies'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey('datasets.id', ondelete='CASCADE'))
    row_index = Column(Integer)
    column_name = Column(String(100))
    anomaly_type = Column(String(50), nullable=False) # outlier, null_value, type_mismatch, invalid_format
    severity = Column(String(20), nullable=False) # low, medium, high
    description = Column(Text, nullable=False)
    suggested_fix = Column(JSON)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="anomalies")


class CleaningLog(Base):
    __tablename__ = 'cleaning_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey('datasets.id', ondelete='CASCADE'))
    operations_applied = Column(JSON, nullable=False) # list of cleaning edits
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="cleaning_logs")


class Dashboard(Base):
    __tablename__ = 'dashboards'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'))
    dataset_id = Column(UUID(as_uuid=True), ForeignKey('datasets.id', ondelete='CASCADE'))
    title = Column(String(255), nullable=False)
    template_type = Column(String(50), nullable=False) # executive, sales, student, hr, finance, survey, auto
    layout_config = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="dashboards")
    dataset = relationship("Dataset", back_populates="dashboards")
    widgets = relationship("DashboardWidget", back_populates="dashboard")


class DashboardWidget(Base):
    __tablename__ = 'dashboard_widgets'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey('dashboards.id', ondelete='CASCADE'))
    title = Column(String(255), nullable=False)
    chart_type = Column(String(50), nullable=False) # kpi, bar, line, pie, scatter, heatmap
    data_query = Column(JSON, nullable=False)
    positioning_config = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dashboard = relationship("Dashboard", back_populates="widgets")


class Report(Base):
    __tablename__ = 'reports'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'))
    dataset_id = Column(UUID(as_uuid=True), ForeignKey('datasets.id', ondelete='CASCADE'))
    title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    sections = Column(JSON)
    is_editable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="reports")
    dataset = relationship("Dataset", back_populates="reports")


class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'))
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation")


class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'))
    role = Column(String(20), nullable=False) # user, assistant
    content = Column(Text, nullable=False)
    status_details = Column(JSON)
    context_references = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
