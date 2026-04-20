import os


def _parse_bool_env(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


raw_write_api_key = os.getenv("WRITE_API_KEY")
if not raw_write_api_key:
    raise RuntimeError(
        "La variable d'environnement WRITE_API_KEY est obligatoire. "
        "Definissez-la avant de demarrer le serveur.",
    )
WRITE_API_KEY: str = raw_write_api_key

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

TRUST_PROXY_HEADERS = _parse_bool_env(os.getenv("TRUST_PROXY_HEADERS"), default=False)
_trusted_proxy_ips_raw = os.getenv("TRUSTED_PROXY_IPS", "127.0.0.1,::1,localhost")
TRUSTED_PROXY_IPS: set[str] = {
    item.strip()
    for item in _trusted_proxy_ips_raw.split(",")
    if item.strip()
}
