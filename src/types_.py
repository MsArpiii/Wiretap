from enum import Enum
from dataclasses import dataclass
from typing import Optional

class AppType(Enum):
    UNKNOWN = 0
    HTTP = 1
    HTTPS = 2
    DNS = 3
    TLS = 4
    QUIC = 5
    GOOGLE = 6
    FACEBOOK = 7
    YOUTUBE = 8
    TWITTER = 9
    INSTAGRAM = 10
    NETFLIX = 11
    AMAZON = 12
    MICROSOFT = 13
    APPLE = 14
    WHATSAPP = 15
    TELEGRAM = 16

    SPOTIFY = 18
    ZOOM = 19
    DISCORD = 20
    GITHUB = 21
    CLOUDFLARE = 22

class ConnectionState(Enum):
    NEW = 0
    ESTABLISHED = 1
    CLASSIFIED = 2
    BLOCKED = 3
    CLOSED = 4

class PacketAction(Enum):
    FORWARD = 0
    DROP = 1
    INSPECT = 2
    LOG_ONLY = 3

@dataclass
class FiveTuple:
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: int  # 6 for TCP, 17 for UDP

    def reverse(self) -> 'FiveTuple':
        return FiveTuple(
            src_ip=self.dst_ip,
            dst_ip=self.src_ip,
            src_port=self.dst_port,
            dst_port=self.src_port,
            protocol=self.protocol
        )
    
    def __hash__(self):
        return hash((self.src_ip, self.dst_ip, self.src_port, self.dst_port, self.protocol))

def sni_to_app_type(sni: str) -> AppType:
    sni = sni.lower()
    if 'youtube' in sni or 'googlevideo' in sni or 'ytimg' in sni:
        return AppType.YOUTUBE
    elif 'google' in sni:
        return AppType.GOOGLE
    elif 'facebook' in sni or 'fbcdn' in sni:
        return AppType.FACEBOOK
    elif 'twitter' in sni or 'twimg' in sni:
        return AppType.TWITTER
    elif 'instagram' in sni or 'cdninstagram' in sni:
        return AppType.INSTAGRAM
    elif 'netflix' in sni or 'nflxvideo' in sni:
        return AppType.NETFLIX
    elif 'amazon' in sni or 'aws' in sni:
        return AppType.AMAZON
    elif 'microsoft' in sni or 'live.com' in sni or 'office.com' in sni:
        return AppType.MICROSOFT
    elif 'apple' in sni or 'icloud' in sni:
        return AppType.APPLE
    elif 'whatsapp' in sni:
        return AppType.WHATSAPP
    elif 'telegram' in sni:
        return AppType.TELEGRAM
    elif 'instagram' in sni or 'cdninstagram' in sni:
        return AppType.INSTAGRAM
    elif 'spotify' in sni:
        return AppType.SPOTIFY
    elif 'zoom' in sni:
        return AppType.ZOOM
    elif 'discord' in sni:
        return AppType.DISCORD
    elif 'github' in sni:
        return AppType.GITHUB
    elif 'cloudflare' in sni:
        return AppType.CLOUDFLARE
    
    return AppType.UNKNOWN
