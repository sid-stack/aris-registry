from setuptools import setup, find_packages
import pathlib

HERE = pathlib.Path(__file__).parent

README = (HERE / "README.md").read_text()

setup(
    name="aris-sdk",
    version="0.1.4",  # Unreleased: balance/usage registry APIs, chat + Conversation SDK
    description="Decentralized AI Network SDK and Node Infrastructure",
    long_description=README,
    long_description_content_type="text/markdown",
    author="Sid",
    author_email="sid@aris.ai",
    license="MIT",
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
    ],
    packages=find_packages(exclude=("aris.tests", "aris.tests.*")),
    include_package_data=True,
    install_requires=[
        "fastapi",
        "uvicorn",
        "httpx>=0.27.0,<0.28.0",
        "requests",
        "pydantic",
        "motor>=3.0",
        "stripe>=11.0",
        "python-dotenv",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "click",  # Added for future CLI enhancements
    ],

    entry_points={
        "console_scripts": [
            "aris-registry=registry.main:start",
            "aris-node=agent_node.llm_agent:start",
        ]
    },
)