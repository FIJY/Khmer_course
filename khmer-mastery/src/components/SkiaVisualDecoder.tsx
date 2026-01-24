import React, { useState } from 'react';
import { Canvas, useFont, Path, Rect, Text, Skia, Group } from '@shopify/react-native-skia';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

// Загружаем шрифт (положи файл в assets)
// ВАЖНО: Это должен быть .ttf или .otf файл
const fontSource = require('./assets/fonts/NotoSansKhmer-Regular.ttf');

export const SkiaVisualDecoder = ({ word = "កាហ្វេ" }) => {
  const fontSize = 100;
  const font = useFont(fontSource, fontSize);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!font) {
    return <View />; // Или лоадер
  }

  // 1. ПОЛУЧАЕМ ГЛИФЫ
  // Skia превращает строку в набор ID глифов (учитывая шейпинг!)
  const glyphIds = font.getGlyphIDs(word);

  // 2. ПОЛУЧАЕМ ПОЗИЦИИ (Advances)
  // Это ширины каждого глифа
  const glyphWidths = font.getGlyphWidths(glyphIds);

  // 3. СТРОИМ Bounding Boxes
  // Нам нужно рассчитать X координату для каждого глифа
  let currentX = 20; // Отступ слева
  const startY = 150; // Базовая линия

  const boxes = glyphIds.map((id, i) => {
    const width = glyphWidths[i];
    const box = {
      index: i,
      id: id,
      x: currentX,
      y: startY - fontSize, // Верхняя граница (приблизительно)
      width: width,
      height: fontSize * 1.5, // Высота с запасом для подписных
    };
    currentX += width;
    return box;
  });

  // 4. ОБРАБОТКА НАЖАТИЯ
  const handleTouch = (e) => {
    const { locationX, locationY } = e.nativeEvent;

    // Ищем, в какой бокс попали
    const hit = boxes.find(b =>
      locationX >= b.x &&
      locationX <= b.x + b.width &&
      locationY >= b.y &&
      locationY <= b.y + b.height
    );

    if (hit) {
      console.log("Clicked glyph index:", hit.index);
      setSelectedIndex(hit.index);
    } else {
      setSelectedIndex(null);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        <Canvas style={{ flex: 1 }}>
          {/* Слой подсветки (рисуем ПОД текстом) */}
          {selectedIndex !== null && (() => {
            const b = boxes[selectedIndex];
            return (
              <Rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                color="rgba(52, 211, 153, 0.5)" // Emerald green highlight
                r={10} // Закругленные углы
              />
            );
          })()}

          {/* Слой текста */}
          {/* Мы можем рисовать текст целиком одной командой */}
          <Text
            x={20}
            y={150}
            text={word}
            font={font}
            color="white"
          />

          {/* ИЛИ (Для дебага) рисовать каждый глиф отдельно, если нужно красить их */}
          {/* {boxes.map((b, i) => (
             <Glyphs
               font={font}
               x={b.x}
               y={150}
               glyphs={[{ id: b.id, pos: { x: 0, y: 0 } }]}
               color={selectedIndex === i ? "#ffb020" : "white"}
             />
          ))}
          */}
        </Canvas>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
