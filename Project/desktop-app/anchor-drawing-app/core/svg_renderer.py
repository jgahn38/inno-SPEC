"""SVG 렌더링"""

import svgwrite
from typing import List, Optional
from models.data_models import AnchorPoint, SectionParams, AnchorRect


# 상수 정의 (SectionView.tsx에서 가져옴)
ANCHOR_FILL_COLOR = '#FF0000'  # 앵커 점은 빨간색
ANCHOR_STROKE_COLOR = '#FF0000'
SECTION_STROKE_COLOR = '#000000'
MAIN_LINE_STROKE_WIDTH = "3"  # 메인 선의 굵기
ANCHOR_OUTER_RADIUS_RATIO = 0.0025
ANCHOR_OUTER_RADIUS_MIN = 2.4
ANCHOR_INNER_RADIUS_RATIO = 0.45
ANCHOR_INNER_RADIUS_MIN = 10
ANCHOR_RING_STROKE_RATIO = 0.12
ANCHOR_RING_STROKE_MIN = 0.4
ANCHOR_INNER_STROKE_RATIO = 0.08
ANCHOR_INNER_STROKE_MIN = 0.2


class SVGRenderer:
    """SVG 렌더링 클래스"""
    
    def __init__(self, params: SectionParams):
        """
        Args:
            params: 삽도 기본 파라미터
        """
        self.params = params
    
    def render_section(
        self, 
        anchor_points: List[AnchorPoint],
        section_path: Optional[str] = None
    ) -> svgwrite.Drawing:
        """
        삽도 SVG 생성
        
        Args:
            anchor_points: 앵커 점 리스트
            section_path: 삽도 경로 (없으면 자동 생성)
            
        Returns:
            SVG Drawing 객체
        """
        dwg = svgwrite.Drawing(
            size=(f"{self.params.width}mm", f"{self.params.height}mm"),
            viewBox=f"0 0 {self.params.width} {self.params.height}"
        )
        
        # 삽도 직사각형
        if section_path:
            dwg.add(dwg.path(
                d=section_path,
                fill="none",
                stroke=SECTION_STROKE_COLOR,
                stroke_width=MAIN_LINE_STROKE_WIDTH
            ))
        else:
            dwg.add(dwg.rect(
                insert=(0, 0),
                size=(f"{self.params.width}mm", f"{self.params.height}mm"),
                fill="none",
                stroke=SECTION_STROKE_COLOR,
                stroke_width=MAIN_LINE_STROKE_WIDTH
            ))
        
        # 앵커 점 렌더링
        for anchor in anchor_points:
            self._render_anchor(dwg, anchor)
        
        return dwg
    
    def _render_anchor(self, dwg: svgwrite.Drawing, anchor: AnchorPoint):
        """
        앵커 점 렌더링 (원형 마커)
        
        Args:
            dwg: SVG Drawing 객체
            anchor: 앵커 점 정보
        """
        # 기본 치수 계산
        base_dimension = max(self.params.width, self.params.height)
        
        # 외부 반지름 계산
        outer_radius = max(
            base_dimension * ANCHOR_OUTER_RADIUS_RATIO, 
            ANCHOR_OUTER_RADIUS_MIN
        )
        
        # 내부 반지름 계산
        inner_radius = max(
            outer_radius * ANCHOR_INNER_RADIUS_RATIO, 
            ANCHOR_INNER_RADIUS_MIN
        )
        
        # 링 선 굵기 계산
        ring_stroke = max(
            outer_radius * ANCHOR_RING_STROKE_RATIO, 
            ANCHOR_RING_STROKE_MIN
        )
        
        # 내부 선 굵기 계산
        inner_stroke = max(
            outer_radius * ANCHOR_INNER_STROKE_RATIO, 
            ANCHOR_INNER_STROKE_MIN
        )
        
        # 외부 원
        dwg.add(dwg.circle(
            center=(anchor.x, anchor.y),
            r=f"{outer_radius}mm",
            fill=ANCHOR_FILL_COLOR,
            stroke=ANCHOR_STROKE_COLOR,
            stroke_width=f"{ring_stroke}mm"
        ))
        
        # 내부 원
        dwg.add(dwg.circle(
            center=(anchor.x, anchor.y),
            r=f"{inner_radius}mm",
            fill="none",
            stroke=ANCHOR_STROKE_COLOR,
            stroke_width=f"{inner_stroke}mm"
        ))
    
    def render_coping_preview(self, view_type: str = 'plan', section_points: List = None) -> svgwrite.Drawing:
        """
        코핑 형상 미리보기 SVG 생성
        
        Args:
            view_type: 뷰 타입 ('plan', 'section', 'side')
            section_points: 단면 점들 (section 뷰일 경우)
            
        Returns:
            SVG Drawing 객체
        """
        if view_type == 'plan':
            return self._render_coping_plan()
        elif view_type == 'side':
            return self._render_coping_side()
        elif view_type == 'section':
            return self._render_coping_section(section_points)
        else:
            return self._render_coping_plan()
    
    def _render_coping_plan(self) -> svgwrite.Drawing:
        """평면 뷰 렌더링"""
        if self.params.width <= 0 or self.params.height <= 0:
            # 기본값 설정
            width, height = 1000, 1000
        else:
            width, height = self.params.width, self.params.height
        
        # Padding 계산 (형상 크기의 5% 또는 최소 100)
        padding = max(width, height) * 0.05
        padding = max(padding, 100)
        
        # viewBox 확장 (padding 포함)
        view_x = -padding
        view_y = -padding
        view_width = width + padding * 2
        view_height = height + padding * 2
        
        dwg = svgwrite.Drawing(
            size=(f"{view_width}mm", f"{view_height}mm"),
            viewBox=f"{view_x} {view_y} {view_width} {view_height}"
        )
        
        # 흰색 배경 (viewBox 전체)
        dwg.add(dwg.rect(
            insert=(view_x, view_y),
            size=(view_width, view_height),
            fill="#ffffff"
        ))
        
        # 그리드 배경 (형상 영역만)
        grid_pattern = dwg.defs.add(dwg.pattern(
            id="coping-grid",
            size=(20, 20),
            patternUnits="userSpaceOnUse"
        ))
        grid_pattern.add(dwg.path(
            d="M 20 0 L 0 0 0 20",
            fill="none",
            stroke="#e5e7eb",
            stroke_width="0.5"
        ))
        dwg.add(dwg.rect(
            insert=(0, 0),
            size=(width, height),
            fill="url(#coping-grid)"
        ))
        
        # 코핑 형상 (직사각형) - padding 적용된 위치
        dwg.add(dwg.rect(
            insert=(0, 0),
            size=(width, height),
            fill="none",
            stroke=SECTION_STROKE_COLOR,
            stroke_width=MAIN_LINE_STROKE_WIDTH
        ))
        
        # 단차 점선
        if self.params.has_step and 0 < self.params.step_value < height:
            step_y = height - self.params.step_value
            dwg.add(dwg.line(
                start=(0, step_y),
                end=(width, step_y),
                stroke=SECTION_STROKE_COLOR,
                stroke_width="2",
                stroke_dasharray="5,5",
                stroke_opacity=0.7
            ))
        
        return dwg
    
    def _render_coping_side(self) -> svgwrite.Drawing:
        """측면 뷰 렌더링"""
        # 측면 뷰에서 사용할 높이 값 결정
        side_height = max(self.params.height_front, self.params.height_back) if self.params.has_step else self.params.height
        side_length = self.params.height  # 길이 값
        
        # 기본값 설정
        if side_height <= 0:
            side_height = 1000
        if side_length <= 0:
            side_length = 1000
        
        # Padding 계산 (형상 크기의 5% 또는 최소 100)
        padding = max(side_length, side_height) * 0.05
        padding = max(padding, 100)
        
        # viewBox 확장 (padding 포함)
        view_x = -padding
        view_y = -padding
        view_width = side_length + padding * 2
        view_height = side_height + padding * 2
        
        dwg = svgwrite.Drawing(
            size=(f"{view_width}mm", f"{view_height}mm"),
            viewBox=f"{view_x} {view_y} {view_width} {view_height}"
        )
        
        # 흰색 배경 (viewBox 전체)
        dwg.add(dwg.rect(
            insert=(view_x, view_y),
            size=(view_width, view_height),
            fill="#ffffff"
        ))
        
        # 그리드 배경 (형상 영역만)
        grid_pattern = dwg.defs.add(dwg.pattern(
            id="coping-side-grid",
            size=(20, 20),
            patternUnits="userSpaceOnUse"
        ))
        grid_pattern.add(dwg.path(
            d="M 20 0 L 0 0 0 20",
            fill="none",
            stroke="#e5e7eb",
            stroke_width="0.5"
        ))
        dwg.add(dwg.rect(
            insert=(0, 0),
            size=(side_length, side_height),
            fill="url(#coping-side-grid)"
        ))
        
        if self.params.has_step:
            # 전열 부분 (좌측) - viewBox 좌표계에 맞춰 단위 없이 숫자만 사용
            front_width = self.params.step_value if self.params.step_value > 0 else side_length
            dwg.add(dwg.rect(
                insert=(0, side_height - self.params.height_front),
                size=(front_width, self.params.height_front),
                fill="none",
                stroke=SECTION_STROKE_COLOR,
                stroke_width=MAIN_LINE_STROKE_WIDTH
            ))
            
            # 후열 부분 (우측) - viewBox 좌표계에 맞춰 단위 없이 숫자만 사용
            back_start_x = self.params.step_value if self.params.step_value > 0 else 0
            back_width = side_length - back_start_x
            dwg.add(dwg.rect(
                insert=(back_start_x, side_height - self.params.height_back),
                size=(back_width, self.params.height_back),
                fill="none",
                stroke=SECTION_STROKE_COLOR,
                stroke_width=MAIN_LINE_STROKE_WIDTH
            ))
            
            # 단차 위치 표시 (점선)
            if 0 < self.params.step_value < side_length:
                dwg.add(dwg.line(
                    start=(self.params.step_value, 0),
                    end=(self.params.step_value, side_height),
                    stroke=SECTION_STROKE_COLOR,
                    stroke_width="2",
                    stroke_dasharray="5,5",
                    stroke_opacity=0.7
                ))
        else:
            # 단일 직사각형 - viewBox 좌표계에 맞춰 단위 없이 숫자만 사용
            dwg.add(dwg.rect(
                insert=(0, side_height - self.params.height),
                size=(side_length, self.params.height),
                fill="none",
                stroke=SECTION_STROKE_COLOR,
                stroke_width=MAIN_LINE_STROKE_WIDTH
            ))
        
        return dwg
    
    def _render_coping_section(self, section_points: List = None) -> svgwrite.Drawing:
        """단면 뷰 렌더링"""
        if not section_points or len(section_points) == 0:
            # 단면 점이 없으면 평면과 동일하게 처리
            return self._render_coping_plan()
        
        # 경계 계산
        xs = [p.x for p in section_points]
        ys = [p.y for p in section_points]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        width = max_x - min_x if max_x > min_x else 100
        height = max_y - min_y if max_y > min_y else 100
        
        padding = max(width, height) * 0.1 or 20
        view_x = min_x - padding
        view_y = min_y - padding
        view_width = width + padding * 2
        view_height = height + padding * 2
        
        dwg = svgwrite.Drawing(
            size=(f"{view_width}mm", f"{view_height}mm"),
            viewBox=f"{view_x} {view_y} {view_width} {view_height}"
        )
        
        # 흰색 배경
        dwg.add(dwg.rect(
            insert=(view_x, view_y),
            size=(view_width, view_height),
            fill="#ffffff"
        ))
        
        # 그리드 배경
        grid_pattern = dwg.defs.add(dwg.pattern(
            id="section-grid",
            size=(20, 20),
            patternUnits="userSpaceOnUse"
        ))
        grid_pattern.add(dwg.path(
            d="M 20 0 L 0 0 0 20",
            fill="none",
            stroke="#e5e7eb",
            stroke_width="0.5"
        ))
        dwg.add(dwg.rect(
            insert=(view_x, view_y),
            size=(view_width, view_height),
            fill="url(#section-grid)"
        ))
        
        # 단면 경로 생성
        import math
        path_data = f"M {section_points[0].x} {section_points[0].y}"
        for i in range(1, len(section_points)):
            point = section_points[i]
            prev_point = section_points[i - 1]
            
            if point.r == 0 or abs(point.r) < 0.001:
                path_data += f" L {point.x} {point.y}"
            else:
                # 호 그리기
                dx = point.x - prev_point.x
                dy = point.y - prev_point.y
                distance = (dx**2 + dy**2)**0.5
                
                if abs(point.r) < distance / 2:
                    path_data += f" L {point.x} {point.y}"
                else:
                    radius = abs(point.r)
                    is_negative = point.r < 0
                    
                    mid_x = (prev_point.x + point.x) / 2
                    mid_y = (prev_point.y + point.y) / 2
                    perp_x = -dy / distance if distance > 0 else 0
                    perp_y = dx / distance if distance > 0 else 0
                    h = radius - (radius**2 - (distance / 2)**2)**0.5 if radius > distance / 2 else 0
                    center_x = mid_x + perp_x * h
                    center_y = mid_y + perp_y * h
                    
                    start_angle = math.atan2(prev_point.y - center_y, prev_point.x - center_x)
                    end_angle = math.atan2(point.y - center_y, point.x - center_x)
                    angle_diff = end_angle - start_angle
                    
                    while angle_diff > math.pi:
                        angle_diff -= 2 * math.pi
                    while angle_diff < -math.pi:
                        angle_diff += 2 * math.pi
                    
                    large_arc = 1 if abs(angle_diff) > math.pi else 0
                    sweep = 1 if angle_diff > 0 else 0
                    if is_negative:
                        sweep = 1 - sweep
                    
                    path_data += f" A {radius} {radius} 0 {large_arc} {sweep} {point.x} {point.y}"
        
        path_data += " Z"
        
        dwg.add(dwg.path(
            d=path_data,
            fill="none",
            stroke=SECTION_STROKE_COLOR,
            stroke_width=MAIN_LINE_STROKE_WIDTH
        ))
        
        # 점 표시
        for point in section_points:
            dwg.add(dwg.circle(
                center=(point.x, point.y),
                r="3",
                fill=SECTION_STROKE_COLOR,
                stroke=SECTION_STROKE_COLOR
            ))
        
        return dwg

