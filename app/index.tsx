import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CalcButton, type ButtonVariant } from '@/components/CalcButton';

type Operator = '+' | '−' | '×' | '÷';

interface KeyDef {
  label: string;
  variant: ButtonVariant;
  action: string;
  wide?: boolean;
}

const KEYPAD: KeyDef[][] = [
  [
    { label: 'AC', variant: 'function', action: 'clear' },
    { label: '±', variant: 'function', action: 'negate' },
    { label: '%', variant: 'function', action: 'percent' },
    { label: '÷', variant: 'operator', action: 'op:÷' },
  ],
  [
    { label: '7', variant: 'number', action: 'digit:7' },
    { label: '8', variant: 'number', action: 'digit:8' },
    { label: '9', variant: 'number', action: 'digit:9' },
    { label: '×', variant: 'operator', action: 'op:×' },
  ],
  [
    { label: '4', variant: 'number', action: 'digit:4' },
    { label: '5', variant: 'number', action: 'digit:5' },
    { label: '6', variant: 'number', action: 'digit:6' },
    { label: '−', variant: 'operator', action: 'op:−' },
  ],
  [
    { label: '1', variant: 'number', action: 'digit:1' },
    { label: '2', variant: 'number', action: 'digit:2' },
    { label: '3', variant: 'number', action: 'digit:3' },
    { label: '+', variant: 'operator', action: 'op:+' },
  ],
  [
    { label: '0', variant: 'number', action: 'digit:0', wide: true },
    { label: '.', variant: 'number', action: 'dot' },
    { label: '=', variant: 'equals', action: 'equals' },
  ],
];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const buttonSize = useMemo(() => {
    const gap = 18;
    const sidePadding = 26;
    const available = width - sidePadding * 2 - gap * 3;
    return Math.min(available / 4, 78);
  }, [width]);

  const inputDigit = useCallback(
    (d: string) => {
      setDisplay((cur) => {
        if (overwrite || justEvaluated || cur === '0') {
          return d;
        }
        if (cur.replace(/[-.]/g, '').length >= 12) return cur;
        return cur + d;
      });
      setOverwrite(false);
      setJustEvaluated(false);
    },
    [overwrite, justEvaluated],
  );

  const inputDot = useCallback(() => {
    setDisplay((cur) => {
      if (overwrite || justEvaluated) return '0.';
      if (cur.includes('.')) return cur;
      return cur + '.';
    });
    setOverwrite(false);
    setJustEvaluated(false);
  }, [overwrite, justEvaluated]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
    setJustEvaluated(false);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay((cur) => {
      if (cur === '0') return cur;
      if (cur.startsWith('-')) return cur.slice(1);
      return '-' + cur;
    });
  }, []);

  const percent = useCallback(() => {
    setDisplay((cur) => {
      const n = parseFloat(cur);
      if (Number.isNaN(n)) return cur;
      const result = n / 100;
      return formatResult(result);
    });
  }, []);

  const applyOp = useCallback(
    (nextOp: Operator) => {
      const current = parseFloat(display);
      if (Number.isNaN(current)) return;

      if (previous !== null && operator && !overwrite) {
        const result = compute(previous, current, operator);
        setPrevious(result);
        setDisplay(formatResult(result));
      } else {
        setPrevious(current);
      }

      setOperator(nextOp);
      setOverwrite(true);
      setJustEvaluated(false);
    },
    [display, previous, operator, overwrite],
  );

  const evaluate = useCallback(() => {
    if (previous === null || operator === null) return;
    const current = parseFloat(display);
    if (Number.isNaN(current)) return;
    const result = compute(previous, current, operator);
    setDisplay(formatResult(result));
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
    setJustEvaluated(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [previous, operator, display]);

  const handleAction = useCallback(
    (action: string) => {
      if (action.startsWith('digit:')) {
        inputDigit(action.slice(6));
      } else if (action === 'dot') {
        inputDot();
      } else if (action === 'clear') {
        clearAll();
      } else if (action === 'negate') {
        toggleSign();
      } else if (action === 'percent') {
        percent();
      } else if (action.startsWith('op:')) {
        applyOp(action.slice(3) as Operator);
      } else if (action === 'equals') {
        evaluate();
      }
    },
    [inputDigit, inputDot, clearAll, toggleSign, percent, applyOp, evaluate],
  );

  const displayFontSize = useMemo(() => {
    const len = display.replace('-', '').length;
    if (len > 9) return width * 0.12;
    if (len > 7) return width * 0.15;
    return width * 0.2;
  }, [display, width]);

  const gap = 18;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#05050A', '#000000', '#04030C']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.ambient, { top: -width * 0.35, left: -width * 0.2 }]}>
        <View style={[styles.ambientOrb, styles.orbBlue]} />
      </View>
      <View
        style={[styles.ambient, { bottom: -width * 0.3, right: -width * 0.25 }]}
      >
        <View style={[styles.ambientOrb, styles.orbPurple]} />
      </View>

      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View style={styles.displayArea}>
          <Text style={styles.brand}>CALCULATOR</Text>
          <View style={styles.displayWrap}>
            <Text
              style={[styles.display, { fontSize: displayFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {display}
            </Text>
          </View>
        </View>

        <View style={[styles.keypad, { gap }]}>
          {KEYPAD.map((row, rowIdx) => (
            <View key={rowIdx} style={[styles.row, { gap }]}>
              {row.map((key) => (
                <CalcButton
                  key={key.action}
                  label={key.label}
                  variant={key.variant}
                  onPress={() => handleAction(key.action)}
                  onLongPress={key.action === 'clear' ? clearAll : undefined}
                  size={buttonSize}
                  wide={key.wide}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function compute(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  if (Number.isNaN(n)) return 'Error';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
    return n.toExponential(4);
  }
  const rounded = parseFloat(n.toPrecision(12));
  let str = String(rounded);
  if (str.length > 12 && str.includes('.')) {
    str = String(parseFloat(n.toPrecision(10)));
  }
  return str;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
  },
  ambient: {
    position: 'absolute',
    width: 320,
    height: 320,
  },
  ambientOrb: {
    width: '100%',
    height: '100%',
    borderRadius: 320,
    opacity: 0.4,
  },
  orbBlue: {
    backgroundColor: '#1E2BFF',
    shadowColor: '#3B5BFF',
    shadowOpacity: 0.5,
    shadowRadius: 120,
    shadowOffset: { width: 0, height: 0 },
  },
  orbPurple: {
    backgroundColor: '#7A3BFF',
    shadowColor: '#8E5BFF',
    shadowOpacity: 0.45,
    shadowRadius: 120,
    shadowOffset: { width: 0, height: 0 },
  },
  displayArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  brand: {
    color: 'rgba(150,150,180,0.5)',
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    letterSpacing: 6,
    marginBottom: 18,
    marginLeft: 6,
  },
  displayWrap: {
    minHeight: 120,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  display: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Light',
    fontWeight: '300',
    textAlign: 'right',
    includeFontPadding: false,
  },
  keypad: {
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
