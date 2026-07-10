from flask import Flask, render_template, jsonify
import os
from scapy.utils import PcapReader
import sys
from collections import Counter

# Import existing DPI logic
from src.rule_manager import RuleManager
from src.dpi_engine import DPIEngine
from src.types_ import PacketAction

# Import the test pcap generator
import generate_test_pcap

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_traffic():
    try:
        # Generate the PCAP file
        generate_test_pcap.main()
        return jsonify({"status": "success", "message": "Test traffic generated successfully in test_dpi.pcap"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_traffic():
    pcap_file = 'test_dpi.pcap'
    
    if not os.path.exists(pcap_file):
        return jsonify({"status": "error", "message": "PCAP file not found. Generate traffic first."}), 404
        
    try:
        # Initialize engine (without any blocking rules just to see the traffic breakdown)
        rule_manager = RuleManager()
        # You could also add blocking rules here if you want to demonstrate dropped packets:
        # rule_manager.block_app('YOUTUBE')
        # rule_manager.block_domain('tiktok')
        
        engine = DPIEngine(rule_manager)
        
        total_packets = 0
        forwarded = 0
        dropped = 0
        
        # Read the pcap and process packets
        with PcapReader(pcap_file) as pcap:
            for pkt in pcap:
                total_packets += 1
                action = engine.process_packet(pkt)
                if action == PacketAction.DROP:
                    dropped += 1
                else:
                    forwarded += 1
                    
        # Aggregate statistics from connection state
        app_counts = Counter()
        domain_list = []
        
        # Iterate over all tracked connections
        for tuple_, conn in engine.connections.items():
            if conn.app_type.name != 'UNKNOWN':
                app_counts[conn.app_type.name] += 1
                
            if conn.sni:
                # Add to domain list if not already there, just to have a clean list
                domain_entry = next((item for item in domain_list if item["domain"] == conn.sni), None)
                if domain_entry:
                    domain_entry["count"] += 1
                else:
                    domain_list.append({
                        "domain": conn.sni,
                        "app": conn.app_type.name,
                        "count": 1
                    })
                    
        # Sort domain list by count
        domain_list.sort(key=lambda x: x["count"], reverse=True)
        
        return jsonify({
            "status": "success",
            "stats": {
                "total_packets": total_packets,
                "forwarded": forwarded,
                "dropped": dropped,
                "applications": dict(app_counts),
                "domains": domain_list
            }
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
