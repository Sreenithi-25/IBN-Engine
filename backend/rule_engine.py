import json
import subprocess
import socket
from datetime import datetime

NETWORK_TOPOLOGY = {
    "devices": [
        {"id": "dev-1", "name": "Student Laptop", "ip": "192.168.1.10"},
        {"id": "dev-2", "name": "Faculty PC", "ip": "192.168.1.20"},
        {"id": "dev-3", "name": "IoT Sensor", "ip": "192.168.1.30"},
        {"id": "dev-4", "name": "Admin Server", "ip": "192.168.1.40"},
    ],
    "links": [
        {"from": "dev-1", "to": "dev-4"},
        {"from": "dev-2", "to": "dev-4"},
        {"from": "dev-3", "to": "dev-4"},
    ]
}

active_policies = []
policy_counter = 1

# Domains to resolve and block
KNOWN_DOMAINS = {
    "youtube.com": ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    "instagram.com": ["instagram.com", "www.instagram.com"],
    "facebook.com": ["facebook.com", "www.facebook.com"],
    "tiktok.com": ["tiktok.com", "www.tiktok.com"],
    "twitter.com": ["twitter.com", "www.twitter.com", "x.com"],
    "reddit.com": ["reddit.com", "www.reddit.com"],
}

def resolve_ip(domain):
    try:
        ip = socket.gethostbyname(domain)
        return ip
    except:
        return None

def apply_firewall_block(target, policy_id):
    domains = []
    for key, variants in KNOWN_DOMAINS.items():
        if key in target.lower() or target.lower() in key:
            domains = variants
            break

    if not domains:
        domains = [target]

    blocked_ips = []
    for domain in domains:
        ip = resolve_ip(domain)
        if ip:
            rule_name = f"IBN-BLOCK-{policy_id}-{domain}"
            subprocess.run([
                "netsh", "advfirewall", "firewall", "add", "rule",
                f"name={rule_name}",
                "dir=out",
                "action=block",
                "protocol=any",
                f"remoteip={ip}"
            ], capture_output=True)
            blocked_ips.append(f"{domain} → {ip}")

    return blocked_ips

def remove_firewall_block(policy_id):
    # Remove all firewall rules for this policy
    result = subprocess.run([
        "netsh", "advfirewall", "firewall", "show", "rule",
        f"name=IBN-BLOCK-{policy_id}"
    ], capture_output=True, text=True)

    subprocess.run([
        "netsh", "advfirewall", "firewall", "delete", "rule",
        f"name=all"
    ], capture_output=True)

    # More precise delete
    import re
    lines = result.stdout.split('\n')
    for line in lines:
        if line.strip().startswith("Rule Name:"):
            rule_name = line.split(":", 1)[1].strip()
            if f"IBN-BLOCK-{policy_id}" in rule_name:
                subprocess.run([
                    "netsh", "advfirewall", "firewall", "delete", "rule",
                    f"name={rule_name}"
                ], capture_output=True)

def add_policy(policy):
    global policy_counter
    policy["id"] = f"policy-{policy_counter}"
    policy["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    policy["status"] = "active"
    policy["blocked_ips"] = []

    # Only apply firewall for BLOCK actions
    if policy["action"] == "block":
        blocked_ips = apply_firewall_block(policy["target"], policy["id"])
        policy["blocked_ips"] = blocked_ips
        policy["firewall"] = "ENFORCED" if blocked_ips else "SIMULATED"
    else:
        policy["firewall"] = "SIMULATED"

    active_policies.append(policy)
    policy_counter += 1
    return policy

def get_all_policies():
    return active_policies

def delete_policy(policy_id):
    global active_policies
    for p in active_policies:
        if p["id"] == policy_id and p["action"] == "block":
            remove_firewall_block(policy_id)
    before = len(active_policies)
    active_policies = [p for p in active_policies if p["id"] != policy_id]
    return len(active_policies) < before

def check_traffic(target, current_time=None):
    if current_time is None:
        current_time = datetime.now().strftime("%H:%M")
    matched_policies = []
    for policy in active_policies:
        if policy["status"] != "active":
            continue
        if policy["target"].lower() in target.lower() or target.lower() in policy["target"].lower():
            if policy["time_start"] and policy["time_end"]:
                if policy["time_start"] <= current_time <= policy["time_end"]:
                    matched_policies.append(policy)
            else:
                matched_policies.append(policy)
    if matched_policies:
        priority_order = {"high": 0, "medium": 1, "low": 2}
        matched_policies.sort(key=lambda p: priority_order.get(p["priority"], 99))
        top = matched_policies[0]
        return {
            "allowed": top["action"] != "block",
            "action": top["action"],
            "matched_policy": top["id"],
            "description": top["description"]
        }
    return {"allowed": True, "action": "allow", "matched_policy": None, "description": "No matching policy, traffic allowed"}

def get_topology():
    return NETWORK_TOPOLOGY