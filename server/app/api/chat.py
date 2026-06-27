import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Conversation, ChatMessage, Dataset, Project, UploadedFile
from app.schemas.pydantic_schemas import ConversationResponse, MessageCreate, ChatMessageResponse
from app.services.assistant import AIAssistant

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # Delete previous conversations to avoid clutter (once analysis is done, delete previous chat)
    old_convs = db.query(Conversation).filter(
        Conversation.project_id == project_id,
        Conversation.user_id == current_user.id
    ).all()
    for c in old_convs:
        db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).delete()
        db.delete(c)
    db.commit()
        
    db_conversation = Conversation(
        project_id=project_id,
        user_id=current_user.id,
        title="New Chat Session"
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(
    conversation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).join(Project).filter(
        Conversation.id == conversation_id,
        Project.org_id == current_user.org_id
    ).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conversation.messages

@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
def send_message(
    conversation_id: uuid.UUID,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).join(Project).filter(
        Conversation.id == conversation_id,
        Project.org_id == current_user.org_id
    ).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
        
    # Get the latest dataset from this project to run analysis queries on
    dataset = db.query(Dataset).join(UploadedFile, Dataset.file_id == UploadedFile.id).filter(
        UploadedFile.project_id == conversation.project_id
    ).order_by(Dataset.created_at.desc()).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset available in this project to query. Upload a file first."
        )

    # 1. Log the user message in DB
    db_user_msg = ChatMessage(
        conversation_id=conversation_id,
        role="user",
        content=message_in.content
    )
    db.add(db_user_msg)
    db.commit()

    try:
        # Load dataset Parquet
        df = pd.read_parquet(dataset.parquet_path)
        
        # Load conversation message history (includes the user message we just committed)
        db_messages = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id
        ).order_by(ChatMessage.created_at.asc()).all()
        
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in db_messages
        ]
        
        # 2. Execute NLP Query on DataFrame with History
        result = AIAssistant.process_query(df, message_in.content, history)
        
        # Log assistant message
        db_assistant_msg = ChatMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=result["content"],
            status_details=result["status_details"],
            context_references={"recommended_widget": result["recommended_widget"]} if result["recommended_widget"] else None
        )
        db.add(db_assistant_msg)
        db.commit()
        db.refresh(db_assistant_msg)
        
        return db_assistant_msg
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processor crashed: {str(e)}"
        )
