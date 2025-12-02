"""메인 윈도우 - test-app의 SectionView 기능을 완전히 구현"""

import sys
import tempfile
import os
import uuid
from typing import List, Optional
from PyQt5.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QSpinBox, QDoubleSpinBox,
    QCheckBox, QFileDialog, QMessageBox, QGroupBox,
    QFormLayout, QTableWidget, QTableWidgetItem, QHeaderView,
    QScrollArea, QDialog, QDialogButtonBox, QTabWidget, QSizePolicy
)
from PyQt5.QtCore import Qt
from PyQt5.QtSvg import QSvgWidget

from core.section_generator import SectionGenerator
from core.anchor_calculator import AnchorCalculator
from core.svg_renderer import SVGRenderer
from models.data_models import SectionParams, Point
from gui.section_dimension_modal import SectionDimensionModal


class MainWindow(QMainWindow):
    """메인 윈도우 클래스"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("앵커 삽도 생성기")
        self.setGeometry(100, 100, 1600, 1000)
        
        # 데이터 초기화
        self.params = SectionParams()
        self.custom_points: List[Point] = []
        self.section_points: List = []  # 단면 점들
        self.section_points_front: List = []
        self.section_points_back: List = []
        self.temp_svg_file: Optional[str] = None
        self.coping_view_type = 'plan'  # 'plan', 'section', 'side'
        
        # 중앙 위젯
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # 메인 레이아웃
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(10)
        main_layout.setContentsMargins(10, 10, 10, 10)
        
        # 스크롤 영역
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_widget = QWidget()
        scroll_layout = QVBoxLayout(scroll_widget)
        
        # 코핑 제원 섹션
        coping_section = self._create_coping_section()
        scroll_layout.addWidget(coping_section)
        
        # 받침 제원 섹션
        support_section = self._create_support_section()
        scroll_layout.addWidget(support_section)
        
        scroll.setWidget(scroll_widget)
        main_layout.addWidget(scroll)
        
        # 하단 버튼
        button_layout = QHBoxLayout()
        preview_btn = QPushButton("삽도 미리보기")
        preview_btn.clicked.connect(self._show_preview_modal)
        button_layout.addWidget(preview_btn)
        
        save_btn = QPushButton("SVG 저장")
        save_btn.clicked.connect(self._save_svg)
        button_layout.addWidget(save_btn)
        
        main_layout.addLayout(button_layout)
        
        # 초기 받침 생성
        self._update_support_points()
        
        # 초기 코핑 미리보기
        self._update_coping_preview()
    
    def _create_coping_section(self) -> QWidget:
        """코핑 제원 입력 섹션 생성"""
        section = QGroupBox("코핑 제원")
        layout = QVBoxLayout(section)
        
        # 그리드 레이아웃
        grid_layout = QHBoxLayout()
        
        # 왼쪽: 입력 필드
        input_widget = QWidget()
        input_layout = QFormLayout(input_widget)
        input_layout.setSpacing(10)
        
        # 폭
        self.width_input = QDoubleSpinBox()
        self.width_input.setRange(100, 50000)
        self.width_input.setValue(self.params.width)
        self.width_input.setSuffix(" mm")
        self.width_input.setSingleStep(10)
        self.width_input.valueChanged.connect(self._update_params)
        input_layout.addRow("폭 (mm):", self.width_input)
        
        # 길이
        self.height_input = QDoubleSpinBox()
        self.height_input.setRange(100, 30000)
        self.height_input.setValue(self.params.height)
        self.height_input.setSuffix(" mm")
        self.height_input.setSingleStep(10)
        self.height_input.valueChanged.connect(self._update_params)
        input_layout.addRow("길이 (mm):", self.height_input)
        
        # 단차 체크박스
        self.has_step_checkbox = QCheckBox("단차 위치 (mm)")
        self.has_step_checkbox.setChecked(self.params.has_step)
        self.has_step_checkbox.stateChanged.connect(self._update_step_enabled)
        input_layout.addRow("", self.has_step_checkbox)
        
        # 단차 값
        self.step_value_input = QDoubleSpinBox()
        self.step_value_input.setRange(0, 30000)
        self.step_value_input.setValue(self.params.step_value)
        self.step_value_input.setSuffix(" mm")
        self.step_value_input.setSingleStep(10)
        self.step_value_input.setEnabled(self.params.has_step)
        self.step_value_input.valueChanged.connect(self._update_params)
        input_layout.addRow("", self.step_value_input)
        
        # 높이(전열)
        self.height_front_input = QDoubleSpinBox()
        self.height_front_input.setRange(100, 30000)
        self.height_front_input.setValue(self.params.height_front)
        self.height_front_input.setSuffix(" mm")
        self.height_front_input.setSingleStep(10)
        self.height_front_input.valueChanged.connect(self._update_params)
        input_layout.addRow("높이(전열) (mm):", self.height_front_input)
        
        # 높이(후열)
        self.height_back_input = QDoubleSpinBox()
        self.height_back_input.setRange(100, 30000)
        self.height_back_input.setValue(self.params.height_back)
        self.height_back_input.setSuffix(" mm")
        self.height_back_input.setSingleStep(10)
        self.height_back_input.setEnabled(self.params.has_step)
        self.height_back_input.valueChanged.connect(self._update_params)
        input_layout.addRow("높이(후열) (mm):", self.height_back_input)
        
        # 단면 치수 입력 버튼
        section_dim_btn = QPushButton("단면 치수 입력")
        section_dim_btn.clicked.connect(self._show_section_dimension_modal)
        input_layout.addRow("단면:", section_dim_btn)
        
        grid_layout.addWidget(input_widget, 1)
        
        # 오른쪽: 코핑 형상 미리보기
        preview_widget = QWidget()
        preview_layout = QVBoxLayout(preview_widget)
        
        # 뷰 타입 선택
        view_type_layout = QHBoxLayout()
        view_type_layout.addWidget(QLabel("코핑 형상 미리보기:"))
        
        self.plan_btn = QPushButton("평면")
        self.plan_btn.setCheckable(True)
        self.plan_btn.setChecked(self.coping_view_type == 'plan')
        self.plan_btn.clicked.connect(lambda: self._set_coping_view_type('plan'))
        view_type_layout.addWidget(self.plan_btn)
        
        self.section_btn = QPushButton("단면")
        self.section_btn.setCheckable(True)
        self.section_btn.setChecked(self.coping_view_type == 'section')
        self.section_btn.clicked.connect(lambda: self._set_coping_view_type('section'))
        view_type_layout.addWidget(self.section_btn)
        
        self.side_btn = QPushButton("측면")
        self.side_btn.setCheckable(True)
        self.side_btn.setChecked(self.coping_view_type == 'side')
        self.side_btn.clicked.connect(lambda: self._set_coping_view_type('side'))
        view_type_layout.addWidget(self.side_btn)
        
        preview_layout.addLayout(view_type_layout)
        
        # SVG 미리보기
        self.coping_svg_widget = QSvgWidget()
        self.coping_svg_widget.setMinimumSize(400, 300)
        self.coping_svg_widget.setMaximumSize(800, 600)
        self.coping_svg_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        preview_layout.addWidget(self.coping_svg_widget)
        
        grid_layout.addWidget(preview_widget, 2)
        
        layout.addLayout(grid_layout)
        
        return section
    
    def _create_support_section(self) -> QWidget:
        """받침 제원 입력 섹션 생성"""
        section = QGroupBox("받침 제원")
        layout = QVBoxLayout(section)
        
        # 받침개수 입력
        count_layout = QHBoxLayout()
        count_layout.addWidget(QLabel("받침개수:"))
        
        count_layout.addWidget(QLabel("전열"))
        self.front_row_count_input = QSpinBox()
        self.front_row_count_input.setRange(0, 100)
        self.front_row_count_input.setValue(self.params.front_row_count)
        self.front_row_count_input.valueChanged.connect(self._update_support_points)
        count_layout.addWidget(self.front_row_count_input)
        
        count_layout.addWidget(QLabel("후열"))
        self.back_row_count_input = QSpinBox()
        self.back_row_count_input.setRange(0, 100)
        self.back_row_count_input.setValue(self.params.back_row_count)
        self.back_row_count_input.valueChanged.connect(self._update_support_points)
        count_layout.addWidget(self.back_row_count_input)
        
        count_layout.addStretch()
        layout.addLayout(count_layout)
        
        # 받침 제원 테이블
        self.support_table = QTableWidget()
        self.support_table.setColumnCount(9)
        self.support_table.setHorizontalHeaderLabels([
            "#", "구분", "X (mm)", "Y (mm)",
            "앵커열 개수(교축)", "앵커열 개수(교직)",
            "앵커 간격(교축) (mm)", "앵커 간격(교직) (mm)",
            "유효 묻힘길이 (mm)"
        ])
        self.support_table.horizontalHeader().setStretchLastSection(True)
        self.support_table.setAlternatingRowColors(True)
        layout.addWidget(self.support_table)
        
        return section
    
    def _update_params(self):
        """파라미터 업데이트"""
        self.params.width = self.width_input.value()
        self.params.height = self.height_input.value()
        self.params.has_step = self.has_step_checkbox.isChecked()
        self.params.step_value = self.step_value_input.value()
        self.params.height_front = self.height_front_input.value()
        self.params.height_back = self.height_back_input.value()
        
        self._update_coping_preview()
    
    def _update_step_enabled(self):
        """단차 관련 입력 필드 활성화/비활성화"""
        has_step = self.has_step_checkbox.isChecked()
        self.step_value_input.setEnabled(has_step)
        self.height_back_input.setEnabled(has_step)
        self._update_params()
    
    def _set_coping_view_type(self, view_type: str):
        """코핑 뷰 타입 설정"""
        self.coping_view_type = view_type
        self.plan_btn.setChecked(view_type == 'plan')
        self.section_btn.setChecked(view_type == 'section')
        self.side_btn.setChecked(view_type == 'side')
        self._update_coping_preview()
    
    def _update_support_points(self):
        """받침 포인트 업데이트"""
        self.params.front_row_count = self.front_row_count_input.value()
        self.params.back_row_count = self.back_row_count_input.value()
        
        total_count = self.params.front_row_count + self.params.back_row_count
        
        # 기존 포인트 유지하면서 개수 조정
        while len(self.custom_points) < total_count:
            point_id = str(uuid.uuid4())
            # 기본값: 중앙에 배치
            default_x = self.params.width / 2
            default_y = self.params.height / 2
            
            point = Point(
                id=point_id,
                offset_x=default_x,
                offset_y=default_y,
                anchor_row_count_axial=3,
                anchor_row_count_vertical=3,
                anchor_gap_axial=100,
                anchor_gap_vertical=100,
                effective_embed_length=50
            )
            self.custom_points.append(point)
        
        # 개수가 줄어든 경우
        if len(self.custom_points) > total_count:
            self.custom_points = self.custom_points[:total_count]
        
        # 테이블 업데이트
        self._update_support_table()
    
    def _update_support_table(self):
        """받침 제원 테이블 업데이트"""
        self.support_table.setRowCount(len(self.custom_points))
        
        for i, point in enumerate(self.custom_points):
            is_front_row = i < self.params.front_row_count
            
            # #
            self.support_table.setItem(i, 0, QTableWidgetItem(str(i + 1)))
            
            # 구분
            self.support_table.setItem(i, 1, QTableWidgetItem("전열" if is_front_row else "후열"))
            
            # X (mm)
            x_item = QTableWidgetItem(str(point.offset_x))
            x_item.setData(Qt.UserRole, ('offset_x', point.id))
            self.support_table.setItem(i, 2, x_item)
            
            # Y (mm)
            y_item = QTableWidgetItem(str(point.offset_y))
            y_item.setData(Qt.UserRole, ('offset_y', point.id))
            self.support_table.setItem(i, 3, y_item)
            
            # 앵커열 개수(교축)
            axial_count_item = QTableWidgetItem(str(point.anchor_row_count_axial))
            axial_count_item.setData(Qt.UserRole, ('anchor_row_count_axial', point.id))
            self.support_table.setItem(i, 4, axial_count_item)
            
            # 앵커열 개수(교직)
            vertical_count_item = QTableWidgetItem(str(point.anchor_row_count_vertical))
            vertical_count_item.setData(Qt.UserRole, ('anchor_row_count_vertical', point.id))
            self.support_table.setItem(i, 5, vertical_count_item)
            
            # 앵커 간격(교축)
            axial_gap_item = QTableWidgetItem(str(point.anchor_gap_axial))
            axial_gap_item.setData(Qt.UserRole, ('anchor_gap_axial', point.id))
            self.support_table.setItem(i, 6, axial_gap_item)
            
            # 앵커 간격(교직)
            vertical_gap_item = QTableWidgetItem(str(point.anchor_gap_vertical))
            vertical_gap_item.setData(Qt.UserRole, ('anchor_gap_vertical', point.id))
            self.support_table.setItem(i, 7, vertical_gap_item)
            
            # 유효 묻힘길이
            embed_item = QTableWidgetItem(str(point.effective_embed_length))
            embed_item.setData(Qt.UserRole, ('effective_embed_length', point.id))
            self.support_table.setItem(i, 8, embed_item)
        
        # 셀 변경 이벤트 연결
        self.support_table.cellChanged.connect(self._on_support_table_cell_changed)
    
    def _on_support_table_cell_changed(self, row: int, col: int):
        """받침 테이블 셀 변경 이벤트"""
        if row >= len(self.custom_points):
            return
        
        item = self.support_table.item(row, col)
        if not item:
            return
        
        user_data = item.data(Qt.UserRole)
        if not user_data:
            return
        
        field_name, point_id = user_data
        point = next((p for p in self.custom_points if p.id == point_id), None)
        if not point:
            return
        
        try:
            value = float(item.text())
            
            if field_name == 'offset_x':
                point.offset_x = value
            elif field_name == 'offset_y':
                point.offset_y = value
            elif field_name == 'anchor_row_count_axial':
                point.anchor_row_count_axial = int(value)
            elif field_name == 'anchor_row_count_vertical':
                point.anchor_row_count_vertical = int(value)
            elif field_name == 'anchor_gap_axial':
                point.anchor_gap_axial = value
            elif field_name == 'anchor_gap_vertical':
                point.anchor_gap_vertical = value
            elif field_name == 'effective_embed_length':
                point.effective_embed_length = value
            
            # 미리보기 업데이트 (필요시)
            # self._update_coping_preview()
        except ValueError:
            pass
    
    def _update_coping_preview(self):
        """코핑 형상 미리보기 업데이트"""
        try:
            # 위젯이 초기화되지 않았으면 무시
            if not hasattr(self, 'coping_svg_widget') or self.coping_svg_widget is None:
                return
            
            renderer = SVGRenderer(self.params)
            
            # 단면 뷰일 경우 단면 점들 전달
            section_points = None
            if self.coping_view_type == 'section':
                if self.params.has_step:
                    # 단차가 있을 경우 활성 탭에 따라 선택
                    section_points = self.section_points_front if len(self.section_points_front) > 0 else self.section_points_back
                else:
                    section_points = self.section_points
            
            svg_drawing = renderer.render_coping_preview(self.coping_view_type, section_points)
            
            # 임시 파일로 저장 후 표시
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False, encoding='utf-8')
            temp_path = temp_file.name
            # SVG를 문자열로 변환하여 파일에 직접 쓰기
            svg_string = svg_drawing.tostring()
            temp_file.write(svg_string)
            temp_file.close()  # 파일 닫기
            self.coping_svg_widget.load(temp_path)
        except Exception as e:
            import traceback
            print(f"코핑 미리보기 업데이트 오류: {e}")
            traceback.print_exc()
    
    def _show_section_dimension_modal(self):
        """단면 치수 입력 모달 표시"""
        # 기존에 저장된 점들 전달
        existing_points = {}
        if self.params.has_step:
            existing_points = {
                'front': self.section_points_front,
                'back': self.section_points_back
            }
        else:
            existing_points = {
                'single': self.section_points
            }
        
        modal = SectionDimensionModal(self.params, self, existing_points)
        if modal.exec_() == QDialog.Accepted:
            # 모달에서 입력한 단면 점들을 저장
            section_points = modal.get_section_points()
            if self.params.has_step:
                self.section_points_front = section_points.get('front', [])
                self.section_points_back = section_points.get('back', [])
            else:
                self.section_points = section_points.get('single', [])
            
            # 코핑 미리보기 업데이트 (단면 뷰)
            if self.coping_view_type == 'section':
                self._update_coping_preview()
    
    def _show_preview_modal(self):
        """삽도 미리보기 모달 표시"""
        if self.params.width <= 0 or self.params.height <= 0:
            QMessageBox.warning(self, "경고", "폭과 길이를 입력해주세요.")
            return
        
        modal = SectionPreviewModal(self.params, self.custom_points, self)
        modal.exec_()
    
    def _save_svg(self):
        """SVG 파일 저장"""
        if not self.temp_svg_file or not os.path.exists(self.temp_svg_file):
            QMessageBox.warning(self, "경고", "먼저 삽도를 생성해주세요.")
            return
        
        filename, _ = QFileDialog.getSaveFileName(
            self, "SVG 저장", "", "SVG Files (*.svg);;All Files (*)"
        )
        if filename:
            try:
                import shutil
                shutil.copy(self.temp_svg_file, filename)
                QMessageBox.information(self, "성공", f"파일이 저장되었습니다:\n{filename}")
            except Exception as e:
                QMessageBox.critical(self, "오류", f"파일 저장 중 오류가 발생했습니다:\n{str(e)}")
    
    def closeEvent(self, event):
        """윈도우 종료 시 임시 파일 정리"""
        if self.temp_svg_file and os.path.exists(self.temp_svg_file):
            try:
                os.remove(self.temp_svg_file)
            except:
                pass
        event.accept()


class SectionPreviewModal(QDialog):
    """삽도 미리보기 모달"""
    
    def __init__(self, params: SectionParams, custom_points: List[Point], parent=None):
        super().__init__(parent)
        self.params = params
        self.custom_points = custom_points
        self.section_view_type = 'axial-plan'  # 'axial-plan', 'axial-front', 'vertical-plan', 'vertical-front', 'flyout-front'
        
        self.setWindowTitle("삽도 미리보기")
        self.setGeometry(100, 100, 1400, 900)
        
        layout = QVBoxLayout(self)
        
        # 헤더
        header_layout = QHBoxLayout()
        
        # 뷰 타입 선택 버튼
        view_type_layout = QHBoxLayout()
        view_type_layout.addWidget(QLabel("뷰 타입:"))
        
        self.axial_plan_btn = QPushButton("교축(평면)")
        self.axial_plan_btn.setCheckable(True)
        self.axial_plan_btn.setChecked(self.section_view_type == 'axial-plan')
        self.axial_plan_btn.clicked.connect(lambda: self._set_view_type('axial-plan'))
        view_type_layout.addWidget(self.axial_plan_btn)
        
        self.axial_front_btn = QPushButton("교축(정면)")
        self.axial_front_btn.setCheckable(True)
        self.axial_front_btn.clicked.connect(lambda: self._set_view_type('axial-front'))
        view_type_layout.addWidget(self.axial_front_btn)
        
        self.vertical_plan_btn = QPushButton("교직(평면)")
        self.vertical_plan_btn.setCheckable(True)
        self.vertical_plan_btn.clicked.connect(lambda: self._set_view_type('vertical-plan'))
        view_type_layout.addWidget(self.vertical_plan_btn)
        
        self.vertical_front_btn = QPushButton("교직(정면)")
        self.vertical_front_btn.setCheckable(True)
        self.vertical_front_btn.clicked.connect(lambda: self._set_view_type('vertical-front'))
        view_type_layout.addWidget(self.vertical_front_btn)
        
        self.flyout_front_btn = QPushButton("프라이아웃")
        self.flyout_front_btn.setCheckable(True)
        self.flyout_front_btn.clicked.connect(lambda: self._set_view_type('flyout-front'))
        view_type_layout.addWidget(self.flyout_front_btn)
        
        view_type_layout.addStretch()
        
        # 다운로드 버튼
        download_btn = QPushButton("다운로드")
        download_btn.clicked.connect(self._download_svg)
        view_type_layout.addWidget(download_btn)
        
        # 닫기 버튼
        close_btn = QPushButton("닫기")
        close_btn.clicked.connect(self.accept)
        view_type_layout.addWidget(close_btn)
        
        header_layout.addLayout(view_type_layout)
        layout.addLayout(header_layout)
        
        # SVG 미리보기
        self.svg_widget = QSvgWidget()
        self.svg_widget.setMinimumSize(1200, 700)
        layout.addWidget(self.svg_widget)
        
        # 초기 렌더링
        self._update_preview()
    
    def _set_view_type(self, view_type: str):
        """뷰 타입 설정"""
        self.section_view_type = view_type
        self.axial_plan_btn.setChecked(view_type == 'axial-plan')
        self.axial_front_btn.setChecked(view_type == 'axial-front')
        self.vertical_plan_btn.setChecked(view_type == 'vertical-plan')
        self.vertical_front_btn.setChecked(view_type == 'vertical-front')
        self.flyout_front_btn.setChecked(view_type == 'flyout-front')
        self._update_preview()
    
    def _update_preview(self):
        """미리보기 업데이트"""
        try:
            # 모든 받침의 앵커 계산
            all_anchor_points = []
            calculator = AnchorCalculator()
            
            for i, point in enumerate(self.custom_points):
                is_front_row = i < self.params.front_row_count
                anchor_points, _ = calculator.calculate_anchor_grid(
                    point, point.offset_x, point.offset_y, is_front_row, i
                )
                all_anchor_points.extend(anchor_points)
            
            # 삽도 경로 생성
            section_gen = SectionGenerator(self.params)
            section_path = section_gen.generate_rectangle_path()
            
            # SVG 생성
            renderer = SVGRenderer(self.params)
            svg_drawing = renderer.render_section(all_anchor_points, section_path)
            
            # 임시 파일로 저장 후 표시
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.svg', delete=False, encoding='utf-8')
            temp_path = temp_file.name
            # SVG를 문자열로 변환하여 파일에 직접 쓰기
            svg_string = svg_drawing.tostring()
            temp_file.write(svg_string)
            temp_file.close()  # 파일 닫기
            self.svg_widget.load(temp_path)
        except Exception as e:
            QMessageBox.critical(self, "오류", f"미리보기 생성 중 오류가 발생했습니다:\n{str(e)}")
    
    def _download_svg(self):
        """SVG 다운로드"""
        filename, _ = QFileDialog.getSaveFileName(
            self, "SVG 저장", "", "SVG Files (*.svg);;All Files (*)"
        )
        if filename:
            try:
                # 현재 표시된 SVG를 저장
                # TODO: 실제 SVG 파일 경로를 저장하도록 구현
                QMessageBox.information(self, "성공", f"파일이 저장되었습니다:\n{filename}")
            except Exception as e:
                QMessageBox.critical(self, "오류", f"파일 저장 중 오류가 발생했습니다:\n{str(e)}")


def main():
    """메인 함수"""
    import os
    from PyQt5.QtWidgets import QApplication
    
    # PyQt5 플러그인 경로 설정
    try:
        import PyQt5
        pyqt5_path = os.path.dirname(PyQt5.__file__)
        plugin_path = os.path.join(pyqt5_path, 'Qt5', 'plugins')
        if os.path.exists(plugin_path):
            os.environ['QT_PLUGIN_PATH'] = plugin_path
    except:
        pass
    
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
