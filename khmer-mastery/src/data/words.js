// src/data/words.js

export const WORD_DATA = {
  // Ключ - это само слово или ID урока
  "កាហ្វេ": {
    word: "កាហ្វេ",
    // Mapping описывает, какие части слова за что отвечают.
    // indices - это порядковые номера "кусочков" (parts), которые мы передаем в компонент.
    mapping: [
      {
        id: "consonant_k",
        role: "consonant", // командир
        meaning: "K (Ka)",
        color: "#ffb020", // Оранжевый
        indices: [0] // Это "ក"
      },
      {
        id: "vowel_aa",
        role: "vowel", // гласная
        meaning: "Aa",
        color: "#ff4081", // Розовый
        indices: [1] // Это "ា"
      },
      {
        id: "consonant_cluster_f",
        role: "cluster", // сложный звук Ф (Х + В)
        meaning: "F (H + Vo)",
        color: "#6b5cff", // Синий
        indices: [2, 3] // Это "ហ" и "្វ"
      },
      {
        id: "vowel_e",
        role: "vowel", // гласная
        meaning: "E",
        color: "#ff4081", // Розовый
        indices: [4] // Это "េ"
      }
    ]
  }
};