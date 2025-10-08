"""Configuration helpers for the Naver blog automation script."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    """Strongly-typed configuration values required by the script."""

    client_id: str
    client_secret: str
    access_token: str
    blog_id: str
    api_base_url: str = "https://openapi.naver.com/blog/writePost.json"

    @classmethod
    def from_env(cls, prefix: str = "NAVER_BLOG") -> "Config":
        """Create an instance from environment variables.

        Parameters
        ----------
        prefix:
            Prefix used for environment variables (e.g. ``NAVER_BLOG_CLIENT_ID``).
        """

        def read_env(name: str) -> str:
            value = os.getenv(name)
            if not value:
                raise ValueError(f"Environment variable '{name}' must be set")
            return value

        base = prefix.upper()
        return cls(
            client_id=read_env(f"{base}_CLIENT_ID"),
            client_secret=read_env(f"{base}_CLIENT_SECRET"),
            access_token=read_env(f"{base}_ACCESS_TOKEN"),
            blog_id=read_env(f"{base}_BLOG_ID"),
            api_base_url=os.getenv(f"{base}_API_BASE_URL", "https://openapi.naver.com/blog/writePost.json"),
        )


def get_config(prefix: Optional[str] = "NAVER_BLOG") -> Config:
    """Return the application configuration.

    This helper is kept separate so that it can be easily mocked during tests.
    """

    return Config.from_env(prefix or "NAVER_BLOG")
