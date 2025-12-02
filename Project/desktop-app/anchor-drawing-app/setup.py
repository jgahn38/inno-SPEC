from setuptools import setup, find_packages

setup(
    name="anchor-drawing-app",
    version="1.0.0",
    description="앵커 삽도 생성 데스크톱 애플리케이션",
    author="Inno-Spec",
    packages=find_packages(),
    install_requires=[
        "PyQt5>=5.15.0",
        "svgwrite>=1.4.3",
    ],
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "anchor-drawing=main:main",
        ],
    },
)

