"""데이터 모델 정의"""

from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class SectionParams:
    """삽도 기본 파라미터"""
    width: float = 10000  # 너비 (mm)
    height: float = 3000  # 높이 (mm)
    height_front: float = 3000  # 높이(전열) (mm)
    height_back: float = 3000  # 높이(후열) (mm)
    front_row_count: int = 2  # 받침개수(전열)
    back_row_count: int = 2  # 받침개수(후열)
    has_step: bool = False  # 단차 사용 여부
    step_value: float = 0  # 단차 값 (mm)


@dataclass
class Point:
    """받침 위치 및 앵커 정보"""
    id: str
    offset_x: float = 0  # 기준점으로부터의 X 오프셋 (mm)
    offset_y: float = 0  # 기준점으로부터의 Y 오프셋 (mm)
    anchor_row_count_axial: int = 0  # 앵커열 개수(교축)
    anchor_row_count_vertical: int = 0  # 앵커열 개수(교직)
    anchor_gap_axial: float = 0  # 앵커간격(교축) (mm)
    anchor_gap_vertical: float = 0  # 앵커간격(교직) (mm)
    effective_embed_length: float = 0  # 유효 묻힘길이 (mm)


@dataclass
class AnchorPoint:
    """앵커 점 정보"""
    x: float  # X 좌표 (mm)
    y: float  # Y 좌표 (mm)
    is_front_row: bool  # 전열 여부
    support_index: int  # 받침 인덱스


@dataclass
class AnchorRect:
    """앵커 그리드 사각형 정보"""
    x: float  # X 좌표 (mm)
    y: float  # Y 좌표 (mm)
    width: float  # 너비 (mm)
    height: float  # 높이 (mm)
    base_x: float  # 받침 중심점 X (mm)
    base_y: float  # 받침 중심점 Y (mm)
    point_id: str  # 포인트 ID


@dataclass
class SectionPoint:
    """단면 점 정보"""
    id: str
    x: float  # X 좌표 (mm)
    y: float  # Y 좌표 (mm)
    r: float = 0  # 반지름 (mm, 선택적)

