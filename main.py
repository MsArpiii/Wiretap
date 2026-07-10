import argparse
import sys
from typing import List, Tuple
from multiprocessing import Pool
from scapy.utils import PcapReader, PcapWriter
from scapy.all import Packet

from src.rule_manager import RuleManager
from src.dpi_engine import DPIEngine
from src.types_ import PacketAction

def process_chunk(args: Tuple[List[Packet], List[str], List[str]]) -> List[Packet]:
    packets, blocked_apps, blocked_domains = args
    
    rule_manager = RuleManager()
    for app in blocked_apps:
        rule_manager.block_app(app)
    for domain in blocked_domains:
        rule_manager.block_domain(domain)
        
    engine = DPIEngine(rule_manager)
    
    allowed = []
    for pkt in packets:
        action = engine.process_packet(pkt)
        if action != PacketAction.DROP:
            allowed.append(pkt)
            
    return allowed

def main():
    parser = argparse.ArgumentParser(description="Python DPI Packet Analyzer")
    parser.add_argument("input_pcap", help="Input PCAP file")
    parser.add_argument("output_pcap", help="Output PCAP file")
    parser.add_argument("--block-app", action="append", default=[], help="Block specific application")
    parser.add_argument("--block-domain", action="append", default=[], help="Block specific domain")
    parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")
    
    args = parser.parse_args()
    
    print(f"Starting DPI Analyzer")
    print(f"Input: {args.input_pcap}")
    print(f"Output: {args.output_pcap}")
    print(f"Blocked apps: {args.block_app}")
    print(f"Blocked domains: {args.block_domain}")
    print(f"Workers: {args.workers}")
    
    # Read packets in chunks to support multiprocessing without blowing up memory
    CHUNK_SIZE = 1000
    
    chunks = []
    current_chunk = []
    
    with PcapReader(args.input_pcap) as pcap:
        for pkt in pcap:
            current_chunk.append(pkt)
            if len(current_chunk) >= CHUNK_SIZE:
                chunks.append((current_chunk, args.block_app, args.block_domain))
                current_chunk = []
                
    if current_chunk:
        chunks.append((current_chunk, args.block_app, args.block_domain))
        
    allowed_packets = []
    
    if args.workers > 1:
        with Pool(args.workers) as pool:
            results = pool.map(process_chunk, chunks)
            for res in results:
                allowed_packets.extend(res)
    else:
        for chunk in chunks:
            allowed_packets.extend(process_chunk(chunk))
            
    with PcapWriter(args.output_pcap, append=False) as writer:
        for pkt in allowed_packets:
            writer.write(pkt)
            
    print(f"Finished processing. Allowed {len(allowed_packets)} packets.")

if __name__ == "__main__":
    main()
