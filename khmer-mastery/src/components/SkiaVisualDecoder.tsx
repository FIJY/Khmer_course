import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import {
  Canvas,
  useFont,
  Skia,
  Path,
  TextBlob,
  vec,
  Group,
  Fill
} from '@shopify/react-native-skia';

// Загрузи свой шрифт (NotoSansKhmer) в проект
const fontSource = require('../../assets/fonts/NotoSansKhmer-Regular.ttf');

interface WordPart {
  char: string;
  index: number;
}

interface GlyphData {
  id: number;     // ID глифа в шрифте
  path: any;      // SkPath (контур)
  x: number;      // Позиция X
  y: number;      // Позиция Y
  charIndex: number; // К какой части слова относится
  color: string;
}

export const SkiaVisualDecoder = ({
  word = "កាហ្វេ",
  parts = ["ក", "ា", "ហ្វ", "េ"], // Твоя разбивка из БД
  fontSize = 120
}) => {
  const font = useFont(fontSource, fontSize);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 1. ПРЕ-КАЛЬКУЛЯЦИЯ ГЛИФОВ И КОНТУРОВ
  const glyphsData = useMemo(() => {
    if (!font) return [];

    const data: GlyphData[] = [];
    let currentX = 40; // Отступ слева
    const baseline = fontSize * 1.5; // Базовая линия

    // Мы идем по частям слова (parts), чтобы сохранить связь "Глиф -> Смысл"
    parts.forEach((part, index) => {
      // Получаем ID глифов для этой части
      const glyphIds = font.getGlyphIDs(part);
      const widths = font.getGlyphWidths(glyphIds);

      // Определяем цвет (твоя логика consonant/vowel)
      const color = getCharColor(part);

      glyphIds.forEach((id, i) => {
        // ВАЖНО: Получаем контур глифа из шрифта!
        // getPath(glyphId, x, y, pointSize)
        const path = font.getPath(id, currentX, baseline, fontSize);

        // Для кхмерского: если это subscript (ширина 0 или маленькая),
        // он рисуется под предыдущим, но font.getPath уже учитывает смещение отрисовки
        // относительно точки (currentX, baseline) для стандартных глифов.
        // *Примечание*: для сложных лигатур position может требовать корректировки,
        // но path обычно уже содержит геометрию в правильном месте относительно origin.

        data.push({
          id,
          path, // Это объект SkPath
          x: currentX,
          y: baseline,
          charIndex: index,
          color
        });

        currentX += widths[i];
      });
    });

    return data;
  }, [font, word, parts, fontSize]);

  if (!font) return <View />;

  // 2. ОБРАБОТКА КЛИКА (HIT TESTING)
  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;

    // Ищем глиф, в чей КОНТУР мы попали
    // Мы идем с конца массива, чтобы верхние слои (если есть наложение) имели приоритет
    for (let i = glyphsData.length - 1; i >= 0; i--) {
      const g = glyphsData[i];

      // path.contains(x, y) - это точная математическая проверка
      if (g.path.contains(locationX, locationY)) {
        console.log("Hit glyph:", g.charIndex);
        setSelectedIndex(g.charIndex);
        return;
      }
    }
    setSelectedIndex(null);
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        <Canvas style={{ flex: 1 }}>
          <Fill color="black" />

          {/* СЛОЙ 1: Подсветка (Глоу эффект) */}
          {/* Рисуем ТОЛЬКО если что-то выбрано */}
          {glyphsData.map((g, i) => {
             const isSelected = selectedIndex === g.charIndex;
             if (!isSelected) return null;

             return (
               <Path
                 key={`glow-${i}`}
                 path={g.path}
                 color={g.color}
                 style="stroke"
                 strokeWidth={10} // Толстая обводка для свечения
                 opacity={0.5}
               >
                 {/* Можно добавить BlurMask для мягкости */}
               </Path>
             );
          })}

          {/* СЛОЙ 2: Сами буквы (Заливка) */}
          {glyphsData.map((g, i) => {
             const isSelected = selectedIndex === g.charIndex;

             return (
               <Path
                 key={`fill-${i}`}
                 path={g.path}
                 // Если выбран - рисуем цветом, иначе белым
                 color={isSelected ? g.color : "white"}
                 style="fill"
               />
             );
          })}

        </Canvas>
      </View>
    </TouchableWithoutFeedback>
  );
};

// Хелпер для цветов
const getCharColor = (char: string) => {
  const code = char.codePointAt(0) || 0;
  if (code >= 0x1780 && code <= 0x17a2) return '#ffb020'; // Consonant
  if (code >= 0x17a3 && code <= 0x17b5) return '#ff4081'; // Vowel
  if (code >= 0x17b6 && code <= 0x17c5) return '#ff4081'; // Dependent Vowel
  return '#6b5cff'; // Subscript/Other
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 400, // Высота холста
  },
});