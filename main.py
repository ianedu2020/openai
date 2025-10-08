"""Automate generating and publishing a post to a Naver blog.

This module provides a small CLI that can generate a simple blog article for a
given topic and optionally publish it to the Naver Blog Write API. The content
is intentionally lightweight so that it works out of the box without requiring a
third-party language model. However, the script is structured so it can be
extended easily.
"""

from __future__ import annotations

import argparse
import logging
import random
import textwrap
from datetime import datetime
from typing import Iterable

import requests

from config import Config, get_config

LOGGER = logging.getLogger(__name__)


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a post for a Naver blog and optionally publish it.",
    )
    parser.add_argument("topic", help="Topic to write about.")
    parser.add_argument(
        "--keywords",
        nargs="*",
        default=(),
        help="Additional keywords to weave into the generated article.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print the post without publishing it to Naver.",
    )
    parser.add_argument(
        "--title-prefix",
        default="",
        help="Optional prefix to add to the generated title.",
    )
    return parser


def generate_post(topic: str, keywords: Iterable[str]) -> tuple[str, str]:
    """Generate a simple blog post about ``topic``.

    The generator intentionally keeps things deterministic and easy to audit.
    Additional keywords are sprinkled throughout to help with SEO.
    """

    keywords_list = [kw.strip() for kw in keywords if kw.strip()]
    keywords_text = ", ".join(keywords_list)

    intro_templates = [
        "오늘은 {date} 기준으로 {topic}에 대해 깊이 살펴보려고 합니다.",
        "{date} 현재 {topic}는 많은 사람들의 관심을 받고 있는데요,",
        "최근 제 주변에서도 {topic} 이야기가 자주 들려오고 있습니다. 최신 정보({date})도 함께 정리해봅니다.",
    ]
    intro = random.choice(intro_templates).format(topic=topic, date=datetime.now().strftime("%Y-%m-%d"))

    if keywords_text:
        intro += f" 주요 키워드는 {keywords_text} 입니다."

    body_sections = [
        "핵심 포인트",
        "실전 적용 방법",
        "마무리 생각",
    ]
    paragraphs = []

    for section in body_sections:
        content = textwrap.dedent(
            f"""
            ## {section}

            {section} 관점에서 {topic}를 정리해보면 다음과 같습니다. {keywords_text or topic}와(과)
            연관된 사례를 정리하며 핵심을 잡아보세요.
            """
        ).strip()
        paragraphs.append(content)

    outro = textwrap.dedent(
        f"""
        ## 다음 단계

        {topic}를 공부하거나 현업에 적용할 때 가장 중요한 것은 꾸준한 기록입니다.
        오늘 정리한 내용을 바탕으로 자신만의 프로젝트를 만들어보면 어떨까요?
        """
    ).strip()

    article_body = "\n\n".join([intro, *paragraphs, outro])
    title = f"{topic} 가이드" if not keywords_text else f"{topic} ({keywords_text}) 가이드"

    return title, article_body


def publish_post(config: Config, title: str, body: str) -> dict:
    """Publish a post to Naver Blog Write API.

    Parameters
    ----------
    config:
        Loaded configuration with API credentials.
    title:
        Title of the blog post.
    body:
        Markdown-formatted article body. The API expects HTML but it accepts
        simple Markdown snippets as well.
    """

    headers = {
        "Authorization": f"Bearer {config.access_token}",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Naver-Client-Id": config.client_id,
        "X-Naver-Client-Secret": config.client_secret,
    }
    payload = {
        "title": title,
        "contents": body,
        "blogId": config.blog_id,
    }

    LOGGER.debug("POST %s", config.api_base_url)
    response = requests.post(config.api_base_url, headers=headers, data=payload, timeout=10)
    if response.ok:
        LOGGER.info("Successfully published the post. Post ID: %s", response.json().get("postId"))
    else:
        LOGGER.error("Failed to publish post: %s", response.text)
    response.raise_for_status()
    return response.json()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    args = _build_argument_parser().parse_args()

    config = get_config()

    title, body = generate_post(args.topic, args.keywords)
    if args.title_prefix:
        title = f"{args.title_prefix.strip()} {title}".strip()

    print("=" * 40)
    print(title)
    print("=" * 40)
    print(body)

    if args.dry_run:
        LOGGER.info("Dry run enabled; skipping publish step.")
        return

    publish_post(config, title, body)


if __name__ == "__main__":
    main()
