"""단면 치수 입력 모달"""

import uuid
from typing import List, Optional
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QSpinBox, QTabWidget, QWidget,
    QDoubleSpinBox, QMessageBox
)
from PyQt5.QtCore import Qt

from models.data_models import SectionParams, SectionPoint


class SectionDimensionModal(QDialog):
    """단면 치수 입력 모달"""
    
    def __init__(self, params: SectionParams, parent=None, 
                 existing_points: Optional[dict] = None):
        super().__init__(parent)
        self.params = params
        
        # 기존 점들이 있으면 사용, 없으면 빈 리스트
        if existing_points:
            if params.has_step:
                front_points = existing_points.get('front', [])
                back_points = existing_points.get('back', [])
                # 리스트 복사 (SectionPoint 객체는 참조 복사)
                self.section_points_front = list(front_points) if front_points else []
                self.section_points_back = list(back_points) if back_points else []
                self.section_point_count_front = len(self.section_points_front)
                self.section_point_count_back = len(self.section_points_back)
            else:
                single_points = existing_points.get('single', [])
                self.section_points = list(single_points) if single_points else []
                self.section_point_count = len(self.section_points)
        else:
            self.section_points: List[SectionPoint] = []
            self.section_points_front: List[SectionPoint] = []
            self.section_points_back: List[SectionPoint] = []
            self.section_point_count = 0
            self.section_point_count_front = 0
            self.section_point_count_back = 0
        
        self.active_tab = 'front'  # 'front' or 'back'
        
        # 테이블 인스턴스 변수 초기화
        self.single_table = None
        self.front_table = None
        self.back_table = None
        
        self.setWindowTitle("단면 치수 입력")
        self.setGeometry(100, 100, 1000, 600)
        
        layout = QVBoxLayout(self)
        
        # 헤더
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel("단면 치수 입력"))
        header_layout.addStretch()
        
        close_btn = QPushButton("닫기")
        close_btn.clicked.connect(self.accept)
        header_layout.addWidget(close_btn)
        
        layout.addLayout(header_layout)
        
        # 탭 위젯 (단차가 있을 경우)
        if self.params.has_step:
            tabs = QTabWidget()
            
            # 전열 탭
            front_tab = self._create_tab('front')
            tabs.addTab(front_tab, "전열")
            
            # 후열 탭
            back_tab = self._create_tab('back')
            tabs.addTab(back_tab, "후열")
            
            tabs.currentChanged.connect(self._on_tab_changed)
            layout.addWidget(tabs)
            # 탭이 생성된 후 테이블 업데이트 (기존 값이 있으면 표시)
            self._update_table('front')
            self._update_table('back')
        else:
            # 단차가 없을 경우 단일 탭
            single_tab = self._create_tab('single')
            layout.addWidget(single_tab)
            # 탭이 생성된 후 테이블 업데이트 (기존 값이 있으면 표시)
            self._update_table('single')
    
    def _create_tab(self, tab_type: str) -> QWidget:
        """탭 위젯 생성"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # 행 개수 입력
        count_layout = QHBoxLayout()
        count_layout.addWidget(QLabel("행 개수:"))
        
        count_input = QSpinBox()
        count_input.setRange(0, 1000)
        # 기존 값으로 초기화
        if tab_type == 'single':
            count_input.setValue(self.section_point_count)
        elif tab_type == 'front':
            count_input.setValue(self.section_point_count_front)
        elif tab_type == 'back':
            count_input.setValue(self.section_point_count_back)
        else:
            count_input.setValue(0)
        count_input.valueChanged.connect(lambda val: self._on_count_changed(tab_type, val))
        count_layout.addWidget(count_input)
        count_layout.addStretch()
        
        layout.addLayout(count_layout)
        
        # 테이블
        table = QTableWidget()
        table.setColumnCount(4)
        table.setHorizontalHeaderLabels(["#", "X (mm)", "Y (mm)", "R (mm)"])
        table.horizontalHeader().setStretchLastSection(True)
        table.setAlternatingRowColors(True)
        table.setMinimumHeight(400)  # 테이블 최소 높이 설정
        
        # 테이블을 인스턴스 변수로 저장
        if tab_type == 'single':
            self.single_table = table
        elif tab_type == 'front':
            self.front_table = table
        elif tab_type == 'back':
            self.back_table = table
        
        layout.addWidget(table)
        
        # 테이블 업데이트 (초기에는 점이 없으므로 빈 테이블만 표시)
        # 테이블이 생성된 후에만 업데이트 가능
        if table is not None:
            self._update_table(tab_type)
        
        return widget
    
    def _on_tab_changed(self, index: int):
        """탭 변경 이벤트"""
        self.active_tab = 'front' if index == 0 else 'back'
    
    def _on_count_changed(self, tab_type: str, count: int):
        """행 개수 변경 이벤트"""
        if tab_type == 'single':
            self.section_point_count = count
            self._sync_points_list('single', count)
        elif tab_type == 'front':
            self.section_point_count_front = count
            self._sync_points_list('front', count)
        elif tab_type == 'back':
            self.section_point_count_back = count
            self._sync_points_list('back', count)
        
        self._update_table(tab_type)
    
    def _sync_points_list(self, tab_type: str, count: int):
        """점 리스트 동기화"""
        if tab_type == 'single':
            points = self.section_points
            while len(points) < count:
                points.append(SectionPoint(
                    id=str(uuid.uuid4()),
                    x=0,
                    y=0,
                    r=0
                ))
            if len(points) > count:
                self.section_points = points[:count]
        elif tab_type == 'front':
            points = self.section_points_front
            while len(points) < count:
                points.append(SectionPoint(
                    id=str(uuid.uuid4()),
                    x=0,
                    y=0,
                    r=0
                ))
            if len(points) > count:
                self.section_points_front = points[:count]
        elif tab_type == 'back':
            points = self.section_points_back
            while len(points) < count:
                points.append(SectionPoint(
                    id=str(uuid.uuid4()),
                    x=0,
                    y=0,
                    r=0
                ))
            if len(points) > count:
                self.section_points_back = points[:count]
    
    def _update_table(self, tab_type: str):
        """테이블 업데이트"""
        if tab_type == 'single':
            table = self.single_table
            points = self.section_points
        elif tab_type == 'front':
            table = self.front_table
            points = self.section_points_front
        elif tab_type == 'back':
            table = self.back_table
            points = self.section_points_back
        else:
            return
        
        # 테이블이 아직 생성되지 않았으면 무시
        if table is None:
            return
        
        table.setRowCount(len(points))
        
        # 기존 연결 해제 (연결이 있을 경우에만)
        try:
            table.cellChanged.disconnect()
        except TypeError:
            pass  # 연결이 없으면 무시
        
        for i, point in enumerate(points):
            # #
            table.setItem(i, 0, QTableWidgetItem(str(i + 1)))
            
            # X
            x_item = QTableWidgetItem(str(point.x))
            x_item.setData(Qt.UserRole, ('x', point.id, tab_type))
            table.setItem(i, 1, x_item)
            
            # Y
            y_item = QTableWidgetItem(str(point.y))
            y_item.setData(Qt.UserRole, ('y', point.id, tab_type))
            table.setItem(i, 2, y_item)
            
            # R
            r_item = QTableWidgetItem(str(point.r))
            r_item.setData(Qt.UserRole, ('r', point.id, tab_type))
            table.setItem(i, 3, r_item)
        
        # 셀 변경 이벤트 연결
        def make_handler(tab):
            return lambda row, col: self._on_cell_changed(row, col, tab)
        table.cellChanged.connect(make_handler(tab_type))
    
    def _on_cell_changed(self, row: int, col: int, tab_type: str):
        """셀 변경 이벤트"""
        if tab_type == 'single':
            table = self.single_table
            points = self.section_points
        elif tab_type == 'front':
            table = self.front_table
            points = self.section_points_front
        elif tab_type == 'back':
            table = self.back_table
            points = self.section_points_back
        else:
            return
        
        if row >= len(points):
            return
        
        item = table.item(row, col)
        if not item:
            return
        
        user_data = item.data(Qt.UserRole)
        if not user_data:
            return
        
        field_name, point_id, _ = user_data
        point = next((p for p in points if p.id == point_id), None)
        if not point:
            return
        
        try:
            value = float(item.text())
            
            if field_name == 'x':
                point.x = value
            elif field_name == 'y':
                point.y = value
            elif field_name == 'r':
                point.r = value
        except ValueError:
            pass
    
    def get_section_points(self):
        """단면 점들 반환"""
        if self.params.has_step:
            return {
                'front': self.section_points_front,
                'back': self.section_points_back
            }
        else:
            return {
                'single': self.section_points
            }

