import React, { useState, useRef, useEffect } from 'react';
import TVFrame from '../Shared/TVFrame';

export interface LetterRow {
  text: string;
  scale?: number;
  icon?: string;
  label?: string;
  translation?: string;
  desiredRepeats?: number;
  minRepeats?: number;
}

export interface LetterTraceConfig {
  title: string;
  subtitle: string;
  rows: LetterRow[];
}

export interface LetterTraceResult {
  score: number;
  status: 'completed';
  completed: number;
  total: number;
}

interface Props {
  config: LetterTraceConfig;
  onComplete?: (result: LetterTraceResult) => void;
}

interface Point {
  x: number;
  y: number;
}

interface LetterPath {
  id: string;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  path: string; // SVG path data for the letter
  segments: string[]; // Individual segments for complex letters
  userPath: Point[][]; // Array of strokes (each stroke is an array of points)
  completed: boolean;
  accuracy: number;
}

// Split letter paths into segments for more accurate validation
const LETTER_SEGMENTS: Record<string, string[]> = {
  'A': [
    'M 20 60 L 40 10',  // Left diagonal
    'M 40 10 L 60 60',  // Right diagonal
    'M 30 40 L 50 40'   // Crossbar
  ],
  'B': [
    'M 20 10 L 20 60',  // Vertical line
    'M 20 10 L 45 10 Q 55 15 55 25 Q 55 35 45 35 L 20 35',  // Top bump
    'M 20 35 L 47 35 Q 60 40 60 50 Q 60 60 47 60 L 20 60'   // Bottom bump
  ],
  'C': [
    'M 55 20 Q 50 10 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 50 60 55 50'
  ],
  'D': [
    'M 20 10 L 20 60',  // Vertical line
    'M 20 10 L 40 10 Q 60 15 60 35 Q 60 55 40 60 L 20 60'  // Curved part
  ],
  'E': [
    'M 20 10 L 20 60',  // Vertical line
    'M 55 10 L 20 10',  // Top horizontal
    'M 20 35 L 45 35',  // Middle horizontal
    'M 20 60 L 55 60'   // Bottom horizontal
  ],
  'F': [
    'M 20 10 L 20 60',  // Vertical line
    'M 55 10 L 20 10',  // Top horizontal
    'M 20 35 L 45 35'   // Middle horizontal
  ],
  'G': [
    'M 55 20 Q 50 10 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 55 60 55 45',
    'M 55 45 L 55 40 L 40 40'
  ],
  'H': [
    'M 20 10 L 20 60',  // Left vertical
    'M 55 10 L 55 60',  // Right vertical
    'M 20 35 L 55 35'   // Crossbar
  ],
  'I': [
    'M 30 10 L 50 10',  // Top horizontal
    'M 40 10 L 40 60',  // Vertical
    'M 30 60 L 50 60'   // Bottom horizontal
  ],
  'J': [
    'M 35 10 L 55 10',  // Top horizontal
    'M 45 10 L 45 50 Q 45 60 35 60 Q 25 60 25 50'  // Vertical and hook
  ],
  'K': [
    'M 20 10 L 20 60',  // Vertical line
    'M 55 10 L 20 40',  // Upper diagonal
    'M 20 40 L 55 60'   // Lower diagonal
  ],
  'L': [
    'M 20 10 L 20 60',  // Vertical
    'M 20 60 L 55 60'   // Horizontal
  ],
  'M': [
    'M 20 60 L 20 10',  // Left vertical
    'M 20 10 L 40 30',  // Left diagonal
    'M 40 30 L 60 10',  // Right diagonal
    'M 60 10 L 60 60'   // Right vertical
  ],
  'N': [
    'M 20 60 L 20 10',  // Left vertical
    'M 20 10 L 55 60',  // Diagonal
    'M 55 60 L 55 10'   // Right vertical
  ],
  'O': [
    'M 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 60 60 60 40 L 60 30 Q 60 10 40 10 Z'
  ],
  'P': [
    'M 20 60 L 20 10',  // Vertical line
    'M 20 10 L 45 10 Q 60 15 60 25 Q 60 35 45 35 L 20 35'  // Top bump
  ],
  'Q': [
    'M 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 60 60 60 40 L 60 30 Q 60 10 40 10 Z',  // Circle
    'M 45 50 L 60 65'  // Tail
  ],
  'R': [
    'M 20 60 L 20 10',  // Vertical line
    'M 20 10 L 45 10 Q 60 15 60 25 Q 60 35 45 35 L 20 35',  // Top bump
    'M 35 35 L 55 60'  // Diagonal leg
  ],
  'S': [
    'M 55 20 Q 55 10 40 10 Q 25 10 25 20 Q 25 30 40 35 Q 55 40 55 50 Q 55 60 40 60 Q 25 60 25 50'
  ],
  'T': [
    'M 20 10 L 60 10',  // Top horizontal
    'M 40 10 L 40 60'   // Vertical
  ],
  'U': [
    'M 20 10 L 20 45 Q 20 60 35 60 Q 50 60 50 45 L 50 10'
  ],
  'V': [
    'M 20 10 L 40 60',  // Left diagonal
    'M 40 60 L 60 10'   // Right diagonal
  ],
  'W': [
    'M 15 10 L 25 60',  // First diagonal down
    'M 25 60 L 40 30',  // Second diagonal up
    'M 40 30 L 55 60',  // Third diagonal down
    'M 55 60 L 65 10'   // Fourth diagonal up
  ],
  'X': [
    'M 20 10 L 60 60',  // Main diagonal
    'M 60 10 L 20 60'   // Cross diagonal
  ],
  'Y': [
    'M 20 10 L 40 35',  // Left diagonal
    'M 60 10 L 40 35',  // Right diagonal
    'M 40 35 L 40 60'   // Vertical
  ],
  'Z': [
    'M 20 10 L 60 10',  // Top horizontal
    'M 60 10 L 20 60',  // Diagonal
    'M 20 60 L 60 60'   // Bottom horizontal
  ],
  'a': [
    'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38',
    'M 55 18 L 55 62'
  ],
  'b': [
    'M 22 8 L 22 62',
    'M 22 35 Q 35 15 52 25 Q 66 34 60 50 Q 54 66 37 60 Q 27 56 22 45'
  ],
  'c': [
    'M 58 25 Q 45 13 30 20 Q 16 27 18 43 Q 20 60 36 62 Q 50 64 60 52'
  ],
  'd': [
    'M 58 8 L 58 62',
    'M 58 35 Q 45 15 28 25 Q 14 34 20 50 Q 26 66 43 60 Q 53 56 58 45'
  ],
  'e': [
    'M 18 40 L 60 40',
    'M 60 40 Q 56 18 38 18 Q 20 18 18 40 Q 18 62 38 62 Q 52 62 60 52'
  ],
  'f': [
    'M 48 12 Q 32 6 28 24 L 28 62',
    'M 16 34 L 46 34'
  ],
  'g': [
    'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38',
    'M 55 18 L 55 68 Q 55 80 42 80 Q 30 80 22 70'
  ],
  'h': [
    'M 22 8 L 22 62',
    'M 22 38 Q 32 18 48 24 Q 58 28 58 45 L 58 62'
  ],
  'i': [
    'M 38 28 L 38 62',
    'M 38 14 L 38 18'
  ],
  'j': [
    'M 42 28 L 42 68 Q 42 80 30 80 Q 22 80 18 72',
    'M 42 14 L 42 18'
  ],
  'k': [
    'M 22 8 L 22 62',
    'M 56 24 L 22 44',
    'M 34 37 L 58 62'
  ],
  'l': [
    'M 34 8 Q 26 32 30 52 Q 32 64 44 58'
  ],
  'm': [
    'M 16 28 L 16 62',
    'M 16 38 Q 24 22 36 28 Q 42 32 42 45 L 42 62',
    'M 42 38 Q 50 22 62 28 Q 68 32 68 45 L 68 62'
  ],
  'n': [
    'M 20 28 L 20 62',
    'M 20 38 Q 30 18 48 24 Q 58 28 58 45 L 58 62'
  ],
  'o': [
    'M 40 18 Q 20 18 18 40 Q 18 62 40 62 Q 62 62 62 40 Q 62 18 40 18 Z'
  ],
  'p': [
    'M 22 28 L 22 78',
    'M 22 35 Q 35 15 52 25 Q 66 34 60 50 Q 54 66 37 60 Q 27 56 22 45'
  ],
  'q': [
    'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38',
    'M 55 28 L 55 78'
  ],
  'r': [
    'M 22 28 L 22 62',
    'M 22 40 Q 34 20 54 28'
  ],
  's': [
    'M 56 26 Q 44 14 30 22 Q 18 30 32 38 Q 50 46 56 54 Q 50 66 30 60 Q 22 58 16 50'
  ],
  't': [
    'M 36 14 L 36 52 Q 36 64 50 58',
    'M 20 30 L 52 30'
  ],
  'u': [
    'M 20 28 L 20 48 Q 20 64 36 62 Q 50 60 58 45',
    'M 58 28 L 58 62'
  ],
  'v': [
    'M 18 28 L 38 62',
    'M 38 62 L 60 28'
  ],
  'w': [
    'M 12 28 L 24 62',
    'M 24 62 L 38 38',
    'M 38 38 L 52 62',
    'M 52 62 L 64 28'
  ],
  'x': [
    'M 18 28 L 58 62',
    'M 58 28 L 18 62'
  ],
  'y': [
    'M 18 28 L 38 62',
    'M 60 28 L 38 62 L 28 78 Q 20 88 12 76'
  ],
  'z': [
    'M 18 28 L 58 28',
    'M 58 28 L 18 62',
    'M 18 62 L 58 62'
  ]
};

// Handwriting-style letter paths (simplified versions for tracing)
const LETTER_PATHS: Record<string, string> = {
  'A': 'M 20 60 L 40 10 L 60 60 M 30 40 L 50 40',
  'B': 'M 20 10 L 20 60 M 20 10 L 45 10 Q 55 15 55 25 Q 55 35 45 35 L 20 35 M 20 35 L 47 35 Q 60 40 60 50 Q 60 60 47 60 L 20 60',
  'C': 'M 55 20 Q 50 10 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 50 60 55 50',
  'D': 'M 20 10 L 20 60 M 20 10 L 40 10 Q 60 15 60 35 Q 60 55 40 60 L 20 60',
  'E': 'M 55 10 L 20 10 L 20 60 L 55 60 M 20 35 L 45 35',
  'F': 'M 55 10 L 20 10 L 20 60 M 20 35 L 45 35',
  'G': 'M 55 20 Q 50 10 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 55 60 55 45 L 55 40 L 40 40',
  'H': 'M 20 10 L 20 60 M 55 10 L 55 60 M 20 35 L 55 35',
  'I': 'M 30 10 L 50 10 M 40 10 L 40 60 M 30 60 L 50 60',
  'J': 'M 35 10 L 55 10 M 45 10 L 45 50 Q 45 60 35 60 Q 25 60 25 50',
  'K': 'M 20 10 L 20 60 M 55 10 L 20 40 L 55 60',
  'L': 'M 20 10 L 20 60 L 55 60',
  'M': 'M 20 60 L 20 10 L 40 30 L 60 10 L 60 60',
  'N': 'M 20 60 L 20 10 L 55 60 L 55 10',
  'O': 'M 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 60 60 60 40 L 60 30 Q 60 10 40 10 Z',
  'P': 'M 20 60 L 20 10 L 45 10 Q 60 15 60 25 Q 60 35 45 35 L 20 35',
  'Q': 'M 40 10 Q 20 10 20 30 L 20 40 Q 20 60 40 60 Q 60 60 60 40 L 60 30 Q 60 10 40 10 Z M 45 50 L 60 65',
  'R': 'M 20 60 L 20 10 L 45 10 Q 60 15 60 25 Q 60 35 45 35 L 20 35 M 35 35 L 55 60',
  'S': 'M 55 20 Q 55 10 40 10 Q 25 10 25 20 Q 25 30 40 35 Q 55 40 55 50 Q 55 60 40 60 Q 25 60 25 50',
  'T': 'M 20 10 L 60 10 M 40 10 L 40 60',
  'U': 'M 20 10 L 20 45 Q 20 60 35 60 Q 50 60 50 45 L 50 10',
  'V': 'M 20 10 L 40 60 L 60 10',
  'W': 'M 15 10 L 25 60 L 40 30 L 55 60 L 65 10',
  'X': 'M 20 10 L 60 60 M 60 10 L 20 60',
  'Y': 'M 20 10 L 40 35 M 60 10 L 40 35 M 40 35 L 40 60',
  'Z': 'M 20 10 L 60 10 L 20 60 L 60 60',
  'a': 'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38 M 55 18 L 55 62',
  'b': 'M 22 8 L 22 62 M 22 35 Q 35 15 52 25 Q 66 34 60 50 Q 54 66 37 60 Q 27 56 22 45',
  'c': 'M 58 25 Q 45 13 30 20 Q 16 27 18 43 Q 20 60 36 62 Q 50 64 60 52',
  'd': 'M 58 8 L 58 62 M 58 35 Q 45 15 28 25 Q 14 34 20 50 Q 26 66 43 60 Q 53 56 58 45',
  'e': 'M 18 40 L 60 40 M 60 40 Q 56 18 38 18 Q 20 18 18 40 Q 18 62 38 62 Q 52 62 60 52',
  'f': 'M 48 12 Q 32 6 28 24 L 28 62 M 16 34 L 46 34',
  'g': 'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38 M 55 18 L 55 68 Q 55 80 42 80 Q 30 80 22 70',
  'h': 'M 22 8 L 22 62 M 22 38 Q 32 18 48 24 Q 58 28 58 45 L 58 62',
  'i': 'M 38 28 L 38 62 M 38 14 L 38 18',
  'j': 'M 42 28 L 42 68 Q 42 80 30 80 Q 22 80 18 72 M 42 14 L 42 18',
  'k': 'M 22 8 L 22 62 M 56 24 L 22 44 M 34 37 L 58 62',
  'l': 'M 34 8 Q 26 32 30 52 Q 32 64 44 58',
  'm': 'M 16 28 L 16 62 M 16 38 Q 24 22 36 28 Q 42 32 42 45 L 42 62 M 42 38 Q 50 22 62 28 Q 68 32 68 45 L 68 62',
  'n': 'M 20 28 L 20 62 M 20 38 Q 30 18 48 24 Q 58 28 58 45 L 58 62',
  'o': 'M 40 18 Q 20 18 18 40 Q 18 62 40 62 Q 62 62 62 40 Q 62 18 40 18 Z',
  'p': 'M 22 28 L 22 78 M 22 35 Q 35 15 52 25 Q 66 34 60 50 Q 54 66 37 60 Q 27 56 22 45',
  'q': 'M 55 35 Q 55 15 38 15 Q 20 15 20 38 Q 20 62 38 62 Q 55 62 55 38 M 55 28 L 55 78',
  'r': 'M 22 28 L 22 62 M 22 40 Q 34 20 54 28',
  's': 'M 56 26 Q 44 14 30 22 Q 18 30 32 38 Q 50 46 56 54 Q 50 66 30 60 Q 22 58 16 50',
  't': 'M 36 14 L 36 52 Q 36 64 50 58 M 20 30 L 52 30',
  'u': 'M 20 28 L 20 48 Q 20 64 36 62 Q 50 60 58 45 M 58 28 L 58 62',
  'v': 'M 18 28 L 38 62 M 38 62 L 60 28',
  'w': 'M 12 28 L 24 62 M 24 62 L 38 38 M 38 38 L 52 62 M 52 62 L 64 28',
  'x': 'M 18 28 L 58 62 M 58 28 L 18 62',
  'y': 'M 18 28 L 38 62 M 60 28 L 38 62 L 28 78 Q 20 88 12 76',
  'z': 'M 18 28 L 58 28 M 58 28 L 18 62 M 18 62 L 58 62'
};

const LetterTraceGame: React.FC<Props> = ({ config, onComplete }) => {
  const [letterPaths, setLetterPaths] = useState<LetterPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);

  // Fire onComplete once when all letters are traced
  useEffect(() => {
    if (!hasFinished && letterPaths.length > 0 && completedCount >= letterPaths.length) {
      setHasFinished(true);
      onComplete?.({
        score: completedCount * 10,
        status: 'completed',
        completed: completedCount,
        total: letterPaths.length,
      });
    }
  }, [completedCount, letterPaths.length, hasFinished, onComplete]);
  const [statusMessage, setStatusMessage] = useState('Обведи буквы по контуру');
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize letter paths
  useEffect(() => {
    const paths: LetterPath[] = [];
    let yPosition = 60;  // Reduced from 80

    config.rows.forEach((row, rowIndex) => {
      const fontSize = 100 * (row.scale || 1.0);  // Reduced from 120
      const letters = row.text.split('');
      let xPosition = 80;  // Reduced from 100

      letters.forEach((char, charIndex) => {
        if (char === ' ') {
          xPosition += fontSize * 0.4;  // Reduced from 0.5
          return;
        }

        if (LETTER_PATHS[char]) {
          paths.push({
            id: `${rowIndex}-${charIndex}`,
            char,
            x: xPosition,
            y: yPosition,
            fontSize,
            path: LETTER_PATHS[char],
            segments: LETTER_SEGMENTS[char] || [LETTER_PATHS[char]],
            userPath: [],
            completed: false,
            accuracy: 0,
          });
        }

        xPosition += fontSize * 0.8;  // Reduced from 0.9
      });

      yPosition += fontSize + 20;  // Reduced from 40
    });

    setLetterPaths(paths);
  }, [config]);

  // Get coordinates from mouse/touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!svgRef.current) return null;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();

    if ('touches' in e && e.touches.length > 0) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else if ('clientX' in e) {
      pt.x = e.clientX;
      pt.y = e.clientY;
    } else {
      return null;
    }

    const screenCTM = svg.getScreenCTM();
    if (!screenCTM) return null;

    const svgPt = pt.matrixTransform(screenCTM.inverse());
    return { x: svgPt.x, y: svgPt.y };
  };

  // Start drawing - FIXED: now preserves previous strokes
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, pathId: string) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentPathId(pathId);

    setLetterPaths(prev => prev.map(path => {
      if (path.id === pathId) {
        // Start a new stroke (don't connect to previous strokes)
        const newStroke = [coords];
        const newUserPath = path.completed ? [newStroke] : [...path.userPath, newStroke];
        return { ...path, userPath: newUserPath, completed: false };
      }
      return path;
    }));
  };

  // Continue drawing
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !currentPathId) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    setLetterPaths(prev => prev.map(path => {
      if (path.id === currentPathId && path.userPath.length > 0) {
        // Add point to the current stroke (last stroke in the array)
        const updatedStrokes = [...path.userPath];
        const currentStroke = updatedStrokes[updatedStrokes.length - 1];
        updatedStrokes[updatedStrokes.length - 1] = [...currentStroke, coords];
        return { ...path, userPath: updatedStrokes };
      }
      return path;
    }));
  };

  // Parse SVG path into points for validation
  const pathToPoints = (pathData: string): Point[] => {
    const points: Point[] = [];
    const commands = pathData.match(/[MLQCZmlqcz][^MLQCZmlqcz]*/g) || [];

    let currentX = 0;
    let currentY = 0;

    commands.forEach(cmd => {
      const type = cmd[0];
      const coords = cmd.substring(1).trim().split(/[\s,]+/).map(Number);

      switch (type.toUpperCase()) {
        case 'M':
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
          break;
        case 'L':
          for (let i = 0; i < coords.length; i += 2) {
            const x = coords[i];
            const y = coords[i + 1];
            // Add MORE interpolated points for better coverage
            const steps = 20;  // Increased from 10
            for (let j = 1; j <= steps; j++) {
              points.push({
                x: currentX + (x - currentX) * j / steps,
                y: currentY + (y - currentY) * j / steps
              });
            }
            currentX = x;
            currentY = y;
          }
          break;
        case 'Q':
          // Quadratic Bezier - approximate with more points
          const qx1 = coords[0], qy1 = coords[1];
          const qx2 = coords[2], qy2 = coords[3];
          for (let t = 0; t <= 1; t += 0.05) {  // More granular (was 0.1)
            const x = (1-t)*(1-t)*currentX + 2*(1-t)*t*qx1 + t*t*qx2;
            const y = (1-t)*(1-t)*currentY + 2*(1-t)*t*qy1 + t*t*qy2;
            points.push({ x, y });
          }
          currentX = qx2;
          currentY = qy2;
          break;
        case 'Z':
          // Close path - add line back to start if needed
          if (points.length > 0) {
            const startPoint = points[0];
            const steps = 20;
            for (let j = 1; j <= steps; j++) {
              points.push({
                x: currentX + (startPoint.x - currentX) * j / steps,
                y: currentY + (startPoint.y - currentY) * j / steps
              });
            }
          }
          break;
      }
    });

    return points;
  };

  // Check path accuracy with STRICTER validation
  const checkPathAccuracy = (letterPath: LetterPath): { completed: boolean; accuracy: number } => {
    // Count total points across all strokes
    const totalPoints = letterPath.userPath.reduce((total, stroke) => total + stroke.length, 0);
    if (totalPoints < 30) return { completed: false, accuracy: 0 };  // Minimum points needed

    const segmentCoverage: number[] = [];
    const segmentDetails: { segment: string, coverage: number }[] = [];

    // Check each segment separately with STRICTER requirements
    letterPath.segments.forEach((segment, segIdx) => {
      const expectedPoints = pathToPoints(segment);
      if (expectedPoints.length === 0) {
        segmentCoverage.push(0);
        return;
      }

      const coveredPoints = new Set<number>();
      let totalDistance = 0;
      let coveredDistance = 0;

      // Transform user points to letter's local coordinates and check coverage
      // Iterate through all strokes
      letterPath.userPath.forEach(stroke => {
        stroke.forEach(userPoint => {
          const localX = (userPoint.x - letterPath.x) / (letterPath.fontSize / 80);
          const localY = (userPoint.y - letterPath.y) / (letterPath.fontSize / 80);
          const localPoint = { x: localX, y: localY };

          // Check which expected points are covered by this user point
          expectedPoints.forEach((expectedPoint, idx) => {
            const distance = Math.sqrt(
              Math.pow(localPoint.x - expectedPoint.x, 2) +
              Math.pow(localPoint.y - expectedPoint.y, 2)
            );

            if (distance < 8) {  // More forgiving tolerance for children
              coveredPoints.add(idx);
            }
          });
        });
      });

      // Calculate coverage for this segment
      const coverage = (coveredPoints.size / expectedPoints.length) * 100;
      segmentCoverage.push(coverage);
      segmentDetails.push({ segment: `Segment ${segIdx + 1}`, coverage });
    });

    // MUCH STRICTER requirements
    const minSegmentCoverage = Math.min(...segmentCoverage);
    const avgSegmentCoverage = segmentCoverage.reduce((a, b) => a + b, 0) / segmentCoverage.length;

    // Debug info for tuning
    console.log(`Letter ${letterPath.char} - Min: ${minSegmentCoverage.toFixed(1)}%, Avg: ${avgSegmentCoverage.toFixed(1)}%`);
    segmentDetails.forEach(d => console.log(`  ${d.segment}: ${d.coverage.toFixed(1)}%`));

    let completed = false;
    if (letterPath.segments.length > 1) {
      // Every segment must be genuinely traced. The old min>50 let adjacent
      // segments incidentally cover each other near junctions (e.g. the two
      // diagonals of "A" overlapped ~66% of the crossbar, so "A" counted without
      // the crossbar). Requiring min>70 forces each stroke to actually be drawn.
      completed = minSegmentCoverage > 70 && avgSegmentCoverage > 75;
    } else {
      // For simple letters, good overall coverage is enough
      completed = avgSegmentCoverage > 75;  // Child-friendly: 75% is plenty for kids
    }

    return { completed, accuracy: avgSegmentCoverage };
  };

  // Stop drawing
  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !currentPathId) return;

    setLetterPaths(prev => prev.map(path => {
      // Count total points across all strokes
      const totalPoints = path.userPath.reduce((total, stroke) => total + stroke.length, 0);
      if (path.id === currentPathId && totalPoints > 20) {
        const { completed, accuracy } = checkPathAccuracy(path);

        if (completed && !path.completed) {
          setCompletedCount(c => c + 1);
          setStatusMessage('Отлично! Продолжай писать!');
        } else if (!completed && path.userPath.reduce((total, stroke) => total + stroke.length, 0) > 40) {
          if (accuracy < 40) {
            setStatusMessage('Попробуй обвести букву точнее по контуру');
          } else if (accuracy < 60) {
            setStatusMessage('Неплохо, но нужно пройти по всей букве');
          } else if (accuracy < 80) {
            setStatusMessage('Почти получилось! Обведи все части буквы точнее');
          } else {
            setStatusMessage('Очень близко! Пройди по всем линиям буквы');
          }
        }

        return { ...path, completed, accuracy };
      }
      return path;
    }));

    setIsDrawing(false);
    setCurrentPathId(null);
  };

  // Convert points to SVG path
  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }

    if (points.length > 1) {
      d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    }

    return d;
  };

  return (
    <TVFrame>
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        {/* Compact Header */}
        <div className="bg-white/95 backdrop-blur px-6 py-2 shadow-md border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs text-gray-600">{config.subtitle}</p>
            <div className="flex items-center gap-2">
              <div className="text-lg">✍️</div>
              <div className="text-xs font-semibold text-blue-600">
                {completedCount} / {letterPaths.length}
              </div>
            </div>
            <div className="text-xs text-gray-600 italic">{statusMessage}</div>
          </div>
        </div>

        {/* Drawing area - fixed viewport */}
        <div className="flex-1 p-2 overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            {/* Render letter paths */}
            {letterPaths.map(letterPath => (
              <g key={letterPath.id}>
                {/* Letter outline - guideline (thicker and more visible) */}
                <g transform={`translate(${letterPath.x}, ${letterPath.y}) scale(${letterPath.fontSize / 80})`}>
                  <path
                    d={letterPath.path}
                    fill="none"
                    stroke={letterPath.completed ? '#10b981' : '#94a3b8'}
                    strokeWidth={letterPath.completed ? "2" : "2.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={letterPath.completed ? "0" : "5 3"}
                    opacity={letterPath.completed ? 0.3 : 0.8}
                  />
                </g>

                {/* User's drawn strokes - render each stroke separately */}
                {letterPath.userPath.map((stroke, strokeIdx) => (
                  stroke.length > 0 && (
                    <path
                      key={`${letterPath.id}-stroke-${strokeIdx}`}
                      d={pointsToPath(stroke)}
                      fill="none"
                      stroke={letterPath.completed ? '#10b981' : '#3b82f6'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
                  )
                ))}

                {/* Invisible hit area for interaction */}
                <g
                  transform={`translate(${letterPath.x}, ${letterPath.y}) scale(${letterPath.fontSize / 80})`}
                  onMouseDown={(e) => handlePointerDown(e, letterPath.id)}
                  onTouchStart={(e) => handlePointerDown(e, letterPath.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={letterPath.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="25"
                  />
                </g>

                {/* Completion indicator */}
                {letterPath.completed && (
                  <g transform={`translate(${letterPath.x + letterPath.fontSize * 0.65}, ${letterPath.y - letterPath.fontSize * 0.25})`}>
                    <circle r="10" fill="#10b981" />
                    <path
                      d="M -5 0 L -2 3 L 5 -3"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </TVFrame>
  );
};

export default LetterTraceGame;
