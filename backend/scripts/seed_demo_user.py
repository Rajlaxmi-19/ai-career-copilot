"""Create a demo user for local skill management testing."""

import asyncio
import uuid

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.user import User

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEMO_USER_EMAIL = "demo@careercopilot.local"


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == DEMO_USER_ID))
        if result.scalar_one_or_none() is not None:
            print(f"Demo user already exists: {DEMO_USER_ID}")
            return

        session.add(User(id=DEMO_USER_ID, email=DEMO_USER_EMAIL))
        await session.commit()
        print(f"Created demo user: {DEMO_USER_ID} ({DEMO_USER_EMAIL})")


if __name__ == "__main__":
    asyncio.run(seed())
