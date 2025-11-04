import React, { useState, useEffect, useMemo } from 'react';
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

// 색상 상수 정의
const SECTION_STROKE_COLOR = '#000000';
const POINT_FILL_COLOR = '#000000';
const POINT_STROKE_COLOR = '#000000';
const ANCHOR_FILL_COLOR = '#FF0000'; // 앵커 점은 빨간색
const ANCHOR_STROKE_COLOR = '#FF0000';

const SectionView: React.FC = () => {
  const [params, setParams] = useState<SectionParams>({
    width: 10000,
    height: 3000,
    heightFront: 3000,
    heightBack: 3000,
    frontRowCount: 2,
    backRowCount: 2,
    hasStep: false,
    stepValue: 0
  });

  const [svgPath, setSvgPath] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<Point[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copingViewType, setCopingViewType] = useState<'plan' | 'side' | 'section'>('plan'); // 평면, 측면, 또는 단면
  const [isSectionDimensionModalOpen, setIsSectionDimensionModalOpen] = useState<boolean>(false);
  const [sectionPoints, setSectionPoints] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [sectionPointsFront, setSectionPointsFront] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [sectionPointsBack, setSectionPointsBack] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [activeSectionTab, setActiveSectionTab] = useState<'front' | 'back'>('front'); // 전열/후열 탭

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

  // 단차 옵션이 Off일 때 heightFront를 height 값으로 동기화
  useEffect(() => {
    if (!params.hasStep && params.heightFront !== params.height) {
      setParams(prev => ({
        ...prev,
        heightFront: prev.height
      }));
    }
  }, [params.hasStep, params.height, params.heightFront]);

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
  const renderedAnchors = useMemo(() => {
    if (customPoints.length === 0) return null;

    const anchorPoints: Array<{ 
      x: number; 
      y: number; 
      isFrontRow: boolean; // 전열 여부
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

    customPoints.forEach((point, index) => {
      const isFrontRow = index < params.frontRowCount;
      
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
            
            anchorPoints.push({ x: anchorX, y: anchorY, isFrontRow: isFrontRow });
          }
        }
      }
    });

    if (anchorPoints.length === 0) return null;

    // 전열과 후열로 분리
    const frontRowAnchors = anchorPoints.filter(a => a.isFrontRow);
    const backRowAnchors = anchorPoints.filter(a => !a.isFrontRow);

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

    // 직선을 그릴 앵커만 선택
    const anchorsToDrawLines = [...frontRowTopAnchors, ...backRowBottomAnchors];

    return (
      <g key="anchor-points-group">
        {/* 축선들 (받침중심 점에서 사각형까지) */}
        {anchorRects.map((rect) => {
          const rectEndX = rect.x + rect.width;
          const rectEndY = rect.y + rect.height;
          
          return (
            <g key={`anchor-axes-${rect.pointId}`}>
              {/* 가로 축 (수평선) - 받침 중심점에서 사각형 좌측에서 우측까지 */}
              <line
                x1={rect.x}
                y1={rect.baseY}
                x2={rectEndX}
                y2={rect.baseY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth="1"
                strokeOpacity={1}
                vectorEffect="non-scaling-stroke"
              />
              {/* 세로 축 (수직선) - 받침 중심점에서 사각형 상단에서 하단까지 */}
              <line
                x1={rect.baseX}
                y1={rect.y}
                x2={rect.baseX}
                y2={rectEndY}
                stroke={SECTION_STROKE_COLOR}
                strokeWidth="1"
                strokeOpacity={1}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        {/* 앵커 사각형들 */}
        {anchorRects.map((rect) => (
          <rect
            key={`anchor-rect-${rect.pointId}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="none"
            stroke={SECTION_STROKE_COLOR}
            strokeWidth="1"
            strokeOpacity={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* 앵커 점들 (모두 렌더링) */}
        {anchorPoints.map((anchor, idx) => (
          <g key={`anchor-point-${idx}`}>
            {/* 앵커 점 주변 원 (배경) */}
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
            {/* 앵커 점 */}
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
        {/* 직선은 선택된 앵커만 렌더링 */}
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
          const slope = 1 / 1.5; // 약 0.6667
          let line1: { x1: number; y1: number; x2: number; y2: number } | null = null;
          let line2: { x1: number; y1: number; x2: number; y2: number } | null = null;

          if (anchor.isFrontRow) {
            // 전열: (+X, -Y) 방향 (기울기 -1/1.5), (-X, -Y) 방향 (기울기 1/1.5)
            // 전열은 +Y 방향 부분을 Trim (trimPositiveY = true)
            line1 = getLineIntersection(-slope, anchor.x, anchor.y, true); // (+X, -Y)
            line2 = getLineIntersection(slope, anchor.x, anchor.y, true);  // (-X, -Y)
          } else {
            // 후열: (+X, +Y) 방향 (기울기 1/1.5), (-X, +Y) 방향 (기울기 -1/1.5)
            // 후열은 -Y 방향 부분을 Trim (trimPositiveY = false)
            line1 = getLineIntersection(slope, anchor.x, anchor.y, false);   // (+X, +Y)
            line2 = getLineIntersection(-slope, anchor.x, anchor.y, false);  // (-X, +Y)
          }

          return (
            <g key={`anchor-line-group-${idx}`}>
              {/* 직선 1 */}
              {line1 && (
                <line
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
              )}
              {/* 직선 2 */}
              {line2 && (
                <line
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
              )}
            </g>
          );
        })}
      </g>
    );
  }, [customPoints, params.height, params.width, params.frontRowCount]);

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

  // 단면 뷰 렌더링을 위한 useMemo
  const sectionViewContent = useMemo(() => {
    // 단면 뷰에서 사용할 점들 결정
    const pointsToRender = params.hasStep
      ? (activeSectionTab === 'front' ? sectionPointsFront : sectionPointsBack)
      : sectionPoints;

    if (pointsToRender.length === 0) {
      return (
        <div className="text-gray-400 text-center">
          <p className="text-sm">단면 치수 입력에서 점을 추가하세요</p>
        </div>
      );
    }

    // 점들의 경계 계산
    const minX = Math.min(...pointsToRender.map(p => p.x));
    const maxX = Math.max(...pointsToRender.map(p => p.x));
    const minY = Math.min(...pointsToRender.map(p => p.y));
    const maxY = Math.max(...pointsToRender.map(p => p.y));

    const viewBoxWidth = maxX - minX || 100;
    const viewBoxHeight = maxY - minY || 100;
    const padding = Math.max(viewBoxWidth, viewBoxHeight) * 0.1 || 20;

    // SVG 경계
    const svgX = minX - padding;
    const svgY = minY - padding;
    const svgWidth = viewBoxWidth + padding * 2;
    const svgHeight = viewBoxHeight + padding * 2;

    // 점들을 path로 변환
    const pathData = pointsToRender.length > 0
      ? `M ${pointsToRender[0].x} ${pointsToRender[0].y} ` +
        pointsToRender.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
        ' Z'
      : '';

    return (
      <svg
        viewBox={`${svgX} ${svgY} ${svgWidth} ${svgHeight}`}
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

        {/* 단면 폴리곤 */}
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

        {/* 점들 */}
        {pointsToRender.map((point, index) => (
          <g key={`section-point-${point.id || index}`}>
            <circle
              cx={point.x}
              cy={point.y}
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
  }, [params.hasStep, activeSectionTab, sectionPoints, sectionPointsFront, sectionPointsBack]);

  return (
    <PageLayout title="">
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
              onClick={() => setIsModalOpen(true)}
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
                  <div className="flex gap-2">
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
                    <input
                      type="number"
                      value={params.width}
                      onChange={(e) => handleParamChange('width', Number(e.target.value))}
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
                    <input
                      type="number"
                      value={params.height}
                      onChange={(e) => handleParamChange('height', Number(e.target.value))}
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
                        단차 (mm)
                      </label>
                    </div>
                    <input
                      type="number"
                      value={params.stepValue}
                      onChange={(e) => handleParamChange('stepValue', Number(e.target.value))}
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
                    <input
                      type="number"
                      value={params.heightFront}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        handleParamChange('heightFront', newValue);
                        // 단차 Off일 때는 height도 함께 업데이트
                        if (!params.hasStep) {
                          handleParamChange('height', newValue);
                        }
                      }}
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
                    <input
                      type="number"
                      value={params.heightBack}
                      onChange={(e) => handleParamChange('heightBack', Number(e.target.value))}
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
                            strokeWidth="3"
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
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          받침개수(전열)
                        </label>
                        <input
                          type="number"
                          value={params.frontRowCount}
                          onChange={(e) => handleParamChange('frontRowCount', Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          max="100"
                          step="1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          받침개수(후열)
                        </label>
                        <input
                          type="number"
                          value={params.backRowCount}
                          onChange={(e) => handleParamChange('backRowCount', Number(e.target.value))}
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
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">구분</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">X (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Y (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커열 개수(교축)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커열 개수(교직)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커간격(교축) (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">앵커간격(교직) (mm)</th>
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
                                <input
                                  type="number"
                                  value={point.offsetX}
                                  onChange={(e) => updatePoint(point.id, 'offsetX', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={point.offsetY}
                                  onChange={(e) => updatePoint(point.id, 'offsetY', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={point.anchorRowCountAxial}
                                  onChange={(e) => updatePoint(point.id, 'anchorRowCountAxial', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                  min="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={point.anchorRowCountVertical}
                                  onChange={(e) => updatePoint(point.id, 'anchorRowCountVertical', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                  min="0"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={point.anchorGapAxial}
                                  onChange={(e) => updatePoint(point.id, 'anchorGapAxial', Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  step="1"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={point.anchorGapVertical}
                                  onChange={(e) => updatePoint(point.id, 'anchorGapVertical', Number(e.target.value))}
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  삽도 미리보기
                </h2>
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
                {params.width > 0 && params.height > 0 ? (
                  <div className="flex items-center justify-center min-h-full">
                    <svg
                      id="section-svg"
                      width={params.width}
                      height={params.height}
                      viewBox={`0 0 ${params.width} ${params.height}`}
                      className="border border-gray-200 bg-white max-w-full max-h-[85vh]"
                      style={{ 
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: '85vh'
                      }}
                      preserveAspectRatio="xMidYMid meet"
                      key={`svg-${params.width}-${params.height}-${customPoints.length}`}
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
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* 삽도 경로 */}
                      <path
                        d={svgPath}
                        fill="none"
                        stroke={SECTION_STROKE_COLOR}
                        strokeWidth="3"
                        strokeOpacity={1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />

                      {/* 추가 점들 (기준점: 좌측 하단) */}
                      {renderedPoints}

                      {/* 앵커 위치들 */}
                      {renderedAnchors}

                      {/* 치수선 예시 */}
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
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Ruler className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>너비와 높이를 입력하세요.</p>
                    </div>
                  </div>
                )}
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
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => {
                              const newPoint = {
                                id: `point-front-${Date.now()}-${sectionPointsFront.length}`,
                                x: 0,
                                y: 0
                              };
                              setSectionPointsFront([...sectionPointsFront, newPoint]);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            점 추가
                          </button>
                        </div>
                      <div className="border border-gray-300 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">X (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Y (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-20">작업</th>
                            </tr>
                          </thead>
                          <tbody
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text');
                              const lines = pastedData.split('\n').filter(line => line.trim());
                              const updatedPoints = [...sectionPointsFront];
                              const newPoints: Array<{ id: string; x: number; y: number }> = [];

                              lines.forEach((line, lineIndex) => {
                                const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                                if (cells.length >= 2) {
                                  const x = parseFloat(cells[0]);
                                  const y = parseFloat(cells[1]);

                                  if (!isNaN(x) && !isNaN(y)) {
                                    const targetIndex = lineIndex;
                                    if (targetIndex < updatedPoints.length) {
                                      updatedPoints[targetIndex] = {
                                        ...updatedPoints[targetIndex],
                                        x: x,
                                        y: y
                                      };
                                    } else {
                                      newPoints.push({
                                        id: `point-front-${Date.now()}-${lineIndex}`,
                                        x: x,
                                        y: y
                                      });
                                    }
                                  }
                                }
                              });

                              if (newPoints.length > 0) {
                                setSectionPointsFront([...updatedPoints, ...newPoints]);
                              } else if (updatedPoints.some((p, i) =>
                                i < sectionPointsFront.length &&
                                (p.x !== sectionPointsFront[i].x || p.y !== sectionPointsFront[i].y)
                              )) {
                                setSectionPointsFront(updatedPoints);
                              }
                            }}
                          >
                            {sectionPointsFront.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                  점이 없습니다. 점을 추가하거나 엑셀에서 데이터를 붙여넣으세요.
                                </td>
                              </tr>
                            ) : (
                              sectionPointsFront.map((point, index) => (
                                <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                  <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={point.x}
                                      onChange={(e) => {
                                        const updated = sectionPointsFront.map(p =>
                                          p.id === point.id ? { ...p, x: Number(e.target.value) } : p
                                        );
                                        setSectionPointsFront(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={point.y}
                                      onChange={(e) => {
                                        const updated = sectionPointsFront.map(p =>
                                          p.id === point.id ? { ...p, y: Number(e.target.value) } : p
                                        );
                                        setSectionPointsFront(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => {
                                        setSectionPointsFront(sectionPointsFront.filter(p => p.id !== point.id));
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                                    >
                                      삭제
                                    </button>
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
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => {
                              const newPoint = {
                                id: `point-back-${Date.now()}-${sectionPointsBack.length}`,
                                x: 0,
                                y: 0
                              };
                              setSectionPointsBack([...sectionPointsBack, newPoint]);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            점 추가
                          </button>
                        </div>
                      <div className="border border-gray-300 rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">X (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Y (mm)</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-20">작업</th>
                            </tr>
                          </thead>
                          <tbody
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData.getData('text');
                              const lines = pastedData.split('\n').filter(line => line.trim());
                              const updatedPoints = [...sectionPointsBack];
                              const newPoints: Array<{ id: string; x: number; y: number }> = [];

                              lines.forEach((line, lineIndex) => {
                                const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                                if (cells.length >= 2) {
                                  const x = parseFloat(cells[0]);
                                  const y = parseFloat(cells[1]);

                                  if (!isNaN(x) && !isNaN(y)) {
                                    const targetIndex = lineIndex;
                                    if (targetIndex < updatedPoints.length) {
                                      updatedPoints[targetIndex] = {
                                        ...updatedPoints[targetIndex],
                                        x: x,
                                        y: y
                                      };
                                    } else {
                                      newPoints.push({
                                        id: `point-back-${Date.now()}-${lineIndex}`,
                                        x: x,
                                        y: y
                                      });
                                    }
                                  }
                                }
                              });

                              if (newPoints.length > 0) {
                                setSectionPointsBack([...updatedPoints, ...newPoints]);
                              } else if (updatedPoints.some((p, i) =>
                                i < sectionPointsBack.length &&
                                (p.x !== sectionPointsBack[i].x || p.y !== sectionPointsBack[i].y)
                              )) {
                                setSectionPointsBack(updatedPoints);
                              }
                            }}
                          >
                            {sectionPointsBack.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                  점이 없습니다. 점을 추가하거나 엑셀에서 데이터를 붙여넣으세요.
                                </td>
                              </tr>
                            ) : (
                              sectionPointsBack.map((point, index) => (
                                <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                  <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={point.x}
                                      onChange={(e) => {
                                        const updated = sectionPointsBack.map(p =>
                                          p.id === point.id ? { ...p, x: Number(e.target.value) } : p
                                        );
                                        setSectionPointsBack(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={point.y}
                                      onChange={(e) => {
                                        const updated = sectionPointsBack.map(p =>
                                          p.id === point.id ? { ...p, y: Number(e.target.value) } : p
                                        );
                                        setSectionPointsBack(updated);
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      step="1"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => {
                                        setSectionPointsBack(sectionPointsBack.filter(p => p.id !== point.id));
                                      }}
                                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                                    >
                                      삭제
                                    </button>
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
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => {
                          const newPoint = {
                            id: `point-${Date.now()}-${sectionPoints.length}`,
                            x: 0,
                            y: 0
                          };
                          setSectionPoints([...sectionPoints, newPoint]);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        점 추가
                      </button>
                    </div>
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-12">#</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">X (mm)</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">Y (mm)</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-20">작업</th>
                          </tr>
                        </thead>
                        <tbody
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text');
                            const lines = pastedData.split('\n').filter(line => line.trim());
                            const updatedPoints = [...sectionPoints];
                            const newPoints: Array<{ id: string; x: number; y: number }> = [];

                            lines.forEach((line, lineIndex) => {
                              const cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                              if (cells.length >= 2) {
                                const x = parseFloat(cells[0]);
                                const y = parseFloat(cells[1]);

                                if (!isNaN(x) && !isNaN(y)) {
                                  const targetIndex = lineIndex;
                                  if (targetIndex < updatedPoints.length) {
                                    updatedPoints[targetIndex] = {
                                      ...updatedPoints[targetIndex],
                                      x: x,
                                      y: y
                                    };
                                  } else {
                                    newPoints.push({
                                      id: `point-${Date.now()}-${lineIndex}`,
                                      x: x,
                                      y: y
                                    });
                                  }
                                }
                              }
                            });

                            if (newPoints.length > 0) {
                              setSectionPoints([...updatedPoints, ...newPoints]);
                            } else if (updatedPoints.some((p, i) =>
                              i < sectionPoints.length &&
                              (p.x !== sectionPoints[i].x || p.y !== sectionPoints[i].y)
                            )) {
                              setSectionPoints(updatedPoints);
                            }
                          }}
                        >
                          {sectionPoints.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                점이 없습니다. 점을 추가하거나 엑셀에서 데이터를 붙여넣으세요.
                              </td>
                            </tr>
                          ) : (
                            sectionPoints.map((point, index) => (
                              <tr key={point.id} className="hover:bg-gray-50 border-b border-gray-200">
                                <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={point.x}
                                    onChange={(e) => {
                                      const updated = sectionPoints.map(p =>
                                        p.id === point.id ? { ...p, x: Number(e.target.value) } : p
                                      );
                                      setSectionPoints(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    step="1"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={point.y}
                                    onChange={(e) => {
                                      const updated = sectionPoints.map(p =>
                                        p.id === point.id ? { ...p, y: Number(e.target.value) } : p
                                      );
                                      setSectionPoints(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    step="1"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => {
                                      setSectionPoints(sectionPoints.filter(p => p.id !== point.id));
                                    }}
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                                  >
                                    삭제
                                  </button>
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

