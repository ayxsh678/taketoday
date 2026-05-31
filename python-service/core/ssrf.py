"""
SSRF protection utilities for the scraper.

Validates URLs before fetching to prevent Server-Side Request Forgery:
- Blocks non-http/https schemes
- Resolves hostnames and blocks requests to private/reserved IP ranges

NOTE: This validation is susceptible to DNS rebinding (the hostname could
resolve to a safe IP at check time but a private IP at request time).
For full protection in a higher-threat environment, route all outbound
requests through an egress proxy that enforces IP-level filtering.
"""

import ipaddress
import socket
import concurrent.futures
from urllib.parse import urlparse
from typing import Optional

# RFC 1918 + reserved ranges that must never be reachable from the scraper
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),    # loopback
    ipaddress.ip_network("10.0.0.0/8"),     # private (RFC 1918)
    ipaddress.ip_network("172.16.0.0/12"),  # private (RFC 1918)
    ipaddress.ip_network("192.168.0.0/16"), # private (RFC 1918)
    ipaddress.ip_network("169.254.0.0/16"), # link-local / AWS IMDS
    ipaddress.ip_network("100.64.0.0/10"),  # carrier-grade NAT
    ipaddress.ip_network("198.18.0.0/15"),  # benchmarking
    ipaddress.ip_network("0.0.0.0/8"),      # this-network
    ipaddress.ip_network("::1/128"),        # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),       # IPv6 unique-local
    ipaddress.ip_network("fe80::/10"),      # IPv6 link-local
]

ALLOWED_SCHEMES = frozenset({"http", "https"})
DNS_TIMEOUT_S = 3


def _is_private(ip_str: str) -> bool:
    """Return True if *ip_str* falls in a private/reserved range."""
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in _BLOCKED_NETWORKS)
    except ValueError:
        return True  # fail-closed


def validate_url(url: str) -> Optional[str]:
    """
    Return an error string if the URL should be blocked, else None.

    Checks:
    1. Scheme is http or https
    2. Hostname is present
    3. If hostname is a raw IP, it must not be private
    4. If hostname is a domain, all resolved IPs must be public
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return "Unparseable URL"

    if parsed.scheme not in ALLOWED_SCHEMES:
        return f"Scheme '{parsed.scheme}' not allowed"

    hostname = parsed.hostname
    if not hostname:
        return "Missing hostname"

    # If hostname IS a raw IP address, check it directly
    try:
        addr = ipaddress.ip_address(hostname)
        if _is_private(str(addr)):
            return f"Direct access to private IP '{hostname}' blocked"
        return None  # public IP — allow
    except ValueError:
        pass  # not an IP — it's a domain name, fall through to DNS check

    # DNS resolution check with timeout (getaddrinfo is blocking)
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(socket.getaddrinfo, hostname, None)
            results = future.result(timeout=DNS_TIMEOUT_S)
    except concurrent.futures.TimeoutError:
        return f"DNS resolution timed out for '{hostname}'"
    except (socket.gaierror, OSError) as exc:
        return f"DNS resolution failed: {exc}"

    for result in results:
        resolved_ip = result[4][0]
        if _is_private(resolved_ip):
            return f"Hostname resolves to private IP '{resolved_ip}' — blocked"

    return None  # all resolved IPs are public
