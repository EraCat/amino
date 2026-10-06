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
    ],
    "history": {
      "clue": "Название происходит от греческого слова «сладкий».",
      "story": "В 1820 году Анри Браконно получил глицин при расщеплении желатина. Название происходит от греческого glykys — «сладкий», по вкусу кристаллов. Почти два века спустя глицин обнаружил аппарат Rosetta в газопылевой оболочке кометы Чурюмова — Герасименко; результаты опубликовали в 2016 году.",
      "sources": [
        "https://en.wiktionary.org/wiki/glycine",
        "https://en.wikipedia.org/wiki/Glycine#History_and_etymology",
        "https://www.esa.int/Science_Exploration/Space_Science/Rosetta/Rosetta_s_comet_contains_ingredients_for_life"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с альдегидом, использованным при химическом синтезе.",
      "story": "В 1850 году Адольф Штреккер синтезировал аланин, используя ацетальдегид, аммиак и синильную кислоту. Название аминокислоты связывают с исходным альдегидом. Этот опыт стал началом синтеза Штреккера — способа получать аминокислоты из сравнительно простых соединений.",
      "sources": [
        "https://en.wikipedia.org/wiki/Alanine#History_and_etymology"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с валериановой кислотой и через неё — с валерианой.",
      "story": "Название валина связано с валериановой кислотой, которая получила имя от валерианы. Химики рассматривали аминокислоту как производное изовалериановой кислоты; короткое название «валин» предложил Эмиль Фишер в 1906 году. Так в имени компонента белков сохранился след названия растения.",
      "sources": [
        "https://www.cun.es/diccionario-medico/terminos/valina",
        "https://chemtymology.co.uk/2020/12/18/proline-valine-and-methionine/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название происходит от греческого слова «белый», по виду кристаллов.",
      "story": "В 1820 году Анри Браконно выделил белые кристаллы при расщеплении мышечной ткани и назвал вещество лейцином: leukos по-гречески означает «белый». Годом раньше Пруст получил это же вещество при исследовании сыра, но дал ему другое название. Что это одно соединение, установили лишь в 1839 году.",
      "sources": [
        "https://chemtymology.co.uk/2020/12/04/leucine-isoleucine-and-arginine/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название указывает на изомерию с лейцином.",
      "story": "В начале XX века химики заметили, что разные порции выделенного лейцина отличаются растворимостью и оптическим вращением. В 1903 году Феликс Эрлих установил присутствие ещё одной аминокислоты — изолейцина. Название означает изомер лейцина: формула та же, но углеродная цепь разветвлена иначе.",
      "sources": [
        "https://chemtymology.co.uk/2020/12/04/leucine-isoleucine-and-arginine/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название сокращает описание метилсодержащего серного фрагмента.",
      "story": "В 1921 году Джон Говард Мюллер выделил из казеина новую серосодержащую аминокислоту. В 1928 году Баргер и Койн установили её строение и предложили название «метионин». Оно сокращает описание фрагмента –S–CH₃: «мет-» связано с метилом, «тио-» — с серой.",
      "sources": [
        "https://chemtymology.co.uk/2020/12/18/proline-valine-and-methionine/",
        "https://stacks.cdc.gov/view/cdc/68531/cdc_68531_DS1.pdf",
        "https://doi.org/10.1042/bj0221417"
      ]
    }
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
    ],
    "history": {
      "clue": "Название сокращено от «пирролидин» — названия насыщенного пятичленного кольца.",
      "story": "Пролин синтезировали в 1900 году, а год спустя обнаружили среди компонентов белков. Сначала его называли пирролидин-α-карбоновой кислотой. В 1904 году Эмиль Фишер предложил сокращение «пролин»: длинное название было неудобно при описании пептидов. В коротком имени сохранилась отсылка к пятичленному пирролидиновому кольцу.",
      "sources": [
        "https://chemtymology.co.uk/2020/12/18/proline-valine-and-methionine/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название объединяет «фенил» и «аланин».",
      "story": "«Фенилаланин» объединяет слова «фенил» и «аланин» и описывает боковую цепь –CH₂–C₆H₅. В 1961 году эта аминокислота помогла расшифровать генетический код: в опыте Ниренберга и Маттеи РНК из повторяющихся U направляла синтез цепи из фенилаланина. Так установили значение кодона UUU.",
      "sources": [
        "https://www.collinsdictionary.com/us/dictionary/english/phenylalanine",
        "https://iupac.qmul.ac.uk/AminoAcid/AA1n2.html",
        "https://www.acs.org/education/whatischemistry/landmarks/geneticcode.html"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с трипсином и греческим словом «показывать».",
      "story": "Название соединяет отсылку к трипсину и греческое phainein — «показывать, обнаруживать»: вещество изучали среди продуктов расщепления белков. В 1901 году Фредерик Гоуленд Хопкинс и Сидни Коул выделили триптофан из казеина. Хопкинс позднее получил Нобелевскую премию за работы, связанные с открытием витаминов.",
      "sources": [
        "https://www.etymonline.com/word/tryptophan",
        "https://www.acs.org/molecule-of-the-week/archive/t/tryptophan.html"
      ]
    }
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
    ],
    "history": {
      "clue": "Название происходит от латинского слова «шёлк».",
      "story": "В 1865 году Эмиль Крамер впервые получил серин из белка шёлка. Отсюда и название: латинское sericum означает «шёлк». Источник выделения превратился в имя аминокислоты, которая встречается и во множестве других белков.",
      "sources": [
        "https://www.etymonline.com/word/serine",
        "https://en.wikipedia.org/wiki/Serine#History"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с сахаром треозой и пространственным расположением групп.",
      "story": "В 1930-х годах группа Уильяма Роуза обнаружила, что крысы не растут на смеси всех известных тогда аминокислот. Поиск недостающего компонента привёл к треонину: препарат выделили в 1935 году, а пространственное строение уточнили в 1936-м. Название дали по сходству расположения групп с сахаром треозой.",
      "sources": [
        "https://chemtymology.co.uk/2019/10/13/threonine-threose-and-erythrose/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название образовано от цистина, ранее найденного в камнях мочевого пузыря.",
      "story": "История началась в 1810 году: Уильям Волластон обнаружил цистин в камнях мочевого пузыря. Греческое kystis — «мочевой пузырь» — дало веществу название. В 1884 году Ойген Бауман восстановил цистин и получил цистеин, сохранив в имени связь с исходным соединением. Две молекулы цистеина при окислении могут вновь образовать цистин.",
      "sources": [
        "https://chemtymology.co.uk/2020/11/27/cysteine-and-cystine/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название происходит от греческого слова «сыр».",
      "story": "Греческое tyros означает «сыр». В 1846 году Юстус фон Либих выделил тирозин при исследовании казеина — белка молока и сыра. Название сохранило историю выделения: сыр → казеин → тирозин.",
      "sources": [
        "https://www.etymonline.com/word/tyrosine",
        "https://www.acs.org/molecule-of-the-week/archive/t/l-tyrosine.html"
      ]
    }
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
    ],
    "history": {
      "clue": "Первой из аминокислот выделена из сока спаржи; название напоминает об этом растении.",
      "story": "В 1806 году Луи-Никола Воклен и Пьер Жан Робике выделили кристаллическое вещество из сока спаржи. Аспарагин стал первой выделенной аминокислотой, а имя получил от asparagus — «спаржа». Его открыли задолго до того, как сложилось современное представление о строении белков.",
      "sources": [
        "https://pubchem.ncbi.nlm.nih.gov/pathway/BioCyc%3AHUMAN_ASPARAGINE-BIOSYNTHESIS",
        "https://en.wikipedia.org/wiki/Asparagine#History"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с глутаминовой кислотой, амидом которой является это вещество.",
      "story": "Глутамин впервые выделили из свекольного сока Шульце и Босхард в 1883 году. Название отражает родство с глутаминовой кислотой: глутамин является её амидом. Через неё общий корень восходит к глютену — хотя сам глутамин впервые получили из свёклы.",
      "sources": [
        "https://en.wikipedia.org/wiki/Glutamine",
        "https://iupac.qmul.ac.uk/AminoAcid/AA1n2.html",
        "https://dingler.bbaw.de/articles/mi247is12.html"
      ]
    }
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
    ],
    "history": {
      "clue": "Впервые получена гидролизом аспарагина; название сохраняет связь с ним.",
      "story": "В 1827 году аспарагиновую кислоту получили гидролизом уже известного аспарагина. При этом боковая амидная группа превращается в карбоксильную. Название сохранило родство с аспарагином и через него — со спаржей, из сока которой тот был выделен.",
      "sources": [
        "https://en.wikipedia.org/wiki/Aspartic_acid#Discovery"
      ]
    }
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
    ],
    "history": {
      "clue": "Название связано с глютеном, из которого вещество впервые выделили.",
      "story": "В 1866 году Карл Риттхаузен выделил глутаминовую кислоту из пшеничного глютена — клейковины, давшей ей имя. В 1908 году Кикунаэ Икеда установил, что глутамат придаёт бульону из водорослей комбу характерный вкус. Он назвал этот вкус «умами». Так одна аминокислота связала историю химии белков с японской кухней.",
      "sources": [
        "https://upload.wikimedia.org/wikipedia/commons/d/df/The_physiology_of_the_amino_acids_%28IA_physiologyofamin00underich%29.pdf",
        "https://www.umamiinfo.com/what/whatisumami/"
      ]
    }
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
    ],
    "history": {
      "clue": "Название восходит к греческому слову «освобождение, растворение».",
      "story": "Название лизина восходит к греческому lysis — «освобождение, растворение», как в слове «гидролиз». В 1889 году Эдмунд Дрексель выделил лизин при гидролизе казеина. Молочный белок оказался источником открытия нескольких аминокислот, включая лизин и тирозин.",
      "sources": [
        "https://www.dictionnaire-academie.fr/article/A9L1457",
        "https://www.acs.org/molecule-of-the-week/archive/l/l-lysine.html"
      ]
    }
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
    ],
    "history": {
      "clue": "Впервые выделена из проростков люпина Шульце и Штайгером в 1886 году.",
      "story": "В 1886 году Эрнст Шульце и Эрнст Штайгер выделили аргинин из проростков люпина. Они исследовали азотсодержащие вещества растений, осаждая и очищая их соединения. Люпин помог открыть и другую аминокислоту — фенилаланин, описанный Шульце и Барбьери в 1879 году.",
      "sources": [
        "https://chemtymology.co.uk/2020/12/04/leucine-isoleucine-and-arginine/",
        "https://en.wikipedia.org/wiki/Phenylalanine#History"
      ]
    }
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
    ],
    "history": {
      "clue": "Название содержит корень histo-, связанный с тканями.",
      "story": "Корень histo- связан с греческим histos — «ткань, полотно», как в слове «гистология». Гистидин независимо выделили Альбрехт Коссель и Свен Густав Гедин в 1896 году. Коссель позднее получил Нобелевскую премию за исследования химического состава клеток, включая белки и нуклеиновые вещества.",
      "sources": [
        "https://www.etymonline.com/word/histidine",
        "https://www.nobelprize.org/prizes/medicine/1910/kossel/biographical/",
        "https://en.wikipedia.org/wiki/Histidine"
      ]
    }
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
    ],
    "history": {
      "clue": "Название указывает на аналог цистеина с селеном вместо серы.",
      "story": "Название селеноцистеина описывает его строение: это аналог цистеина с селеном вместо серы. Исследования Тересы Штадтман помогли установить роль селена в белках. В 1986 году выяснилось, что в генах некоторых селенсодержащих ферментов на месте этой аминокислоты стоит UGA — кодон, обычно означающий остановку синтеза.",
      "sources": [
        "https://www.ncbi.nlm.nih.gov/mesh/68017279",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC2933860/",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC1311585/",
        "https://academic.oup.com/femsec/article/96/12/fiaa209/5921172"
      ]
    }
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
    ],
    "history": {
      "clue": "В 2002 году обнаружена в метилтрансферазе метанобразующей археи.",
      "story": "В 2002 году пирролизин обнаружили в активном центре метилтрансферазы метанобразующей археи Methanosarcina barkeri. Необычный остаток увидели при исследовании пространственной структуры фермента. Название объединяет пирролиновое кольцо и лизиновый фрагмент. Пирролизин стал 22-й известной генетически кодируемой аминокислотой.",
      "sources": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC3968831/",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC2933860/"
      ]
    }
  }
];
