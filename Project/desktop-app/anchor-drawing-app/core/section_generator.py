"""삽도 생성 로직"""

from typing import List
from models.data_models import SectionParams, Point, AnchorPoint


class SectionGenerator:
    """삽도 생성 클래스"""
    
    def __init__(self, params: SectionParams):
        """
        Args:
            params: 삽도 기본 파라미터
        """
        self.params = params
    
    def generate_rectangle_path(self) -> str:
        """
        직사각형 삽도 경로 생성
        
        Returns:
            SVG 경로 문자열
        """
        width = self.params.width
        height = self.params.height
        
        # 직사각형 삽도 생성
        rectangle_points = [
            (0, 0),           # 좌상단
            (width, 0),       # 우상단
            (width, height),  # 우하단
            (0, height),      # 좌하단
            (0, 0)            # 다시 좌상단으로 닫기
        ]

        path = f"M {rectangle_points[0][0]} {rectangle_points[0][1]}"
        for i in range(1, len(rectangle_points)):
            path += f" L {rectangle_points[i][0]} {rectangle_points[i][1]}"
        path += " Z"
        
        return path

