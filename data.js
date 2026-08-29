// 국립세종수목원 식물도감 데이터
// 각 식물의 QR 푯말 URL 형식: https://도메인/?collect=plant_001

// 수목원 주요 구역 정의 (인터랙티브 지도용)
// x, y 값은 국립세종수목원 안내도 이미지(assets/sejong-map.png) 기준 0~100(%) 좌표
const ZONES = [
  // 왼쪽 하단(입구·서편)
  { id: "kid_forest",        name: "유아숲체험원",           color: "#6fa03c", x: 12,  y: 53.2, cat: "water" },
  { id: "research",          name: "연구동",                 color: "#7a8472", x: 19.9, y: 49.4, cat: "exhibit" },
  { id: "garden_mgmt",       name: "한국수목원정원관리원",   color: "#7a8472", x: 24.5, y: 53.9, cat: "exhibit" },
  { id: "greening_memorial", name: "국토녹화기념관",         color: "#8a6d3b", x: 19.7, y: 62.1, cat: "exhibit" },
  { id: "greenhouse",        name: "사계절전시온실",         color: "#3f9d5a", x: 28.9, y: 66.8, cat: "exhibit" },
  { id: "sense_garden",      name: "감각정원",               color: "#c47f3d", x: 35, y: 55.3, cat: "garden" },
  { id: "forest_garden",     name: "숲정원",                 color: "#3f9d5a", x: 30.8, y: 40.9, cat: "water" },
  { id: "hamyangji",         name: "함양지",                 color: "#3d7fd7", x: 21.8, y: 39.5, cat: "water" },
  // 중앙(하천·전통정원)
  { id: "cheongryu",         name: "청류지원",               color: "#3d7fd7", x: 36.5, y: 46.4, cat: "water" },
  { id: "festival_yard",     name: "축제마당",               color: "#d18e1c", x: 39.4, y: 59.8, cat: "flower" },
  { id: "flower_road",       name: "사계절꽃길",             color: "#d75d7c", x: 44.1, y: 68.7, cat: "flower" },
  { id: "ifla_garden",       name: "세계조경가대회기념정원", color: "#6fa03c", x: 39.3, y: 74.2, cat: "garden" },
  { id: "garden_center",     name: "가든센터",               color: "#7a8472", x: 50, y: 72, cat: "facility" },
  { id: "visitor_center",    name: "방문자센터",             color: "#7a8472", x: 47.1, y: 78.2, cat: "facility" },
  { id: "ieum_garden",       name: "이음정원",               color: "#c47f3d", x: 50, y: 65.9, cat: "flower" },
  { id: "pine_road",         name: "큰키소나무길",           color: "#2f6d4f", x: 46.9, y: 61.7, cat: "flower" },
  { id: "traditional_seoseo",name: "한국전통정원(별서정원)", color: "#c47f3d", x: 46.3, y: 45.5, cat: "garden" },
  { id: "wall_garden",       name: "담장정원",               color: "#8a6d3b", x: 41.1, y: 37.9, cat: "garden" },
  { id: "healing_garden",    name: "치유정원",               color: "#3f9d5a", x: 43.4, y: 31.2, cat: "garden" },
  { id: "successor_garden",  name: "후계목정원",             color: "#2f6d4f", x: 56.1, y: 65.7, cat: "flower" },
  { id: "traditional_gung",  name: "한국전통정원(궁궐정원)", color: "#c47f3d", x: 57.8, y: 51.8, cat: "garden" },
  { id: "bonsai",            name: "분재원",                 color: "#8a6d3b", x: 57.2, y: 36.9, cat: "garden" },
  // 중앙 상단(생태·주제원)
  { id: "pollinator",        name: "폴리네이터가든",         color: "#e0a92e", x: 59.2, y: 18.6, cat: "water" },
  { id: "amphibian",         name: "양서류관찰원",           color: "#3d7fd7", x: 67.7, y: 14.7, cat: "water" },
  { id: "wildflower",        name: "야생화원",               color: "#d75d7c", x: 65, y: 28, cat: "flower" },
  { id: "rare_greenhouse",   name: "희귀특산식물전시온실",   color: "#3f9d5a", x: 70.4, y: 25.9, cat: "exhibit" },
  { id: "rare_garden",       name: "희귀특산식물원",         color: "#6fa03c", x: 70.7, y: 36.6, cat: "flower" },
  { id: "kid_garden",        name: "어린이정원",             color: "#6fa03c", x: 65.3, y: 43.4, cat: "garden" },
  { id: "life_garden",       name: "생활정원",               color: "#c47f3d", x: 69.9, y: 52.5, cat: "garden" },
  { id: "share_garden",      name: "공유정원",               color: "#6fa03c", x: 65.2, y: 63.1, cat: "garden" },
  { id: "iris_garden",       name: "붓꽃원",                 color: "#7d5fd7", x: 73.6, y: 42.7, cat: "flower" },
  { id: "maple_garden",      name: "단풍정원",               color: "#c0392b", x: 77.8, y: 48.8, cat: "flower" },
  // 오른쪽 상단(동편)
  { id: "wetland_forest",    name: "습지형생태숲",           color: "#3d7fd7", x: 72.7, y: 6.7, cat: "water" },
  { id: "rose_of_sharon",    name: "무궁화원",               color: "#d75d7c", x: 80.6, y: 14.6, cat: "flower" },
  { id: "garden_plant_plot", name: "정원식물가늠터",         color: "#6fa03c", x: 88.4, y: 18.5, cat: "flower" },
  { id: "folk_plant",        name: "민속식물원",             color: "#2f6d4f", x: 89.2, y: 31.4, cat: "garden" },
  { id: "chisan",            name: "치산녹화원",             color: "#8a6d3b", x: 94.7, y: 18.6, cat: "water" },
];

// 지도 카테고리(디자인.md 5분류) — 필터 칩용
const CATEGORIES = [
  { id: "exhibit",  name: "전시·온실", icon: "🌺" },
  { id: "garden",   name: "전통·정원", icon: "🏯" },
  { id: "water",    name: "수계·생태", icon: "🌊" },
  { id: "flower",   name: "화원·산책", icon: "🌼" },
  { id: "facility", name: "편의시설",  icon: "ℹ️" },
];

// 뱃지(업적) 정의
const BADGES = [
  { id: "first_find",  name: "첫 식물 발견",  icon: "sprout",  desc: "첫 번째 목표 식물을 찾았어요.",          condition: { type: "count", value: 1 } },
  { id: "getting_warm", name: "탐험의 시작",  icon: "footprints", desc: "목표 식물 3종을 찾았어요.",            condition: { type: "count", value: 3 } },
  { id: "almost_there", name: "한 걸음 남았다", icon: "compass", desc: "목표 식물 4종을 찾았어요.",            condition: { type: "count", value: 4 } },
  { id: "sejong_explorer", name: "세종의 탐험가", icon: "award", desc: "내게 배정된 목표 식물을 모두 찾아 미션을 완료했어요!", condition: { type: "complete" } },
];

// 식물 데이터 (10종 v1)
// zone: 지도 핀이 찍히는 주 위치. locations: 안내판 표기용 전체 위치.
// img: 사진 경로(있으면 사진, 없으면 emoji 표시).
const PLANTS = [
  { id: "plant_001", name: "노랑땅나리", sci: "", zone: "rare_greenhouse",
    locations: "희귀특산식물전시온실", bloom: "7~8월", emoji: "🌼",
    img: "assets/plants/plant_001.png",
    hint: "희귀특산식물전시온실에서 땅을 바라보며 피는 주황빛 나리를 찾아보세요.",
    desc: "왜 이름이 '땅'나리일까? 그 이유는 땅나리의 꽃이 땅을 바라보기 때문에!" },

  { id: "plant_002", name: "해국", sci: "", zone: "pine_road",
    locations: "큰키소나무길, 한국전통정원(별서정원)", bloom: "7~11월", emoji: "🌸",
    img: "assets/plants/plant_002.png",
    hint: "큰키소나무길과 별서정원 주변, 국화를 닮은 연보라 꽃을 찾아보세요.",
    desc: "이름이 '해'국일까? 국화를 닮은 이 꽃이 바닷가 바위틈에서 자라기 때문! 한자로 '海菊(바다 국화)'라는 뜻을 담고 있어." },

  { id: "plant_003", name: "억새", sci: "", zone: "sense_garden",
    locations: "감각정원, 후계목정원", bloom: "9~10월", emoji: "🌾",
    img: "assets/plants/plant_003.png",
    hint: "감각정원과 후계목정원에서 바람에 흩날리는 은빛 이삭을 찾아보세요.",
    desc: "억새의 은빛 이삭은 사실 '꽃'일까? 맞아, 그게 바로 억새의 꽃이야! 화려한 꽃잎 대신 바람에 흩날리는 은백색 이삭으로 승부하는 벼과 식물이라 가을 억새밭이 장관을 이루는 거지." },

  { id: "plant_004", name: "향등골나물", sci: "", zone: "traditional_gung",
    locations: "한국전통정원(궁궐정원), 공유정원", bloom: "8~10월", emoji: "🌿",
    img: "assets/plants/plant_004.png",
    hint: "궁궐정원과 공유정원에서 은은한 향이 나는 흰 꽃 무리를 찾아보세요.",
    desc: "왜 이름에 '등골'이 들어갈까? 잎맥이 마치 사람 등뼈(등골)처럼 뚜렷하게 갈라진 모양이라서 붙은 이름이야. 여기에 은은한 향이 나서 '향'자가 앞에 붙었지." },

  { id: "plant_005", name: "은목서", sci: "", zone: "rare_garden",
    locations: "희귀특산식물원", bloom: "9~10월", emoji: "🤍",
    img: "assets/plants/plant_005.png",
    hint: "희귀특산식물원에서 새하얀 꽃과 은은한 향이 나는 나무를 찾아보세요.",
    desc: "왜 '은'목서일까? 사촌 격인 '금목서'는 주황빛 꽃을 피우는 반면, 은목서는 새하얀 꽃을 피우기 때문에 은빛에 빗대어 이름 붙었어. 향은 오히려 금목서보다 은은한 편이야." },

  { id: "plant_006", name: "노랑코스모스", sci: "", zone: "folk_plant",
    locations: "민속식물원", bloom: "6~10월", emoji: "🌻",
    img: "assets/plants/plant_006.png",
    hint: "민속식물원에서 노랑·주황빛으로만 피는 코스모스를 찾아보세요.",
    desc: "일반 코스모스와 뭐가 다를까? 우리가 흔히 아는 분홍·흰색 코스모스와 달리 노란색과 주황색 계열로만 피는 별도의 종이야. 멕시코가 원산지라 더위에 강해서 한여름에도 꽃을 볼 수 있어." },

  { id: "plant_007", name: "천사의나팔", sci: "", zone: "greenhouse",
    locations: "사계절전시온실", bloom: "6~10월", emoji: "🎺",
    img: "assets/plants/plant_007.png",
    hint: "사계절전시온실에서 아래로 늘어져 피는 커다란 나팔 모양 꽃을 찾아보세요.",
    desc: "왜 '천사'의 나팔일까? 꽃이 나팔 모양으로 아래를 향해 늘어져 피는데, 그 모습이 마치 천사가 부는 나팔 같다고 해서 붙여진 이름이야. 참고로 꽃이 위를 향해 피는 독말풀 종류는 '악마의 나팔'이라 불려서 서로 대조를 이뤄." },

  { id: "plant_008", name: "핑크뮬리", sci: "", zone: "forest_garden",
    locations: "숲정원", bloom: "9~10월", emoji: "🌸",
    img: "assets/plants/plant_008.png",
    hint: "숲정원에서 분홍빛 안개처럼 보이는 풀밭을 찾아보세요.",
    desc: "저 몽환적인 분홍빛 안개 같은 게 정말 꽃일까? 맞아, 아주 작은 꽃들이 무수히 모인 이삭이 바람에 흩날리며 안개처럼 보이는 거야. 북미가 원산지인 벼과 식물이라 우리나라에선 관상용으로 심어서 가을 명소를 만들지." },

  { id: "plant_009", name: "미국미역취", sci: "", zone: "traditional_seoseo",
    locations: "한국전통정원(별서정원)", bloom: "8~10월", emoji: "💛",
    img: "assets/plants/plant_009.png",
    hint: "별서정원에서 노란 꽃이 무리 지어 피는 키 큰 풀을 찾아보세요.",
    desc: "이름에 왜 '미국'이 붙었을까? 우리나라 토종 '미역취'와 생김새는 닮았지만, 북미(미국)에서 건너온 귀화식물이기 때문이야. 번식력이 워낙 강해서 생태계교란종으로도 지정된, 그야말로 '침입자' 식물이지." },

  { id: "plant_010", name: "가는잎향유", sci: "", zone: "rare_garden",
    locations: "희귀특산식물원", bloom: "9~10월", emoji: "💜",
    img: "assets/plants/plant_010.png",
    hint: "희귀특산식물원에서 잎을 스치면 향이 나는 보랏빛 꽃을 찾아보세요.",
    desc: "'향유'라는 이름은 어디서 왔을까? 잎을 스치기만 해도 진한 향이 퍼져서 '향기 나는 기름(香薷)'이라는 뜻의 한자에서 유래했어. 그중에서도 잎이 가늘고 좁은 품종이라 '가는잎'이 앞에 붙은 거야." },
];
