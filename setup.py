from setuptools import setup, find_packages
import pathlib

HERE = pathlib.Path(__file__).parent

README = (HERE / "README.md").read_text()

setup(
    name="aris-sdk",
    version="0.1.3",  # 🚨 Bumped version for the update
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
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi",
        "uvicorn",
        "requests",
        "pydantic",
        "python-dotenv",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "click",  # Added for future CLI enhancements
    ],

    entry_points={
        "console_scripts": [
            "aris-registry=aris_registry_api.main:start",
            "aris-node=bidsmith_api.llm_agent:start",
        ]
    },
)