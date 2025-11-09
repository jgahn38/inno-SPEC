import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageLayout } from '@inno-spec/ui-lib';
import { Ruler, Download, Eye, X } from 'lucide-react';

interface SectionParams {
  width: number;
  height: number;
  heightFront: number; // 높이(전열)
  heightBack: number; // 높이(후열)
  frontRowCount: number; // 받침개수(전열)
  backRowCount: number;  // 받침개수(후열)
  hasStep: boolean; // 단차 사용 여부
  stepValue: number; // 단차 값 (길이 방향)
}

interface Point {
  id: string;
  offsetX: number; // 기준점으로부터의 X 오프셋 (mm)
  offsetY: number; // 기준점으로부터의 Y 오프셋 (mm)
  anchorRowCountAxial: number; // 앵커열 개수(교축)
  anchorRowCountVertical: number; // 앵커열 개수(교직)
  anchorGapAxial: number; // 앵커간격(교축) (mm)
  anchorGapVertical: number; // 앵커간격(교직) (mm)
}

type NumericInputProps = {
  inputKey: string;
  value: number;
  onValueChange: (value: number) => void;
  fallbackValue?: number;
  pendingInputs: Record<string, string>;
  handleNumericInputChange: (key: string, rawValue: string, commit: (value: number) => void) => void;
  handleNumericInputBlur: (key: string, fallbackValue: number, commit: (value: number) => void) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

const NumericInput = React.memo(
  ({
    pendingInputs,
    handleNumericInputChange,
    handleNumericInputBlur,
    inputKey,
    value,
    onValueChange,
    fallbackValue,
    onBlur,
    className,
    inputMode,
    ...rest
  }: NumericInputProps) => {
    const hasPendingValue = Object.prototype.hasOwnProperty.call(pendingInputs, inputKey);
    const displayValue = hasPendingValue
      ? pendingInputs[inputKey]
      : Number.isFinite(value)
        ? String(value)
        : '';

    const spinnerHiddenClass = 'appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [MozAppearance:textfield]';
    const combinedClassName = className ? `${className} ${spinnerHiddenClass}` : spinnerHiddenClass;

    return (
      <input
        {...rest}
        value={displayValue}
        className={combinedClassName}
        inputMode={inputMode ?? 'decimal'}
        onChange={(event) => handleNumericInputChange(inputKey, event.target.value, onValueChange)}
        onBlur={(event) => {
          handleNumericInputBlur(inputKey, fallbackValue ?? value, onValueChange);
          onBlur?.(event);
        }}
      />
    );
  }
);

// 색상 및 선 굵기 상수 정의
const SECTION_STROKE_COLOR = '#000000';
const ANCHOR_FILL_COLOR = '#FF0000'; // 앵커 점은 빨간색
const ANCHOR_STROKE_COLOR = '#FF0000';
const MAIN_LINE_STROKE_WIDTH = "3"; // 메인 선의 굵기 (코핑 형상 미리보기와 삽도 미리보기 통일)

// 교축(평면) 치수선 배치를 위한 상수
const PLAN_DIMENSION_LINE_OFFSET_FRONT = 150;
const PLAN_DIMENSION_TEXT_OFFSET_FRONT = 80;
const PLAN_DIMENSION_LINE_OFFSET_BACK = 150;
const PLAN_DIMENSION_TEXT_OFFSET_BACK = 80;
const PLAN_DIMENSION_EXTRA_MARGIN = 100;
const PLAN_DIMENSION_TEXT_FONT_SIZE = 100;
const AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_OFFSET_Y = 80;
const AXIAL_PLAN_HORIZONTAL_DIMENSION_EXTRA_MARGIN = 100;
const AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_FONT_SIZE = 100;
const AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X = 150;
const AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_OFFSET_X = 80;
const AXIAL_PLAN_VERTICAL_DIMENSION_EXTRA_MARGIN = 100;
const AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_FONT_SIZE = 100;
const VERTICAL_PLAN_DIMENSION_LINE_OFFSET_FRONT_X = 150;
const VERTICAL_PLAN_DIMENSION_LINE_OFFSET_BACK_X = 300;
const VERTICAL_PLAN_DIMENSION_TEXT_OFFSET_X = 80;
const VERTICAL_PLAN_DIMENSION_EXTRA_MARGIN = 100;
const VERTICAL_PLAN_DIMENSION_TEXT_FONT_SIZE = 100;
const VERTICAL_PLAN_HORIZONTAL_BOTTOM_OFFSET = 150;
const VERTICAL_PLAN_HORIZONTAL_BOTTOM_TEXT_OFFSET = 80;
const VERTICAL_PLAN_HORIZONTAL_TOP_OFFSET = 150;
const VERTICAL_PLAN_HORIZONTAL_TOP_TEXT_OFFSET = 80;
const VERTICAL_PLAN_HORIZONTAL_EXTRA_MARGIN = 100;
const VERTICAL_PLAN_VERTICAL_TEXT_OFFSET_X = 100;

// localStorage 키 상수
const STORAGE_KEYS = {
  PARAMS: 'anchor-section-params',
  CUSTOM_POINTS: 'anchor-section-custom-points',
  SECTION_POINTS: 'anchor-section-section-points',
  SECTION_POINTS_FRONT: 'anchor-section-section-points-front',
  SECTION_POINTS_BACK: 'anchor-section-section-points-back',
  SECTION_POINT_COUNT: 'anchor-section-section-point-count',
  SECTION_POINT_COUNT_FRONT: 'anchor-section-section-point-count-front',
  SECTION_POINT_COUNT_BACK: 'anchor-section-section-point-count-back',
  COPING_VIEW_TYPE: 'anchor-section-coping-view-type',
  SECTION_VIEW_TYPE: 'anchor-section-section-view-type',
  ACTIVE_SECTION_TAB: 'anchor-section-active-section-tab',
};

// 기본값 상수
const DEFAULT_PARAMS: SectionParams = {
  width: 10000,
  height: 3000,
  heightFront: 3000,
  heightBack: 3000,
  frontRowCount: 2,
  backRowCount: 2,
  hasStep: false,
  stepValue: 0
};

const SectionView: React.FC = () => {
  // localStorage에서 상태 복원 또는 기본값 사용
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
    return defaultValue;
  };

  // 상태 저장 함수
  const saveToStorage = <T,>(key: string, value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // 초기 상태 로드
  const [params, setParams] = useState<SectionParams>(() => loadFromStorage(STORAGE_KEYS.PARAMS, DEFAULT_PARAMS));
  const [customPoints, setCustomPoints] = useState<Point[]>(() => loadFromStorage(STORAGE_KEYS.CUSTOM_POINTS, []));
  const [sectionPoints, setSectionPoints] = useState<Array<{ id: string; x: number; y: number; r: number }>>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINTS, [])
  );
  const [sectionPointsFront, setSectionPointsFront] = useState<Array<{ id: string; x: number; y: number; r: number }>>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINTS_FRONT, [])
  );
  const [sectionPointsBack, setSectionPointsBack] = useState<Array<{ id: string; x: number; y: number; r: number }>>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINTS_BACK, [])
  );
  const [sectionPointCount, setSectionPointCount] = useState<number>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINT_COUNT, 0)
  );
  const [sectionPointCountFront, setSectionPointCountFront] = useState<number>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINT_COUNT_FRONT, 0)
  );
  const [sectionPointCountBack, setSectionPointCountBack] = useState<number>(() => 
    loadFromStorage(STORAGE_KEYS.SECTION_POINT_COUNT_BACK, 0)
  );
  const [copingViewType, setCopingViewType] = useState<'plan' | 'side' | 'section'>(() => 
    loadFromStorage(STORAGE_KEYS.COPING_VIEW_TYPE, 'plan')
  );
  const [sectionViewType, setSectionViewType] = useState<'axial-plan' | 'axial-front' | 'vertical-plan' | 'vertical-front' | 'flyout-front' | 'flyout-back'>(() => 'axial-plan');
  const [activeSectionTab, setActiveSectionTab] = useState<'front' | 'back'>(() => 
    loadFromStorage(STORAGE_KEYS.ACTIVE_SECTION_TAB, 'front')
  );

  const [svgPath, setSvgPath] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSectionDimensionModalOpen, setIsSectionDimensionModalOpen] = useState<boolean>(false);
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>({});
const [isFrontSupportGroupEnabled, setIsFrontSupportGroupEnabled] = useState<boolean>(false);
const [isBackSupportGroupEnabled, setIsBackSupportGroupEnabled] = useState<boolean>(false);
const [viewOptionVersion, setViewOptionVersion] = useState<number>(0);

  const isIntermediateNumericValue = useCallback((value: string) => {
    return value === '' || value === '-' || value === '.' || value === '-.';
  }, []);

  const handleNumericInputChange = useCallback(
    (key: string, rawValue: string, commit: (value: number) => void) => {
      setPendingInputs(prev => {
        const existing = prev[key];
        if (existing === rawValue) {
          return prev;
        }
        return {
          ...prev,
          [key]: rawValue
        };
      });

      if (isIntermediateNumericValue(rawValue)) {
        return;
      }

      const parsed = Number(rawValue);
      if (!Number.isNaN(parsed)) {
        commit(parsed);
      }
    },
    [isIntermediateNumericValue]
  );

  const handleNumericInputBlur = useCallback(
    (key: string, fallbackValue: number, commit: (value: number) => void) => {
      setPendingInputs(prev => {
        const { [key]: rawValue, ...rest } = prev;

        if (rawValue === undefined) {
          return prev;
        }

        if (isIntermediateNumericValue(rawValue)) {
          commit(fallbackValue);
        } else {
          const parsed = Number(rawValue);
          if (!Number.isNaN(parsed)) {
            commit(parsed);
          } else {
            commit(fallbackValue);
          }
        }

        return rest;
      });
    },
    [isIntermediateNumericValue]
  );

  const numericInputSharedProps = useMemo(
    () => ({
      pendingInputs,
      handleNumericInputChange,
      handleNumericInputBlur
    }),
    [pendingInputs, handleNumericInputChange, handleNumericInputBlur]
  );

  const numericInputGlobalStyle = useMemo(
    () => `
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      input[type="number"] {
        -moz-appearance: textfield;
      }
    `,
    []
  );

  // params 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PARAMS, params);
  }, [params]);

  // customPoints 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOM_POINTS, customPoints);
  }, [customPoints]);

  // sectionPoints 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINTS, sectionPoints);
  }, [sectionPoints]);

  // sectionPointsFront 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINTS_FRONT, sectionPointsFront);
  }, [sectionPointsFront]);

  // sectionPointsBack 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINTS_BACK, sectionPointsBack);
  }, [sectionPointsBack]);

  // sectionPointCount 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINT_COUNT, sectionPointCount);
  }, [sectionPointCount]);

  // sectionPointCountFront 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINT_COUNT_FRONT, sectionPointCountFront);
  }, [sectionPointCountFront]);

  // sectionPointCountBack 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_POINT_COUNT_BACK, sectionPointCountBack);
  }, [sectionPointCountBack]);

  // copingViewType 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COPING_VIEW_TYPE, copingViewType);
  }, [copingViewType]);

  // sectionViewType 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SECTION_VIEW_TYPE, sectionViewType);
  }, [sectionViewType]);

  // activeSectionTab 변경 시 localStorage에 저장
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVE_SECTION_TAB, activeSectionTab);
  }, [activeSectionTab]);

  // 2D 삽도 생성 함수
  const generateSection = () => {
    const { width, height } = params;
    
    // 직사각형 삽도 생성
    const rectanglePoints = [
      { x: 0, y: 0 },           // 좌상단
      { x: width, y: 0 },       // 우상단
      { x: width, y: height },  // 우하단
      { x: 0, y: height },      // 좌하단
      { x: 0, y: 0 }            // 다시 좌상단으로 닫기
    ];

    let path = `M ${rectanglePoints[0].x} ${rectanglePoints[0].y}`;
    for (let i = 1; i < rectanglePoints.length; i++) {
      path += ` L ${rectanglePoints[i].x} ${rectanglePoints[i].y}`;
    }
    path += ' Z';

    setSvgPath(path);
  };

  // 단차 옵션이 Off일 때 높이(후열)을 높이(전열) 값으로 동기화
  useEffect(() => {
    if (!params.hasStep && params.heightBack !== params.heightFront) {
      setParams(prev => ({
        ...prev,
        heightBack: prev.heightFront
      }));
    }
  }, [params.hasStep, params.heightFront, params.heightBack]);

  // 파라미터나 점이 변경될 때마다 실시간으로 삽도 업데이트
  useEffect(() => {
    if (params.width > 0 && params.height > 0) {
      generateSection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.width, params.height, params.frontRowCount, params.backRowCount, customPoints]);

  // 점들을 메모이제이션하여 색상이 유지되도록 (받침 중심 점은 렌더링하지 않음)
  const renderedPoints = useMemo(() => {
    // 받침 중심 점은 렌더링하지 않음
    return null;
  }, [customPoints, params.height, params.frontRowCount]);

  // 앵커 위치들과 사각형을 메모이제이션하여 렌더링
  const {
    anchorElements: renderedAnchors,
    axialPlanVerticalElements,
    axialPlanHorizontalElements,
    axialPlanDimensionElements,
    verticalPlanDimensionElements,
    verticalPlanAdditionalHorizontalElements,
    verticalPlanAdditionalVerticalElements
  } = useMemo(() => {
    if (customPoints.length === 0) {
      return {
        anchorElements: null,
        axialPlanVerticalElements: [],
        axialPlanHorizontalElements: [],
        axialPlanDimensionElements: [],
        verticalPlanDimensionElements: [],
        verticalPlanAdditionalHorizontalElements: [],
        verticalPlanAdditionalVerticalElements: []
      };
    }

    const anchorPoints: Array<{ 
      x: number; 
      y: number; 
      isFrontRow: boolean; // 전열 여부
      supportIndex: number;
    }> = [];
    const anchorRects: Array<{ 
      x: number; 
      y: number; 
      width: number; 
      height: number;
      baseX: number; // 받침 중심점 X
      baseY: number; // 받침 중심점 Y
      pointId: string;
    }> = [];
    const planDimensionMap = new Map<number, { anchorY: number; isFrontRow: boolean; minX: number; maxX: number }>();
    const axialPlanVerticalDimensions: Array<{
      key: string;
      lineX: number;
      textX: number;
      anchorY: number;
      targetY: number;
      length: number;
    }> = [];
    const axialPlanHorizontalDimensions: Array<{
      key: string;
      anchorX: number;
      targetX: number;
      lineY: number;
      textPosition: 'above' | 'below';
      length: number;
    }> = [];
    const verticalPlanAdditionalVerticalDimensions: Array<{
      key: string;
      lineX: number;
      anchorY: number;
      targetY: number;
      textX: number;
      length: number;
    }> = [];
    const verticalPlanAdditionalHorizontalDimensions: Array<{
      key: string;
      anchorX: number;
      targetX: number;
      lineY: number;
      textY: number;
      length: number;
    }> = [];
    const verticalPlanDimensionMap = new Map<'front' | 'back', { minY: number; maxY: number }>();
    const updateVerticalDimension = (key: 'front' | 'back', y: number) => {
      const entry = verticalPlanDimensionMap.get(key) ?? { minY: Infinity, maxY: -Infinity };
      entry.minY = Math.min(entry.minY, y);
      entry.maxY = Math.max(entry.maxY, y);
      verticalPlanDimensionMap.set(key, entry);
    };
    const getDomainY = (anchor: { x: number; y: number; isFrontRow: boolean }) =>
      params.height - anchor.y;
    const selectAnchor = (
      supportIndex: number | null,
      domainPreference: 'max' | 'min',
      xPreference: 'max' | 'min'
    ) => {
      if (supportIndex === null) {
        return null;
      }
      const anchors = anchorPoints.filter(anchor => anchor.supportIndex === supportIndex);
      if (anchors.length === 0) {
        return null;
      }
      const domainValues = anchors.map(getDomainY);
      const targetDomain =
        domainPreference === 'max' ? Math.max(...domainValues) : Math.min(...domainValues);
      const domainFiltered = anchors.filter(
        anchor => Math.abs(getDomainY(anchor) - targetDomain) < 0.001
      );
      const xValues = domainFiltered.map(anchor => anchor.x);
      const targetX =
        xPreference === 'max' ? Math.max(...xValues) : Math.min(...xValues);
      const xFiltered = domainFiltered.filter(anchor => Math.abs(anchor.x - targetX) < 0.001);
      return xFiltered[0] ?? domainFiltered[0] ?? null;
    };
    const addVerticalDimension = (
      key: string,
      anchor: { x: number; y: number },
      direction: 'up' | 'down',
      side: 'left' | 'right'
    ) => {
      const targetY = direction === 'down' ? params.height : 0;
      const length = Math.abs(targetY - anchor.y);
      if (length <= 0.001) {
        return;
      }
      const lineX =
        side === 'left'
          ? -AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X
          : params.width + AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X;
      const textX =
        side === 'left'
          ? -(AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X + AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_OFFSET_X)
          : params.width +
            AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X +
            AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_OFFSET_X;
      axialPlanVerticalDimensions.push({
        key,
        lineX,
        textX,
        anchorY: anchor.y,
        targetY,
        length
      });
    };
    const addHorizontalDimension = (
      key: string,
      anchor: { x: number; y: number },
      direction: 'left' | 'right',
      textPosition: 'above' | 'below'
    ) => {
      const targetX = direction === 'left' ? 0 : params.width;
      const length = Math.abs(targetX - anchor.x);
      if (length <= 0.001) {
        return;
      }
      axialPlanHorizontalDimensions.push({
        key,
        anchorX: anchor.x,
        targetX,
        lineY: anchor.y,
        textPosition,
        length
      });
    };
    const addVerticalPlanVerticalDimension = (
      key: string,
      anchor: { x: number; y: number },
      direction: 'up' | 'down'
    ) => {
      const targetY = direction === 'down' ? params.height : 0;
      const length = Math.abs(targetY - anchor.y);
      if (length <= 0.001) {
        return;
      }
      verticalPlanAdditionalVerticalDimensions.push({
        key,
        lineX: anchor.x,
        anchorY: anchor.y,
        targetY,
        textX: anchor.x + VERTICAL_PLAN_VERTICAL_TEXT_OFFSET_X,
        length
      });
    };
    const addVerticalPlanHorizontalDimension = (
      key: string,
      anchor: { x: number; y: number },
      position: 'top' | 'bottom'
    ) => {
      const targetX = params.width;
      const length = Math.abs(targetX - anchor.x);
      if (length <= 0.001) {
        return;
      }
      const lineY =
        position === 'top'
          ? -VERTICAL_PLAN_HORIZONTAL_TOP_OFFSET
          : params.height + VERTICAL_PLAN_HORIZONTAL_BOTTOM_OFFSET;
      const textY =
        position === 'top'
          ? lineY - VERTICAL_PLAN_HORIZONTAL_TOP_TEXT_OFFSET
          : lineY + VERTICAL_PLAN_HORIZONTAL_BOTTOM_TEXT_OFFSET;
      verticalPlanAdditionalHorizontalDimensions.push({
        key,
        anchorX: anchor.x,
        targetX,
        lineY,
        textY,
        length
      });
    };

    type PointWithIndex = { point: (typeof customPoints)[number]; originalIndex: number };
    const pointsForRendering: PointWithIndex[] = (() => {
      if (sectionViewType === 'flyout-front') {
        if (params.frontRowCount <= 0) {
          return [] as PointWithIndex[];
        }
        const index = Math.min(Math.max(params.frontRowCount - 1, 0), customPoints.length - 1);
        return index >= 0 ? [{ point: customPoints[index], originalIndex: index }] : [];
      }
      if (sectionViewType === 'flyout-back') {
        if (params.backRowCount <= 0) {
          return [] as PointWithIndex[];
        }
        const index = params.frontRowCount + params.backRowCount - 1;
        if (index < 0 || index >= customPoints.length) {
          return [] as PointWithIndex[];
        }
        return [{ point: customPoints[index], originalIndex: index }];
      }
      return customPoints.map((point, originalIndex) => ({ point, originalIndex }));
    })();

    pointsForRendering.forEach(({ point, originalIndex }) => {
      const isFrontRow = originalIndex < params.frontRowCount;
      
      // 받침위치의 절대 좌표 계산
      const baseX = point.offsetX;
      const baseY = isFrontRow 
        ? params.height - point.offsetY  // 좌측 하단 기준
        : point.offsetY;                  // 좌측 상단 기준

      // 앵커 배치 조건 확인
      if (point.anchorRowCountAxial > 0 && point.anchorRowCountVertical > 0 &&
          point.anchorGapAxial > 0 && point.anchorGapVertical > 0) {
        
        // 앵커 그리드의 총 크기 계산
        // 교축(axial) 열 개수는 Y축 방향에 적용, 교직(vertical) 열 개수는 X축 방향에 적용
        // 교축(axial) 간격은 Y축 방향에 적용, 교직(vertical) 간격은 X축 방향에 적용
        const totalWidth = (point.anchorRowCountVertical - 1) * point.anchorGapVertical;
        const totalHeight = (point.anchorRowCountAxial - 1) * point.anchorGapAxial;
        
        // 시작 위치 계산 (받침위치를 중심으로 배치)
        // X축: 받침위치를 중심으로 좌우로 배치
        const startX = baseX - totalWidth / 2;
        
        // Y축: 받침위치를 중심으로 배치
        // SVG 좌표계에서는 Y축이 아래로 증가하므로:
        // - 전열(좌측 하단 기준): baseY에서 위쪽으로 올라가야 하므로 Y값 감소
        // - 후열(좌측 상단 기준): baseY에서 위쪽으로 올라가야 하므로 Y값 감소
        const startY = baseY - totalHeight / 2;

        // 앵커 그리드 사각형 정보 저장 (받침 중심점 기준으로 1.5배 확대)
        const rectWidth = totalWidth * 1.5;
        const rectHeight = totalHeight * 1.5;
        const rectStartX = baseX - rectWidth / 2;
        const rectStartY = baseY - rectHeight / 2;
        
        anchorRects.push({
          x: rectStartX,
          y: rectStartY,
          width: rectWidth,
          height: rectHeight,
          baseX: baseX,
          baseY: baseY,
          pointId: point.id
        });

        // 앵커 그리드 생성
        // X축 방향: 교직(vertical) 열 개수 사용
        // Y축 방향: 교축(axial) 열 개수 사용
        for (let i = 0; i < point.anchorRowCountVertical; i++) {
          for (let j = 0; j < point.anchorRowCountAxial; j++) {
            // X축 방향에는 교직 간격 사용
            const anchorX = startX + i * point.anchorGapVertical;
            // Y축 방향에는 교축 간격 사용
            const anchorY = startY + j * point.anchorGapAxial;
            
            anchorPoints.push({ x: anchorX, y: anchorY, isFrontRow: isFrontRow, supportIndex: originalIndex });
          }
        }
      }
    });

    if (anchorPoints.length === 0) {
      return {
        anchorElements: null,
        axialPlanVerticalElements: [],
        axialPlanHorizontalElements: [],
        axialPlanDimensionElements: [],
        verticalPlanDimensionElements: [],
        verticalPlanAdditionalHorizontalElements: [],
        verticalPlanAdditionalVerticalElements: []
      };
    }

    if (
      (sectionViewType === 'flyout-front' || sectionViewType === 'flyout-back') &&
      anchorRects.length > 0
    ) {
      const targetCenterX = params.width / 2;
      const targetCenterY = params.height / 2;
      const shiftX = targetCenterX - anchorRects[0].baseX;
      const shiftY = targetCenterY - anchorRects[0].baseY;

      anchorRects.forEach(rect => {
        rect.x += shiftX;
        rect.y += shiftY;
        rect.baseX += shiftX;
        rect.baseY += shiftY;
      });

      anchorPoints.forEach(anchor => {
        anchor.x += shiftX;
        anchor.y += shiftY;
      });
    }

    // 전열과 후열로 분리
    const frontRowAnchors = anchorPoints.filter(a => a.isFrontRow);
    const backRowAnchors = anchorPoints.filter(a => !a.isFrontRow);

    let anchorsToDrawLines: Array<typeof anchorPoints[number]> = [];

    if (sectionViewType === 'vertical-plan') {
      const lastFrontSupportIndex = params.frontRowCount > 0 ? params.frontRowCount - 1 : null;
      const lastBackSupportIndex =
        params.backRowCount > 0 ? params.frontRowCount + params.backRowCount - 1 : null;

      const selectAnchorsForSupport = (supportIndex: number | null, targetAnchors: Array<typeof anchorPoints[number]>) => {
        if (supportIndex === null) {
          return [];
        }
        const supportAnchors = targetAnchors.filter(anchor => anchor.supportIndex === supportIndex);
        if (supportAnchors.length === 0) {
          return [];
        }
        const minX = Math.min(...supportAnchors.map(anchor => anchor.x));
        return supportAnchors.filter(anchor => Math.abs(anchor.x - minX) < 0.001);
      };

      anchorsToDrawLines = [
        ...selectAnchorsForSupport(lastFrontSupportIndex, frontRowAnchors),
        ...selectAnchorsForSupport(lastBackSupportIndex, backRowAnchors)
      ];
    } else {
      // 전열: Y 값이 가장 작은 앵커들 찾기 (교축방향으로 가장 위에 배치된 열)
      const frontRowMinY = frontRowAnchors.length > 0 
        ? Math.min(...frontRowAnchors.map(a => a.y))
        : null;
      const frontRowTopAnchors = frontRowMinY !== null
        ? frontRowAnchors.filter(a => Math.abs(a.y - frontRowMinY) < 0.001) // Y 값이 같거나 거의 같은 앵커들
        : [];

      // 후열: Y 값이 가장 큰 앵커들 찾기 (교축방향으로 가장 아래에 배치된 열)
      const backRowMaxY = backRowAnchors.length > 0
        ? Math.max(...backRowAnchors.map(a => a.y))
        : null;
      const backRowBottomAnchors = backRowMaxY !== null
        ? backRowAnchors.filter(a => Math.abs(a.y - backRowMaxY) < 0.001) // Y 값이 같거나 거의 같은 앵커들
        : [];

      anchorsToDrawLines = [...frontRowTopAnchors, ...backRowBottomAnchors];
    }

    if (sectionViewType === 'axial-plan') {
      const frontFirstAnchor =
        params.frontRowCount > 0
          ? selectAnchor(0, 'max', 'min')
          : null;
      if (frontFirstAnchor) {
        addVerticalDimension('front-first', frontFirstAnchor, 'down', 'left');
        addHorizontalDimension('front-first', frontFirstAnchor, 'left', 'above');
      }

      const frontLastSupportIndex =
        params.frontRowCount > 0 ? params.frontRowCount - 1 : null;
      const frontLastAnchor = frontLastSupportIndex !== null
        ? selectAnchor(frontLastSupportIndex, 'max', 'max')
        : null;
      if (frontLastAnchor) {
        addVerticalDimension('front-last', frontLastAnchor, 'down', 'right');
        addHorizontalDimension('front-last', frontLastAnchor, 'right', 'above');
      }

      const backFirstSupportIndex =
        params.backRowCount > 0 ? params.frontRowCount : null;
      const backFirstAnchor = backFirstSupportIndex !== null
        ? selectAnchor(backFirstSupportIndex, 'min', 'min')
        : null;
      if (backFirstAnchor) {
        addVerticalDimension('back-first', backFirstAnchor, 'up', 'left');
        addHorizontalDimension('back-first', backFirstAnchor, 'left', 'below');
      }

      const backLastSupportIndex =
        params.backRowCount > 0 ? params.frontRowCount + params.backRowCount - 1 : null;
      const backLastAnchor = backLastSupportIndex !== null
        ? selectAnchor(backLastSupportIndex, 'min', 'max')
        : null;
      if (backLastAnchor) {
        addVerticalDimension('back-last', backLastAnchor, 'up', 'right');
        addHorizontalDimension('back-last', backLastAnchor, 'right', 'below');
      }
    }

    if (sectionViewType === 'vertical-plan') {
      const frontLastSupportIndex =
        params.frontRowCount > 0 ? params.frontRowCount - 1 : null;
      const frontLastAnchor = frontLastSupportIndex !== null
        ? selectAnchor(frontLastSupportIndex, 'min', 'min')
        : null;
      if (frontLastAnchor) {
        addVerticalPlanHorizontalDimension('vertical-front-last-horizontal', frontLastAnchor, 'bottom');
        addVerticalPlanVerticalDimension('vertical-front-last-vertical', frontLastAnchor, 'down');
      }

      const backLastSupportIndex =
        params.backRowCount > 0 ? params.frontRowCount + params.backRowCount - 1 : null;
      const backLastAnchor = backLastSupportIndex !== null
        ? selectAnchor(backLastSupportIndex, 'max', 'min')
        : null;
      if (backLastAnchor) {
        addVerticalPlanHorizontalDimension('vertical-back-last-horizontal', backLastAnchor, 'top');
        addVerticalPlanVerticalDimension('vertical-back-last-vertical', backLastAnchor, 'up');
      }
    }

    const anchorElements = (
      <g key="anchor-points-group">
        {anchorRects.map((rect) => {
          const rectEndX = rect.x + rect.width;
          const rectEndY = rect.y + rect.height;

          return (
            <g key={`anchor-axes-${rect.pointId}`}>
              <line
                x1={rect.x}
                y1={rect.baseY}
                x2={rectEndX}
                y2={rect.baseY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth={MAIN_LINE_STROKE_WIDTH}
                strokeOpacity={1}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={rect.baseX}
                y1={rect.y}
                x2={rect.baseX}
                y2={rectEndY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth={MAIN_LINE_STROKE_WIDTH}
                strokeOpacity={1}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {anchorRects.map((rect) => (
          <rect
            key={`anchor-rect-${rect.pointId}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="white"
            stroke={SECTION_STROKE_COLOR}
            strokeWidth={MAIN_LINE_STROKE_WIDTH}
            strokeOpacity={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {anchorPoints.map((anchor, idx) => (
          <g key={`anchor-point-${idx}`}>
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r="40"
              fill="white"
              stroke={ANCHOR_STROKE_COLOR}
              strokeWidth="1"
              strokeOpacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r="5"
              fill={ANCHOR_FILL_COLOR}
              stroke={ANCHOR_STROKE_COLOR}
              strokeWidth="1"
              fillOpacity={1}
              strokeOpacity={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {anchorsToDrawLines.map((anchor, idx) => {
          // 사각형 경계
          const rectLeft = 0;
          const rectRight = params.width;
          const rectTop = 0;
          const rectBottom = params.height;

          // 직선 방정식 계산 함수 (Trim 처리 포함)
          // 기울기 m, 점 (anchor.x, anchor.y)를 지나는 직선: y - anchor.y = m * (x - anchor.x)
          const getLineIntersection = (slope: number, anchorX: number, anchorY: number, trimPositiveY: boolean) => {
            // 사각형의 네 모서리와의 교점 계산
            const intersections: Array<{ x: number; y: number }> = [];
            
            // 좌측 경계 (x = 0)와의 교점
            const yAtLeft = anchorY + slope * (rectLeft - anchorX);
            if (yAtLeft >= rectTop && yAtLeft <= rectBottom) {
              intersections.push({ x: rectLeft, y: yAtLeft });
            }
            
            // 우측 경계 (x = params.width)와의 교점
            const yAtRight = anchorY + slope * (rectRight - anchorX);
            if (yAtRight >= rectTop && yAtRight <= rectBottom) {
              intersections.push({ x: rectRight, y: yAtRight });
            }
            
            // 상단 경계 (y = 0)와의 교점
            if (slope !== 0) {
              const xAtTop = anchorX + (rectTop - anchorY) / slope;
              if (xAtTop >= rectLeft && xAtTop <= rectRight) {
                intersections.push({ x: xAtTop, y: rectTop });
              }
            }
            
            // 하단 경계 (y = params.height)와의 교점
            if (slope !== 0) {
              const xAtBottom = anchorX + (rectBottom - anchorY) / slope;
              if (xAtBottom >= rectLeft && xAtBottom <= rectRight) {
                intersections.push({ x: xAtBottom, y: rectBottom });
              }
            }
            if (
              sectionViewType === 'vertical-plan' &&
              params.hasStep &&
              params.stepValue > 0 &&
              params.stepValue < params.height &&
              slope !== 0
            ) {
              const stepY = params.stepValue;
      if (Math.abs(stepY - anchorY) > 1e-6) {
                const xAtStep = anchorX + (stepY - anchorY) / slope;
                if (xAtStep >= rectLeft && xAtStep <= rectRight) {
                  intersections.push({ x: xAtStep, y: stepY });
                }
              }
            }
            
            // Trim 처리: 앵커 중심점 기준으로 필터링
            // Trim되지 않은 방향의 교점만 사용하여 선분을 그림
            let filteredIntersections: Array<{ x: number; y: number }> = [];
            if (trimPositiveY) {
              // 전열: +Y 방향 부분 제거 → anchorY보다 큰 부분(y > anchorY) 제거
              // 따라서 anchorY보다 작거나 같은 부분(y <= anchorY)만 사용 (즉, -Y 방향만 유지)
              // 하지만 반대로 적용되어야 함: anchorY보다 큰 부분만 유지해야 함
              filteredIntersections = intersections.filter(p => p.y > anchorY);
            } else {
              // 후열: -Y 방향 부분 제거 → anchorY보다 작은 부분(y < anchorY) 제거
              // 따라서 anchorY보다 크거나 같은 부분(y >= anchorY)만 사용 (즉, +Y 방향만 유지)
              // 하지만 반대로 적용되어야 함: anchorY보다 작은 부분만 유지해야 함
              filteredIntersections = intersections.filter(p => p.y < anchorY);
            }
            
            // 앵커 중심점도 포함하여 선분 계산
            if (filteredIntersections.length >= 1) {
              // 거리순으로 정렬
              filteredIntersections.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.x - anchorX, 2) + Math.pow(a.y - anchorY, 2));
                const distB = Math.sqrt(Math.pow(b.x - anchorX, 2) + Math.pow(b.y - anchorY, 2));
                return distA - distB;
              });
              
              // 가장 가까운 교점과 앵커 중심점을 연결
              // 앵커 중심점이 시작점, 교점이 끝점
              return {
                x1: anchorX,
                y1: anchorY,
                x2: filteredIntersections[0].x,
                y2: filteredIntersections[0].y
              };
            }
            
            // 교점이 없으면 null 반환
            return null;
          };

          // 전열 받침의 앵커: (+X, -Y) 방향과 (-X, -Y) 방향으로 각각 1/1.5의 기울기
          // 후열 받침의 앵커: (+X, +Y) 방향과 (-X, +Y) 방향으로 각각 1/1.5의 기울기
        const baseSlope = 1 / 1.5; // 약 0.6667
        const adjustSlope = (value: number) => sectionViewType === 'vertical-plan' ? -1 / value : value;
          let line1: { x1: number; y1: number; x2: number; y2: number } | null = null;
          let line2: { x1: number; y1: number; x2: number; y2: number } | null = null;

        const getTrimmedLine = (slope: number, trimPositiveY: boolean) => {
          const initialLine = getLineIntersection(slope, anchor.x, anchor.y, trimPositiveY);
          if (!initialLine || sectionViewType !== 'vertical-plan') {
            return initialLine;
          }
          const isLeftDirection = initialLine.x2 < anchor.x;
          if (!isLeftDirection) {
            return initialLine;
          }
          const adjustedLine = getLineIntersection(slope, anchor.x, anchor.y, !trimPositiveY);
          return adjustedLine ?? initialLine;
        };

        if (anchor.isFrontRow) {
          // 전열: (+X, -Y) 방향 (기울기 -1/1.5), (-X, -Y) 방향 (기울기 1/1.5)
          // 전열은 +Y 방향 부분을 Trim (trimPositiveY = true)
          line1 = getTrimmedLine(adjustSlope(-baseSlope), true); // (+X, -Y)
          line2 = getTrimmedLine(adjustSlope(baseSlope), true);  // (-X, -Y)
        } else {
          // 후열: (+X, +Y) 방향 (기울기 1/1.5), (-X, +Y) 방향 (기울기 -1/1.5)
          // 후열은 -Y 방향 부분을 Trim (trimPositiveY = false)
          line1 = getTrimmedLine(adjustSlope(baseSlope), false);   // (+X, +Y)
          line2 = getTrimmedLine(adjustSlope(-baseSlope), false);  // (-X, +Y)
        }

          const groupElements: React.ReactNode[] = [];

          if (sectionViewType !== 'flyout-front' && sectionViewType !== 'flyout-back') {
            if (line1) {
              groupElements.push(
                <line
                  key={`anchor-line1-${idx}`}
                  x1={line1.x1}
                  y1={line1.y1}
                  x2={line1.x2}
                  y2={line1.y2}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                  strokeDasharray="2,2"
                  vectorEffect="non-scaling-stroke"
                />
              );
            }

            if (line2) {
              groupElements.push(
                <line
                  key={`anchor-line2-${idx}`}
                  x1={line2.x1}
                  y1={line2.y1}
                  x2={line2.x2}
                  y2={line2.y2}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                  strokeDasharray="2,2"
                  vectorEffect="non-scaling-stroke"
                />
              );
            }
          }

        if (sectionViewType === 'vertical-plan') {
          const dimensionKey = anchor.isFrontRow ? 'front' : 'back';
          if (line1) {
            updateVerticalDimension(dimensionKey, line1.y2);
          }
          if (line2) {
            updateVerticalDimension(dimensionKey, line2.y2);
          }
        }

          if (sectionViewType === 'axial-plan') {
            if (!planDimensionMap.has(anchor.supportIndex)) {
              planDimensionMap.set(anchor.supportIndex, {
                anchorY: anchor.y,
                isFrontRow: anchor.isFrontRow,
                minX: Infinity,
                maxX: -Infinity
              });
            }
            const entry = planDimensionMap.get(anchor.supportIndex)!;
            entry.anchorY = anchor.y;
            entry.isFrontRow = anchor.isFrontRow;
            if (line1) {
              entry.minX = Math.min(entry.minX, line1.x2);
              entry.maxX = Math.max(entry.maxX, line1.x2);
            }
            if (line2) {
              entry.minX = Math.min(entry.minX, line2.x2);
              entry.maxX = Math.max(entry.maxX, line2.x2);
            }
          }

          return (
            <g key={`anchor-line-group-${idx}`}>
              {groupElements}
            </g>
          );
        })}
      </g>
    );

    const axialPlanVerticalElements =
      sectionViewType === 'axial-plan'
        ? axialPlanVerticalDimensions.map(dimension => {
            const tickHalf = 20;
            const y1 = Math.min(dimension.anchorY, dimension.targetY);
            const y2 = Math.max(dimension.anchorY, dimension.targetY);
            const label = Math.round(dimension.length).toLocaleString();

            return (
              <g key={`axial-plan-vertical-dimension-${dimension.key}`}>
                <line
                  x1={dimension.lineX}
                  y1={y1}
                  x2={dimension.lineX}
                  y2={y2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                <line
                  x1={dimension.lineX - tickHalf}
                  y1={dimension.anchorY}
                  x2={dimension.lineX + tickHalf}
                  y2={dimension.anchorY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <line
                  x1={dimension.lineX - tickHalf}
                  y1={dimension.targetY}
                  x2={dimension.lineX + tickHalf}
                  y2={dimension.targetY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <text
                  x={0}
                  y={0}
                  transform={`translate(${dimension.textX}, ${(dimension.anchorY + dimension.targetY) / 2}) rotate(-90)`}
                  fill={SECTION_STROKE_COLOR}
                  fontSize={AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_FONT_SIZE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })
        : [];

    const axialPlanHorizontalElements =
      sectionViewType === 'axial-plan'
        ? axialPlanHorizontalDimensions.map(dimension => {
            const tickHalf = 20;
            const x1 = Math.min(dimension.anchorX, dimension.targetX);
            const x2 = Math.max(dimension.anchorX, dimension.targetX);
            const label = Math.round(dimension.length).toLocaleString();
            const textY =
              dimension.lineY +
              (dimension.textPosition === 'above'
                ? -AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_OFFSET_Y
                : AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_OFFSET_Y);

            return (
              <g key={`axial-plan-horizontal-dimension-${dimension.key}`}>
                <line
                  x1={x1}
                  y1={dimension.lineY}
                  x2={x2}
                  y2={dimension.lineY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                <line
                  x1={dimension.anchorX}
                  y1={dimension.lineY - tickHalf}
                  x2={dimension.anchorX}
                  y2={dimension.lineY + tickHalf}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <line
                  x1={dimension.targetX}
                  y1={dimension.lineY - tickHalf}
                  x2={dimension.targetX}
                  y2={dimension.lineY + tickHalf}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <text
                  x={(dimension.anchorX + dimension.targetX) / 2}
                  y={textY}
                  fill={SECTION_STROKE_COLOR}
                  fontSize={AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_FONT_SIZE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })
        : [];

    const axialPlanDimensionElements =
      sectionViewType === 'axial-plan'
        ? (() => {
            const entries = Array.from(planDimensionMap.entries()).map(([supportIndex, data]) => ({
              key: supportIndex,
              ...data
            }));

            const dimensionEntries: Array<{
              key: React.Key;
              minX: number;
              maxX: number;
              isFrontRow: boolean;
            }> = [];

            const frontEntries = entries.filter(entry => entry.isFrontRow);
            const backEntries = entries.filter(entry => !entry.isFrontRow);

            const addEntries = (
              groupEntries: typeof entries,
              grouped: boolean,
              groupKey: string,
              isFrontRow: boolean
            ) => {
              if (groupEntries.length === 0) {
                return;
              }

              if (grouped) {
                const minX = Math.min(...groupEntries.map(entry => entry.minX));
                const maxX = Math.max(...groupEntries.map(entry => entry.maxX));

                if (!Number.isFinite(minX) || !Number.isFinite(maxX) || Math.abs(maxX - minX) < 1e-6) {
                  return;
                }

                dimensionEntries.push({
                  key: groupKey,
                  minX,
                  maxX,
                  isFrontRow
                });
              } else {
                groupEntries.forEach(entry => {
                  if (
                    Number.isFinite(entry.minX) &&
                    Number.isFinite(entry.maxX) &&
                    Math.abs(entry.maxX - entry.minX) >= 1e-6
                  ) {
                    dimensionEntries.push({
                      key: entry.key,
                      minX: entry.minX,
                      maxX: entry.maxX,
                      isFrontRow
                    });
                  }
                });
              }
            };

            addEntries(frontEntries, isFrontSupportGroupEnabled, 'front-group', true);
            addEntries(backEntries, isBackSupportGroupEnabled, 'back-group', false);

            return dimensionEntries.map(entry => {
              const dimensionY = entry.isFrontRow
                ? params.height + PLAN_DIMENSION_LINE_OFFSET_FRONT
                : -PLAN_DIMENSION_LINE_OFFSET_BACK;
              const labelY = entry.isFrontRow
                ? dimensionY + PLAN_DIMENSION_TEXT_OFFSET_FRONT
                : dimensionY - PLAN_DIMENSION_TEXT_OFFSET_BACK;
              const tickHalf = 20;
              const dimensionText = Math.round(entry.maxX - entry.minX).toLocaleString();

              return (
                <g key={`axial-plan-dimension-${entry.key}`}>
                  <line
                    x1={entry.minX}
                    y1={dimensionY}
                    x2={entry.maxX}
                    y2={dimensionY}
                    stroke={SECTION_STROKE_COLOR}
                    strokeWidth="2"
                    strokeOpacity={1}
                    markerStart="url(#arrowhead-start)"
                    markerEnd="url(#arrowhead-end)"
                  />
                  <line
                    x1={entry.minX}
                    y1={dimensionY - tickHalf}
                    x2={entry.minX}
                    y2={dimensionY + tickHalf}
                    stroke={SECTION_STROKE_COLOR}
                    strokeWidth="2"
                    strokeOpacity={1}
                  />
                  <line
                    x1={entry.maxX}
                    y1={dimensionY - tickHalf}
                    x2={entry.maxX}
                    y2={dimensionY + tickHalf}
                    stroke={SECTION_STROKE_COLOR}
                    strokeWidth="2"
                    strokeOpacity={1}
                  />
                  <text
                    x={(entry.minX + entry.maxX) / 2}
                    y={labelY}
                    fill={SECTION_STROKE_COLOR}
                    fontSize={PLAN_DIMENSION_TEXT_FONT_SIZE}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {dimensionText}
                  </text>
                </g>
              );
            });
          })()
        : [];

    const verticalPlanDimensionElements =
      sectionViewType === 'vertical-plan'
        ? (['front', 'back'] as const).map(key => {
          const data = verticalPlanDimensionMap.get(key);
          if (!data || !Number.isFinite(data.minY) || !Number.isFinite(data.maxY) || Math.abs(data.maxY - data.minY) < 1e-6) {
            return null;
          }

          const lineX = params.width + VERTICAL_PLAN_DIMENSION_LINE_OFFSET_FRONT_X;
          const textX = lineX + VERTICAL_PLAN_DIMENSION_TEXT_OFFSET_X;
          const tickHalf = 20;
          const dimensionText = Math.round(data.maxY - data.minY).toLocaleString();

          return (
            <g key={`vertical-plan-dimension-${key}`}>
              <line
                x1={lineX}
                y1={data.minY}
                x2={lineX}
                y2={data.maxY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth="2"
                strokeOpacity={1}
                markerStart="url(#arrowhead-start)"
                markerEnd="url(#arrowhead-end)"
              />
              <line
                x1={lineX - tickHalf}
                y1={data.minY}
                x2={lineX + tickHalf}
                y2={data.minY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth="2"
                strokeOpacity={1}
              />
              <line
                x1={lineX - tickHalf}
                y1={data.maxY}
                x2={lineX + tickHalf}
                y2={data.maxY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth="2"
                strokeOpacity={1}
              />
              <text
                x={0}
                y={0}
                transform={`translate(${textX}, ${(data.minY + data.maxY) / 2}) rotate(-90)`}
                fill={SECTION_STROKE_COLOR}
                fontSize={VERTICAL_PLAN_DIMENSION_TEXT_FONT_SIZE}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {dimensionText}
              </text>
            </g>
          );
        })
        : [];

    const verticalPlanAdditionalHorizontalElements =
      sectionViewType === 'vertical-plan'
        ? verticalPlanAdditionalHorizontalDimensions.map(dimension => {
            const tickHalf = 20;
            const x1 = Math.min(dimension.anchorX, dimension.targetX);
            const x2 = Math.max(dimension.anchorX, dimension.targetX);
            const label = Math.round(dimension.length).toLocaleString();

            return (
              <g key={`vertical-plan-horizontal-dimension-${dimension.key}`}>
                <line
                  x1={x1}
                  y1={dimension.lineY}
                  x2={x2}
                  y2={dimension.lineY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                <line
                  x1={dimension.anchorX}
                  y1={dimension.lineY - tickHalf}
                  x2={dimension.anchorX}
                  y2={dimension.lineY + tickHalf}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <line
                  x1={dimension.targetX}
                  y1={dimension.lineY - tickHalf}
                  x2={dimension.targetX}
                  y2={dimension.lineY + tickHalf}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <text
                  x={(dimension.anchorX + dimension.targetX) / 2}
                  y={dimension.textY}
                  fill={SECTION_STROKE_COLOR}
                  fontSize={VERTICAL_PLAN_DIMENSION_TEXT_FONT_SIZE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })
        : [];

    const verticalPlanAdditionalVerticalElements =
      sectionViewType === 'vertical-plan'
        ? verticalPlanAdditionalVerticalDimensions.map(dimension => {
            const tickHalf = 20;
            const y1 = Math.min(dimension.anchorY, dimension.targetY);
            const y2 = Math.max(dimension.anchorY, dimension.targetY);
            const label = Math.round(dimension.length).toLocaleString();

            return (
              <g key={`vertical-plan-vertical-dimension-${dimension.key}`}>
                <line
                  x1={dimension.lineX}
                  y1={y1}
                  x2={dimension.lineX}
                  y2={y2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                <line
                  x1={dimension.lineX - tickHalf}
                  y1={dimension.anchorY}
                  x2={dimension.lineX + tickHalf}
                  y2={dimension.anchorY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <line
                  x1={dimension.lineX - tickHalf}
                  y1={dimension.targetY}
                  x2={dimension.lineX + tickHalf}
                  y2={dimension.targetY}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                <text
                  x={0}
                  y={0}
                  transform={`translate(${dimension.textX}, ${(dimension.anchorY + dimension.targetY) / 2}) rotate(-90)`}
                  fill={SECTION_STROKE_COLOR}
                  fontSize={VERTICAL_PLAN_DIMENSION_TEXT_FONT_SIZE}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              </g>
            );
          })
        : [];

    return {
      anchorElements,
      axialPlanVerticalElements,
      axialPlanHorizontalElements,
      axialPlanDimensionElements,
      verticalPlanDimensionElements,
      verticalPlanAdditionalHorizontalElements,
      verticalPlanAdditionalVerticalElements
    };
  }, [
    sectionViewType,
    customPoints,
    params.width,
    params.height,
    params.heightFront,
    params.heightBack,
    params.frontRowCount,
    params.backRowCount,
    params.hasStep,
    params.stepValue,
    isFrontSupportGroupEnabled,
    isBackSupportGroupEnabled,
    viewOptionVersion
  ]);

  // 삽도 미리보기 옵션별 렌더링 (useMemo로 메모이제이션)
  // 교축(정면)에서 받침 중심 위치 및 앵커 렌더링
  const renderedSupportCenters = useMemo(() => {
    if (sectionViewType !== 'axial-front') {
      return null;
    }

    // viewBox 높이 계산
    const baseViewBoxHeight = Math.max(params.heightFront, params.heightBack);
    const viewBoxHeight = baseViewBoxHeight;

    // 전열 받침 중심 위치 및 앵커 계산 및 렌더링
    const frontSupportsAndAnchors = customPoints
      .filter((_, index) => {
        // 전열 받침: frontRowCount 개수만큼
        return index < params.frontRowCount;
      })
      .map((point, index) => {
        // 기준점: "길이=0, 높이=높이(전열)"
        // viewBox Y 시작점이 -padding이므로, 실제 Y 좌표는 그대로 유지
        const baseX = 0;
        const baseY = viewBoxHeight - params.heightFront;
        
        // 길이 방향으로 받침 제원의 Y 값만큼 이동
        const centerX = baseX + point.offsetY;
        const centerY = baseY;
        
        // 앵커 위치 계산
        const anchorCount = Number(point.anchorRowCountAxial) || 0;
        const anchorGap = Number(point.anchorGapAxial) || 0;
        const anchors: JSX.Element[] = [];
        
        if (anchorCount > 0 && anchorGap > 0) {
          for (let i = 0; i < anchorCount; i++) {
            // 앵커 위치 = (i - (n-1)/2) * gap
            // 예: n=2, gap=600: i=0 -> (0-0.5)*600=-300, i=1 -> (1-0.5)*600=300
            // 예: n=3, gap=600: i=0 -> (0-1)*600=-600, i=1 -> (1-1)*600=0, i=2 -> (2-1)*600=600
            const offset = (i - (anchorCount - 1) / 2) * anchorGap;
            const anchorX = centerX + offset;
            const anchorY = centerY;
            
            // -Y 방향으로 300mm 선 그리기 (아래쪽 방향)
            const lineEndY = anchorY + 300; // Y축 아래 방향으로 300mm
            
            anchors.push(
              <g key={`front-anchor-group-${index}-${i}`}>
                <line
                  x1={anchorX}
                  y1={anchorY}
                  x2={anchorX}
                  y2={lineEndY}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="3"
                  strokeOpacity={1}
                />
                <circle
                  cx={anchorX}
                  cy={anchorY}
                  r="12"
                  fill={ANCHOR_FILL_COLOR}
                  stroke="darkred"
                  strokeWidth="3"
                  opacity={0.9}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          
          // 전열 받침: 교축방향 마지막 열의 앵커 중심 위치에서 1.5의 기울기를 갖는 선을 -X, +Y 방향으로 형상의 외곽선과 만나는 위치까지 그린다.
          if (anchorCount > 0) {
            const lastAnchorIndex = anchorCount - 1; // 마지막 열 (가장 오른쪽)
            const lastAnchorOffset = (lastAnchorIndex - (anchorCount - 1) / 2) * anchorGap;
            const lastAnchorX = centerX + lastAnchorOffset;
            const lastAnchorY = centerY;
            
            // 기울기 1.5: dy/dx = 1.5, 즉 dy = 1.5 * dx
            // -X, +Y 방향 (왼쪽 아래, SVG 좌표계에서 +Y는 아래)
            // 직선 방정식: y - lastAnchorY = 1.5 * (x - lastAnchorX)
            // -X, +Y 방향이므로 x가 감소하고 y가 증가해야 함 (SVG 좌표계에서 아래는 Y가 큰 값)
            // 형상의 외곽선: 좌측 가장자리(x=0) 또는 하단 가장자리(y=viewBoxHeight)
            // 좌측 가장자리와 만나는 점: x = 0
            // y = lastAnchorY + 1.5 * (0 - lastAnchorX) = lastAnchorY - 1.5 * lastAnchorX
            // 하단 가장자리와 만나는 점: y = viewBoxHeight
            // viewBoxHeight = lastAnchorY + 1.5 * (x - lastAnchorX)
            // x = lastAnchorX - (viewBoxHeight - lastAnchorY) / 1.5
            
            const slope = 1.5;
            const leftEdgeX = 0; // 좌측 가장자리
            const bottomEdgeY = viewBoxHeight; // 하단 가장자리
            
            // 좌측 가장자리와 만나는 점 (-X, +Y 방향, Y가 증가해야 함)
            const intersectionWithLeftY = lastAnchorY + slope * (lastAnchorX - leftEdgeX);
            
            // 하단 가장자리와 만나는 점
            const deltaY = bottomEdgeY - lastAnchorY;
            const deltaX = deltaY / slope;
            const intersectionWithBottomX = lastAnchorX - deltaX; // -X 방향
            
            // 실제 교차점은 좌측 가장자리와 하단 가장자리 중 먼저 만나는 곳
            // -X, -Y 방향이므로 앵커 점에서 더 가까운 곳 선택
            let intersectionX: number;
            let intersectionY: number;
            
            // 좌측 가장자리 교차점이 유효한지 확인 (Y가 형상 범위 내에 있고, 앵커보다 아래에 있어야 함)
            const isLeftValid = intersectionWithLeftY > lastAnchorY && 
                               intersectionWithLeftY <= bottomEdgeY;
            
            // 하단 가장자리 교차점이 유효한지 확인 (X가 형상 범위 내에 있고, 앵커보다 왼쪽에 있어야 함)
            const isBottomValid = intersectionWithBottomX >= leftEdgeX && 
                                 intersectionWithBottomX <= lastAnchorX;
            
            // 실제 교차점 선택: 둘 다 유효한 경우 거리로 판단
            if (isLeftValid && isBottomValid) {
              // 둘 다 유효한 경우, 거리로 판단
              const leftDistance = Math.sqrt(Math.pow(lastAnchorX - leftEdgeX, 2) + Math.pow(lastAnchorY - intersectionWithLeftY, 2));
              const bottomDistance = Math.sqrt(Math.pow(lastAnchorX - intersectionWithBottomX, 2) + Math.pow(lastAnchorY - bottomEdgeY, 2));
              
              if (leftDistance < bottomDistance) {
                intersectionX = leftEdgeX;
                intersectionY = intersectionWithLeftY;
              } else {
                intersectionX = intersectionWithBottomX;
                intersectionY = bottomEdgeY;
              }
            } else if (isLeftValid) {
              // 좌측 가장자리와 만남
              intersectionX = leftEdgeX;
              intersectionY = intersectionWithLeftY;
            } else if (isBottomValid) {
              // 하단 가장자리와 만남
              intersectionX = intersectionWithBottomX;
              intersectionY = bottomEdgeY;
            } else {
              // 둘 다 유효하지 않은 경우, 좌측 우선 시도
              intersectionX = leftEdgeX;
              intersectionY = intersectionWithLeftY;
            }
            
            // Dimension: 빨간색 점선이 형상 외곽선과 만나는 점과 형상의 상단 중앙점 간의 수직 거리
            const topCenterY = 0; // 형상의 상단 중앙점 Y (상단)
            const dimensionY1 = topCenterY; // Dimension 시작점 Y (상단)
            const dimensionY2 = intersectionY; // Dimension 끝점 Y (교차점)
            const dimensionDistance = Math.abs(dimensionY2 - dimensionY1); // 수직 거리
            
            // Dimension 선 그리기 (전열 받침: 형상 외곽선의 왼쪽)
            const dimensionLineOffset = 100; // Dimension 선과 형상 사이의 간격 (전열)
            const dimensionLineX = 0 - dimensionLineOffset; // 형상 외곽선 왼쪽에 그리기
            
            // 보조선의 기준점: 형상 상단 중앙점과 교차점
            const referenceX1 = params.height / 2; // 형상 상단 중앙점 X
            const referenceX2 = intersectionX; // 교차점 X
            
            anchors.push(
              <g key={`front-dimension-${index}`}>
                <line
                  key={`front-dashed-line-${index}`}
                  x1={lastAnchorX}
                  y1={lastAnchorY}
                  x2={intersectionX}
                  y2={intersectionY}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeOpacity={1}
                />
                {/* 보조선: 시작점(형상 상단 중앙점)에서 치수선까지 */}
                <line
                  x1={referenceX1}
                  y1={dimensionY1}
                  x2={dimensionLineX}
                  y2={dimensionY1}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
                {/* 보조선: 끝점(교차점)에서 치수선까지 */}
                <line
                  x1={referenceX2}
                  y1={dimensionY2}
                  x2={dimensionLineX}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
                {/* Dimension 수직선 (화살표 포함) */}
                <line
                  x1={dimensionLineX}
                  y1={dimensionY1}
                  x2={dimensionLineX}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                {/* Dimension 시작점 표시선 */}
                <line
                  x1={dimensionLineX - 20}
                  y1={dimensionY1}
                  x2={dimensionLineX + 20}
                  y2={dimensionY1}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                {/* Dimension 끝점 표시선 */}
                <line
                  x1={dimensionLineX - 20}
                  y1={dimensionY2}
                  x2={dimensionLineX + 20}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                {/* Dimension 텍스트 (전열: 치수 선의 왼쪽에 배치, 텍스트는 세로로 배치) */}
                <text
                  x={dimensionLineX - 100}
                  y={(dimensionY1 + dimensionY2) / 2}
                  fill={SECTION_STROKE_COLOR}
                  fontSize="100"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(-90 ${dimensionLineX - 100} ${(dimensionY1 + dimensionY2) / 2})`}
                >
                  {Math.round(dimensionDistance).toLocaleString()}
                </text>
              </g>
            );
          }
        }
        
        // 받침 중심 기준 직사각형 계산
        // 아래 변의 중앙이 받침 중심 위치와 일치하도록
        const rectWidth = anchorGap * 1.5; // 가로 길이 = 앵커 간격(교축) * 1.5
        const rectHeight = 100; // 세로 길이 = 100
        const rectX = centerX - rectWidth / 2; // 중심에서 가로/2만큼 왼쪽
        const rectY = centerY - rectHeight; // 아래 변이 받침 중심과 일치하도록
        
        return (
          <g key={`front-support-group-${index}`}>
            {/* 받침 중심 기준 직사각형 */}
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              fill="white"
              stroke={SECTION_STROKE_COLOR}
              strokeWidth={MAIN_LINE_STROKE_WIDTH}
              strokeOpacity={1}
              vectorEffect="non-scaling-stroke"
            />
            {/* 받침 중심점 (크게 표시하여 육안으로 확인 가능하도록) */}
            <circle
              cx={centerX}
              cy={centerY}
              r="15"
              fill="red"
              stroke="darkred"
              strokeWidth="3"
              opacity={0.9}
              vectorEffect="non-scaling-stroke"
            />
            {/* 앵커 점들 */}
            {anchors}
          </g>
        );
      });

    // 후열 받침 중심 위치 및 앵커 계산 및 렌더링
    const backSupportsAndAnchors = customPoints
      .filter((_, index) => {
        // 후열 받침: frontRowCount 이후부터
        return index >= params.frontRowCount;
      })
      .map((point, index) => {
        // 기준점: "길이=길이, 높이=높이(후열)"
        // viewBox Y 시작점이 -padding이므로, 실제 Y 좌표는 그대로 유지
        const baseX = params.height; // 길이
        const baseY = viewBoxHeight - params.heightBack;
        
        // 길이 반대방향으로 받침 제원의 Y 값만큼 이동
        const centerX = baseX - point.offsetY;
        const centerY = baseY;
        
        // 앵커 위치 계산
        const anchorCount = Number(point.anchorRowCountAxial) || 0;
        const anchorGap = Number(point.anchorGapAxial) || 0;
        const anchors: JSX.Element[] = [];
        
        if (anchorCount > 0 && anchorGap > 0) {
          for (let i = 0; i < anchorCount; i++) {
            // 앵커 위치 = (i - (n-1)/2) * gap
            const offset = (i - (anchorCount - 1) / 2) * anchorGap;
            const anchorX = centerX + offset;
            const anchorY = centerY;
            
            // -Y 방향으로 300mm 선 그리기 (아래쪽 방향)
            const lineEndY = anchorY + 300; // Y축 아래 방향으로 300mm
            
            anchors.push(
              <g key={`back-anchor-group-${index}-${i}`}>
                <line
                  x1={anchorX}
                  y1={anchorY}
                  x2={anchorX}
                  y2={lineEndY}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="3"
                  strokeOpacity={1}
                />
                <circle
                  cx={anchorX}
                  cy={anchorY}
                  r="12"
                  fill={ANCHOR_FILL_COLOR}
                  stroke="darkred"
                  strokeWidth="3"
                  opacity={0.9}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }
          
          // 후열 받침: 교축방향 첫번째 열의 앵커 중심 위치에서 1.5의 기울기를 갖는 선을 +X, -Y 방향으로 형상의 외곽선과 만나는 위치까지 그린다.
          if (anchorCount > 0) {
            const firstAnchorIndex = 0; // 첫번째 열 (가장 왼쪽)
            const firstAnchorOffset = (firstAnchorIndex - (anchorCount - 1) / 2) * anchorGap;
            const firstAnchorX = centerX + firstAnchorOffset;
            const firstAnchorY = centerY;
            
            // 기울기 1.5: dy/dx = 1.5, 즉 dy = 1.5 * dx
            // +X, -Y 방향 (오른쪽 아래)
            // 직선 방정식: y - firstAnchorY = 1.5 * (x - firstAnchorX)
            // 형상의 외곽선: 우측 가장자리(x=params.height) 또는 하단 가장자리(y=viewBoxHeight)
            // 우측 가장자리와 만나는 점: x = params.height
            // y = firstAnchorY + 1.5 * (params.height - firstAnchorX)
            // 하단 가장자리와 만나는 점: y = viewBoxHeight
            // viewBoxHeight = firstAnchorY + 1.5 * (x - firstAnchorX)
            // x = firstAnchorX + (viewBoxHeight - firstAnchorY) / 1.5
            
            const slope = 1.5;
            const rightEdgeX = params.height; // 우측 가장자리
            const bottomEdgeY = viewBoxHeight; // 하단 가장자리
            
            // 우측 가장자리와 만나는 점
            const intersectionWithRightY = firstAnchorY + slope * (rightEdgeX - firstAnchorX);
            
            // 하단 가장자리와 만나는 점
            const deltaY = bottomEdgeY - firstAnchorY;
            const deltaX = deltaY / slope;
            const intersectionWithBottomX = firstAnchorX + deltaX; // +X 방향
            
            // 실제 교차점은 우측 가장자리와 하단 가장자리 중 먼저 만나는 곳
            let intersectionX: number;
            let intersectionY: number;
            
            if (intersectionWithRightY >= 0 && intersectionWithRightY <= bottomEdgeY) {
              // 우측 가장자리와 먼저 만남
              intersectionX = rightEdgeX;
              intersectionY = intersectionWithRightY;
            } else {
              // 하단 가장자리와 만남
              intersectionX = intersectionWithBottomX;
              intersectionY = bottomEdgeY;
            }
            
            // Dimension: 빨간색 점선이 형상 외곽선과 만나는 점과 형상의 상단 중앙점 간의 수직 거리
            const topCenterY = 0; // 형상의 상단 중앙점 Y (상단)
            const dimensionY1 = topCenterY; // Dimension 시작점 Y (상단)
            const dimensionY2 = intersectionY; // Dimension 끝점 Y (교차점)
            const dimensionDistance = Math.abs(dimensionY2 - dimensionY1); // 수직 거리
            
            // Dimension 선 그리기 (후열 받침: 형상 외곽선의 오른쪽)
            const dimensionLineOffset = 200; // Dimension 선과 형상 사이의 간격 (후열)
            const dimensionLineX = params.height + dimensionLineOffset; // 형상 외곽선 오른쪽에 그리기
            
            // 보조선의 기준점: 형상 상단 중앙점과 교차점
            const referenceX1 = params.height / 2; // 형상 상단 중앙점 X
            const referenceX2 = intersectionX; // 교차점 X
            
            anchors.push(
              <g key={`back-dimension-${index}`}>
                <line
                  key={`back-dashed-line-${index}`}
                  x1={firstAnchorX}
                  y1={firstAnchorY}
                  x2={intersectionX}
                  y2={intersectionY}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeOpacity={1}
                />
                {/* 보조선: 시작점(형상 상단 중앙점)에서 치수선까지 */}
                <line
                  x1={referenceX1}
                  y1={dimensionY1}
                  x2={dimensionLineX}
                  y2={dimensionY1}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
                {/* 보조선: 끝점(교차점)에서 치수선까지 */}
                <line
                  x1={referenceX2}
                  y1={dimensionY2}
                  x2={dimensionLineX}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
                {/* Dimension 수직선 (화살표 포함) */}
                <line
                  x1={dimensionLineX}
                  y1={dimensionY1}
                  x2={dimensionLineX}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
                {/* Dimension 시작점 표시선 */}
                <line
                  x1={dimensionLineX - 20}
                  y1={dimensionY1}
                  x2={dimensionLineX + 20}
                  y2={dimensionY1}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                {/* Dimension 끝점 표시선 */}
                <line
                  x1={dimensionLineX - 20}
                  y1={dimensionY2}
                  x2={dimensionLineX + 20}
                  y2={dimensionY2}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
                {/* Dimension 텍스트 (후열: 치수 선의 왼쪽에 배치, 텍스트는 세로로 배치) */}
                <text
                  x={dimensionLineX - 100}
                  y={(dimensionY1 + dimensionY2) / 2}
                  fill={SECTION_STROKE_COLOR}
                  fontSize="100"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(-90 ${dimensionLineX - 100} ${(dimensionY1 + dimensionY2) / 2})`}
                >
                  {Math.round(dimensionDistance).toLocaleString()}
                </text>
              </g>
            );
          }
        }
        
        // 받침 중심 기준 직사각형 계산
        // 아래 변의 중앙이 받침 중심 위치와 일치하도록
        const rectWidth = anchorGap * 1.5; // 가로 길이 = 앵커 간격(교축) * 1.5
        const rectHeight = 100; // 세로 길이 = 100
        const rectX = centerX - rectWidth / 2; // 중심에서 가로/2만큼 왼쪽
        const rectY = centerY - rectHeight; // 아래 변이 받침 중심과 일치하도록
        
        return (
          <g key={`back-support-group-${index}`}>
            {/* 받침 중심 기준 직사각형 */}
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              fill="white"
              stroke={SECTION_STROKE_COLOR}
              strokeWidth={MAIN_LINE_STROKE_WIDTH}
              strokeOpacity={1}
              vectorEffect="non-scaling-stroke"
            />
            {/* 받침 중심점 (크게 표시하여 육안으로 확인 가능하도록) */}
            <circle
              cx={centerX}
              cy={centerY}
              r="15"
              fill="red"
              stroke="darkred"
              strokeWidth="3"
              opacity={0.9}
              vectorEffect="non-scaling-stroke"
            />
            {/* 앵커 점들 */}
            {anchors}
          </g>
        );
      });

    return (
      <>
        {frontSupportsAndAnchors}
        {backSupportsAndAnchors}
      </>
    );
  }, [sectionViewType, customPoints, params.height, params.heightFront, params.heightBack, params.frontRowCount]);



  // 단면 치수 행 개수에 따라 점 개수 자동 조정 (단차 Off일 때)
  useEffect(() => {
    setSectionPoints(prev => {
      const currentCount = prev.length;
      
      if (sectionPointCount === currentCount) {
        return prev;
      }
      
      const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];
      for (let i = 0; i < sectionPointCount; i++) {
        if (i < currentCount) {
          newPoints.push(prev[i]);
        } else {
          newPoints.push({
            id: `point-${Date.now()}-${i}`,
            x: 0,
            y: 0,
            r: 0
          });
        }
      }
      
      return newPoints;
    });
  }, [sectionPointCount]);

  // 단면 치수 행 개수에 따라 점 개수 자동 조정 (전열)
  useEffect(() => {
    setSectionPointsFront(prev => {
      const currentCount = prev.length;
      
      if (sectionPointCountFront === currentCount) {
        return prev;
      }
      
      const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];
      for (let i = 0; i < sectionPointCountFront; i++) {
        if (i < currentCount) {
          newPoints.push(prev[i]);
        } else {
          newPoints.push({
            id: `point-front-${Date.now()}-${i}`,
            x: 0,
            y: 0,
            r: 0
          });
        }
      }
      
      return newPoints;
    });
  }, [sectionPointCountFront]);

  // 단면 치수 행 개수에 따라 점 개수 자동 조정 (후열)
  useEffect(() => {
    setSectionPointsBack(prev => {
      const currentCount = prev.length;
      
      if (sectionPointCountBack === currentCount) {
        return prev;
      }
      
      const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];
      for (let i = 0; i < sectionPointCountBack; i++) {
        if (i < currentCount) {
          newPoints.push(prev[i]);
        } else {
          newPoints.push({
            id: `point-back-${Date.now()}-${i}`,
            x: 0,
            y: 0,
            r: 0
          });
        }
      }
      
      return newPoints;
    });
  }, [sectionPointCountBack]);

  // 받침개수에 따라 점 개수 자동 조정
  useEffect(() => {
    const totalCount = params.frontRowCount + params.backRowCount;
    
    setCustomPoints(prev => {
      const currentCount = prev.length;
      
      // 이미 정확한 개수면 변경하지 않음
      if (totalCount === currentCount) {
        return prev;
      }
      
      // 정확한 개수로 재생성 (기존 데이터는 유지하되, 개수만 맞춤)
      const newPoints: Point[] = [];
      for (let i = 0; i < totalCount; i++) {
        if (i < currentCount) {
          // 기존 점 유지
          newPoints.push(prev[i]);
        } else {
          // 새로운 점 추가
          newPoints.push({
            id: `point-${Date.now()}-${i}`,
            offsetX: 0,
            offsetY: 0,
            anchorRowCountAxial: 0,
            anchorRowCountVertical: 0,
            anchorGapAxial: 0,
            anchorGapVertical: 0
          });
        }
      }
      return newPoints;
    });
  }, [params.frontRowCount, params.backRowCount]);

  // 점 업데이트
  const updatePoint = (id: string, field: 'offsetX' | 'offsetY' | 'anchorRowCountAxial' | 'anchorRowCountVertical' | 'anchorGapAxial' | 'anchorGapVertical', value: number) => {
    setCustomPoints(customPoints.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // 엑셀 데이터 붙여넣기 처리
  const handlePasteData = (pastedData: string, startIndex: number) => {
    const lines = pastedData.split('\n').filter(line => line.trim());
    const updatedPoints = [...customPoints];
    const newPoints: Point[] = [];
    
    lines.forEach((line, lineIndex) => {
      const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
      if (cells.length >= 2) {
        const x = parseFloat(cells[0]);
        const y = parseFloat(cells[1]);
        const anchorRowCountAxial = cells.length >= 3 ? parseFloat(cells[2]) : 0;
        const anchorRowCountVertical = cells.length >= 4 ? parseFloat(cells[3]) : 0;
        const anchorGapAxial = cells.length >= 5 ? parseFloat(cells[4]) : 0;
        const anchorGapVertical = cells.length >= 6 ? parseFloat(cells[5]) : 0;
        
        if (!isNaN(x) && !isNaN(y)) {
          const targetIndex = startIndex + lineIndex;
          
          if (targetIndex < updatedPoints.length) {
            // 기존 점 업데이트
            updatedPoints[targetIndex] = {
              ...updatedPoints[targetIndex],
              offsetX: x,
              offsetY: y,
              anchorRowCountAxial: !isNaN(anchorRowCountAxial) ? anchorRowCountAxial : updatedPoints[targetIndex].anchorRowCountAxial,
              anchorRowCountVertical: !isNaN(anchorRowCountVertical) ? anchorRowCountVertical : updatedPoints[targetIndex].anchorRowCountVertical,
              anchorGapAxial: !isNaN(anchorGapAxial) ? anchorGapAxial : updatedPoints[targetIndex].anchorGapAxial,
              anchorGapVertical: !isNaN(anchorGapVertical) ? anchorGapVertical : updatedPoints[targetIndex].anchorGapVertical
            };
          } else {
            // 새 점 추가
            newPoints.push({
              id: Date.now().toString() + '-' + lineIndex,
              offsetX: x,
              offsetY: y,
              anchorRowCountAxial: !isNaN(anchorRowCountAxial) ? anchorRowCountAxial : 0,
              anchorRowCountVertical: !isNaN(anchorRowCountVertical) ? anchorRowCountVertical : 0,
              anchorGapAxial: !isNaN(anchorGapAxial) ? anchorGapAxial : 0,
              anchorGapVertical: !isNaN(anchorGapVertical) ? anchorGapVertical : 0
            });
          }
        }
      }
    });
    
    // 모든 변경사항을 한 번에 적용
    if (newPoints.length > 0) {
      setCustomPoints([...updatedPoints, ...newPoints]);
    } else if (updatedPoints.some((p, i) => 
      i < customPoints.length && 
      (p.offsetX !== customPoints[i].offsetX || p.offsetY !== customPoints[i].offsetY ||
       p.anchorRowCountAxial !== customPoints[i].anchorRowCountAxial ||
       p.anchorRowCountVertical !== customPoints[i].anchorRowCountVertical ||
       p.anchorGapAxial !== customPoints[i].anchorGapAxial || p.anchorGapVertical !== customPoints[i].anchorGapVertical)
    )) {
      setCustomPoints(updatedPoints);
    }
  };

  const handleParamChange = (key: keyof SectionParams, value: number | boolean) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDownload = () => {
    const svg = document.getElementById('section-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = params.width;
      canvas.height = params.height;
      ctx?.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `section-${Date.now()}.png`;
      link.href = png;
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // 상대 좌표를 절대 좌표로 변환하는 헬퍼 함수 (단면 뷰 렌더링용)
  // 모든 점이 상대 좌표로 저장되어 있으므로, 누적하여 절대 좌표로 변환
  const convertToAbsoluteCoordinates = (points: Array<{ id: string; x: number; y: number; r: number }>): Array<{ x: number; y: number; r: number }> => {
    if (points.length === 0) return [];
    
    const absolutePoints: Array<{ x: number; y: number; r: number }> = [];
    
    // 첫 번째 점은 기준점 (0, 0)의 상대 좌표이므로 절대 좌표와 동일
    absolutePoints.push({ x: points[0].x, y: points[0].y, r: points[0].r });
    
    // 나머지 점들은 이전 점을 기준으로 상대 좌표를 누적
    for (let i = 1; i < points.length; i++) {
      absolutePoints.push({
        x: absolutePoints[i - 1].x + points[i].x,
        y: absolutePoints[i - 1].y + points[i].y,
        r: points[i].r
      });
    }
    
    return absolutePoints;
  };

const ARC_TOLERANCE = 1e-8;

const calculateArcCenter = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number
): { centerX: number; centerY: number } | null => {
  const dx = endX - startX;
  const dy = endY - startY;
  const chordLength = Math.sqrt(dx * dx + dy * dy);

  if (chordLength < ARC_TOLERANCE) {
    return null;
  }

  const absRadius = Math.abs(radius);
  const halfChord = chordLength / 2;

  if (absRadius < halfChord - ARC_TOLERANCE) {
    return null;
  }

  let hSquared = absRadius * absRadius - halfChord * halfChord;

  if (hSquared < 0 && Math.abs(hSquared) <= ARC_TOLERANCE) {
    hSquared = 0;
  }

  if (hSquared < 0) {
    return null;
  }

  const h = Math.sqrt(hSquared);
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const perpX = -dy / chordLength;
  const perpY = dx / chordLength;

  const centerOptions = [
    { x: midX + perpX * h, y: midY + perpY * h },
    { x: midX - perpX * h, y: midY - perpY * h }
  ];

  const radiusSign = radius >= 0 ? 1 : -1;
  const desiredCrossSign = radiusSign >= 0 ? -1 : 1;

  const chooseCenter = () => {
    let fallback = centerOptions[0];
    let fallbackCross = 0;

    for (const option of centerOptions) {
      const startToCenterX = option.x - startX;
      const startToCenterY = option.y - startY;
      const cross = dx * startToCenterY - dy * startToCenterX;

      if (fallback === centerOptions[0]) {
        fallback = option;
        fallbackCross = cross;
      }

      if (Math.abs(cross) <= ARC_TOLERANCE) {
        return option;
      }

      if (Math.sign(cross) === desiredCrossSign) {
        return option;
      }
    }

    return fallbackCross !== 0 ? fallback : centerOptions[0];
  };

  const chosenCenter = chooseCenter();

  return {
    centerX: chosenCenter.x,
    centerY: chosenCenter.y
  };
};

  // 테이블에서 입력받은 값을 저장 형식으로 변환하는 함수
  // 모든 입력값은 상대 좌표로 그대로 저장
  const convertInputToStorage = (
    currentPoints: Array<{ id: string; x: number; y: number; r: number }>,
    index: number,
    inputX: number,
    inputY: number,
    inputR?: number
  ): Array<{ id: string; x: number; y: number; r: number }> => {
    const updated = [...currentPoints];
    
    // 모든 행의 입력값을 상대 좌표로 그대로 저장
    updated[index] = {
      ...updated[index],
      x: inputX,
      y: inputY,
      r: inputR !== undefined ? inputR : updated[index].r
    };
    
    return updated;
  };

  // 단면 뷰 렌더링을 위한 useMemo
  // 단면 형상 path 생성 (교직(정면)과 코핑 형상 미리보기 단면에서 공통 사용)
  const sectionPathData = useMemo(() => {
    // 단면 뷰에서 사용할 점들 결정
    const pointsToRender = params.hasStep
      ? (activeSectionTab === 'front' ? sectionPointsFront : sectionPointsBack)
      : sectionPoints;

    if (pointsToRender.length === 0) {
      return null;
    }

    // 상대 좌표를 절대 좌표로 변환
    const absolutePoints = convertToAbsoluteCoordinates(pointsToRender);

    // 점들의 경계 계산
    const minX = Math.min(...absolutePoints.map(p => p.x));
    const maxX = Math.max(...absolutePoints.map(p => p.x));
    const minY = Math.min(...absolutePoints.map(p => p.y));
    const maxY = Math.max(...absolutePoints.map(p => p.y));

    const viewBoxWidth = maxX - minX || 100;
    const viewBoxHeight = maxY - minY || 100;
    const padding = Math.max(viewBoxWidth, viewBoxHeight) * 0.1 || 20;

    // SVG 경계
    const svgX = minX - padding;
    const svgY = minY - padding;
    const svgWidth = viewBoxWidth + padding * 2;
    const svgHeight = viewBoxHeight + padding * 2;

    // Y축을 뒤집기 위한 변환 값 계산 (SVG 좌표계에서 Y가 아래로 증가하므로, +Y가 위쪽이 되도록)
    // viewBox의 중앙 Y 좌표
    const centerY = svgY + svgHeight / 2;

    // Y 좌표 변환 함수: Y축을 뒤집기 (centerY 기준으로 반사)
    const flipY = (y: number) => centerY * 2 - y;

    // 두 점 사이의 Arc를 생성하는 함수
    const createArcPath = (
      startX: number, startY: number,
      endX: number, endY: number,
      radius: number
    ): string => {
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 반지름이 거리의 절반보다 작으면 직선으로 처리
      if (radius === 0 || Math.abs(radius) < distance / 2) {
        return `L ${endX} ${endY}`;
      }
      
      // R 값의 부호에 따라 Arc 방향 결정
      const isNegative = radius < 0;
      const absRadius = Math.abs(radius);
      
      // 두 점의 중점
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      
      // 수직 방향 벡터 (두 점을 연결하는 선에 수직)
      // 항상 한 방향으로 고정
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // Arc의 높이 (versine)
      const h = absRadius - Math.sqrt(absRadius * absRadius - (distance / 2) * (distance / 2));
      
      // Arc의 중심점 (항상 같은 방향)
      const centerX = midX + perpX * h;
      const centerY = midY + perpY * h;
      
      // 시작점과 끝점에서 중심까지의 벡터
      const startToCenterX = centerX - startX;
      const startToCenterY = centerY - startY;
      const endToCenterX = centerX - endX;
      const endToCenterY = centerY - endY;
      
      // 각도 계산 (시작점과 끝점의 중심 기준 각도)
      const startAngle = Math.atan2(startToCenterY, startToCenterX);
      const endAngle = Math.atan2(endToCenterY, endToCenterX);
      
      // Arc의 방향 결정 (큰 Arc인지 작은 Arc인지)
      let angleDiff = endAngle - startAngle;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;
      
      // sweepFlag 계산 (각도 차이에 따라)
      let sweepFlag = angleDiff > 0 ? 1 : 0;
      
      // R이 음수면 sweepFlag를 반대로 설정하여 Arc 방향 반전
      if (isNegative) {
        sweepFlag = sweepFlag === 1 ? 0 : 1;
      }
      
      // SVG A 명령어 사용 (절댓값 사용)
      return `A ${absRadius} ${absRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    };

    // 점들을 path로 변환 (Y축 뒤집기 및 R 값 적용)
    let pathData = '';
    if (absolutePoints.length > 0) {
      const firstPoint = absolutePoints[0];
      pathData = `M ${firstPoint.x} ${flipY(firstPoint.y)} `;
      
      for (let i = 1; i < absolutePoints.length; i++) {
        const prevPoint = absolutePoints[i - 1];
        const currentPoint = absolutePoints[i];
        const prevX = prevPoint.x;
        const prevY = flipY(prevPoint.y);
        const currX = currentPoint.x;
        const currY = flipY(currentPoint.y);
        
        if (currentPoint.r === 0) {
          // 직선 연결
          pathData += `L ${currX} ${currY} `;
        } else {
          // Arc 연결
          pathData += createArcPath(prevX, prevY, currX, currY, currentPoint.r);
          pathData += ' ';
        }
      }
      
      pathData += 'Z';
    }

    return {
      pathData,
      absolutePoints,
      flipY,
      viewBox: `${svgX} ${svgY} ${svgWidth} ${svgHeight}`
    };
  }, [params.hasStep, activeSectionTab, sectionPoints, sectionPointsFront, sectionPointsBack]);

  // 교직(정면) 받침 중심위치 렌더링
  const renderedVerticalFrontSupports = useMemo(() => {
    if (sectionViewType !== 'vertical-front') {
      return null;
    }

    const sectionData = sectionPathData;
    // sectionData가 없어도 기준점 표시는 가능하도록 기본값 설정
    if (!sectionData || !sectionData.pathData) {
      // 기본 경계값 사용
      const defaultMinX = 0;
      const defaultMaxX = params.width || 1000;
      const defaultMinY = 0;
      const defaultMaxY = params.height || 1000;
      
      const sectionWidth = defaultMaxX - defaultMinX || 1000;
      const sectionHeight = defaultMaxY - defaultMinY || 1000;
      
      const baseViewBoxWidth = params.width || 1000;
      const baseViewBoxHeight = params.height || 1000;
      const padding = Math.max(baseViewBoxWidth, baseViewBoxHeight) * 0.1 || 20;
      const adjustedViewBoxWidth = baseViewBoxWidth + padding * 2;
      const adjustedViewBoxHeight = baseViewBoxHeight + padding * 2;
      
      const scaleX = adjustedViewBoxWidth / sectionWidth;
      const scaleY = adjustedViewBoxHeight / sectionHeight;
      const scale = Math.min(scaleX, scaleY) * 0.9;
      
      const offsetX = (adjustedViewBoxWidth - sectionWidth * scale) / 2;
      const offsetY = (adjustedViewBoxHeight - sectionHeight * scale) / 2;
      
      const translateX = offsetX - defaultMinX * scale;
      const translateY = offsetY - defaultMinY * scale;
      
      // 기준점 표시만 반환
      const originX = 0;
      const originY = 0;
      const transformedOriginX = translateX + originX * scale;
      const transformedOriginY = translateY + originY * scale;
      
      const markerSize = 200; // 매우 크게
      const circleRadius = 50;
      
      return (
        <g>
          <line
            x1={transformedOriginX - markerSize}
            y1={transformedOriginY}
            x2={transformedOriginX + markerSize}
            y2={transformedOriginY}
            stroke="blue"
            strokeWidth="10"
            opacity={1}
            strokeLinecap="round"
          />
          <line
            x1={transformedOriginX}
            y1={transformedOriginY - markerSize}
            x2={transformedOriginX}
            y2={transformedOriginY + markerSize}
            stroke="blue"
            strokeWidth="10"
            opacity={1}
            strokeLinecap="round"
          />
          <circle
            cx={transformedOriginX}
            cy={transformedOriginY}
            r={circleRadius}
            fill="blue"
            stroke="darkblue"
            strokeWidth="5"
            opacity={0.9}
          />
          <circle
            cx={transformedOriginX}
            cy={transformedOriginY}
            r={circleRadius * 0.4}
            fill="white"
            stroke="none"
          />
        </g>
      );
    }

    // 단면 형상의 경계 계산 (pathData는 이미 flipY가 적용된 상태)
    const { absolutePoints, flipY } = sectionData;
    
    // 기준점: 단면 치수 입력 테이블의 첫 번째 점 (절대 좌표)
    // absolutePoints는 이미 절대 좌표로 변환된 상태이므로, 첫 번째 점이 기준점
    // absolutePoints[0]는 단면 형상의 첫 번째 꼭지점입니다
    // pathData 생성 시 첫 번째 점은 M ${firstPoint.x} ${flipY(firstPoint.y)}로 시작하므로
    // 기준점도 동일한 좌표를 사용해야 합니다
    const originPoint = absolutePoints.length > 0 ? absolutePoints[0] : { x: 0, y: 0 };
    const originX = originPoint.x;
    const originY = originPoint.y; // 절대 좌표 (flipY 적용 전, 원본 Y 좌표)
    
    // flipY가 적용된 좌표로 경계 계산 (모달에서 단면 형상 렌더링과 동일)
    const flippedPoints = absolutePoints.map(p => ({ x: p.x, y: flipY(p.y) }));
    const minX = Math.min(...flippedPoints.map(p => p.x));
    const maxX = Math.max(...flippedPoints.map(p => p.x));
    const minY = Math.min(...flippedPoints.map(p => p.y));
    const maxY = Math.max(...flippedPoints.map(p => p.y));
    const sectionWidth = maxX - minX || 1;
    const sectionHeight = maxY - minY || 1;

    // viewBox 계산 (삽도 미리보기 모달의 viewBox와 동일하게 설정)
    // 모달에서 교직(정면)의 경우: viewBoxX = -padding, viewBoxY = -padding
    const baseViewBoxWidth = params.width;
    const baseViewBoxHeight = params.height;
    const padding = Math.max(baseViewBoxWidth, baseViewBoxHeight) * 0.1 || 20;
    const adjustedViewBoxWidth = baseViewBoxWidth + padding * 2;
    const adjustedViewBoxHeight = baseViewBoxHeight + padding * 2;
    // 모달의 viewBox 시작점 (viewBoxX, viewBoxY)
    const modalViewBoxX = -padding;
    const modalViewBoxY = -padding;

    // 교직(정면) viewBox에 맞게 스케일링 및 중앙 정렬 (모달에서 단면 형상 렌더링과 완전히 동일한 계산)
    // 형상이 viewBox 중앙에 위치하도록 계산
    const scaleX = adjustedViewBoxWidth / sectionWidth;
    const scaleY = adjustedViewBoxHeight / sectionHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90%로 약간 여유 공간

    // 형상의 중심점 계산 (flipY가 적용된 좌표 기준)
    const sectionCenterX = (minX + maxX) / 2;
    const sectionCenterY = (minY + maxY) / 2;
    const originalMinX = Math.min(...absolutePoints.map(p => p.x));
    const originalMaxX = Math.max(...absolutePoints.map(p => p.x));
    
    // viewBox의 중심점 계산
    // viewBox는 viewBox={`${viewBoxX} ${viewBoxY} ${adjustedViewBoxWidth} ${adjustedViewBoxHeight}`}
    // viewBoxX = -padding, viewBoxY = -padding
    // viewBox의 중심점은: (viewBoxX + adjustedViewBoxWidth / 2, viewBoxY + adjustedViewBoxHeight / 2)
    const viewBoxCenterX = modalViewBoxX + adjustedViewBoxWidth / 2;
    const viewBoxCenterY = modalViewBoxY + adjustedViewBoxHeight / 2;
    
    // 형상의 중심점을 viewBox의 중심점에 맞추기 위한 translate 계산
    // scale 적용 후 형상의 중심점: (sectionCenterX * scale, sectionCenterY * scale)
    // 이 중심점이 viewBox의 중심점에 위치하도록:
    //   translateX = viewBoxCenterX - sectionCenterX * scale
    //   translateY = viewBoxCenterY - sectionCenterY * scale
    const translateX = viewBoxCenterX - sectionCenterX * scale;
    const translateY = viewBoxCenterY - sectionCenterY * scale;

    // 기준점 표시 (단면 치수 입력 테이블의 첫 번째 점, 크고 눈에 띄게)
    // 기준점은 단면 형상 좌표계에서의 첫 번째 점(absolutePoints[0])이므로, 변환된 위치에 표시
    // 모달에서 단면 형상은 <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>로 렌더링됨
    // 모달의 viewBox는 viewBox={`${modalViewBoxX} ${modalViewBoxY} ${adjustedViewBoxWidth} ${adjustedViewBoxHeight}`}`로 설정됨
    // SVG transform의 적용 순서: translate가 먼저, scale이 나중에 적용됨
    // 
    // pathData의 첫 번째 점: M ${firstPoint.x} ${flipY(firstPoint.y)}
    // pathData는 이미 flipY가 적용된 좌표를 사용하므로, transform 적용 시:
    //   X: (translateX + originX) * scale
    //   Y: (translateY + flipY(originY)) * scale
    // 
    // 하지만 translateY는 이미 flipY가 적용된 좌표(flippedPoints)로 계산된 minY를 기반으로 하므로,
    // 기준점의 Y 좌표는 flipY(originY)를 사용해야 합니다.
    const flippedOriginX = originX;
    const flippedOriginY = flipY(originY);
    // SVG transform 적용: translate 먼저, scale 나중 (viewBox 좌표계)
    // translateX, translateY는 이미 flipY가 적용된 좌표(flippedPoints) 기반으로 계산됨
    const transformedOriginX = (translateX + flippedOriginX) * scale;
    const transformedOriginY = (translateY + flippedOriginY) * scale;
    
    // 디버깅: 기준점 좌표 확인
    console.log('기준점 계산:', {
      'absolutePoints[0] (원본)': absolutePoints[0],
      'pathData 첫 번째 점 (M 명령)': `${absolutePoints[0].x} ${flipY(absolutePoints[0].y)}`,
      originX,
      originY,
      'flippedOriginX': flippedOriginX,
      'flippedOriginY': flippedOriginY,
      'flipY(originY)': flipY(originY),
      'translateX, translateY': `${translateX}, ${translateY}`,
      'translateY 계산 기반 (minY, flipped)': minY,
      scale,
      '기준점 SVG 좌표 (변환 후, scale 먼저 적용)': `${flippedOriginX * scale + translateX}, ${flippedOriginY * scale + translateY}`,
      transformedOriginX,
      transformedOriginY,
      'minX, minY (flipped)': `${minX}, ${minY}`,
      'maxX, maxY (flipped)': `${maxX}, ${maxY}`,
      '모달 path 첫 번째 점 (M 명령) 실제 SVG 좌표 (SVG transform 적용, scale 먼저)': `${originX * scale + translateX}, ${flipY(originY) * scale + translateY}`,
      '차이 (Y 방향)': `${(flipY(originY) * scale + translateY) - transformedOriginY}`
    });
    
    // 받침 중심위치 및 앵커 렌더링: 기준점(단면 치수 입력 테이블의 첫 번째 점)을 기준으로 받침 제원 테이블의 "X" 열(offsetX) 값만큼 떨어진 위치
    const supportAndAnchorElements = customPoints.map((point, index) => {
      // 기준점(첫 번째 점) 기준으로 offsetX만큼 떨어진 위치 (받침 중심위치)
      // 기준점은 단면 형상 좌표계에서 (originX, originY)이므로, 받침 중심위치는 기준점 + offsetX
      // originY는 flipY 적용 전 원본 Y 좌표이므로, 받침 중심위치의 Y도 originY를 사용
      const supportX = originX + point.offsetX;
      const supportY = originY; // Y는 기준점의 Y 좌표 (원본, flipY 적용 전)

      const elements: React.ReactNode[] = [];

      // 받침 중심위치 점 (크게 표시하여 육안으로 확인 가능하도록)
      // 기준점 기준으로 받침 중심위치 계산
      const supportCircleX = supportX;
      const supportCircleY = supportY;
      elements.push(
        <circle
          key={`vertical-front-support-${index}`}
          cx={supportCircleX}
          cy={supportCircleY}
          r="15"
          fill="red"
          stroke="darkred"
          strokeWidth="3"
          opacity={0.9}
        />
      );

      // 앵커 위치 계산 및 렌더링
      const anchorRowCountVertical = Number(point.anchorRowCountVertical) || 0;
      const anchorGapVertical = Number(point.anchorGapVertical) || 0;

      // 받침 중심 위치를 기준으로 직사각형 그리기
      // 직사각형의 가로 길이 = 앵커 간격(교직) * 1.5
      // 직사각형의 세로 길이 = 100
      // 직사각형의 하단 중앙점이 받침 중심위치와 일치하도록 배치
      if (anchorGapVertical > 0) {
        const rectWidth = anchorGapVertical * 1.5; // 가로 길이 = 앵커 간격(교직) * 1.5
        const rectHeight = 100; // 세로 길이 = 100
        
        // 직사각형의 하단 중앙점이 받침 중심위치와 일치하도록 배치
        // SVG rect의 y는 상단 모서리의 Y 좌표이므로:
        // 원본 좌표계에서 직사각형의 하단 Y 좌표 = rectY + rectHeight
        // 이 하단 Y 좌표가 supportY와 일치해야 함: rectY + rectHeight = supportY
        // 따라서 rectY = supportY - rectHeight
        // 
        // 하지만 flipY가 적용되므로, 실제 화면에서 직사각형의 하단 중앙점이 받침 중심 위치와 일치하도록 하려면:
        // - 원본 좌표계에서: rectY = supportY - rectHeight
        //   -> 직사각형의 하단 = rectY + rectHeight = supportY (받침 중심 위치)
        // - flipY 적용 후: 직사각형의 하단은 flipY(supportY) 위치에 표시됨
        // 
        // 받침 중심 위치도 flipY가 적용되어 표시되므로, 직사각형의 하단도 flipY가 적용된 위치에 표시되어야 함
        // 따라서 rectY = supportY - rectHeight로 설정하면 올바름
        const rectX = supportX - rectWidth / 2; // 직사각형의 X 좌표 (중앙 정렬)
        const rectY = supportY - rectHeight; // 직사각형의 상단 Y 좌표 (원본 좌표계)
        
        elements.push(
          <rect
            key={`vertical-front-support-rect-${index}`}
            x={rectX}
            y={rectY}
            width={rectWidth}
            height={rectHeight}
            fill="white"
            stroke={SECTION_STROKE_COLOR}
            strokeWidth={MAIN_LINE_STROKE_WIDTH}
            opacity={1}
          />
        );
      }

      if (anchorRowCountVertical > 0 && anchorGapVertical > 0) {
        // 앵커 위치 계산: 받침 중심위치를 기준으로 X 방향으로 배치
        // 앵커열 개수(교직)=2, 앵커 간격(교직)=600 → 받침 중심위치로부터 -X 방향으로 300, +X 방향으로 300
        // 앵커열 개수(교직)=3, 앵커 간격(교직)=600 → 받침 중심위치로부터 -X 방향으로 600, 받침 중심위치, +X 방향으로 600
        for (let i = 0; i < anchorRowCountVertical; i++) {
          // 앵커 위치: 받침 중심위치에서 시작하여 X 방향으로 배치
          // i=0: 첫 번째 앵커 (가장 왼쪽)
          // i=anchorRowCountVertical-1: 마지막 앵커 (가장 오른쪽)
          // 중앙 정렬을 위해 offset 계산
          const offset = (i - (anchorRowCountVertical - 1) / 2) * anchorGapVertical;
          const anchorX = supportX + offset;
          const anchorY = supportY;

          // 앵커 위치 점 (크게 표시하여 육안으로 확인 가능하도록)
          elements.push(
            <circle
              key={`vertical-front-anchor-${index}-${i}`}
              cx={anchorX}
              cy={anchorY}
              r="12"
              fill={ANCHOR_FILL_COLOR}
              stroke="darkred"
              strokeWidth="2"
              opacity={0.9}
            />
          );

          // 앵커 위치에서 -Y(아래) 방향으로 300mm의 빨간색 선
          // 단면 형상 좌표계에서 아래는 +Y 방향이지만, flipY가 적용되면 반대가 됨
          // 따라서 원본 좌표계에서 위쪽 방향(-Y)으로 선을 그리려면, 원본 좌표계에서 -Y 방향으로 선을 그려야 함
          // 즉, lineEndY = anchorY - 300 (원본 좌표계에서 위쪽 방향)
          // flipY 적용 후에는 아래쪽 방향으로 표시됨
          const lineEndY = anchorY - 300; // 원본 좌표계에서 위쪽 방향 (-Y), flipY 적용 후 아래쪽으로 표시
          elements.push(
            <line
              key={`vertical-front-anchor-line-${index}-${i}`}
              x1={anchorX}
              y1={anchorY}
              x2={anchorX}
              y2={lineEndY}
              stroke={ANCHOR_STROKE_COLOR}
              strokeWidth="3"
              strokeOpacity={1}
            />
          );
        }

        // 빨간색 점선 그리기
        // 첫 번째 전열 받침 또는 첫 번째 후열 받침: 교직방향 마지막 열의 앵커 중심 위치에서 1.5의 기울기를 갖는 선을 -X, -Y 방향으로 형상의 외곽선과 만나는 위치까지 그린다.
        // 마지막 전열 받침 또는 마지막 후열 받침: 교직방향 첫번째 열의 앵커 중심 위치에서 1.5의 기울기를 갖는 선을 +X, -Y 방향으로 형상의 외곽선과 만나는 위치까지 그린다.
        // sectionData가 있어야 absolutePoints를 사용할 수 있음
        if (sectionData && sectionData.absolutePoints) {
          const absolutePoints = sectionData.absolutePoints;
          
          const isFirstFront = index === 0;
          const isFirstBack = index === params.frontRowCount;
          const isLastFront = index === params.frontRowCount - 1;
          const isLastBack = index === customPoints.length - 1;
          
          // 첫 번째 전열 받침 또는 첫 번째 후열 받침
          const isFirstSupport = isFirstFront || isFirstBack;
          // 마지막 전열 받침 또는 마지막 후열 받침
          const isLastSupport = isLastFront || isLastBack;
          
          if (isFirstSupport || isLastSupport) {
            // 첫 번째 전열/후열 받침: 마지막 열의 앵커
            // 마지막 전열/후열 받침: 첫 번째 열의 앵커
            const targetAnchorIndex = isFirstSupport
              ? anchorRowCountVertical - 1  // 마지막 열
              : 0;  // 첫 번째 열
            
            const targetOffset = (targetAnchorIndex - (anchorRowCountVertical - 1) / 2) * anchorGapVertical;
            const targetAnchorX = supportX + targetOffset;
            const targetAnchorY = supportY;
            
            // 기울기 1.5: dy/dx = 1.5의 절댓값
            // 방향: 첫 번째 받침 -> -X, -Y / 마지막 받침 -> +X, -Y
            const directionX = isFirstSupport ? -1 : 1; // -X 또는 +X
            const directionY = -1; // -Y (아래 방향)
            
            // 직선 방정식: y - targetAnchorY = 1.5 * directionY/directionX * (x - targetAnchorX)
            // directionY/directionX가 음수이면 기울기는 양수가 됨 (예: -1/-1 = 1)
            // 하지만 실제로는 dy와 dx의 부호를 고려해야 함
            // (-X, -Y) 방향: dx < 0, dy < 0이므로 dy/dx > 0, 기울기는 양수
            // (+X, -Y) 방향: dx > 0, dy < 0이므로 dy/dx < 0, 기울기는 음수
            // 따라서 기울기는 1.5 * directionY/directionX가 아니라 1.5 * directionY * directionX의 부호를 고려해야 함
            // 실제로는: slope = 1.5 * (directionY의 부호) * (directionX의 부호)
            // directionY = -1, directionX = -1 -> slope = 1.5 * (-1) * (-1) = 1.5 (양수)
            // directionY = -1, directionX = 1 -> slope = 1.5 * (-1) * (1) = -1.5 (음수)
            // 하지만 이것도 복잡하므로, 더 간단하게: slope = 1.5 * directionY (directionX는 방향만 결정)
            // 아니면: slope = 1.5 * directionY / directionX
            // directionY = -1, directionX = -1 -> slope = 1.5 * (-1) / (-1) = 1.5
            // directionY = -1, directionX = 1 -> slope = 1.5 * (-1) / (1) = -1.5
            
            // 단면 형상의 외곽선과 교차점 찾기
            // absolutePoints는 단면 형상의 각 꼭지점을 나타냄
            // 각 선분과의 교차점을 찾아야 함
            
            let intersectionX: number | null = null;
            let intersectionY: number | null = null;
            let minDistance = Infinity;
            let foundIntersection = false;
            
            // 디버깅: 조건 확인
            console.log('점선 그리기 조건 확인:', {
              index,
              isFirstFront,
              isFirstBack,
              isLastFront,
              isLastBack,
              isFirstSupport,
              isLastSupport,
              targetAnchorIndex,
              targetAnchorX,
              targetAnchorY,
              directionX,
              directionY,
              absolutePointsLength: absolutePoints.length,
              absolutePoints: absolutePoints.slice(0, 5) // 처음 5개 점만 로그
            });
            
            // 단면 형상의 각 선분과 교차점 계산
            // 디버깅: 교차점 계산 시작 전 로그
            console.log('교차점 계산 시작:', {
              targetAnchorX,
              targetAnchorY,
              directionX,
              directionY,
              slope: 1.5 * directionY / directionX,
              firstFewPoints: absolutePoints.slice(0, 3)
            });
            
            // 기울기 1.5의 선의 방정식: y = targetAnchorY + slope * (x - targetAnchorX)
            // (-X, -Y) 방향: dx < 0, dy < 0이므로 dy/dx > 0, slope = 1.5 (양수)
            // (+X, -Y) 방향: dx > 0, dy < 0이므로 dy/dx < 0, slope = -1.5 (음수)
            // 따라서 slope = 1.5 * directionY / directionX
            const slope = 1.5 * directionY / directionX;
            const intercept = targetAnchorY - slope * targetAnchorX;
            
            console.log(`교차점 계산: 총 ${absolutePoints.length}개 선분 순회 시작`);
            
            for (let j = 0; j < absolutePoints.length; j++) {
              const p1 = absolutePoints[j];
              const p2 = absolutePoints[(j + 1) % absolutePoints.length];
              // p2의 r 값은 p1에서 p2로 가는 선분의 Arc 반지름
              // 하지만 absolutePoints의 구조를 확인해야 함
              // sectionPathData에서 r 값은 currentPoint.r로 저장되므로, p2.r이 맞음
              const r = p2.r !== undefined ? p2.r : 0; // 다음 점까지의 Arc 반지름 (p2의 r 값), 없으면 0
              
              // 디버깅: 선분 정보 (Arc 포함) - 모든 선분에 대해 출력
              console.log(`선분 ${j}/${absolutePoints.length - 1} 정보:`, {
                p1: { x: p1.x, y: p1.y, r: p1.r },
                p2: { x: p2.x, y: p2.y, r: p2.r },
                r: r,
                isArc: Math.abs(r) > 1e-10
              });
              
              const dx1 = p2.x - p1.x;
              const dy1 = p2.y - p1.y;
              
              // 디버깅: 선분 정보
              if (j < 3) {
                console.log(`선분 ${j}:`, {
                  p1: { x: p1.x, y: p1.y },
                  p2: { x: p2.x, y: p2.y },
                  dx1,
                  dy1
                });
              }
              
              // 먼저 직선으로 처리할지 결정
              const distance = Math.sqrt(dx1 * dx1 + dy1 * dy1);
              const shouldTreatAsLine = Math.abs(r) < 1e-10 || 
                                       (Math.abs(r) > 1e-10 && Math.abs(r) < distance / 2);
              let shouldProcessLine = shouldTreatAsLine;
              
              // 디버깅: 처리 방식 결정
              if (j >= 3 && j <= 12) {
                console.log(`선분 ${j} 처리 방식 결정:`, {
                  r,
                  distance,
                  shouldTreatAsLine,
                  isArc: Math.abs(r) > 1e-10 && !shouldTreatAsLine
                });
              }
              
              // R 값이 0이 아니고 반지름이 충분히 큰 경우 Arc로 처리
              if (Math.abs(r) > 1e-10 && !shouldTreatAsLine) {
                // Arc로 처리 (반지름이 충분히 큰 경우)
                const absRadius = Math.abs(r);
                const arcCenter = calculateArcCenter(p1.x, p1.y, p2.x, p2.y, r);

                if (arcCenter) {
                  const { centerX, centerY } = arcCenter;
                  
                  // 직선과 원의 교차점 계산
                  // 직선: y = slope * x + intercept
                  // 원: (x - centerX)^2 + (y - centerY)^2 = absRadius^2
                  // 원의 방정식에 직선을 대입: (x - centerX)^2 + (slope * x + intercept - centerY)^2 = absRadius^2
                  const a = 1 + slope * slope;
                  const b = -2 * centerX + 2 * slope * (intercept - centerY);
                  const c = centerX * centerX + (intercept - centerY) * (intercept - centerY) - absRadius * absRadius;
                  
                  const discriminant = b * b - 4 * a * c;
                  
                  if (discriminant >= 0) {
                    const sqrtDiscriminant = Math.sqrt(discriminant);
                    const x1 = (-b + sqrtDiscriminant) / (2 * a);
                    const x2 = (-b - sqrtDiscriminant) / (2 * a);
                    const y1 = slope * x1 + intercept;
                    const y2 = slope * x2 + intercept;
                    
                    // 두 교차점 중 Arc 위에 있는 점 찾기
                    const candidates = [
                      { x: x1, y: y1 },
                      { x: x2, y: y2 }
                    ];
                    
                    for (const candidate of candidates) {
                    // Arc 위에 있는지 확인 (createArcPath 로직과 동일)
                    // 시작점과 끝점에서 중심까지의 벡터
                    const startToCenterX = centerX - p1.x;
                    const startToCenterY = centerY - p1.y;
                    const endToCenterX = centerX - p2.x;
                    const endToCenterY = centerY - p2.y;
                    
                    // 각도 계산
                    const startAngle = Math.atan2(startToCenterY, startToCenterX);
                    const endAngle = Math.atan2(endToCenterY, endToCenterX);
                    const candidateToCenterX = centerX - candidate.x;
                    const candidateToCenterY = centerY - candidate.y;
                    const candidateAngle = Math.atan2(candidateToCenterY, candidateToCenterX);
                    
                    // Arc의 방향 결정 (createArcPath와 동일한 로직)
                    let angleDiff = endAngle - startAngle;
                    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;
                    let sweepFlag = angleDiff > 0 ? 1 : 0;
                    
                    // R이 음수면 sweepFlag를 반대로 설정
                    
                    // Arc 위에 있는지 확인
                    // 각도 정규화
                    const normalizeAngle = (angle: number) => {
                      while (angle < 0) angle += 2 * Math.PI;
                      while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
                      return angle;
                    };
                    
                    const normStart = normalizeAngle(startAngle);
                    const normEnd = normalizeAngle(endAngle);
                    const normCandidate = normalizeAngle(candidateAngle);
                    
                    // Arc가 시작각도에서 끝각도로 진행하는지 확인
                    // largeArcFlag와 sweepFlag를 고려
                    let isOnArc = false;
                    
                    if (sweepFlag === 1) {
                      // 시계방향 (각도 증가)
                      if (normEnd >= normStart) {
                        isOnArc = normCandidate >= normStart && normCandidate <= normEnd;
                      } else {
                        // 0을 넘어가는 경우
                        isOnArc = normCandidate >= normStart || normCandidate <= normEnd;
                      }
                    } else {
                      // 반시계방향 (각도 감소)
                      if (normEnd <= normStart) {
                        isOnArc = normCandidate <= normStart && normCandidate >= normEnd;
                      } else {
                        // 0을 넘어가는 경우
                        isOnArc = normCandidate <= normStart || normCandidate >= normEnd;
                      }
                    }
                    
                    // 디버깅: Arc 교차점 확인
                    if (j < 3) {
                      console.log(`Arc 선분 ${j} 교차점 후보:`, {
                        candidate: { x: candidate.x, y: candidate.y },
                        center: { x: centerX, y: centerY },
                        startAngle: normStart,
                        endAngle: normEnd,
                        candidateAngle: normCandidate,
                        angleDiff,
                        largeArcFlag,
                        sweepFlag,
                        isOnArc,
                        r
                      });
                    }
                    
                    if (isOnArc) {
                      // 방향 체크
                      const deltaX = candidate.x - targetAnchorX;
                      const deltaY = candidate.y - targetAnchorY;
                      // deltaX 또는 deltaY가 0인 경우 (앵커가 Arc 위에 있는 경우)는 항상 유효
                      const isDirectionValid = (Math.abs(deltaX) < 1e-10 || deltaX * directionX >= 0) && 
                                               (Math.abs(deltaY) < 1e-10 || deltaY * directionY >= 0);
                      
                      if (isDirectionValid) {
                        const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                        // 거리가 0이면 앵커가 Arc 위에 있는 경우이므로 교차점으로 인정하지 않음
                        // 앵커에서 시작해서 형상 외곽선의 다른 부분과 만나는 점을 찾아야 함
                        if (distance > 1e-10 && distance < minDistance) {
                          minDistance = distance;
                          intersectionX = candidate.x;
                          intersectionY = candidate.y;
                          foundIntersection = true;
                          console.log(`Arc 선분 ${j}에서 교차점 발견:`, { 
                            x: candidate.x, 
                            y: candidate.y, 
                            deltaX, 
                            deltaY, 
                            distance, 
                            isDirectionValid,
                            normStart,
                            normEnd,
                            normCandidate,
                            sweepFlag
                          });
                        } else {
                          if (j < 3) {
                            console.log(`Arc 선분 ${j}에서 교차점 찾았지만 거리 조건 불만족:`, { 
                              x: candidate.x, 
                              y: candidate.y, 
                              distance, 
                              minDistance 
                            });
                          }
                        }
                      } else {
                        if (j < 3) {
                          console.log(`Arc 선분 ${j}에서 방향 조건 불만족:`, { 
                            x: candidate.x, 
                            y: candidate.y, 
                            deltaX, 
                            deltaY, 
                            directionX, 
                            directionY,
                            deltaXdirectionX: deltaX * directionX,
                            deltaYdirectionY: deltaY * directionY
                          });
                        }
                      }
                    } else {
                      if (j < 3) {
                        console.log(`Arc 선분 ${j}에서 Arc 위에 있지 않음:`, {
                          candidate: { x: candidate.x, y: candidate.y },
                          normStart,
                          normEnd,
                          normCandidate,
                          sweepFlag
                        });
                      }
                    }
                  }
                  }
                } else {
                  shouldProcessLine = true;
                  if (j < 3) {
                    console.log(`Arc 선분 ${j}에서 중심 계산 실패:`, {
                      p1,
                      p2,
                      r
                    });
                  }
                }
              }
              
              // R 값이 0이거나 Arc 계산에서 처리되지 않은 경우 직선으로 처리
              // shouldTreatAsLine은 위에서 이미 계산됨
              if (shouldProcessLine) {
                // 디버깅: 직선 처리 블록 진입
                if (j >= 3 && j <= 12) {
                  console.log(`선분 ${j} 직선 처리 블록 진입`);
                }
                // 선분이 수직인 경우 (dx1 = 0)
                if (Math.abs(dx1) < 1e-10) {
                  const x = p1.x;
                  const slope = 1.5 * directionY / directionX;
                  const y = targetAnchorY + slope * (x - targetAnchorX);
                  
                  // 선분 위에 있는지 확인 (매개변수 t 사용)
                  const dy1 = p2.y - p1.y;
                  const segmentLengthSq = dy1 * dy1;
                  let t = 0;
                  
                  if (segmentLengthSq > 1e-10) {
                    const dyToPoint = y - p1.y;
                    t = dyToPoint / dy1;
                  } else {
                    // 선분의 길이가 거의 0인 경우
                    const distToP1 = Math.abs(y - p1.y);
                    if (distToP1 < 1e-10) {
                      t = 0;
                    } else {
                      t = -1; // 선분이 아니므로 제외
                    }
                  }
                  
                  // 선분 위에 있는지 확인 (경계값 포함, 부동소수점 오차 허용)
                  const tolerance = 1e-6;
                  const isOnSegment = t >= -tolerance && t <= 1 + tolerance;
                  
                  // 디버깅: 수직 선분 교차점 계산
                  if (j < 3) {
                    console.log(`수직 선분 ${j} 교차점 계산:`, {
                      x,
                      y,
                      p1: { x: p1.x, y: p1.y },
                      p2: { x: p2.x, y: p2.y },
                      t,
                      isOnSegment,
                      targetAnchorX,
                      targetAnchorY,
                      directionX,
                      directionY
                    });
                  }
                  
                  if (isOnSegment) {
                    // 방향 체크: 앵커에서 교차점까지의 방향이 올바른지 확인
                    const deltaX = x - targetAnchorX;
                    const deltaY = y - targetAnchorY;
                    
                    // directionY가 -1이면 deltaY가 음수여야 함 (Y가 감소하는 방향, 원본 좌표계에서 위쪽)
                    // directionY가 +1이면 deltaY가 양수여야 함 (Y가 증가하는 방향, 원본 좌표계에서 아래쪽)
                    // directionX가 -1이면 deltaX가 음수여야 함 (X가 감소하는 방향, 왼쪽)
                    // directionX가 +1이면 deltaX가 양수여야 함 (X가 증가하는 방향, 오른쪽)
                    // 
                    // 원본 좌표계에서 +Y는 아래쪽이므로, directionY=-1은 위쪽 방향을 의미
                    // 따라서 deltaY는 음수여야 함 (y < targetAnchorY)
                    // deltaY * directionY = deltaY * (-1) = -deltaY
                    // deltaY가 음수이면 -deltaY는 양수이므로, deltaY * directionY >= 0이어야 함
                    // 하지만 directionY=-1이고 deltaY<0이면 deltaY * directionY > 0이므로 >= 0 조건이 맞음
                    // 반대로 directionY=-1이고 deltaY>0이면 deltaY * directionY < 0이므로 조건 불만족
                    // 따라서 deltaY * directionY >= 0 조건이 맞음
                    const isDirectionValid = (deltaX * directionX >= 0 || Math.abs(deltaX) < 1e-10) && 
                                             (deltaY * directionY >= 0 || Math.abs(deltaY) < 1e-10);
                    
                  if (isDirectionValid) {
                    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                    // 거리가 0이면 앵커가 선분 위에 있는 경우이므로 교차점으로 인정하지 않음
                    // 앵커에서 시작해서 형상 외곽선의 다른 부분과 만나는 점을 찾아야 함
                    if (distance > 1e-10 && distance < minDistance) {
                      minDistance = distance;
                      intersectionX = x;
                      intersectionY = y;
                      foundIntersection = true;
                      console.log(`수직 선분 ${j}에서 교차점 발견:`, { x, y, deltaX, deltaY, distance, isDirectionValid });
                    } else {
                      if (j < 3) {
                        console.log(`수직 선분 ${j}에서 교차점 찾았지만 거리 조건 불만족:`, { x, y, deltaX, deltaY, distance, minDistance });
                      }
                    }
                  } else {
                      if (j < 3) {
                        console.log(`수직 선분 ${j}에서 방향 조건 불만족:`, { x, y, deltaX, deltaY, directionX, directionY, deltaXdirectionX: deltaX * directionX, deltaYdirectionY: deltaY * directionY });
                      }
                    }
                  }
                } else {
                  // 선분의 기울기
                  const slope1 = dy1 / dx1;
                  const intercept1 = p1.y - slope1 * p1.x;
                  
                  // 기울기 1.5의 선의 방정식
                  const slope2 = 1.5 * directionY / directionX;
                  const intercept2 = targetAnchorY - slope2 * targetAnchorX;
                  
                  // 교차점 계산
                  if (Math.abs(slope1 - slope2) < 1e-10) {
                    // 평행한 경우 스킵
                    if (j >= 3 && j <= 12) {
                      console.log(`일반 선분 ${j} 평행 - 스킵`);
                    }
                    continue;
                  }
                  
                  const x = (intercept2 - intercept1) / (slope1 - slope2);
                  const y = slope1 * x + intercept1;
                  
                  // 선분 위에 있는지 확인 (매개변수 t 사용)
                  // 선분의 방향으로 투영된 매개변수 t를 계산
                  // p(t) = p1 + t * (p2 - p1), t가 [0, 1] 범위에 있으면 선분 위에 있음
                  let t = 0;
                  const segmentLengthSq = dx1 * dx1 + dy1 * dy1;
                  
                  if (segmentLengthSq > 1e-10) {
                    // 선분의 방향 벡터로 투영
                    const dxToPoint = x - p1.x;
                    const dyToPoint = y - p1.y;
                    t = (dxToPoint * dx1 + dyToPoint * dy1) / segmentLengthSq;
                  } else {
                    // 선분의 길이가 거의 0인 경우, 점이 선분의 시작점과 일치하는지 확인
                    const distToP1 = Math.sqrt((x - p1.x) * (x - p1.x) + (y - p1.y) * (y - p1.y));
                    if (distToP1 < 1e-10) {
                      t = 0;
                    } else {
                      t = -1; // 선분이 아니므로 제외
                    }
                  }
                  
                  // 선분 위에 있는지 확인 (경계값 포함, 부동소수점 오차 허용)
                  const tolerance = 1e-6;
                  const isOnSegment = t >= -tolerance && t <= 1 + tolerance;
                  
                  // 디버깅: 일반 선분 교차점 계산
                  if (j >= 3 && j <= 12) {
                    console.log(`일반 선분 ${j} 교차점 계산:`, {
                      x,
                      y,
                      p1: { x: p1.x, y: p1.y },
                      p2: { x: p2.x, y: p2.y },
                      t,
                      isOnSegment,
                      targetAnchorX,
                      targetAnchorY,
                      directionX,
                      directionY,
                      slope1,
                      slope2
                    });
                  }
                  
                  // 방향 체크: 앵커에서 교차점까지의 방향이 올바른지 확인
                  const deltaX = x - targetAnchorX;
                  const deltaY = y - targetAnchorY;
                  
                  // directionY가 -1이면 deltaY가 음수여야 함 (Y가 감소하는 방향, 원본 좌표계에서 위쪽)
                  // directionY가 +1이면 deltaY가 양수여야 함 (Y가 증가하는 방향, 원본 좌표계에서 아래쪽)
                  // directionX가 -1이면 deltaX가 음수여야 함 (X가 감소하는 방향, 왼쪽)
                  // directionX가 +1이면 deltaX가 양수여야 함 (X가 증가하는 방향, 오른쪽)
                  // 
                  // 원본 좌표계에서 +Y는 아래쪽이므로, directionY=-1은 위쪽 방향을 의미
                  // 따라서 deltaY는 음수여야 함 (y < targetAnchorY)
                  // deltaY * directionY = deltaY * (-1) = -deltaY
                  // deltaY가 음수이면 -deltaY는 양수이므로, deltaY * directionY >= 0이어야 함
                  // 하지만 directionY=-1이고 deltaY<0이면 deltaY * directionY > 0이므로 >= 0 조건이 맞음
                  // 반대로 directionY=-1이고 deltaY>0이면 deltaY * directionY < 0이므로 조건 불만족
                  // 따라서 deltaY * directionY >= 0 조건이 맞음
                  // 
                  // deltaX 또는 deltaY가 0인 경우 (앵커가 선분 위에 있는 경우)는 항상 유효
                  const isDirectionValid = (Math.abs(deltaX) < 1e-10 || deltaX * directionX >= 0) && 
                                           (Math.abs(deltaY) < 1e-10 || deltaY * directionY >= 0);
                  
                  // 선분 위에 있고, 방향이 올바른 경우 교차점 사용
                  if (isOnSegment && isDirectionValid) {
                    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                    // 거리가 0이면 앵커가 선분 위에 있는 경우이므로 교차점으로 인정하지 않음
                    // 앵커에서 시작해서 형상 외곽선의 다른 부분과 만나는 점을 찾아야 함
                    if (distance > 1e-10 && distance < minDistance) {
                      minDistance = distance;
                      intersectionX = x;
                      intersectionY = y;
                      foundIntersection = true;
                      console.log(`일반 선분 ${j}에서 교차점 발견:`, { x, y, deltaX, deltaY, distance, isDirectionValid, isOnSegment });
                    } else {
                      if (j >= 3 && j <= 12) {
                        console.log(`일반 선분 ${j}에서 교차점 찾았지만 거리 조건 불만족:`, { x, y, deltaX, deltaY, distance, minDistance, isOnSegment });
                      }
                    }
                  } else {
                    if (j >= 3 && j <= 12) {
                      console.log(`일반 선분 ${j}에서 조건 불만족:`, { 
                        x, y, 
                        deltaX, deltaY, 
                        directionX, directionY, 
                        deltaXdirectionX: deltaX * directionX, 
                        deltaYdirectionY: deltaY * directionY, 
                        isOnSegment,
                        isDirectionValid 
                      });
                    }
                  }
                }
              }
            }
            
            // 디버깅: 교차점 계산 완료 후 상태 확인
            console.log('교차점 계산 완료:', {
              intersectionX,
              intersectionY,
              minDistance,
              foundIntersection,
              isNull: intersectionX === null || intersectionY === null,
              isInfinity: minDistance === Infinity,
              isTooSmall: minDistance <= 1e-10,
              targetAnchorX,
              targetAnchorY
            });
            
            // 빨간색 점선 그리기 (교차점이 있으면 교차점까지, 없으면 ViewBox 외곽까지)
            let lineEndX: number;
            let lineEndY: number;
            
            // 교차점이 실제로 설정되었는지 확인 (null이 아니고, 거리가 0이 아닌 경우)
            const hasValidIntersection = foundIntersection &&
                                        intersectionX !== null && 
                                        intersectionY !== null && 
                                        minDistance !== Infinity &&
                                        minDistance > 1e-10;
            
            console.log('hasValidIntersection 체크:', {
              hasValidIntersection,
              intersectionX,
              intersectionY,
              minDistance,
              check1: intersectionX !== null,
              check2: intersectionY !== null,
              check3: minDistance !== Infinity,
              check4: minDistance > 1e-10
            });
            
            if (hasValidIntersection) {
              // 교차점이 있는 경우
              lineEndX = intersectionX!;
              lineEndY = intersectionY!;
              console.log('교차점 발견 (유효):', {
                intersectionX,
                intersectionY,
                targetAnchorX,
                targetAnchorY,
                distance: minDistance,
                deltaX: intersectionX! - targetAnchorX,
                deltaY: intersectionY! - targetAnchorY
              });
            } else {
              // 교차점을 찾지 못한 경우 ViewBox 외곽까지 선을 연장
              console.log('교차점을 찾지 못함, ViewBox 외곽까지 연장:', {
                intersectionX,
                intersectionY,
                minDistance,
                targetAnchorX,
                targetAnchorY
              });
              // 교차점을 찾지 못한 경우 ViewBox 외곽까지 선을 연장
              // ViewBox 크기 계산 (sectionData의 viewBox 사용)
              const viewBoxMatch = sectionData.viewBox.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
              if (viewBoxMatch) {
                const viewBoxX = parseFloat(viewBoxMatch[1]);
                const viewBoxY = parseFloat(viewBoxMatch[2]);
                const viewBoxWidth = parseFloat(viewBoxMatch[3]);
                const viewBoxHeight = parseFloat(viewBoxMatch[4]);
                
                // ViewBox의 경계
                const viewBoxLeft = viewBoxX;
                const viewBoxRight = viewBoxX + viewBoxWidth;
                const viewBoxTop = viewBoxY;
                const viewBoxBottom = viewBoxY + viewBoxHeight;
                
                // 기울기 1.5의 선: y - targetAnchorY = 1.5 * directionY/directionX * (x - targetAnchorX)
                // ViewBox 경계와의 교차점 계산
                const slope = 1.5 * directionY / directionX;
                
                // 각 경계와의 교차점 계산
                const intersections: Array<{ x: number; y: number; distance: number }> = [];
                
                // 좌측 경계 (x = viewBoxLeft)
                const yAtLeft = targetAnchorY + slope * (viewBoxLeft - targetAnchorX);
                if (yAtLeft >= viewBoxTop && yAtLeft <= viewBoxBottom) {
                  const dx = viewBoxLeft - targetAnchorX;
                  const dy = yAtLeft - targetAnchorY;
                  if ((dx * directionX >= 0 || Math.abs(dx) < 1e-10) && 
                      (dy * directionY >= 0 || Math.abs(dy) < 1e-10)) {
                    intersections.push({
                      x: viewBoxLeft,
                      y: yAtLeft,
                      distance: Math.sqrt(dx * dx + dy * dy)
                    });
                  }
                }
                
                // 우측 경계 (x = viewBoxRight)
                const yAtRight = targetAnchorY + slope * (viewBoxRight - targetAnchorX);
                if (yAtRight >= viewBoxTop && yAtRight <= viewBoxBottom) {
                  const dx = viewBoxRight - targetAnchorX;
                  const dy = yAtRight - targetAnchorY;
                  if ((dx * directionX >= 0 || Math.abs(dx) < 1e-10) && 
                      (dy * directionY >= 0 || Math.abs(dy) < 1e-10)) {
                    intersections.push({
                      x: viewBoxRight,
                      y: yAtRight,
                      distance: Math.sqrt(dx * dx + dy * dy)
                    });
                  }
                }
                
                // 상단 경계 (y = viewBoxTop)
                if (Math.abs(slope) > 1e-10) {
                  const xAtTop = targetAnchorX + (viewBoxTop - targetAnchorY) / slope;
                  if (xAtTop >= viewBoxLeft && xAtTop <= viewBoxRight) {
                    const dx = xAtTop - targetAnchorX;
                    const dy = viewBoxTop - targetAnchorY;
                    if ((dx * directionX >= 0 || Math.abs(dx) < 1e-10) && 
                        (dy * directionY >= 0 || Math.abs(dy) < 1e-10)) {
                      intersections.push({
                        x: xAtTop,
                        y: viewBoxTop,
                        distance: Math.sqrt(dx * dx + dy * dy)
                      });
                    }
                  }
                }
                
                // 하단 경계 (y = viewBoxBottom)
                if (Math.abs(slope) > 1e-10) {
                  const xAtBottom = targetAnchorX + (viewBoxBottom - targetAnchorY) / slope;
                  if (xAtBottom >= viewBoxLeft && xAtBottom <= viewBoxRight) {
                    const dx = xAtBottom - targetAnchorX;
                    const dy = viewBoxBottom - targetAnchorY;
                    if ((dx * directionX >= 0 || Math.abs(dx) < 1e-10) && 
                        (dy * directionY >= 0 || Math.abs(dy) < 1e-10)) {
                      intersections.push({
                        x: xAtBottom,
                        y: viewBoxBottom,
                        distance: Math.sqrt(dx * dx + dy * dy)
                      });
                    }
                  }
                }
                
                // 가장 가까운 교차점 선택
                if (intersections.length > 0) {
                  intersections.sort((a, b) => a.distance - b.distance);
                  lineEndX = intersections[0].x;
                  lineEndY = intersections[0].y;
                  console.log('ViewBox 경계와의 교차점:', {
                    lineEndX,
                    lineEndY,
                    intersections
                  });
                } else {
                  // ViewBox 경계와의 교차점을 찾지 못한 경우, 앵커에서 충분히 먼 거리까지 선을 그리기
                  const maxDistance = Math.max(viewBoxWidth, viewBoxHeight) * 2;
                  lineEndX = targetAnchorX + directionX * maxDistance;
                  lineEndY = targetAnchorY + directionY * maxDistance * Math.abs(slope);
                  console.log('ViewBox 경계 교차점을 찾지 못함, 최대 거리로 연장:', {
                    lineEndX,
                    lineEndY,
                    maxDistance
                  });
                }
              } else {
                  // viewBox 파싱 실패 시 기본값 사용
                  const maxDistance = 10000;
                  const slope = 1.5 * directionY / directionX;
                  lineEndX = targetAnchorX + directionX * maxDistance;
                  lineEndY = targetAnchorY + slope * directionX * maxDistance;
              }
            }
            
            elements.push(
              <line
                key={`vertical-front-dashed-line-${index}`}
                x1={targetAnchorX}
                y1={targetAnchorY}
                x2={lineEndX}
                y2={lineEndY}
                stroke={ANCHOR_STROKE_COLOR}
                strokeWidth="2"
                strokeDasharray="5,5"
                strokeOpacity={1}
              />
            );

            if (hasValidIntersection) {
              const dimensionOffsetLeft = 100;
              const dimensionOffsetRight = 200;
              const dimensionLineX = directionX === -1
                ? originalMinX - dimensionOffsetLeft
                : originalMaxX + dimensionOffsetRight;
              const dimensionYStart = targetAnchorY;
              const dimensionYEnd = lineEndY;
              const dimensionYTop = Math.min(dimensionYStart, dimensionYEnd);
              const dimensionYBottom = Math.max(dimensionYStart, dimensionYEnd);
              const dimensionDistance = Math.abs(dimensionYEnd - dimensionYStart);
              const textOffset = 100;
              const textX = directionX === -1
                ? dimensionLineX - textOffset
                : dimensionLineX + textOffset;
              const textY = (dimensionYStart + dimensionYEnd) / 2;
              const tickHalfWidth = 20;

              elements.push(
                <line
                  key={`vertical-front-dimension-guide-start-${index}`}
                  x1={targetAnchorX}
                  y1={dimensionYStart}
                  x2={dimensionLineX}
                  y2={dimensionYStart}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
              );

              elements.push(
                <line
                  key={`vertical-front-dimension-guide-end-${index}`}
                  x1={lineEndX}
                  y1={dimensionYEnd}
                  x2={dimensionLineX}
                  y2={dimensionYEnd}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="1"
                  strokeOpacity={0.5}
                />
              );

              elements.push(
                <line
                  key={`vertical-front-dimension-line-${index}`}
                  x1={dimensionLineX}
                  y1={dimensionYTop}
                  x2={dimensionLineX}
                  y2={dimensionYBottom}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                  markerStart="url(#arrowhead-start)"
                  markerEnd="url(#arrowhead-end)"
                />
              );

              elements.push(
                <line
                  key={`vertical-front-dimension-tick-top-${index}`}
                  x1={dimensionLineX - tickHalfWidth}
                  y1={dimensionYTop}
                  x2={dimensionLineX + tickHalfWidth}
                  y2={dimensionYTop}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
              );

              elements.push(
                <line
                  key={`vertical-front-dimension-tick-bottom-${index}`}
                  x1={dimensionLineX - tickHalfWidth}
                  y1={dimensionYBottom}
                  x2={dimensionLineX + tickHalfWidth}
                  y2={dimensionYBottom}
                  stroke={SECTION_STROKE_COLOR}
                  strokeWidth="2"
                  strokeOpacity={1}
                />
              );

              const baselineFontSize = 100;
              const adjustedFontSize = baselineFontSize;
              const adjustedTextY = textY;

              elements.push(
                <text
                  key={`vertical-front-dimension-text-${index}`}
                  x={textX}
                  y={adjustedTextY}
                  fill={SECTION_STROKE_COLOR}
                  fontSize={adjustedFontSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(-90 ${textX} ${adjustedTextY})`}
                >
                  {Math.round(dimensionDistance).toLocaleString()}
                </text>
              );
            } else {
              // 빨간색 점선 (교차점이 없을 때는 선만 표시)
              elements.push(
                <line
                  key={`vertical-front-dashed-line-${index}`}
                  x1={targetAnchorX}
                  y1={targetAnchorY}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke={ANCHOR_STROKE_COLOR}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  strokeOpacity={1}
                />
              );
            }
          }
        }
      }

      // 받침 중심위치와 앵커를 모달의 viewBox 좌표계로 변환
      // 기준점과 받침 중심위치는 단면 형상 좌표계(원본 좌표)이므로, 모달의 단면 형상 렌더링과 동일한 변환 적용
      // 모달에서 단면 형상은 <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>로 렌더링됨
      // 모달의 viewBox는 viewBox={`${modalViewBoxX} ${modalViewBoxY} ${adjustedViewBoxWidth} ${adjustedViewBoxHeight}`}`로 설정됨
      // SVG transform의 적용 순서: 오른쪽에서 왼쪽으로 (scale이 먼저, translate가 나중)
      // 따라서 받침 중심위치와 앵커도 동일한 변환을 적용:
      //   X: 단면 형상 좌표 X * scale + translateX
      //   Y: flipY(단면 형상 좌표 Y) * scale + translateY
      // modalViewBoxX, modalViewBoxY를 빼지 않음 (viewBox 좌표계이므로)
      const transformedElements = elements.map((element) => {
        if (React.isValidElement(element)) {
          const props = element.props as any;
          if (props.cx !== undefined && props.cy !== undefined) {
            // circle 요소인 경우
            // cx, cy는 단면 형상 좌표계의 원본 좌표
            const x = props.cx;
            const y = props.cy;
            // 모달의 단면 형상 렌더링과 동일한 변환 적용 (SVG transform 순서: scale 먼저, translate 나중)
            const transformedX = x * scale + translateX;
            const transformedY = flipY(y) * scale + translateY;
            
            return React.cloneElement(element, {
              ...props,
              cx: transformedX,
              cy: transformedY,
              key: element.key
            });
          } else if (props.x1 !== undefined && props.y1 !== undefined) {
            // line 요소인 경우
            // x1, y1, x2, y2는 단면 형상 좌표계의 원본 좌표
            const x1 = props.x1;
            const y1 = props.y1;
            const x2 = props.x2;
            const y2 = props.y2;
            // 모달의 단면 형상 렌더링과 동일한 변환 적용 (SVG transform 순서: scale 먼저, translate 나중)
            const transformedX1 = x1 * scale + translateX;
            const transformedY1 = flipY(y1) * scale + translateY;
            const transformedX2 = x2 * scale + translateX;
            const transformedY2 = flipY(y2) * scale + translateY;
            
            return React.cloneElement(element, {
              ...props,
              x1: transformedX1,
              y1: transformedY1,
              x2: transformedX2,
              y2: transformedY2,
              key: element.key
            });
          } else if (element.type === 'text' && props.x !== undefined && props.y !== undefined) {
            const rawX = Array.isArray(props.x) ? props.x[0] : props.x;
            const rawY = Array.isArray(props.y) ? props.y[0] : props.y;
            const transformedX = rawX * scale + translateX;
            const transformedY = flipY(rawY) * scale + translateY;

            const transformString = typeof props.transform === 'string' ? props.transform : '';
            const rotateMatch = transformString.match(/rotate\((-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?))?\)/);
            const rotation = rotateMatch ? rotateMatch[1] : null;
            const adjustedTransform = rotation ? `rotate(${rotation} ${transformedX} ${transformedY})` : undefined;

            const baseFontSize = props.fontSize !== undefined
              ? parseFloat(props.fontSize as string)
              : 100;
            const adjustedFontSize = baseFontSize;

            return React.cloneElement(element, {
              ...props,
              x: transformedX,
              y: transformedY,
              fontSize: adjustedFontSize,
              transform: adjustedTransform,
              key: element.key
            });
          } else if (props.x !== undefined && props.y !== undefined && props.width !== undefined && props.height !== undefined) {
            // rect 요소인 경우
            // x, y는 단면 형상 좌표계의 원본 좌표 (상단 좌측 모서리)
            // width, height는 크기
            // rect의 하단 중앙점이 받침 중심 위치와 일치하도록 y 좌표가 이미 설정되어 있음
            const x = props.x;
            // y는 원본 좌표계에서 y = supportY - height로 설정되어 있으나,
            // 변환 후 y 좌표는 supportY를 직접 사용하여 계산함
            const width = props.width;
            const height = props.height;
            // 모달의 단면 형상 렌더링과 동일한 변환 적용 (SVG transform 순서: scale 먼저, translate 나중)
            // 
            // rect의 하단 중앙점이 받침 중심 위치와 일치하도록 하려면:
            // 원본 좌표계에서: rect의 하단 = y + height = supportY
            // 따라서 y = supportY - height (이미 올바르게 설정됨)
            // 
            // 변환 후 rect의 위치:
            // - rect의 상단 좌측 모서리: (x * scale + translateX, flipY(y) * scale + translateY)
            // - SVG rect에서 y는 상단 좌표이므로, 하단은 y + height
            // - 변환 후 rect의 하단: flipY(y) * scale + translateY + height * scale
            // 
            // rect의 하단 중앙점: ((x + width/2) * scale + translateX, flipY(y) * scale + translateY + height * scale)
            // 
            // 받침 중심 위치: (supportX * scale + translateX, flipY(supportY) * scale + translateY)
            // 
            // rect의 하단 중앙점이 받침 중심 위치와 일치하려면:
            // (x + width/2) * scale + translateX = supportX * scale + translateX
            // -> x + width/2 = supportX (이미 올바르게 설정됨: x = supportX - width/2)
            // 
            // flipY(y) * scale + translateY + height * scale = flipY(supportY) * scale + translateY
            // -> flipY(y) + height = flipY(supportY)
            // -> flipY(y) = flipY(supportY) - height
            // -> centerY * 2 - y = centerY * 2 - supportY - height
            // -> -y = -supportY - height
            // -> y = supportY + height
            // 
            // 하지만 원본 좌표계에서 rect의 하단이 supportY와 일치해야 하므로:
            // y + height = supportY -> y = supportY - height
            // 
            // 이 두 조건이 충돌하므로, flipY 적용 후의 계산을 다시 확인해야 함
            // 
            // 실제로는: flipY(y) = flipY(supportY - height) = centerY * 2 - (supportY - height)
            //           = centerY * 2 - supportY + height = flipY(supportY) + height
            // 
            // 따라서: flipY(y) * scale + translateY + height * scale
            //       = (flipY(supportY) + height) * scale + translateY + height * scale
            //       = flipY(supportY) * scale + translateY + 2 * height * scale
            // 
            // 이것은 받침 중심 위치와 일치하지 않음!
            // 
            // 올바른 방법: rect의 하단이 supportY와 일치하도록 하려면, flipY 적용 후에도 하단이 flipY(supportY)와 일치해야 함
            // 따라서: flipY(y) + height * scale = flipY(supportY) * scale
            // -> flipY(y) = flipY(supportY) * scale - height * scale
            // 하지만 이것은 scale이 적용되기 전의 계산이므로 복잡함
            // 
            // 더 간단한 방법: rect의 하단 중앙점을 직접 계산하여 변환
            // 원본 좌표계에서 rect의 하단 중앙점: (x + width/2, y + height) = (supportX, supportY)
            // 변환 후: (supportX * scale + translateX, flipY(supportY) * scale + translateY)
            // 
            // rect의 y는 상단이므로, 하단이 supportY와 일치하려면:
            // y + height = supportY -> y = supportY - height (이미 올바르게 설정됨)
            // 
            // 변환 후 rect의 상단: flipY(y) * scale + translateY
            // 변환 후 rect의 하단: flipY(y) * scale + translateY + height * scale
            // 
            // 하지만 flipY(y) = flipY(supportY - height) = flipY(supportY) + height
            // 따라서: flipY(y) * scale + translateY + height * scale
            //       = (flipY(supportY) + height) * scale + translateY + height * scale
            //       = flipY(supportY) * scale + translateY + 2 * height * scale
            // 
            // 이것은 받침 중심 위치보다 2 * height * scale만큼 아래에 있음!
            // 
            // 올바른 해결책: rect의 y를 조정하여 하단이 supportY와 일치하도록 함
            // 원본 좌표계에서: y + height = supportY
            // 변환 후: flipY(y) * scale + translateY + height * scale = flipY(supportY) * scale + translateY
            // -> flipY(y) + height = flipY(supportY)
            // -> flipY(y) = flipY(supportY) - height
            // -> centerY * 2 - y = centerY * 2 - supportY - height
            // -> y = supportY + height
            // 
            // 하지만 이것은 원본 좌표계에서 y + height = supportY + 2*height가 되어버림
            // 
            // 실제 문제: SVG rect의 y는 상단이고, height는 아래로 늘어남
            // flipY가 적용되면 Y축이 반전되므로, rect의 하단 계산도 반전되어야 함
            // 
            // rect의 하단 중앙점이 받침 중심 위치와 일치하도록 y 좌표 조정
            // 원본 좌표계에서: rect의 하단 = y + height = supportY (이미 올바르게 설정됨)
            // 변환 후 받침 중심 위치: flipY(supportY) * scale + translateY
            // 
            // rect의 하단이 받침 중심 위치와 일치하도록 하려면:
            // 변환 후 rect의 하단 = flipY(supportY) * scale + translateY
            // rect의 하단 = transformedY + transformedHeight
            // 따라서: transformedY + transformedHeight = flipY(supportY) * scale + translateY
            // -> transformedY = flipY(supportY) * scale + translateY - transformedHeight
            const transformedX = x * scale + translateX;
            // width와 height도 scale 적용
            const transformedWidth = width * scale;
            const transformedHeight = height * scale;
            // rect의 하단이 받침 중심 위치와 일치하도록 y 좌표 조정
            const transformedY = flipY(supportY) * scale + translateY - transformedHeight;
            
            return React.cloneElement(element, {
              ...props,
              x: transformedX,
              y: transformedY,
              width: transformedWidth,
              height: transformedHeight,
              key: element.key
            });
          }
        }
        return element;
      });
      
      return (
        <g key={`vertical-front-support-group-${index}`}>
          {transformedElements}
        </g>
      );
    });

    return (
      <g>
        {supportAndAnchorElements}
      </g>
    );
  }, [
    sectionViewType,
    sectionPathData,
    customPoints,
    params.width,
    params.height,
    isFrontSupportGroupEnabled,
    isBackSupportGroupEnabled,
    viewOptionVersion
  ]);

  const renderedSectionPreview = useMemo(() => {
    const viewType = sectionViewType;
    if (
      viewType === 'axial-plan' ||
      viewType === 'vertical-plan' ||
      viewType === 'flyout-front' ||
      viewType === 'flyout-back'
    ) {
      // 교축(평면)과 교직(평면): 동일한 구현 (외곽 형상과 받침, 앵커 형상 동일)
      return renderedAnchors;
    } else if (viewType === 'axial-front') {
      // 교축(정면): 받침 중심 위치 렌더링
      return renderedSupportCenters;
    } else {
      // 교직(정면): 받침 중심위치 렌더링
      return renderedVerticalFrontSupports;
    }
  }, [
    sectionViewType,
    customPoints,
    params.width,
    params.height,
    params.heightFront,
    params.heightBack,
    params.frontRowCount,
    renderedAnchors,
    renderedSupportCenters,
    renderedVerticalFrontSupports,
    isFrontSupportGroupEnabled,
    isBackSupportGroupEnabled,
    viewOptionVersion
  ]);

  // 단면 뷰 렌더링 (코핑 형상 미리보기용)
  const sectionViewContent = useMemo(() => {
    const sectionData = sectionPathData;
    if (!sectionData) {
      return (
        <div className="text-gray-400 text-center">
          <p className="text-sm">단면 치수 입력에서 점을 추가하세요</p>
        </div>
      );
    }

    const { pathData, absolutePoints, flipY, viewBox } = sectionData;

    return (
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', bottom: '1rem', width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
      >
        {/* 그리드 배경 */}
        <defs>
          <pattern
            id="section-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#section-grid)" />

        {/* 단면 폴리곤 (Y축 뒤집기 적용) */}
        {pathData && (
          <path
            d={pathData}
            fill="none"
            stroke={SECTION_STROKE_COLOR}
            strokeWidth="3"
            strokeOpacity={1}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* 점들 (Y축 뒤집기 적용) */}
        {absolutePoints.map((point, index) => (
          <g key={`section-point-${index}`}>
            <circle
              cx={point.x}
              cy={flipY(point.y)}
              r="3"
              fill={SECTION_STROKE_COLOR}
              stroke={SECTION_STROKE_COLOR}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    );
  }, [sectionPathData]);

  return (
    <PageLayout title="">
      <style>{numericInputGlobalStyle}</style>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                앵커 삽도
              </h1>
              <p className="text-gray-600">입력한 값에 따라 앵커 삽도를 생성합니다.</p>
            </div>
            <button
              onClick={() => {
                setSectionViewType('axial-plan');
                setIsModalOpen(true);
              }}
              disabled={params.width <= 0 || params.height <= 0}
              className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Eye className="w-5 h-5 mr-2" />
              삽도 미리보기
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* 파라미터 입력 영역 */}
          <div className="w-full">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">코핑 제원</h2>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">코핑 형상 미리보기</label>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setCopingViewType('plan')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        copingViewType === 'plan'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      평면
                    </button>
                    <button
                      onClick={() => setCopingViewType('section')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        copingViewType === 'section'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      단면
                    </button>
                    <button
                      onClick={() => setCopingViewType('side')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        copingViewType === 'side'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      측면
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 items-stretch">
                {/* 1열: 폭, 길이, 단차 입력란 */}
                <div className="space-y-4 flex flex-col">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-32">
                      폭 (mm)
                    </label>
                    <NumericInput
                      {...numericInputSharedProps}
                      inputKey="params-width"
                      type="number"
                      value={params.width}
                      onValueChange={(val) => handleParamChange('width', val)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="100"
                      max="5000"
                      step="10"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-32">
                      길이 (mm)
                    </label>
                    <NumericInput
                      {...numericInputSharedProps}
                      inputKey="params-height"
                      type="number"
                      value={params.height}
                      onValueChange={(val) => handleParamChange('height', val)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="100"
                      max="3000"
                      step="10"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 w-32">
                      <input
                        type="checkbox"
                        id="hasStep"
                        checked={params.hasStep}
                        onChange={(e) => handleParamChange('hasStep', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="hasStep" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        단차 위치 (mm)
                      </label>
                    </div>
                    <NumericInput
                      {...numericInputSharedProps}
                      inputKey="params-stepValue"
                      type="number"
                      value={params.stepValue}
                      onValueChange={(val) => handleParamChange('stepValue', val)}
                      disabled={!params.hasStep}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      min="0"
                      max={params.height}
                      step="10"
                    />
                  </div>

                  {/* 높이 입력란: 높이(전열)과 높이(후열) 항상 표시, 단차 Off일 때 높이(전열) 값이 height에 적용 */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-32">
                      높이(전열) (mm)
                    </label>
                    <NumericInput
                      {...numericInputSharedProps}
                      inputKey="params-heightFront"
                      type="number"
                      value={params.heightFront}
                      onValueChange={(val) => handleParamChange('heightFront', val)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="100"
                      max="3000"
                      step="10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-32">
                      높이(후열) (mm)
                    </label>
                    <NumericInput
                      {...numericInputSharedProps}
                      inputKey="params-heightBack"
                      type="number"
                      value={params.heightBack}
                      onValueChange={(val) => handleParamChange('heightBack', val)}
                      disabled={!params.hasStep}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      min="100"
                      max="3000"
                      step="10"
                    />
                  </div>

                  {/* 단면 입력 */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-32">
                      단면
                    </label>
                    <button
                      onClick={() => setIsSectionDimensionModalOpen(true)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      단면 치수 입력
                    </button>
                  </div>
                </div>

                {/* 2열: 코핑 형상 미리보기 */}
                <div className="flex flex-col self-stretch h-full">
                  <div className="h-full border border-gray-300 rounded-md bg-gray-50" style={{ overflow: 'hidden', position: 'relative', padding: '1rem' }}>
                    {copingViewType === 'plan' ? (
                      // 평면 뷰
                      params.width > 0 && params.height > 0 ? (
                        <svg
                          viewBox={`0 0 ${params.width} ${params.height}`}
                          preserveAspectRatio="xMidYMid meet"
                          style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', bottom: '1rem', width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
                        >
                          {/* 그리드 배경 */}
                          <defs>
                            <pattern
                              id="coping-grid"
                              width="20"
                              height="20"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M 20 0 L 0 0 0 20"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="0.5"
                              />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#coping-grid)" />

                          {/* 코핑 형상 (직사각형) */}
                          <rect
                            x="0"
                            y="0"
                            width={params.width}
                            height={params.height}
                            fill="none"
                            stroke={SECTION_STROKE_COLOR}
                            strokeWidth={MAIN_LINE_STROKE_WIDTH}
                            strokeOpacity={1}
                            vectorEffect="non-scaling-stroke"
                          />

                          {/* 단차 점선 (길이 방향 위치에서 폭 방향으로) */}
                          {params.hasStep && params.stepValue > 0 && params.stepValue < params.height && (
                            <line
                              x1="0"
                              y1={params.stepValue}
                              x2={params.width}
                              y2={params.stepValue}
                              stroke={SECTION_STROKE_COLOR}
                              strokeWidth="2"
                              strokeDasharray="5,5"
                              strokeOpacity={0.7}
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </svg>
                      ) : (
                        <div className="text-gray-400 text-center">
                          <p className="text-sm">폭과 길이를 입력하세요</p>
                        </div>
                      )
                    ) : copingViewType === 'side' ? (
                      // 측면 뷰
                      (() => {
                        // 측면 뷰에서 사용할 높이 값 결정
                        const sideHeight = params.hasStep 
                          ? Math.max(params.heightFront, params.heightBack) // 단차 On일 때는 더 큰 높이 사용
                          : params.height; // 단차 Off일 때는 높이 사용
                        
                        const sideLength = params.height; // 길이 값
                        
                        return sideLength > 0 && sideHeight > 0 ? (
                          <svg
                            viewBox={`0 0 ${sideLength} ${sideHeight}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', bottom: '1rem', width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}
                          >
                            {/* 그리드 배경 */}
                            <defs>
                              <pattern
                                id="coping-side-grid"
                                width="20"
                                height="20"
                                patternUnits="userSpaceOnUse"
                              >
                                <path
                                  d="M 20 0 L 0 0 0 20"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="0.5"
                                />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#coping-side-grid)" />

                            {/* 측면 코핑 형상 */}
                            {params.hasStep ? (
                              // 단차가 On일 때: 전열과 후열의 높이가 다를 수 있음
                              <>
                                {/* 전열 부분 (좌측) */}
                                <rect
                                  x="0"
                                  y={sideHeight - params.heightFront}
                                  width={params.stepValue > 0 ? params.stepValue : sideLength}
                                  height={params.heightFront}
                                  fill="none"
                                  stroke={SECTION_STROKE_COLOR}
                                  strokeWidth="3"
                                  strokeOpacity={1}
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* 후열 부분 (우측) */}
                                <rect
                                  x={params.stepValue > 0 ? params.stepValue : 0}
                                  y={sideHeight - params.heightBack}
                                  width={sideLength - (params.stepValue > 0 ? params.stepValue : 0)}
                                  height={params.heightBack}
                                  fill="none"
                                  stroke={SECTION_STROKE_COLOR}
                                  strokeWidth="3"
                                  strokeOpacity={1}
                                  vectorEffect="non-scaling-stroke"
                                />
                                {/* 단차 위치 표시 (점선) */}
                                {params.stepValue > 0 && params.stepValue < sideLength && (
                                  <line
                                    x1={params.stepValue}
                                    y1={0}
                                    x2={params.stepValue}
                                    y2={sideHeight}
                                    stroke={SECTION_STROKE_COLOR}
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    strokeOpacity={0.7}
                                    vectorEffect="non-scaling-stroke"
                                  />
                                )}
                              </>
                            ) : (
                              // 단차가 Off일 때: 단일 직사각형
                              <rect
                                x="0"
                                y={sideHeight - params.height}
                                width={sideLength}
                                height={params.height}
                                fill="none"
                                stroke={SECTION_STROKE_COLOR}
                                strokeWidth="3"
                                strokeOpacity={1}
                                vectorEffect="non-scaling-stroke"
                              />
                            )}
                          </svg>
                        ) : (
                          <div className="text-gray-400 text-center">
                            <p className="text-sm">길이와 높이를 입력하세요</p>
                          </div>
                        );
                      })()
                    ) : (
                      // 단면 뷰
                      sectionViewContent
                    )}
                  </div>
                </div>
              </div>

              {/* 받침 제원 테이블 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">받침 제원</h3>
                    </div>
                    {/* 받침개수(전열)과 받침개수(후열)을 같은 줄에 배치 */}
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        받침개수:
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          전열
                        </label>
                        <NumericInput
                          {...numericInputSharedProps}
                          inputKey="params-frontRowCount"
                          type="number"
                          value={params.frontRowCount}
                          onValueChange={(val) => handleParamChange('frontRowCount', val)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          후열
                        </label>
                        <NumericInput
                          {...numericInputSharedProps}
                          inputKey="params-backRowCount"
                          type="number"
                          value={params.backRowCount}
                          onValueChange={(val) => handleParamChange('backRowCount', val)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {(params.frontRowCount + params.backRowCount) === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4 space-y-2">
                    <p>받침개수를 입력하면 받침 제원 테이블이 자동으로 생성됩니다.</p>
                    <p className="text-xs">엑셀에서 복사한 데이터를 테이블에 붙여넣을 수 있습니다.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-28 whitespace-nowrap">구분</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">X (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Y (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커열 개수(교축)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커열 개수(교직)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커 간격(교축) (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커 간격(교직) (mm)</th>
                        </tr>
                      </thead>
                      <tbody
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          // 첫 번째 행의 첫 번째 셀 기준으로 붙여넣기
                          handlePasteData(pastedData, 0);
                        }}
                      >
                        {customPoints.map((point, index) => {
                          const isFrontRow = index < params.frontRowCount;
                          return (
                            <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                              <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                              <td className="px-3 py-2 text-gray-700">{isFrontRow ? '전열' : '후열'}</td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-offsetX`}
                                  type="number"
                                  value={point.offsetX}
                                  onValueChange={(val) => updatePoint(point.id, 'offsetX', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-offsetY`}
                                  type="number"
                                  value={point.offsetY}
                                  onValueChange={(val) => updatePoint(point.id, 'offsetY', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-anchorRowCountAxial`}
                                  type="number"
                                  value={point.anchorRowCountAxial}
                                  onValueChange={(val) => updatePoint(point.id, 'anchorRowCountAxial', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                  min="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-anchorRowCountVertical`}
                                  type="number"
                                  value={point.anchorRowCountVertical}
                                  onValueChange={(val) => updatePoint(point.id, 'anchorRowCountVertical', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                  min="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-anchorGapAxial`}
                                  type="number"
                                  value={point.anchorGapAxial}
                                  onValueChange={(val) => updatePoint(point.id, 'anchorGapAxial', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <NumericInput
                                  {...numericInputSharedProps}
                                  inputKey={`custom-${point.id}-anchorGapVertical`}
                                  type="number"
                                  value={point.anchorGapVertical}
                                  onValueChange={(val) => updatePoint(point.id, 'anchorGapVertical', val)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 삽도 미리보기 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 gap-4">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  삽도 미리보기
                </h2>
                <div className="flex-1 flex justify-center">
                  {/* 옵션 버튼 */}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setSectionViewType('axial-plan')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'axial-plan'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      교축(평면)
                    </button>
                    <button
                      onClick={() => setSectionViewType('axial-front')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'axial-front'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      교축(정면)
                    </button>
                    <button
                      onClick={() => setSectionViewType('vertical-plan')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'vertical-plan'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      교직(평면)
                    </button>
                    <button
                      onClick={() => setSectionViewType('vertical-front')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'vertical-front'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      교직(정면)
                    </button>
                    <button
                      onClick={() => setSectionViewType('flyout-front')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'flyout-front'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      프라이아웃(전열)
                    </button>
                    <button
                      onClick={() => setSectionViewType('flyout-back')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sectionViewType === 'flyout-back'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      프라이아웃(후열)
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {params.width > 0 && params.height > 0 && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 모달 본문 */}
              <div className="flex-1 overflow-auto p-6 bg-gray-50">
                {(() => {
                  // 옵션에 따른 viewBox 크기 결정
                  const isFrontView = sectionViewType === 'axial-front' || sectionViewType === 'vertical-front';
                  
                  // 교축(정면)의 경우, 앵커 선과 직사각형이 위쪽으로 그려질 수 있으므로 여유 공간 추가
                  let viewBoxHeight = isFrontView 
                    ? Math.max(params.heightFront, params.heightBack)
                    : params.height;
                  
                  // 교축(정면)의 경우, 위쪽 여유 공간 추가 (앵커 선 300mm + 직사각형 높이/2 + 여유)
                  let viewBoxY = 0;
                  let adjustedViewBoxHeight = viewBoxHeight;
                  let viewBoxX = 0;
                  let adjustedViewBoxWidth = (sectionViewType === 'axial-front') 
                    ? params.height  // 교축(정면): 길이 방향
                    : params.width;  // 교직(정면) 또는 평면: 폭 방향
                  
                  // 교직(정면)의 경우, 기준점 표시와 일치하도록 padding 추가
                  if (sectionViewType === 'vertical-front') {
                    const padding = Math.max(params.width, params.height) * 0.1 || 20;
                    adjustedViewBoxWidth = params.width + padding * 2;
                    adjustedViewBoxHeight = params.height + padding * 2;
                    viewBoxX = -padding;
                    viewBoxY = -padding;
                  } else if (sectionViewType === 'axial-front') {
                    const padding = 400; // 위쪽 여유 공간 (앵커 선 300mm + 직사각형 50mm + 여유 50mm)
                    const bottomPadding = 400; // 아래쪽 여유 공간 (형상을 중앙에 배치하기 위해)
                    const dimensionLineOffsetFront = 100; // Dimension 선과 형상 사이의 간격 (전열)
                    const dimensionLineOffsetBack = 200; // Dimension 선과 형상 사이의 간격 (후열)
                    const textOffset = 100; // 텍스트와 Dimension 선 사이의 간격
                    const textSize = 100; // 텍스트 크기
                    // 텍스트가 보이도록 충분한 여유 공간 추가 (텍스트 크기 + 텍스트 오프셋 + 여유 공간)
                    const leftPadding = dimensionLineOffsetFront + textOffset + textSize + 100; // Dimension이 보이도록 왼쪽 여유 공간 추가 (전열)
                    const rightPadding = dimensionLineOffsetBack + textOffset + textSize + 100; // Dimension이 보이도록 오른쪽 여유 공간 추가 (후열)
                    
                    viewBoxY = -padding; // viewBox 시작점을 위로 이동
                    adjustedViewBoxHeight = viewBoxHeight + padding + bottomPadding;
                    viewBoxX = -leftPadding; // viewBox 시작점을 왼쪽으로 이동
                    adjustedViewBoxWidth = params.height + leftPadding + rightPadding;
                  } else if (sectionViewType === 'vertical-plan') {
                    const rightPadding =
                      VERTICAL_PLAN_DIMENSION_LINE_OFFSET_BACK_X +
                      VERTICAL_PLAN_DIMENSION_TEXT_OFFSET_X +
                      VERTICAL_PLAN_DIMENSION_EXTRA_MARGIN;
                    const topPadding =
                      VERTICAL_PLAN_HORIZONTAL_TOP_OFFSET +
                      VERTICAL_PLAN_HORIZONTAL_TOP_TEXT_OFFSET +
                      VERTICAL_PLAN_HORIZONTAL_EXTRA_MARGIN;
                    const bottomPadding =
                      VERTICAL_PLAN_HORIZONTAL_BOTTOM_OFFSET +
                      VERTICAL_PLAN_HORIZONTAL_BOTTOM_TEXT_OFFSET +
                      VERTICAL_PLAN_HORIZONTAL_EXTRA_MARGIN;
                    adjustedViewBoxHeight = viewBoxHeight + topPadding + bottomPadding;
                    adjustedViewBoxWidth = params.width + rightPadding;
                    viewBoxY = -topPadding;
                  } else if (sectionViewType === 'axial-plan') {
                    const topPadding = Math.max(
                      PLAN_DIMENSION_LINE_OFFSET_BACK + PLAN_DIMENSION_TEXT_OFFSET_BACK + PLAN_DIMENSION_EXTRA_MARGIN,
                      AXIAL_PLAN_HORIZONTAL_DIMENSION_TEXT_OFFSET_Y + AXIAL_PLAN_HORIZONTAL_DIMENSION_EXTRA_MARGIN
                    );
                    const bottomPadding =
                      PLAN_DIMENSION_LINE_OFFSET_FRONT + PLAN_DIMENSION_TEXT_OFFSET_FRONT + PLAN_DIMENSION_EXTRA_MARGIN;
                    const sidePadding =
                      AXIAL_PLAN_VERTICAL_DIMENSION_LINE_OFFSET_X +
                      AXIAL_PLAN_VERTICAL_DIMENSION_TEXT_OFFSET_X +
                      AXIAL_PLAN_VERTICAL_DIMENSION_EXTRA_MARGIN;
                    viewBoxX = -sidePadding;
                    viewBoxY = -topPadding;
                    adjustedViewBoxHeight = viewBoxHeight + topPadding + bottomPadding;
                    adjustedViewBoxWidth = params.width + sidePadding * 2;
                  }
                  
                  const isValid = adjustedViewBoxWidth > 0 && adjustedViewBoxHeight > 0;

                  return isValid ? (
                    <div className="flex flex-row gap-6 min-h-full w-full items-stretch">
                      <aside className="w-80 flex-shrink-0">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 h-full">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">뷰 옵션</h3>
                          {sectionViewType === 'axial-plan' && (
                            <div className="space-y-6">
                              <section>
                                <h4 className="text-sm(font-semibold text-gray-800 mb-3">받침 그룹(전단 파괴면)</h4>
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      checked={isFrontSupportGroupEnabled}
                                    onChange={(event) => {
                                      setIsFrontSupportGroupEnabled(event.target.checked);
                                      setViewOptionVersion(prev => prev + 1);
                                    }}
                                    />
                                    전열 받침
                                  </label>
                                  <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      checked={isBackSupportGroupEnabled}
                                    onChange={(event) => {
                                      setIsBackSupportGroupEnabled(event.target.checked);
                                      setViewOptionVersion(prev => prev + 1);
                                    }}
                                    />
                                    후열 받침
                                  </label>
                                </div>
                              </section>
                            </div>
                          )}
                        </div>
                      </aside>
                      <div className="flex-1 flex items-center justify-center">
                        <svg
                          id="section-svg"
                          viewBox={`${viewBoxX} ${viewBoxY} ${adjustedViewBoxWidth} ${adjustedViewBoxHeight}`}
                          className="max-w-full max-h-[85vh]"
                          style={{ 
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '85vh'
                          }}
                          preserveAspectRatio="xMidYMid meet"
                          key={`svg-${adjustedViewBoxWidth}-${adjustedViewBoxHeight}-${customPoints.length}-${sectionViewType}-${isFrontSupportGroupEnabled}-${isBackSupportGroupEnabled}-${viewOptionVersion}`}
                        >
                        {/* 그리드 배경 */}
                        <defs>
                          <pattern
                            id="grid"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 20 0 L 0 0 0 20"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="0.5"
                            />
                          </pattern>
                          {/* 화살표 마커 정의 */}
                          <marker
                            id="arrowhead-start"
                            markerWidth="30"
                            markerHeight="30"
                            refX="3"
                            refY="15"
                            orient="auto"
                          >
                            <polygon
                              points="30 0, 0 15, 30 30"
                              fill={SECTION_STROKE_COLOR}
                            />
                          </marker>
                          <marker
                            id="arrowhead-end"
                            markerWidth="30"
                            markerHeight="30"
                            refX="27"
                            refY="15"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 30 15, 0 30"
                              fill={SECTION_STROKE_COLOR}
                            />
                          </marker>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* 삽도 경로 (평면 뷰만) */}
                {!isFrontView && sectionViewType !== 'flyout-front' && sectionViewType !== 'flyout-back' && (
                          <path
                            d={svgPath}
                            fill="white"
                            stroke={SECTION_STROKE_COLOR}
                            strokeWidth={MAIN_LINE_STROKE_WIDTH}
                            strokeOpacity={1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                {!isFrontView &&
                  sectionViewType !== 'flyout-front' &&
                  sectionViewType !== 'flyout-back' &&
                  params.hasStep &&
                  params.stepValue > 0 &&
                  params.stepValue < params.height && (
                  <line
                    x1={0}
                    y1={params.stepValue}
                    x2={params.width}
                    y2={params.stepValue}
                    stroke="#888"
                    strokeWidth={1}
                    strokeDasharray="8 4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                        {/* 정면 뷰용 삽도 경로 */}
                        {isFrontView && (
                          <>
                            {sectionViewType === 'axial-front' ? (
                              // 교축(정면): 길이, 높이(전열), 높이(후열) 적용
                              // viewBox Y 시작점이 -padding이므로, 실제 Y 좌표는 그대로 유지
                              <>
                                {params.hasStep ? (
                                  // 단차가 On일 때: 전열과 후열의 높이가 다를 수 있음
                                  <>
                                    {/* 전열 부분 (좌측) */}
                                    <rect
                                      x="0"
                                      y={viewBoxHeight - params.heightFront}
                                      width={params.stepValue > 0 ? params.stepValue : params.height}
                                      height={params.heightFront}
                                      fill="white"
                                      stroke={SECTION_STROKE_COLOR}
                                      strokeWidth={MAIN_LINE_STROKE_WIDTH}
                                      strokeOpacity={1}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                    {/* 후열 부분 (우측) */}
                                    <rect
                                      x={params.stepValue > 0 ? params.stepValue : 0}
                                      y={viewBoxHeight - params.heightBack}
                                      width={params.height - (params.stepValue > 0 ? params.stepValue : 0)}
                                      height={params.heightBack}
                                      fill="white"
                                      stroke={SECTION_STROKE_COLOR}
                                      strokeWidth={MAIN_LINE_STROKE_WIDTH}
                                      strokeOpacity={1}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                    {/* 단차 위치 표시 (점선) */}
                                    {params.stepValue > 0 && params.stepValue < params.height && (
                                      <line
                                        x1={params.stepValue}
                                        y1={0}
                                        x2={params.stepValue}
                                        y2={viewBoxHeight}
                                        stroke={SECTION_STROKE_COLOR}
                                        strokeWidth="2"
                                        strokeDasharray="5,5"
                                        strokeOpacity={0.7}
                                        vectorEffect="non-scaling-stroke"
                                      />
                                    )}
                                  </>
                                ) : (
                                  // 단차가 Off일 때: 단일 직사각형
                                  <rect
                                    x="0"
                                    y={viewBoxHeight - params.heightFront}
                                    width={params.height}
                                    height={params.heightFront}
                                    fill="white"
                                    stroke={SECTION_STROKE_COLOR}
                                    strokeWidth={MAIN_LINE_STROKE_WIDTH}
                                    strokeOpacity={1}
                                    vectorEffect="non-scaling-stroke"
                                  />
                                )}
                              </>
                            ) : (
                              // 교직(정면): 단면 형상 적용
                              (() => {
                                const sectionData = sectionPathData;
                                if (!sectionData || !sectionData.pathData) {
                                  // 단면 데이터가 없으면 기본 직사각형
                                  return (
                                    <rect
                                      x="0"
                                      y="0"
                                      width={params.width}
                                      height={viewBoxHeight}
                                      fill="none"
                                      stroke={SECTION_STROKE_COLOR}
                                      strokeWidth={MAIN_LINE_STROKE_WIDTH}
                                      strokeOpacity={1}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                  );
                                }

                                // 단면 형상의 경계 계산 (pathData는 이미 flipY가 적용된 상태)
                                // pathData의 경계를 추출하기 위해 absolutePoints를 사용하되, flipY 변환 고려
                                const { absolutePoints, flipY } = sectionData;
                                
                                // flipY가 적용된 좌표로 경계 계산
                                const flippedPoints = absolutePoints.map(p => ({ x: p.x, y: flipY(p.y) }));
                                const minX = Math.min(...flippedPoints.map(p => p.x));
                                const maxX = Math.max(...flippedPoints.map(p => p.x));
                                const minY = Math.min(...flippedPoints.map(p => p.y));
                                const maxY = Math.max(...flippedPoints.map(p => p.y));
                                const sectionWidth = maxX - minX || 1;
                                const sectionHeight = maxY - minY || 1;

                                // 교직(정면) viewBox에 맞게 스케일링 및 중앙 정렬
                                // 형상이 viewBox 중앙에 위치하도록 계산
                                const scaleX = adjustedViewBoxWidth / sectionWidth;
                                const scaleY = adjustedViewBoxHeight / sectionHeight;
                                const scale = Math.min(scaleX, scaleY) * 0.9; // 90%로 약간 여유 공간

                                // 형상의 중심점 계산 (flipY가 적용된 좌표 기준)
                                const sectionCenterX = (minX + maxX) / 2;
                                const sectionCenterY = (minY + maxY) / 2;
                                
                                // viewBox의 중심점 계산
                                // viewBox는 viewBox={`${viewBoxX} ${viewBoxY} ${adjustedViewBoxWidth} ${adjustedViewBoxHeight}`}
                                // viewBoxX = -padding, viewBoxY = -padding
                                // viewBox의 중심점은: (viewBoxX + adjustedViewBoxWidth / 2, viewBoxY + adjustedViewBoxHeight / 2)
                                const viewBoxCenterX = viewBoxX + adjustedViewBoxWidth / 2;
                                const viewBoxCenterY = viewBoxY + adjustedViewBoxHeight / 2;
                                
                                // 형상의 중심점을 viewBox의 중심점에 맞추기 위한 translate 계산
                                // scale 적용 후 형상의 중심점: (sectionCenterX * scale, sectionCenterY * scale)
                                // 이 중심점이 viewBox의 중심점에 위치하도록:
                                //   translateX = viewBoxCenterX - sectionCenterX * scale
                                //   translateY = viewBoxCenterY - sectionCenterY * scale
                                const translateX = viewBoxCenterX - sectionCenterX * scale;
                                const translateY = viewBoxCenterY - sectionCenterY * scale;

                                // 교직(정면): 단면 형상을 닫힌 path로 렌더링하고 내부를 흰색으로 채움
                                // sectionData.pathData는 이미 Z로 닫힌 형태
                                const closedPathData = sectionData.pathData;
                                
                                // SVG transform의 적용 순서: 오른쪽에서 왼쪽으로 (scale이 먼저, translate가 나중)
                                // 즉, transform="translate(tx, ty) scale(s)"는:
                                //   1. 먼저 scale 적용: (x, y) -> (x * s, y * s)
                                //   2. 그 다음 translate 적용: (x * s, y * s) -> (x * s + tx, y * s + ty)
                                // 따라서 실제 좌표는: (x * scale + translateX, y * scale + translateY)
                                // 
                                // 하지만 우리가 계산한 translateX, translateY는 이미 scale을 고려한 값이므로,
                                // 실제로는: (x * scale + translateX, y * scale + translateY)
                                // 
                                // pathData의 첫 번째 점: M ${firstPoint.x} ${flipY(firstPoint.y)}
                                // 실제 SVG 좌표: (originX * scale + translateX, flipY(originY) * scale + translateY)
                                return (
                                  <g 
                                    transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
                                  >
                                    <path
                                      d={closedPathData}
                                      fill="white"
                                      stroke={SECTION_STROKE_COLOR}
                                      strokeWidth={MAIN_LINE_STROKE_WIDTH}
                                      strokeOpacity={1}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      vectorEffect="non-scaling-stroke"
                                    />
                                  </g>
                                );
                              })()
                            )}
                          </>
                        )}

                        {/* 추가 점들 (기준점: 좌측 하단) */}
                        {!isFrontView && renderedPoints}

                        {/* 앵커 위치들 (옵션에 따라) */}
                        {renderedSectionPreview}

                        {/* 교축(평면) 치수선 */}
                        {sectionViewType === 'axial-plan' && axialPlanVerticalElements}
                        {sectionViewType === 'axial-plan' && axialPlanHorizontalElements}
                        {sectionViewType === 'axial-plan' && axialPlanDimensionElements}

                        {/* 교직(평면) 치수선 */}
                        {sectionViewType === 'vertical-plan' && verticalPlanDimensionElements}
                        {sectionViewType === 'vertical-plan' && verticalPlanAdditionalHorizontalElements}
                        {sectionViewType === 'vertical-plan' && verticalPlanAdditionalVerticalElements}

                        {/* 치수선 예시 (평면 뷰만) */}
                        {!isFrontView && sectionViewType !== 'flyout-front' && sectionViewType !== 'flyout-back' && (
                          <>
                            <line
                              x1="0"
                              y1={params.height + 20}
                              x2={params.width}
                              y2={params.height + 20}
                              stroke="#666"
                              strokeWidth="1"
                            />
                            <text
                              x={params.width / 2}
                              y={params.height + 35}
                              textAnchor="middle"
                              fontSize="12"
                              fill="#666"
                            >
                              {params.width}mm
                            </text>
                          </>
                        )}
                      </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <Ruler className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>너비와 높이를 입력하세요.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 단면 치수 입력 모달 */}
        {isSectionDimensionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsSectionDimensionModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">
                  단면 치수 입력
                </h2>
                <button
                  onClick={() => setIsSectionDimensionModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 모달 본문 */}
              <div className="flex-1 overflow-auto p-6">
                {params.hasStep ? (
                  // 단차 On: 전열과 후열로 구분 (탭)
                  <div>
                    {/* 탭 버튼 */}
                    <div className="flex border-b border-gray-300 mb-4">
                      <button
                        onClick={() => setActiveSectionTab('front')}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                          activeSectionTab === 'front'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        전열
                      </button>
                      <button
                        onClick={() => setActiveSectionTab('back')}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                          activeSectionTab === 'back'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        후열
                      </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    {activeSectionTab === 'front' && (
                      <div>
                        <div className="flex justify-end items-center gap-2 mb-2">
                          <label className="text-sm text-gray-700">행 개수:</label>
                          <NumericInput
                            {...numericInputSharedProps}
                            inputKey="sectionPoints-front-count"
                            type="number"
                            min="0"
                            value={sectionPointCountFront}
                            onValueChange={(val) => setSectionPointCountFront(Math.max(0, Math.floor(val)))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      <div className="border border-gray-300 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">X (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">Y (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">R (mm)</th>
                            </tr>
                          </thead>
                          <tbody
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text');
                              const lines = pastedData.split('\n').filter(line => line.trim());
                              const updatedPoints = [...sectionPointsFront];
                              const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];

                              lines.forEach((line, lineIndex) => {
                                const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                                if (cells.length >= 2) {
                                  const inputX = parseFloat(cells[0]);
                                  const inputY = parseFloat(cells[1]);
                                  const inputR = cells.length >= 3 ? parseFloat(cells[2]) : 0;

                                  if (!isNaN(inputX) && !isNaN(inputY)) {
                                    const targetIndex = lineIndex;
                                    if (targetIndex < updatedPoints.length) {
                                      // 모든 행을 상대 좌표로 그대로 저장
                                      updatedPoints[targetIndex] = {
                                        ...updatedPoints[targetIndex],
                                        x: inputX,
                                        y: inputY,
                                        r: !isNaN(inputR) ? inputR : updatedPoints[targetIndex].r
                                      };
                                    } else {
                                      // 새 점 추가: 모든 행을 상대 좌표로 저장
                                      newPoints.push({
                                        id: `point-front-${Date.now()}-${lineIndex}`,
                                        x: inputX,
                                        y: inputY,
                                        r: !isNaN(inputR) ? inputR : 0
                                      });
                                    }
                                  }
                                }
                              });

                              if (newPoints.length > 0) {
                                setSectionPointsFront([...updatedPoints, ...newPoints]);
                              } else if (updatedPoints.some((p, i) =>
                                i < sectionPointsFront.length &&
                                (p.x !== sectionPointsFront[i].x || p.y !== sectionPointsFront[i].y || p.r !== sectionPointsFront[i].r)
                              )) {
                                setSectionPointsFront(updatedPoints);
                              }
                            }}
                          >
                            {sectionPointsFront.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                  점이 없습니다. 행 개수를 입력하거나 엑셀에서 데이터를 붙여넣으세요.
                                </td>
                              </tr>
                            ) : (
                              sectionPointsFront.map((point, index) => (
                                <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                  <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-front-${point.id}-x`}
                                      type="number"
                                      value={point.x}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsFront, index, val, point.y);
                                        setSectionPointsFront(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-front-${point.id}-y`}
                                      type="number"
                                      value={point.y}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsFront, index, point.x, val);
                                        setSectionPointsFront(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-front-${point.id}-r`}
                                      type="number"
                                      value={point.r}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsFront, index, point.x, point.y, val);
                                        setSectionPointsFront(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                      min="0"
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}

                    {activeSectionTab === 'back' && (
                      <div>
                        <div className="flex justify-end items-center gap-2 mb-2">
                          <label className="text-sm text-gray-700">행 개수:</label>
                          <NumericInput
                            {...numericInputSharedProps}
                            inputKey="sectionPoints-back-count"
                            type="number"
                            min="0"
                            value={sectionPointCountBack}
                            onValueChange={(val) => setSectionPointCountBack(Math.max(0, Math.floor(val)))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      <div className="border border-gray-300 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">X (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">Y (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">R (mm)</th>
                            </tr>
                          </thead>
                          <tbody
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text');
                              const lines = pastedData.split('\n').filter(line => line.trim());
                              const updatedPoints = [...sectionPointsBack];
                              const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];

                              lines.forEach((line, lineIndex) => {
                                const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                                if (cells.length >= 2) {
                                  const inputX = parseFloat(cells[0]);
                                  const inputY = parseFloat(cells[1]);
                                  const inputR = cells.length >= 3 ? parseFloat(cells[2]) : 0;

                                  if (!isNaN(inputX) && !isNaN(inputY)) {
                                    const targetIndex = lineIndex;
                                    if (targetIndex < updatedPoints.length) {
                                      // 모든 행을 상대 좌표로 그대로 저장
                                      updatedPoints[targetIndex] = {
                                        ...updatedPoints[targetIndex],
                                        x: inputX,
                                        y: inputY,
                                        r: !isNaN(inputR) ? inputR : updatedPoints[targetIndex].r
                                      };
                                    } else {
                                      // 새 점 추가: 모든 행을 상대 좌표로 저장
                                      newPoints.push({
                                        id: `point-back-${Date.now()}-${lineIndex}`,
                                        x: inputX,
                                        y: inputY,
                                        r: !isNaN(inputR) ? inputR : 0
                                      });
                                    }
                                  }
                                }
                              });

                              if (newPoints.length > 0) {
                                setSectionPointsBack([...updatedPoints, ...newPoints]);
                              } else if (updatedPoints.some((p, i) =>
                                i < sectionPointsBack.length &&
                                (p.x !== sectionPointsBack[i].x || p.y !== sectionPointsBack[i].y || p.r !== sectionPointsBack[i].r)
                              )) {
                                setSectionPointsBack(updatedPoints);
                              }
                            }}
                          >
                            {sectionPointsBack.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                  점이 없습니다. 행 개수를 입력하거나 엑셀에서 데이터를 붙여넣으세요.
                                </td>
                              </tr>
                            ) : (
                              sectionPointsBack.map((point, index) => (
                                <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                  <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-back-${point.id}-x`}
                                      type="number"
                                      value={point.x}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsBack, index, val, point.y);
                                        setSectionPointsBack(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-back-${point.id}-y`}
                                      type="number"
                                      value={point.y}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsBack, index, point.x, val);
                                        setSectionPointsBack(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <NumericInput
                                      {...numericInputSharedProps}
                                      inputKey={`section-back-${point.id}-r`}
                                      type="number"
                                      value={point.r}
                                      onValueChange={(val) => {
                                        const updated = convertInputToStorage(sectionPointsBack, index, point.x, point.y, val);
                                        setSectionPointsBack(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                      min="0"
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    )}
                  </div>
                ) : (
                  // 단차 Off: 단일 테이블
                  <div>
                    <div className="flex justify-end items-center gap-2 mb-2">
                      <label className="text-sm text-gray-700">행 개수:</label>
                      <NumericInput
                        {...numericInputSharedProps}
                        inputKey="sectionPoints-all-count"
                        type="number"
                        min="0"
                        value={sectionPointCount}
                        onValueChange={(val) => setSectionPointCount(Math.max(0, Math.floor(val)))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">X (mm)</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">Y (mm)</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-24">R (mm)</th>
                          </tr>
                        </thead>
                        <tbody
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text');
                            const lines = pastedData.split('\n').filter(line => line.trim());
                            const updatedPoints = [...sectionPoints];
                            const newPoints: Array<{ id: string; x: number; y: number; r: number }> = [];

                            lines.forEach((line, lineIndex) => {
                              const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                              if (cells.length >= 2) {
                                const inputX = parseFloat(cells[0]);
                                const inputY = parseFloat(cells[1]);
                                const inputR = cells.length >= 3 ? parseFloat(cells[2]) : 0;

                                if (!isNaN(inputX) && !isNaN(inputY)) {
                                  const targetIndex = lineIndex;
                                  if (targetIndex < updatedPoints.length) {
                                    // 모든 행을 상대 좌표로 그대로 저장
                                    updatedPoints[targetIndex] = {
                                      ...updatedPoints[targetIndex],
                                      x: inputX,
                                      y: inputY,
                                      r: !isNaN(inputR) ? inputR : updatedPoints[targetIndex].r
                                    };
                                  } else {
                                    // 새 점 추가: 모든 행을 상대 좌표로 저장
                                    newPoints.push({
                                      id: `point-${Date.now()}-${lineIndex}`,
                                      x: inputX,
                                      y: inputY,
                                      r: !isNaN(inputR) ? inputR : 0
                                    });
                                  }
                                }
                              }
                            });

                            if (newPoints.length > 0) {
                              setSectionPoints([...updatedPoints, ...newPoints]);
                            } else if (updatedPoints.some((p, i) =>
                              i < sectionPoints.length &&
                              (p.x !== sectionPoints[i].x || p.y !== sectionPoints[i].y || p.r !== sectionPoints[i].r)
                            )) {
                              setSectionPoints(updatedPoints);
                            }
                          }}
                        >
                          {sectionPoints.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                                점이 없습니다. 점을 추가하거나 엑셀에서 데이터를 붙여넣으세요.
                              </td>
                            </tr>
                          ) : (
                            sectionPoints.map((point, index) => (
                              <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                <td className="px-3 py-2">
                                  <NumericInput
                                    {...numericInputSharedProps}
                                    inputKey={`section-${point.id}-x`}
                                    type="number"
                                    value={point.x}
                                    onValueChange={(val) => {
                                      const updated = convertInputToStorage(sectionPoints, index, val, point.y);
                                      setSectionPoints(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    step="1"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <NumericInput
                                    {...numericInputSharedProps}
                                    inputKey={`section-${point.id}-y`}
                                    type="number"
                                    value={point.y}
                                    onValueChange={(val) => {
                                      const updated = convertInputToStorage(sectionPoints, index, point.x, val);
                                      setSectionPoints(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    step="1"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <NumericInput
                                    {...numericInputSharedProps}
                                    inputKey={`section-${point.id}-r`}
                                    type="number"
                                    value={point.r}
                                    onValueChange={(val) => {
                                      const updated = convertInputToStorage(sectionPoints, index, point.x, point.y, val);
                                      setSectionPoints(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    step="1"
                                    min="0"
                                  />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setIsSectionDimensionModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setIsSectionDimensionModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SectionView;

