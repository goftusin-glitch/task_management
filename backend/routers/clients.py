from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.client import Client
from models.user import User
from schemas.client import ClientCreate, ClientUpdate, ClientResponse
from services.auth import check_page_access

router = APIRouter(prefix="/api/clients", tags=["Clients"])


@router.get("/", response_model=List[ClientResponse])
async def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access(["clients", "follow_ups"]))
):
    clients = db.query(Client).all()
    return clients


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access(["clients", "follow_ups"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access(["clients", "follow_ups"]))
):
    client = Client(
        name=client_data.name,
        email=client_data.email,
        phone=client_data.phone,
        status=client_data.status,
        custom_fields=client_data.custom_fields,
        created_by=current_user.id
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access(["clients", "follow_ups"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if client_data.name is not None:
        client.name = client_data.name
    if client_data.email is not None:
        client.email = client_data.email
    if client_data.phone is not None:
        client.phone = client_data.phone
    if client_data.custom_fields is not None:
        client.custom_fields = client_data.custom_fields
    if client_data.status is not None:
        client.status = client_data.status
    
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access(["clients", "follow_ups"]))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(client)
    db.commit()
    return None
