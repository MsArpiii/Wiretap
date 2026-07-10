import struct
from typing import Optional

def extract_sni(payload: bytes) -> Optional[str]:
    """Extract Server Name Indication (SNI) from TLS Client Hello."""
    if len(payload) < 9:
        return None
        
    # TLS Record Header
    # Byte 0: Content Type (0x16 = Handshake)
    if payload[0] != 0x16:
        return None
        
    # Bytes 1-2: Version
    version = struct.unpack('>H', payload[1:3])[0]
    if version < 0x0300 or version > 0x0304:
        return None
        
    # Bytes 3-4: Record Length
    record_len = struct.unpack('>H', payload[3:5])[0]
    if record_len > len(payload) - 5:
        return None
        
    # Handshake Header
    # Byte 5: Handshake Type (0x01 = Client Hello)
    if payload[5] != 0x01:
        return None
        
    offset = 5
    # Skip Handshake type (1 byte)
    # Read Handshake length (3 bytes)
    hs_len_bytes = b'\x00' + payload[offset+1:offset+4]
    hs_len = struct.unpack('>I', hs_len_bytes)[0]
    offset += 4
    
    # Client Version
    offset += 2
    
    # Random
    offset += 32
    
    # Session ID
    if offset >= len(payload): return None
    session_id_len = payload[offset]
    offset += 1 + session_id_len
    
    # Cipher Suites
    if offset + 2 > len(payload): return None
    cipher_suites_len = struct.unpack('>H', payload[offset:offset+2])[0]
    offset += 2 + cipher_suites_len
    
    # Compression Methods
    if offset >= len(payload): return None
    comp_methods_len = payload[offset]
    offset += 1 + comp_methods_len
    
    # Extensions
    if offset + 2 > len(payload): return None
    extensions_len = struct.unpack('>H', payload[offset:offset+2])[0]
    offset += 2
    
    ext_end = min(offset + extensions_len, len(payload))
    
    while offset + 4 <= ext_end:
        ext_type, ext_len = struct.unpack('>HH', payload[offset:offset+4])
        offset += 4
        
        if offset + ext_len > ext_end:
            break
            
        if ext_type == 0x0000: # SNI extension
            if ext_len < 5:
                break
            sni_list_len = struct.unpack('>H', payload[offset:offset+2])[0]
            if sni_list_len < 3:
                break
            sni_type = payload[offset+2]
            sni_len = struct.unpack('>H', payload[offset+3:offset+5])[0]
            
            if sni_type == 0x00: # Hostname
                if sni_len <= ext_len - 5:
                    return payload[offset+5:offset+5+sni_len].decode('ascii', errors='ignore')
        
        offset += ext_len
        
    return None

def extract_http_host(payload: bytes) -> Optional[str]:
    """Extract Host header from HTTP Request."""
    if len(payload) < 4:
        return None
        
    methods = [b'GET ', b'POST', b'PUT ', b'HEAD', b'DELE', b'PATC', b'OPTI']
    if not any(payload.startswith(m) for m in methods):
        return None
        
    lines = payload.split(b'\r\n')
    for line in lines:
        if line.lower().startswith(b'host:'):
            host = line[5:].strip().decode('ascii', errors='ignore')
            if ':' in host:
                host = host.split(':')[0]
            return host
            
    return None

def extract_dns_query(payload: bytes) -> Optional[str]:
    """Extract domain from DNS Query."""
    if len(payload) < 12:
        return None
        
    flags = payload[2]
    if flags & 0x80: # Response, not query
        return None
        
    qdcount = struct.unpack('>H', payload[4:6])[0]
    if qdcount == 0:
        return None
        
    offset = 12
    domain = []
    
    while offset < len(payload):
        label_len = payload[offset]
        if label_len == 0:
            break
        if label_len > 63: # Compression or invalid
            break
            
        offset += 1
        if offset + label_len > len(payload):
            break
            
        domain.append(payload[offset:offset+label_len].decode('ascii', errors='ignore'))
        offset += label_len
        
    if domain:
        return '.'.join(domain)
        
    return None
