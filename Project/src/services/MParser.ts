import { MExecutionResult } from '../types';

export interface MParsedExpression {
  type: 'function' | 'variable' | 'literal' | 'operator';
  value: string;
  arguments?: MParsedExpression[];
  line: number;
  column: number;
}

export interface MParsedCode {
  expressions: MParsedExpression[];
  variables: Map<string, any>;
  functions: Map<string, Function>;
}

export class MParser {
  private static instance: MParser;
  private builtInFunctions: Map<string, Function>;

  private constructor() {
    this.initializeBuiltInFunctions();
  }

  public static getInstance(): MParser {
    if (!MParser.instance) {
      MParser.instance = new MParser();
    }
    return MParser.instance;
  }

  // 내장 함수 초기화
  private initializeBuiltInFunctions(): void {
    this.builtInFunctions = new Map();

    // Text 함수들
    this.builtInFunctions.set('Text.Upper', (text: any) => 
      typeof text === 'string' ? text.toUpperCase() : text
    );
    this.builtInFunctions.set('Text.Lower', (text: any) => 
      typeof text === 'string' ? text.toLowerCase() : text
    );
    this.builtInFunctions.set('Text.Trim', (text: any) => 
      typeof text === 'string' ? text.trim() : text
    );
    this.builtInFunctions.set('Text.Length', (text: any) => 
      typeof text === 'string' ? text.length : 0
    );
    this.builtInFunctions.set('Text.Start', (text: any, count: number) => 
      typeof text === 'string' ? text.substring(0, count) : text
    );
    this.builtInFunctions.set('Text.End', (text: any, count: number) => 
      typeof text === 'string' ? text.substring(text.length - count) : text
    );

    // Number 함수들
    this.builtInFunctions.set('Number.Round', (number: any, precision: number = 0) => 
      typeof number === 'number' ? Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision) : number
    );
    this.builtInFunctions.set('Number.Ceiling', (number: any) => 
      typeof number === 'number' ? Math.ceil(number) : number
    );
    this.builtInFunctions.set('Number.Floor', (number: any) => 
      typeof number === 'number' ? Math.floor(number) : number
    );
    this.builtInFunctions.set('Number.Abs', (number: any) => 
      typeof number === 'number' ? Math.abs(number) : number
    );

    // Date 함수들
    this.builtInFunctions.set('Date.AddDays', (date: any, days: number) => {
      if (date instanceof Date) {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + days);
        return newDate;
      }
      return date;
    });
    this.builtInFunctions.set('Date.AddMonths', (date: any, months: number) => {
      if (date instanceof Date) {
        const newDate = new Date(date);
        newDate.setMonth(date.getMonth() + months);
        return newDate;
      }
      return date;
    });
    this.builtInFunctions.set('Date.AddYears', (date: any, years: number) => {
      if (date instanceof Date) {
        const newDate = new Date(date);
        newDate.setFullYear(date.getFullYear() + years);
        return newDate;
      }
      return date;
    });

    // Table 함수들
    this.builtInFunctions.set('Table.TransformColumns', (table: any[], transformations: any[]) => {
      if (!Array.isArray(table)) return table;
      
      return table.map(row => {
        const newRow = { ...row };
        transformations.forEach(transformation => {
          const { name, transform } = transformation;
          if (name && transform && newRow[name] !== undefined) {
            newRow[name] = transform(newRow[name]);
          }
        });
        return newRow;
      });
    });

    this.builtInFunctions.set('Table.SelectColumns', (table: any[], columns: string[]) => {
      if (!Array.isArray(table)) return table;
      
      return table.map(row => {
        const newRow: any = {};
        columns.forEach(col => {
          if (row[col] !== undefined) {
            newRow[col] = row[col];
          }
        });
        return newRow;
      });
    });

    this.builtInFunctions.set('Table.AddColumn', (table: any[], columnName: string, generator: Function) => {
      if (!Array.isArray(table)) return table;
      
      return table.map(row => ({
        ...row,
        [columnName]: generator(row)
      }));
    });

    // Logical 함수들
    this.builtInFunctions.set('Logical.And', (...args: boolean[]) => 
      args.every(arg => Boolean(arg))
    );
    this.builtInFunctions.set('Logical.Or', (...args: boolean[]) => 
      args.some(arg => Boolean(arg))
    );
    this.builtInFunctions.set('Logical.Not', (value: boolean) => !value);

    // Type 함수들
    this.builtInFunctions.set('Type.Is', (value: any, type: string) => {
      switch (type) {
        case 'text': return typeof value === 'string';
        case 'number': return typeof value === 'number';
        case 'date': return value instanceof Date;
        case 'boolean': return typeof value === 'boolean';
        case 'list': return Array.isArray(value);
        default: return false;
      }
    });
  }

  // M 언어 코드 파싱
  public parse(code: string): MParsedCode {
    const expressions: MParsedExpression[] = [];
    const variables = new Map<string, any>();
    const functions = new Map<string, Function>();

    const lines = code.split('\n');
    
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum].trim();
      if (!line || line.startsWith('//')) continue;

      // 변수 할당 파싱 (예: let Source = ...)
      if (line.startsWith('let ')) {
        const varMatch = line.match(/^let\s+(\w+)\s*=\s*(.+)$/);
        if (varMatch) {
          const varName = varMatch[1];
          const varValue = varMatch[2];
          
          // 변수값이 테이블 데이터인 경우
          if (varValue.includes('Table.TransformColumns') || varValue.includes('Table.SelectColumns')) {
            variables.set(varName, { type: 'table', expression: varValue });
          } else {
            variables.set(varName, { type: 'value', expression: varValue });
          }
        }
        continue;
      }

      // 함수 호출 파싱
      const functionCalls = this.parseFunctionCalls(line, lineNum);
      expressions.push(...functionCalls);
    }

    return { expressions, variables, functions };
  }

  // 함수 호출 파싱
  private parseFunctionCalls(line: string, lineNum: number): MParsedExpression[] {
    const expressions: MParsedExpression[] = [];
    
    // 함수 호출 패턴 매칭 (예: Table.TransformColumns(Source, {...}))
    const functionPattern = /(\w+\.\w+)\s*\(/g;
    let match;
    
    while ((match = functionPattern.exec(line)) !== null) {
      const functionName = match[1];
      const startColumn = match.index;
      
      // 괄호 쌍 찾기
      const bracketMatch = this.findMatchingBrackets(line, startColumn + functionName.length);
      if (bracketMatch) {
        const argumentsStr = line.substring(startColumn + functionName.length + 1, bracketMatch);
        const args = this.parseArguments(argumentsStr);
        
        expressions.push({
          type: 'function',
          value: functionName,
          arguments: args,
          line: lineNum,
          column: startColumn
        });
      }
    }

    return expressions;
  }

  // 괄호 쌍 찾기
  private findMatchingBrackets(line: string, startIndex: number): number | null {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = startIndex; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' || char === "'") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
        }
      } else if (!inString) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            return i;
          }
        }
      }
    }
    
    return null;
  }

  // 함수 인수 파싱
  private parseArguments(argsStr: string): MParsedExpression[] {
    const args: MParsedExpression[] = [];
    let currentArg = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if (char === '"' || char === "'") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (stringChar === char) {
          inString = false;
        }
        currentArg += char;
      } else if (!inString) {
        if (char === '(' || char === '{' || char === '[') {
          depth++;
          currentArg += char;
        } else if (char === ')' || char === '}' || char === ']') {
          depth--;
          currentArg += char;
        } else if (char === ',' && depth === 0) {
          if (currentArg.trim()) {
            args.push({
              type: 'literal',
              value: currentArg.trim(),
              line: 0,
              column: 0
            });
          }
          currentArg = '';
        } else {
          currentArg += char;
        }
      } else {
        currentArg += char;
      }
    }
    
    if (currentArg.trim()) {
      args.push({
        type: 'literal',
        value: currentArg.trim(),
        line: 0,
        column: 0
      });
    }
    
    return args;
  }

  // M 언어 코드 실행
  public async execute(code: string, data: any[]): Promise<MExecutionResult> {
    const startTime = Date.now();
    
    try {
      const parsed = this.parse(code);
      const result = await this.executeParsedCode(parsed, data);
      
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        executionTime,
        recordsProcessed: data.length,
        recordsTransformed: result.length
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'M 언어 실행 중 오류가 발생했습니다.',
        executionTime,
        recordsProcessed: data.length,
        recordsTransformed: 0
      };
    }
  }

  // 파싱된 코드 실행
  private async executeParsedCode(parsed: MParsedCode, data: any[]): Promise<any[]> {
    let result = [...data];
    
    // 변수 처리
    for (const [varName, varInfo] of parsed.variables) {
      if (varInfo.type === 'table') {
        // 테이블 변환 표현식 실행
        result = await this.executeTableExpression(varInfo.expression, result);
      }
    }
    
    // 함수 호출 실행
    for (const expression of parsed.expressions) {
      if (expression.type === 'function') {
        result = await this.executeFunction(expression, result);
      }
    }
    
    return result;
  }

  // 테이블 변환 표현식 실행
  private async executeTableExpression(expression: string, data: any[]): Promise<any[]> {
    // Table.TransformColumns(Source, {...}) 형태의 표현식 처리
    if (expression.includes('Table.TransformColumns')) {
      const match = expression.match(/Table\.TransformColumns\s*\(\s*(\w+)\s*,\s*(\{.*\})\s*\)/);
      if (match) {
        const transformations = this.parseTransformations(match[2]);
        return this.executeTransformColumns(data, transformations);
      }
    }
    
    // Table.SelectColumns(Source, {...}) 형태의 표현식 처리
    if (expression.includes('Table.SelectColumns')) {
      const match = expression.match(/Table\.SelectColumns\s*\(\s*(\w+)\s*,\s*(\{.*\})\s*\)/);
      if (match) {
        const columns = this.parseColumnList(match[2]);
        return this.executeSelectColumns(data, columns);
      }
    }
    
    return data;
  }

  // 변환 규칙 파싱
  private parseTransformations(transformStr: string): any[] {
    const transformations: any[] = [];
    
    // {"Column1", each Text.Upper(_), type text} 형태 파싱
    const transformPattern = /\{\s*"([^"]+)"\s*,\s*([^,]+)(?:\s*,\s*([^}]+))?\s*\}/g;
    let match;
    
    while ((match = transformPattern.exec(transformStr)) !== null) {
      const columnName = match[1];
      const transformExpr = match[2].trim();
      const typeInfo = match[3] ? match[3].trim() : '';
      
      let transformFunction: Function;
      
      if (transformExpr.includes('Text.Upper')) {
        transformFunction = (value: any) => this.builtInFunctions.get('Text.Upper')!(value);
      } else if (transformExpr.includes('Text.Lower')) {
        transformFunction = (value: any) => this.builtInFunctions.get('Text.Lower')!(value);
      } else if (transformExpr.includes('Number.Round')) {
        transformFunction = (value: any) => this.builtInFunctions.get('Number.Round')!(value);
      } else {
        // 기본 변환 함수 (변경 없음)
        transformFunction = (value: any) => value;
      }
      
      transformations.push({
        name: columnName,
        transform: transformFunction,
        type: typeInfo
      });
    }
    
    return transformations;
  }

  // 컬럼 목록 파싱
  private parseColumnList(columnsStr: string): string[] {
    const columns: string[] = [];
    
    // "Column1", "Column2" 형태 파싱
    const columnPattern = /"([^"]+)"/g;
    let match;
    
    while ((match = columnPattern.exec(columnsStr)) !== null) {
      columns.push(match[1]);
    }
    
    return columns;
  }

  // TransformColumns 실행
  private executeTransformColumns(data: any[], transformations: any[]): any[] {
    return data.map(row => {
      const newRow = { ...row };
      transformations.forEach(transformation => {
        const { name, transform } = transformation;
        if (name && transform && newRow[name] !== undefined) {
          newRow[name] = transform(newRow[name]);
        }
      });
      return newRow;
    });
  }

  // SelectColumns 실행
  private executeSelectColumns(data: any[], columns: string[]): any[] {
    return data.map(row => {
      const newRow: any = {};
      columns.forEach(col => {
        if (row[col] !== undefined) {
          newRow[col] = row[col];
        }
      });
      return newRow;
    });
  }

  // 함수 실행
  private async executeFunction(expression: MParsedExpression, data: any[]): Promise<any[]> {
    const functionName = expression.value;
    const func = this.builtInFunctions.get(functionName);
    
    if (func) {
      if (functionName.startsWith('Table.')) {
        // 테이블 함수는 이미 executeTableExpression에서 처리됨
        return data;
      } else {
        // 단일 값 함수는 각 행에 적용
        return data.map(row => {
          const args = expression.arguments?.map(arg => {
            if (arg.value.startsWith('"') && arg.value.endsWith('"')) {
              // 문자열 리터럴인 경우 따옴표 제거
              return arg.value.slice(1, -1);
            }
            return arg.value;
          }) || [];
          
          try {
            return func(row, ...args);
          } catch {
            return row;
          }
        });
      }
    }
    
    return data;
  }

  // 코드 유효성 검사
  public validate(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!code.trim()) {
      errors.push('M 언어 코드가 비어있습니다.');
      return { isValid: false, errors };
    }
    
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) continue;
      
      // 기본적인 구문 검사
      if (line.includes('(') && !line.includes(')')) {
        errors.push(`줄 ${i + 1}: 괄호가 닫히지 않았습니다.`);
      }
      
      if (line.includes('{') && !line.includes('}')) {
        errors.push(`줄 ${i + 1}: 중괄호가 닫히지 않았습니다.`);
      }
      
      if (line.includes('"') && (line.match(/"/g) || []).length % 2 !== 0) {
        errors.push(`줄 ${i + 1}: 따옴표가 올바르게 닫히지 않았습니다.`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
