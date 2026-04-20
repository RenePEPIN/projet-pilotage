from ipaddress import ip_address

from fastapi import Request
from slowapi import Limiter

from core.config import TRUST_PROXY_HEADERS, TRUSTED_PROXY_IPS


def _normalize_ip(raw_ip: str | None) -> str | None:
    if not raw_ip:
        return None
    try:
        return str(ip_address(raw_ip.strip()))
    except ValueError:
        return None


def _is_trusted_proxy(client_host: str | None) -> bool:
    if not client_host:
        return False

    if client_host in TRUSTED_PROXY_IPS:
        return True

    normalized = _normalize_ip(client_host)
    return normalized is not None and normalized in TRUSTED_PROXY_IPS


def client_ip_for_rate_limit(request: Request) -> str:
    client_host = request.client.host if request.client else None
    fallback = client_host or "unknown"

    if not TRUST_PROXY_HEADERS or not _is_trusted_proxy(client_host):
        return fallback

    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first_ip = forwarded_for.split(",", 1)[0].strip()
        normalized = _normalize_ip(first_ip)
        if normalized:
            return normalized

    real_ip = request.headers.get("x-real-ip")
    normalized_real_ip = _normalize_ip(real_ip)
    if normalized_real_ip:
        return normalized_real_ip

    return fallback


limiter = Limiter(key_func=client_ip_for_rate_limit)
