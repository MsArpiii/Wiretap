import ipaddress
from typing import Set, List, Optional
from src.types_ import AppType

class RuleManager:
    def __init__(self):
        self.blocked_ips: Set[str] = set()
        self.blocked_apps: Set[AppType] = set()
        self.blocked_domains: Set[str] = set()
        self.domain_patterns: List[str] = []
        self.blocked_ports: Set[int] = set()

    def block_ip(self, ip: str):
        self.blocked_ips.add(ip)
        print(f"[RuleManager] Blocked IP: {ip}")

    def block_app(self, app_name: str):
        try:
            app = AppType[app_name.upper()]
            self.blocked_apps.add(app)
            print(f"[RuleManager] Blocked app: {app.name}")
        except KeyError:
            print(f"[RuleManager] Unknown app type: {app_name}")

    def block_domain(self, domain: str):
        if '*' in domain:
            self.domain_patterns.append(domain.lower())
        else:
            self.blocked_domains.add(domain.lower())
        print(f"[RuleManager] Blocked domain: {domain}")

    def block_port(self, port: int):
        self.blocked_ports.add(port)
        print(f"[RuleManager] Blocked port: {port}")

    def _domain_matches_pattern(self, domain: str, pattern: str) -> bool:
        if pattern.startswith('*.'):
            suffix = pattern[1:] # e.g. .example.com
            if domain.endswith(suffix):
                return True
            if domain == pattern[2:]: # bare domain matches too
                return True
        return False

    def is_domain_blocked(self, domain: str) -> bool:
        domain = domain.lower()
        if domain in self.blocked_domains:
            return True
        
        for pattern in self.domain_patterns:
            if self._domain_matches_pattern(domain, pattern):
                return True
                
        return False

    def should_block(self, src_ip: str, dst_port: int, app: AppType, domain: str) -> Optional[str]:
        # Check IP
        if src_ip in self.blocked_ips:
            return f"IP {src_ip}"
            
        # Check port
        if dst_port in self.blocked_ports:
            return f"PORT {dst_port}"
            
        # Check app
        if app in self.blocked_apps:
            return f"APP {app.name}"
            
        # Check domain
        if domain and self.is_domain_blocked(domain):
            return f"DOMAIN {domain}"
            
        return None
