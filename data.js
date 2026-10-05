const AMINO = [
  {
    "code": "G",
    "three": "Gly",
    "name": "Глицин",
    "en": "Glycine",
    "group": "nonpolar",
    "essential": false,
    "side": "H",
    "smiles": "NCC(=O)O",
    "formula": "C2H5NO2",
    "info": "Единственная стандартная аминокислота без хирального центра. Маленький радикал даёт цепи гибкость.",
    "feature": "Ахиральная",
    "structure": "structures/29586479f8cb4e9a880f6d087742cddd.svg",
    "codons": [
      "GGU",
      "GGC",
      "GGA",
      "GGG"
    ]
  },
  {
    "code": "A",
    "three": "Ala",
    "name": "Аланин",
    "en": "Alanine",
    "group": "nonpolar",
    "essential": false,
    "side": "CH₃",
    "smiles": "N[C@@H](C)C(=O)O",
    "formula": "C3H7NO2",
    "info": "Небольшой неполярный метильный радикал.",
    "feature": "Метильный радикал",
    "structure": "structures/a6cdf4506c7a4bb1ad7fd9bf18de14dc.svg",
    "codons": [
      "GCU",
      "GCC",
      "GCA",
      "GCG"
    ]
  },
  {
    "code": "V",
    "three": "Val",
    "name": "Валин",
    "en": "Valine",
    "group": "nonpolar",
    "essential": true,
    "side": "CH(CH₃)₂",
    "smiles": "N[C@@H](C(C)C)C(=O)O",
    "formula": "C5H11NO2",
    "info": "Гидрофобная аминокислота с разветвлённой цепью (BCAA).",
    "feature": "Разветвлённая цепь",
    "structure": "structures/8596d9e99f934289a5eb920a6a8e30f5.svg",
    "codons": [
      "GUU",
      "GUC",
      "GUA",
      "GUG"
    ]
  },
  {
    "code": "L",
    "three": "Leu",
    "name": "Лейцин",
    "en": "Leucine",
    "group": "nonpolar",
    "essential": true,
    "side": "CH₂–CH(CH₃)₂",
    "smiles": "N[C@@H](CC(C)C)C(=O)O",
    "formula": "C6H13NO2",
    "info": "Гидрофобная BCAA. Отличается от изолейцина положением ветвления.",
    "feature": "Разветвлённая цепь",
    "structure": "structures/3bd18ae9e5a7473ca8c19441850be5b7.svg",
    "codons": [
      "UUA",
      "UUG",
      "CUU",
      "CUC",
      "CUA",
      "CUG"
    ]
  },
  {
    "code": "I",
    "three": "Ile",
    "name": "Изолейцин",
    "en": "Isoleucine",
    "group": "nonpolar",
    "essential": true,
    "side": "CH(CH₃)–CH₂–CH₃",
    "smiles": "CC[C@H](C)[C@H](N)C(=O)O",
    "formula": "C6H13NO2",
    "info": "BCAA с двумя хиральными центрами. Та же молекулярная формула, что у лейцина.",
    "feature": "Два хиральных центра",
    "structure": "structures/f40d776c3c844a06b06dd45fc52238ab.svg",
    "codons": [
      "AUU",
      "AUC",
      "AUA"
    ]
  },
  {
    "code": "M",
    "three": "Met",
    "name": "Метионин",
    "en": "Methionine",
    "group": "nonpolar",
    "essential": true,
    "side": "CH₂–CH₂–S–CH₃",
    "smiles": "N[C@@H](CCSC)C(=O)O",
    "formula": "C5H11NO2S",
    "info": "Содержит серу в тиоэфире. В отличие от цистеина не образует дисульфидные мостики.",
    "feature": "Тиоэфир",
    "structure": "structures/ea2f69cde5c942be937b2bd17872d427.svg",
    "codons": [
      "AUG"
    ]
  },
  {
    "code": "P",
    "three": "Pro",
    "name": "Пролин",
    "en": "Proline",
    "group": "nonpolar",
    "essential": false,
    "side": "(CH₂)₃, замкнут на N",
    "smiles": "O=C(O)[C@@H]1CCCN1",
    "formula": "C5H9NO2",
    "info": "Боковая цепь замыкается на азоте; вторичная аминогруппа. Ограничивает гибкость цепи и часто нарушает α-спираль.",
    "feature": "Циклическая структура",
    "structure": "structures/d2f1f39c6e2b4d749b2cfdda9b24f067.svg",
    "codons": [
      "CCU",
      "CCC",
      "CCA",
      "CCG"
    ]
  },
  {
    "code": "F",
    "three": "Phe",
    "name": "Фенилаланин",
    "en": "Phenylalanine",
    "group": "nonpolar",
    "essential": true,
    "side": "CH₂–C₆H₅",
    "smiles": "N[C@@H](Cc1ccccc1)C(=O)O",
    "formula": "C9H11NO2",
    "info": "Неполярный ароматический радикал. Предшественник тирозина.",
    "feature": "Ароматическая",
    "structure": "structures/056cd17180e54549b42276ced1101f6a.svg",
    "codons": [
      "UUU",
      "UUC"
    ]
  },
  {
    "code": "W",
    "three": "Trp",
    "name": "Триптофан",
    "en": "Tryptophan",
    "group": "nonpolar",
    "essential": true,
    "side": "CH₂–индол",
    "smiles": "N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O",
    "formula": "C11H12N2O2",
    "info": "Крупный ароматический индольный радикал; поглощает УФ около 280 нм.",
    "feature": "Индольное кольцо",
    "structure": "structures/b39e7b4a67114893a21633b8cf6b0d77.svg",
    "codons": [
      "UGG"
    ]
  },
  {
    "code": "S",
    "three": "Ser",
    "name": "Серин",
    "en": "Serine",
    "group": "polar",
    "essential": false,
    "side": "CH₂–OH",
    "smiles": "N[C@@H](CO)C(=O)O",
    "formula": "C3H7NO3",
    "info": "Гидроксильная группа образует водородные связи и может фосфорилироваться.",
    "feature": "Гидроксильная группа",
    "structure": "structures/88c26de4ca47417891ebea088fc08c88.svg",
    "codons": [
      "UCU",
      "UCC",
      "UCA",
      "UCG",
      "AGU",
      "AGC"
    ]
  },
  {
    "code": "T",
    "three": "Thr",
    "name": "Треонин",
    "en": "Threonine",
    "group": "polar",
    "essential": true,
    "side": "CH(OH)–CH₃",
    "smiles": "C[C@@H](O)[C@H](N)C(=O)O",
    "formula": "C4H9NO3",
    "info": "Гидроксильная группа; два хиральных центра. Может фосфорилироваться.",
    "feature": "Два хиральных центра",
    "structure": "structures/59bf55ea409d4dd79061c08d81d915d5.svg",
    "codons": [
      "ACU",
      "ACC",
      "ACA",
      "ACG"
    ]
  },
  {
    "code": "C",
    "three": "Cys",
    "name": "Цистеин",
    "en": "Cysteine",
    "group": "polar",
    "essential": false,
    "side": "CH₂–SH",
    "smiles": "N[C@@H](CS)C(=O)O",
    "formula": "C3H7NO2S",
    "info": "Тиольные группы двух цистеинов при окислении образуют дисульфидный мостик. Синтез зависит от доступности метионина.",
    "feature": "Тиольная группа; при окислении образует дисульфидные мостики",
    "structure": "structures/ddf7d4af98eb4b5ea212bbc4b87de050.svg",
    "codons": [
      "UGU",
      "UGC"
    ]
  },
  {
    "code": "Y",
    "three": "Tyr",
    "name": "Тирозин",
    "en": "Tyrosine",
    "group": "polar",
    "essential": false,
    "side": "CH₂–C₆H₄–OH",
    "smiles": "N[C@@H](Cc1ccc(O)cc1)C(=O)O",
    "formula": "C9H11NO3",
    "info": "Ароматический фенол: гидрофобное кольцо и полярная OH-группа. Может фосфорилироваться; синтезируется из фенилаланина.",
    "feature": "Фенольная группа",
    "structure": "structures/f23a409d704b4fae8ca2cf3e497cf6db.svg",
    "codons": [
      "UAU",
      "UAC"
    ]
  },
  {
    "code": "N",
    "three": "Asn",
    "name": "Аспарагин",
    "en": "Asparagine",
    "group": "polar",
    "essential": false,
    "side": "CH₂–C(=O)–NH₂",
    "smiles": "N[C@@H](CC(=O)N)C(=O)O",
    "formula": "C4H8N2O3",
    "info": "Амид аспарагиновой кислоты; боковая цепь не несёт заряда при pH около 7.",
    "feature": "Амидная группа",
    "structure": "structures/c3e3e38627e54d02ba293f9f6e479bc1.svg",
    "codons": [
      "AAU",
      "AAC"
    ]
  },
  {
    "code": "Q",
    "three": "Gln",
    "name": "Глутамин",
    "en": "Glutamine",
    "group": "polar",
    "essential": false,
    "side": "CH₂–CH₂–C(=O)–NH₂",
    "smiles": "N[C@@H](CCC(=O)N)C(=O)O",
    "formula": "C5H10N2O3",
    "info": "Амид глутаминовой кислоты. Переносит азот; при некоторых состояниях потребность превышает синтез.",
    "feature": "Амидная группа",
    "structure": "structures/faa4dc81c3964bb6a399514cbb60f722.svg",
    "codons": [
      "CAA",
      "CAG"
    ]
  },
  {
    "code": "D",
    "three": "Asp",
    "name": "Аспарагиновая кислота",
    "en": "Aspartic acid",
    "group": "acidic",
    "essential": false,
    "side": "CH₂–COOH",
    "smiles": "N[C@@H](CC(=O)O)C(=O)O",
    "formula": "C4H7NO4",
    "info": "При pH около 7 боковой карбоксилат преимущественно отрицателен. Ионизированная форма — аспартат.",
    "feature": "Кислый радикал",
    "structure": "structures/321e0238737744e7acd13fa8a21a2e92.svg",
    "codons": [
      "GAU",
      "GAC"
    ]
  },
  {
    "code": "E",
    "three": "Glu",
    "name": "Глутаминовая кислота",
    "en": "Glutamic acid",
    "group": "acidic",
    "essential": false,
    "side": "CH₂–CH₂–COOH",
    "smiles": "N[C@@H](CCC(=O)O)C(=O)O",
    "formula": "C5H9NO4",
    "info": "При pH около 7 боковой карбоксилат преимущественно отрицателен. Ионизированная форма — глутамат.",
    "feature": "Кислый радикал",
    "structure": "structures/3e8bd8c44ea34742943c2d7e71bdc116.svg",
    "codons": [
      "GAA",
      "GAG"
    ]
  },
  {
    "code": "K",
    "three": "Lys",
    "name": "Лизин",
    "en": "Lysine",
    "group": "basic",
    "essential": true,
    "side": "(CH₂)₄–NH₂",
    "smiles": "N[C@@H](CCCCN)C(=O)O",
    "formula": "C6H14N2O2",
    "info": "Боковая аминогруппа при pH около 7 преимущественно положительно заряжена.",
    "feature": "Основный радикал",
    "structure": "structures/bcd2e23cebf4408498b5d7287ff7a54e.svg",
    "codons": [
      "AAA",
      "AAG"
    ]
  },
  {
    "code": "R",
    "three": "Arg",
    "name": "Аргинин",
    "en": "Arginine",
    "group": "basic",
    "essential": false,
    "side": "(CH₂)₃–NH–C(=NH)–NH₂",
    "smiles": "N[C@@H](CCCNC(=N)N)C(=O)O",
    "formula": "C6H14N4O2",
    "info": "Гуанидиновая группа преимущественно положительна при pH около 7. Условно незаменим, особенно в период роста.",
    "feature": "Гуанидиновая группа",
    "structure": "structures/7055bfe433854ebcbcfe45d188183824.svg",
    "codons": [
      "CGU",
      "CGC",
      "CGA",
      "CGG",
      "AGA",
      "AGG"
    ]
  },
  {
    "code": "H",
    "three": "His",
    "name": "Гистидин",
    "en": "Histidine",
    "group": "basic",
    "essential": true,
    "side": "CH₂–имидазол",
    "smiles": "N[C@@H](Cc1cnc[nH]1)C(=O)O",
    "formula": "C6H9N3O2",
    "info": "Основная аминокислота. При pH около 7 имидазол преимущественно нейтрален; pKa около 6, заряд зависит от окружения.",
    "feature": "Имидазольное кольцо",
    "structure": "structures/4299ec1cb7114636b0f3d3825629de4c.svg",
    "codons": [
      "CAU",
      "CAC"
    ]
  },
  {
    "code": "U",
    "three": "Sec",
    "name": "Селеноцистеин",
    "en": "Selenocysteine",
    "group": "special",
    "essential": null,
    "side": "CH₂–SeH",
    "smiles": "N[C@@H](C[SeH])C(=O)O",
    "formula": "C3H7NO2Se",
    "info": "21-я генетически кодируемая аминокислота. Включается при специальном прочтении UGA; при pH около 7 боковая цепь преимущественно отрицательна.",
    "feature": "Содержит селен",
    "structure": "structures/59d405e5f60244da923a869c56f61428.svg",
    "codonNote": "UGA обычно является стоп-кодоном. Селеноцистеин включается при специальном прочтении UGA с участием дополнительных сигналов и факторов.",
    "codons": [
      "UGA"
    ]
  },
  {
    "code": "O",
    "three": "Pyl",
    "name": "Пирролизин",
    "en": "Pyrrolysine",
    "group": "special",
    "essential": null,
    "side": "(CH₂)₄–NH–C(=O)–метилпирролиновое кольцо",
    "smiles": "C[C@@H]1CC=N[C@H]1C(=O)NCCCC[C@H](N)C(=O)O",
    "formula": "C12H21N3O3",
    "info": "22-я генетически кодируемая аминокислота у некоторых архей и бактерий. ε-Аминогруппа лизинового фрагмента образует амидную связь с метилпирролинкарбонильным фрагментом. Включается при специальном прочтении UAG.",
    "feature": "Редкая кодируемая",
    "structure": "structures/23e8b8f1807e4376bcaa72eaa8f2acc2.svg",
    "codonNote": "UAG обычно является стоп-кодоном. У некоторых архей и бактерий специальная система трансляции позволяет включать пирролизин.",
    "codons": [
      "UAG"
    ]
  }
];
