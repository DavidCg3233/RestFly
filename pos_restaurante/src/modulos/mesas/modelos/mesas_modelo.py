# C:\Users\Administrador\Desktop\POS RESTAURANTE\RestFly\pos_restaurante\src\modulos\mesas\modelos\mesas_modelo.py

from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class ItemPedido:
    prodId: str
    name: str
    price: float
    qty: int

@dataclass
class PedidoMesa:
    id: str
    mesero: str
    total: float
    items: List[ItemPedido] = field(default_factory=list)

@dataclass
class MesaFront:
    id: str
    number: str
    zone: str
    capacity: int
    status: str
    orderId: Optional[str]

@dataclass
class ProductoMenu:
    id: str
    name: str
    desc: str
    price: float
    cat: str

