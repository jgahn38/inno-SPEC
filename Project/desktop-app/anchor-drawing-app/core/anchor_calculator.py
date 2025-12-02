"""앵커 계산 로직"""

from typing import List, Tuple, Optional
from models.data_models import Point, AnchorPoint, AnchorRect


class AnchorCalculator:
    """앵커 그리드 계산 클래스"""
    
    @staticmethod
    def calculate_anchor_grid(
        point: Point,
        base_x: float,
        base_y: float,
        is_front_row: bool,
        support_index: int
    ) -> Tuple[List[AnchorPoint], Optional[AnchorRect]]:
        """
        앵커 그리드 계산
        
        Args:
            point: 받침 위치 및 앵커 정보
            base_x: 받침 중심점 X 좌표 (mm)
            base_y: 받침 중심점 Y 좌표 (mm)
            is_front_row: 전열 여부
            support_index: 받침 인덱스
            
        Returns:
            (앵커 점 리스트, 앵커 그리드 사각형 정보)
        """
        anchor_points: List[AnchorPoint] = []
        anchor_rect: Optional[AnchorRect] = None
        
        # 앵커 배치 조건 확인
        if (point.anchor_row_count_axial > 0 and 
            point.anchor_row_count_vertical > 0 and
            point.anchor_gap_axial > 0 and 
            point.anchor_gap_vertical > 0):
            
            # 앵커 그리드의 총 크기 계산
            # 교축(axial) 열 개수는 Y축 방향에 적용, 교직(vertical) 열 개수는 X축 방향에 적용
            # 교축(axial) 간격은 Y축 방향에 적용, 교직(vertical) 간격은 X축 방향에 적용
            total_width = (point.anchor_row_count_vertical - 1) * point.anchor_gap_vertical
            total_height = (point.anchor_row_count_axial - 1) * point.anchor_gap_axial
            
            # 시작 위치 계산 (받침위치를 중심으로 배치)
            # X축: 받침위치를 중심으로 좌우로 배치
            start_x = base_x - total_width / 2
            
            # Y축: 받침위치를 중심으로 배치
            # SVG 좌표계에서는 Y축이 아래로 증가하므로:
            # - 전열(좌측 하단 기준): baseY에서 위쪽으로 올라가야 하므로 Y값 감소
            # - 후열(좌측 상단 기준): baseY에서 위쪽으로 올라가야 하므로 Y값 감소
            start_y = base_y - total_height / 2

            # 앵커 그리드 사각형 정보 저장 (받침 중심점 기준으로 1.5배 확대)
            rect_width = total_width * 1.5
            rect_height = total_height * 1.5
            rect_start_x = base_x - rect_width / 2
            rect_start_y = base_y - rect_height / 2
            
            anchor_rect = AnchorRect(
                x=rect_start_x,
                y=rect_start_y,
                width=rect_width,
                height=rect_height,
                base_x=base_x,
                base_y=base_y,
                point_id=point.id
            )

            # 앵커 그리드 생성
            # X축 방향: 교직(vertical) 열 개수 사용
            # Y축 방향: 교축(axial) 열 개수 사용
            for i in range(point.anchor_row_count_vertical):
                for j in range(point.anchor_row_count_axial):
                    # X축 방향에는 교직 간격 사용
                    anchor_x = start_x + i * point.anchor_gap_vertical
                    # Y축 방향에는 교축 간격 사용
                    anchor_y = start_y + j * point.anchor_gap_axial
                    
                    anchor_points.append(AnchorPoint(
                        x=anchor_x,
                        y=anchor_y,
                        is_front_row=is_front_row,
                        support_index=support_index
                    ))
        
        return anchor_points, anchor_rect

