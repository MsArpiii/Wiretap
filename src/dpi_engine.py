from typing import Optional, Dict
from scapy.all import Packet, IP, TCP, UDP
from scapy.packet import Raw

from src.types_ import AppType, FiveTuple, PacketAction, sni_to_app_type
from src.rule_manager import RuleManager
from src.sni_extractor import extract_sni, extract_http_host, extract_dns_query

class Connection:
    def __init__(self, tuple: FiveTuple):
        self.tuple = tuple
        self.app_type = AppType.UNKNOWN
        self.sni: Optional[str] = None
        self.action = PacketAction.INSPECT

class DPIEngine:
    def __init__(self, rule_manager: RuleManager):
        self.rule_manager = rule_manager
        self.connections: Dict[FiveTuple, Connection] = {}

    def get_or_create_connection(self, tuple: FiveTuple) -> Connection:
        if tuple in self.connections:
            return self.connections[tuple]
        
        rev_tuple = tuple.reverse()
        if rev_tuple in self.connections:
            return self.connections[rev_tuple]
            
        conn = Connection(tuple)
        self.connections[tuple] = conn
        return conn

    def process_packet(self, pkt: Packet) -> PacketAction:
        if not pkt.haslayer(IP):
            return PacketAction.FORWARD
            
        ip_layer = pkt[IP]
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        
        if pkt.haslayer(TCP):
            proto = 6
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
            payload = bytes(pkt[TCP].payload) if pkt.haslayer(Raw) else b''
        elif pkt.haslayer(UDP):
            proto = 17
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
            payload = bytes(pkt[UDP].payload) if pkt.haslayer(Raw) else b''
        else:
            return PacketAction.FORWARD
            
        five_tuple = FiveTuple(src_ip, dst_ip, src_port, dst_port, proto)
        conn = self.get_or_create_connection(five_tuple)
        
        # If we already decided to drop this connection
        if conn.action == PacketAction.DROP:
            return PacketAction.DROP
            
        # If we need to inspect and we have a payload
        if conn.action == PacketAction.INSPECT and payload:
            domain = None
            if dst_port == 443 or src_port == 443:
                sni = extract_sni(payload)
                if sni:
                    conn.sni = sni
                    conn.app_type = sni_to_app_type(sni)
                    domain = sni
            elif dst_port == 80 or src_port == 80:
                host = extract_http_host(payload)
                if host:
                    conn.sni = host
                    conn.app_type = sni_to_app_type(host)
                    domain = host
            elif dst_port == 53 or src_port == 53:
                query = extract_dns_query(payload)
                if query:
                    conn.sni = query
                    conn.app_type = sni_to_app_type(query)
                    domain = query
                    
            if domain:
                conn.action = PacketAction.FORWARD # Default if classified and not blocked
                
            # Check rules
            reason = self.rule_manager.should_block(src_ip, dst_port, conn.app_type, domain or "")
            if reason:
                conn.action = PacketAction.DROP
                
            if conn.action != PacketAction.DROP and conn.sni is None:
                # Still don't know what this is, keep inspecting
                pass

        return conn.action
